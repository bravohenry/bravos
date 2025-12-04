import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
} from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAppStoreShallow } from "@/stores/helpers";
import { ThemedIcon } from "@/components/shared/ThemedIcon";
import { AppId, getAppIconPath, appRegistry, getNonFinderApps } from "@/config/appRegistry";
import { getTranslatedAppName, getTranslatedFolderNameFromName } from "@/utils/i18n";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import { useFinderStore } from "@/stores/useFinderStore";
import { useFilesStore } from "@/stores/useFilesStore";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLongPress } from "@/hooks/useLongPress";
import { useSound, Sounds } from "@/hooks/useSound";
import type { AppInstance } from "@/stores/useAppStore";
import type { AppletViewerInitialData } from "@/apps/applet-viewer";
import { RightClickMenu, MenuItem } from "@/components/ui/right-click-menu";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { requestCloseWindow } from "@/utils/windowUtils";
import {
  AnimatePresence,
  motion,
  LayoutGroup,
  useMotionValue,
  useSpring,
  useTransform,
  useIsPresent,
  type MotionValue,
} from "framer-motion";

// 常量配置
const DOCK_CONFIG = {
  MAX_SCALE: {
    macosx: 2.3,
    os1: 1.6,
  },
  DISTANCE: 140,
  BASE_BUTTON_SIZE: {
    macosx: 58, // Aqua 主题默认大小
    os1: 68,    // OS1 主题更大的图标
  },
  SPRING_CONFIG: {
    mass: 0.15,
    stiffness: 160,
    damping: 18,
  },
  LAYOUT_SPRING_CONFIG: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
} as const;

// 工具函数：从路径获取文件名
const getFileName = (path: string): string => {
  const parts = path.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(html|app)$/i, "");
};

// 工具函数：检查是否为 emoji 图标
const isEmojiIcon = (icon: string): boolean => {
  return (
    Boolean(icon) &&
    !icon.startsWith("/") &&
    !icon.startsWith("http") &&
    icon.length <= 10
  );
};

// 工具函数：查找最近打开的实例
const findMostRecentInstance = (
  appId: AppId,
  instances: Record<string, AppInstance>,
  instanceOrder: string[]
): string | null => {
  for (let i = instanceOrder.length - 1; i >= 0; i--) {
    const id = instanceOrder[i];
    const inst = instances[id];
    if (inst && inst.appId === appId && inst.isOpen) {
      return id;
    }
  }
  return null;
};

function MacDock({ isOS1 = false }: { isOS1?: boolean } = {}) {
  const isPhone = useIsPhone();
  const { instances, instanceOrder, bringInstanceToForeground, restoreInstance, minimizeInstance, closeAppInstance } =
    useAppStoreShallow((s) => ({
      instances: s.instances,
      instanceOrder: s.instanceOrder,
      bringInstanceToForeground: s.bringInstanceToForeground,
      restoreInstance: s.restoreInstance,
      minimizeInstance: s.minimizeInstance,
      closeAppInstance: s.closeAppInstance,
    }));
  
  // Sound for hide/minimize action from dock context menu
  const { play: playZoomMinimize } = useSound(Sounds.WINDOW_ZOOM_MINIMIZE);

  const launchApp = useLaunchApp();
  const files = useFilesStore((s) => s.items);
  const fileStore = useFilesStore();
  const trashIcon = useFilesStore(
    (s) => s.items["/Trash"]?.icon || "/icons/trash-empty.png"
  );
  const finderInstances = useFinderStore((s) => s.instances);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);
  const [trashContextMenuPos, setTrashContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [applicationsContextMenuPos, setApplicationsContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false);
  const [appContextMenu, setAppContextMenu] = useState<{ x: number; y: number; appId: AppId; instanceId?: string } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const { t } = useTranslation();
  const dockContainerRef = useRef<HTMLDivElement | null>(null);
  
  // 检查垃圾桶是否为空
  const isTrashEmpty = useMemo(
    () => !Object.values(files).some((item) => item.status === "trashed"),
    [files]
  );
  
  // 处理图标悬停
  const handleIconHover = useCallback((id: string) => {
    setHoveredId(id);
  }, []);
  
  // 处理图标离开
  const handleIconLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  // 获取 Applet 信息（图标和名称）
  const getAppletInfo = useCallback(
    (instance: AppInstance) => {
      const initialData = instance.initialData as
        | AppletViewerInitialData
        | undefined;
      const path = initialData?.path || "";
      const file = files[path];
      const label = path ? getFileName(path) : "Applet Store";
      const fileIcon = file?.icon;

      if (!path) {
        // Applet Store - 使用应用图标
        return {
          icon: getAppIconPath("applet-viewer"),
          label,
          isEmoji: false,
        };
      }

      // 如果是 emoji 图标则使用，否则使用默认的包裹 emoji
      return {
        icon: isEmojiIcon(fileIcon || "") ? fileIcon! : "📦",
        label,
        isEmoji: true,
      };
    },
    [files]
  );

  // Pinned apps on the left side (in order)
  const pinnedLeft: AppId[] = useMemo(
    () => ["finder", "chats", "internet-explorer"] as AppId[],
    []
  );

  // Compute open apps and individual applet instances
  const openItems = useMemo(() => {
    const items: Array<{
      type: "app" | "applet";
      appId: AppId;
      instanceId?: string;
      sortKey: number;
    }> = [];

    // Group instances by appId
    const openByApp: Record<string, AppInstance[]> = {};
    Object.values(instances)
      .filter((i) => i.isOpen)
      .forEach((i) => {
        if (!openByApp[i.appId]) openByApp[i.appId] = [];
        openByApp[i.appId].push(i);
      });

    // For each app, either add individual applet instances or a single app entry
    Object.entries(openByApp).forEach(([appId, instancesList]) => {
      if (appId === "applet-viewer") {
        // Add each applet instance separately
        instancesList.forEach((inst) => {
          items.push({
            type: "applet",
            appId: inst.appId as AppId,
            instanceId: inst.instanceId,
            sortKey: inst.createdAt || 0,
          });
        });
      } else {
        // Add a single entry for this app
        items.push({
          type: "app",
          appId: appId as AppId,
          sortKey: instancesList[0]?.createdAt ?? 0,
        });
      }
    });

    // Sort by creation time to keep a stable order
    items.sort((a, b) => a.sortKey - b.sortKey);
    
    // Filter out pinned apps
    return items.filter((item) => !pinnedLeft.includes(item.appId));
  }, [instances, pinnedLeft]);

  // 聚焦应用最近打开的实例
  const focusMostRecentInstanceOfApp = useCallback(
    (appId: AppId) => {
      const instanceId = findMostRecentInstance(appId, instances, instanceOrder);
      if (instanceId) {
        bringInstanceToForeground(instanceId);
      }
    },
    [instances, instanceOrder, bringInstanceToForeground]
  );

  // 聚焦或启动应用
  const focusOrLaunchApp = useCallback(
    (appId: AppId, initialData?: unknown) => {
      const instanceId = findMostRecentInstance(appId, instances, instanceOrder);
      if (instanceId) {
        bringInstanceToForeground(instanceId);
      } else {
        launchApp(
          appId,
          initialData !== undefined ? { initialData } : undefined
        );
      }
    },
    [instances, instanceOrder, bringInstanceToForeground, launchApp]
  );

  // Finder 专用：聚焦现有实例或启动新实例
  const focusOrLaunchFinder = useCallback(
    (initialPath = "/") => {
      const instanceId = findMostRecentInstance("finder", instances, instanceOrder);
      if (instanceId) {
        bringInstanceToForeground(instanceId);
      } else {
        launchApp("finder", { initialPath });
      }
    },
    [instances, instanceOrder, bringInstanceToForeground, restoreInstance, launchApp]
  );

  // 聚焦指定路径的 Finder 窗口，或启动新窗口
  const focusFinderAtPathOrLaunch = useCallback(
    (targetPath: string, initialData?: unknown) => {
      // 查找匹配路径的 Finder 实例
      for (let i = instanceOrder.length - 1; i >= 0; i--) {
        const id = instanceOrder[i];
        const inst = instances[id];
        if (inst?.appId === "finder" && inst.isOpen) {
          const fi = finderInstances[id];
          if (
            fi &&
            (fi.currentPath === targetPath ||
              fi.currentPath.startsWith(`${targetPath}/`))
          ) {
            // If minimized, restore it; otherwise just bring to foreground
            if (inst.isMinimized) {
              restoreInstance(id);
            } else {
              bringInstanceToForeground(id);
            }
            return;
          }
        }
      }
      // 未找到匹配实例，启动新窗口
      launchApp("finder", {
        initialPath: targetPath,
        initialData,
      });
    },
    [
      instanceOrder,
      instances,
      finderInstances,
      bringInstanceToForeground,
      restoreInstance,
      launchApp,
    ]
  );
  
  // 获取文件夹上下文菜单项
  const getFolderContextMenuItems = useCallback((path: string, isTrash: boolean): MenuItem[] => {
    if (isTrash) {
      return [
        {
          type: "item",
          label: t("apps.finder.contextMenu.open"),
          onSelect: () => {
            focusFinderAtPathOrLaunch("/Trash");
            setTrashContextMenuPos(null);
          },
        },
        { type: "separator" },
        {
          type: "item",
          label: t("apps.finder.contextMenu.emptyTrash"),
          onSelect: () => {
            setIsEmptyTrashDialogOpen(true);
            setTrashContextMenuPos(null);
          },
          disabled: isTrashEmpty,
        },
      ];
    } else {
      return [
        {
          type: "item",
          label: t("apps.finder.contextMenu.open"),
          onSelect: () => {
            focusFinderAtPathOrLaunch("/Applications");
            setApplicationsContextMenuPos(null);
          },
        },
      ];
    }
  }, [t, focusFinderAtPathOrLaunch, isTrashEmpty]);
  
  // 获取应用上下文菜单项
  const getAppContextMenuItems = useCallback((appId: AppId, instanceId?: string): MenuItem[] => {
    const items: MenuItem[] = [];
    const instance = instanceId ? instances[instanceId] : null;
    const isMinimized = instance?.isMinimized ?? false;
    
    if (instanceId) {
      items.push({
        type: "item",
        label: isMinimized ? t("common.dock.show") : t("common.dock.hide"),
        onSelect: () => {
          if (isMinimized) {
            restoreInstance(instanceId);
          } else {
            minimizeInstance(instanceId);
            playZoomMinimize();
          }
          setAppContextMenu(null);
        },
      });
      items.push({ type: "separator" });
      items.push({
        type: "item",
        label: t("common.dock.quit"),
        onSelect: () => {
          requestCloseWindow(instanceId);
          setAppContextMenu(null);
        },
      });
    } else {
      items.push({
        type: "item",
        label: t("common.dock.showAll"),
        onSelect: () => {
          const appInstances = Object.values(instances).filter(
            (i) => i.appId === appId && i.isOpen && i.isMinimized
          );
          appInstances.forEach((inst) => restoreInstance(inst.instanceId));
          setAppContextMenu(null);
        },
      });
    }
    
    return items;
  }, [t, instances, restoreInstance, minimizeInstance, playZoomMinimize]);

  // Dock 放大效果：使用 Framer Motion 在容器级别控制
  const mouseX = useMotionValue<number>(Infinity);
  
  // 检测是否启用放大效果（移动设备禁用）
  const [magnifyEnabled, setMagnifyEnabled] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const computeMagnifyEnabled = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      setMagnifyEnabled(!(coarse || noHover));
    };

    computeMagnifyEnabled();

    const mqlPointerCoarse = window.matchMedia("(pointer: coarse)");
    const mqlHoverNone = window.matchMedia("(hover: none)");
    const removeListeners: Array<() => void> = [];

    const addListener = (mql: MediaQueryList) => {
      if (mql.addEventListener) {
        mql.addEventListener("change", computeMagnifyEnabled);
        removeListeners.push(() =>
          mql.removeEventListener("change", computeMagnifyEnabled)
        );
      } else if ((mql as any).addListener) {
        (mql as any).addListener(computeMagnifyEnabled);
        removeListeners.push(() =>
          (mql as any).removeListener(computeMagnifyEnabled)
        );
      }
    };

    addListener(mqlPointerCoarse);
    addListener(mqlHoverNone);

    return () => removeListeners.forEach((fn) => fn());
  }, []);

  // 禁用放大效果时重置鼠标位置
  useEffect(() => {
    if (!magnifyEnabled) mouseX.set(Infinity);
  }, [magnifyEnabled, mouseX]);

  // Track which icons have appeared before to control enter animations
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [hasMounted, setHasMounted] = useState(false);
  // Mark all currently visible ids as seen whenever the set changes
  const allVisibleIds = useMemo(() => {
    const ids = [
      ...pinnedLeft,
      ...openItems.map((item) =>
        item.type === "applet" ? item.instanceId! : item.appId
      ),
      "__applications__",
      "__trash__",
    ];
    return ids;
  }, [pinnedLeft, openItems]);
  // After first paint, mark everything present as seen and mark mounted
  // Also update seen set whenever visible ids change
  useEffect(() => {
    allVisibleIds.forEach((id) => seenIdsRef.current.add(id));
    if (!hasMounted) setHasMounted(true);
  }, [allVisibleIds, hasMounted]);

  // No global pointer listeners; container updates mouseX and resets to Infinity on leave

  // index tracking no longer needed; sizing is per-element via motion values

  const IconButton = forwardRef<
    HTMLDivElement,
    {
      label: string;
      onClick: () => void;
      icon: string;
      idKey: string;
      isEmoji?: boolean;
      onDragOver?: (e: React.DragEvent<HTMLButtonElement>) => void;
      onDrop?: (e: React.DragEvent<HTMLButtonElement>) => void;
      onDragLeave?: (e: React.DragEvent<HTMLButtonElement>) => void;
      onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      mouseX?: MotionValue<number>;
      magnifyEnabled?: boolean;
      isNew?: boolean;
      isHovered?: boolean;
      isSwapping?: boolean;
      onHover?: () => void;
      onLeave?: () => void;
    }
  >(
    (
      {
        label,
        onClick,
        icon,
        idKey,
        isEmoji = false,
        onDragOver,
        onDrop,
        onDragLeave,
        onContextMenu,
        mouseX: _mouseX,
        magnifyEnabled: _magnifyEnabled,
        isNew: _isNew,
        isHovered: _isHovered,
        isSwapping: _isSwapping,
        onHover,
        onLeave,
      },
      forwardedRef
    ) => {
      const isNew = hasMounted && !seenIdsRef.current.has(idKey);
      const wrapperRef = useRef<HTMLDivElement | null>(null);
      const isPresent = useIsPresent();
      
      // 根据主题获取基础按钮大小
      const baseButtonSize = isOS1
        ? DOCK_CONFIG.BASE_BUTTON_SIZE.os1
        : DOCK_CONFIG.BASE_BUTTON_SIZE.macosx;
      
      // 计算鼠标距离图标中心的距离
      const distanceCalc = useTransform(_mouseX || mouseX, (val) => {
        const bounds = wrapperRef.current?.getBoundingClientRect();
        if (!bounds || !Number.isFinite(val)) return Infinity;
        return val - (bounds.left + bounds.width / 2);
      });
      
      // 根据距离计算图标大小
      const maxScale = isOS1
        ? DOCK_CONFIG.MAX_SCALE.os1
        : DOCK_CONFIG.MAX_SCALE.macosx;
      const maxButtonSize = Math.round(baseButtonSize * maxScale);
      const sizeTransform = useTransform(
        distanceCalc,
        [-DOCK_CONFIG.DISTANCE, 0, DOCK_CONFIG.DISTANCE],
        [baseButtonSize, maxButtonSize, baseButtonSize]
      );
      const sizeSpring = useSpring(sizeTransform, DOCK_CONFIG.SPRING_CONFIG);
      
      // 图标宽度值
      const widthValue = isPresent
        ? (_magnifyEnabled ?? magnifyEnabled)
          ? sizeSpring
          : baseButtonSize
        : 0;

      // Emoji 缩放因子（相对于基础大小）
      const emojiScale = useTransform(
        sizeSpring,
        (val) => val / baseButtonSize
      );
 
      const setCombinedRef = useCallback(
        (node: HTMLDivElement | null) => {
          wrapperRef.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef && "current" in (forwardedRef as object)) {
            (
              forwardedRef as React.MutableRefObject<HTMLDivElement | null>
            ).current = node;
          }
        },
        [forwardedRef]
      );

      return (
        <motion.div
          ref={setCombinedRef}
          layout
          layoutId={`dock-icon-${idKey}`}
          initial={isNew ? { scale: 0, opacity: 0 } : undefined}
          animate={{ scale: 1, opacity: 1 }}
          exit={{
            scale: 0,
            opacity: 0,
          }}
          transition={DOCK_CONFIG.LAYOUT_SPRING_CONFIG}
          style={{
            transformOrigin: "bottom center",
            willChange: "width, height, transform",
            width: widthValue,
            height: widthValue,
            marginLeft: isPresent ? 4 : 0,
            marginRight: isPresent ? 4 : 0,
            overflow: "visible",
            background: "transparent",
            border: "none",
          }}
          className="flex-shrink-0"
        >
          <button
            aria-label={label}
            title={label}
            onClick={onClick}
            onContextMenu={onContextMenu}
            {...(onDragOver && { onDragOver })}
            {...(onDrop && { onDrop })}
            {...(onDragLeave && { onDragLeave })}
            className={`relative flex items-center justify-center w-full h-full transition-all duration-200 ${isOS1 ? "dock-icon-button dock-icon-button-glow" : ""}`}
            style={{
              willChange: "transform",
              background: "transparent",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {isEmoji ? (
              <motion.span
                className="select-none pointer-events-none flex items-center justify-center dock-icon-glow"
                style={{
                  fontSize: baseButtonSize * 0.84,
                  lineHeight: 1,
                  originY: 0.5,
                  originX: 0.5,
                  scale: magnifyEnabled ? emojiScale : 1,
                  width: "100%",
                  height: "100%",
                }}
              >
                {icon}
              </motion.span>
            ) : (
              <ThemedIcon
                name={icon}
                alt={label}
                className="select-none pointer-events-none dock-icon-glow"
                draggable={false}
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  border: "none",
                  borderRadius: 0,
                  objectFit: "contain",
                }}
              />
            )}
          </button>
        </motion.div>
      );
    }
  );

  const Divider = forwardRef<HTMLDivElement, { idKey: string }>(
    ({ idKey }, ref) => (
      <motion.div
        ref={ref}
        layout
        layoutId={`dock-divider-${idKey}`}
        initial={{ opacity: 0, scaleY: 0.8 }}
        animate={{ opacity: 1, scaleY: 1 }}
        exit={{ opacity: 0, scaleY: 0.8 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        style={{
          width: 1,
          height: isOS1
            ? DOCK_CONFIG.BASE_BUTTON_SIZE.os1
            : DOCK_CONFIG.BASE_BUTTON_SIZE.macosx,
          marginLeft: 8,
          marginRight: 8,
          alignSelf: "center",
          // 简单的透明白色分隔线
          background: "rgba(255, 255, 255, 0.3)",
        }}
      />
    )
  );

  return (
    <div
      ref={dockContainerRef}
      className="fixed left-0 right-0 z-50"
      style={{
        // OS1 主题：Dock 与底部保持距离（macOS Ventura 风格）
        // macOS 主题：保持原样，紧贴底部
        bottom: isOS1 ? "12px" : "0",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex w-full items-end justify-center"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <motion.div
          layout
          layoutRoot
          className={`inline-flex items-end px-2 ${isOS1 ? "os1-dock" : "py-2"}`}
          style={{
            pointerEvents: "auto",
            // 根据主题选择不同的样式
            ...(isOS1
              ? {
                  // macOS Ventura 风格的 Dock：更透明、更现代的毛玻璃效果
                  background: "rgba(255, 255, 255, 0.4)",
                  backgroundImage: "none",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: `
                    0 -4px 24px rgba(0, 0, 0, 0.12),
                    0 -2px 8px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5)
                  `,
                  height: 76, // 增加高度以在图标和指示器之间留出空间
                  paddingTop: "8px",
                  paddingBottom: "4px", // 减少底部 padding，让图标更靠近底部
                  borderRadius: "20px", // macOS Ventura：四个角都是圆角
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                }
              : {
                  // Aqua Dock 风格：使用与导航栏相同的背景纹理
                  background: "rgba(248, 248, 248, 0.85)",
                  backgroundImage: "var(--os-pinstripe-menubar)",
                  border: "1px solid rgba(0, 0, 0, 0.15)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: `
                    0 -2px 10px rgba(0, 0, 0, 0.2),
                    0 2px 4px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                  `,
                  height: 64,
                  borderRadius: "0", // 四个角都是直角
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }),
            maxWidth: "min(92vw, 980px)",
            transformOrigin: "center bottom",
            overflowX: isPhone ? "auto" : "visible",
            overflowY: "visible",
            WebkitOverflowScrolling: isPhone ? "touch" : undefined,
            overscrollBehaviorX: isPhone ? "contain" : undefined,
          }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 400,
              damping: 30,
            },
          }}
          onMouseMove={
            magnifyEnabled && !trashContextMenuPos && !appContextMenu
              ? (e) => mouseX.set(e.clientX)
              : undefined
          }
          onMouseLeave={
            magnifyEnabled && !trashContextMenuPos && !appContextMenu
              ? () => {
                  mouseX.set(Infinity);
                  handleIconLeave();
                }
              : undefined
          }
        >
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {/* Left pinned */}
              {pinnedLeft.map((appId) => {
                const icon = getAppIconPath(appId);
                const label = appRegistry[appId]?.name ?? appId;
                return (
                  <IconButton
                    key={appId}
                    label={label}
                    icon={icon}
                    idKey={appId}
                    onClick={() => {
                      if (appId === "finder") {
                        focusOrLaunchFinder("/");
                      } else {
                        focusOrLaunchApp(appId);
                      }
                    }}
                  />
                );
              })}

              {/* Open apps and applet instances dynamically (excluding pinned) */}
              {openItems.map((item) => {
                if (item.type === "applet" && item.instanceId) {
                  // Render individual applet instance
                  const instance = instances[item.instanceId];
                  if (!instance) return null;

                  const { icon, label, isEmoji } = getAppletInfo(instance);
                  return (
                    <IconButton
                      key={item.instanceId}
                      label={label}
                      icon={icon}
                      idKey={item.instanceId}
                      onClick={() => bringInstanceToForeground(item.instanceId!)}
                      isEmoji={isEmoji}
                      mouseX={mouseX}
                      magnifyEnabled={magnifyEnabled}
                      isNew={hasMounted && !seenIdsRef.current.has(item.instanceId!)}
                      isHovered={hoveredId === item.instanceId}
                      isSwapping={isSwapping}
                      onHover={() => handleIconHover(item.instanceId!)}
                      onLeave={handleIconLeave}
                    />
                  );
                } else {
                  // Render regular app
                  const icon = getAppIconPath(item.appId);
                  const label = getTranslatedAppName(item.appId);
                  const isLoading = Object.values(instances).some(
                    (i) => i.appId === item.appId && i.isOpen && i.isLoading
                  );
                  return (
                    <IconButton
                      key={item.appId}
                      label={label}
                      icon={icon}
                      idKey={item.appId}
                      onClick={() => focusMostRecentInstanceOfApp(item.appId)}
                    />
                  );
                }
              })}

              {/* Divider between open apps and Applications/Trash */}
              <Divider key="divider-between" idKey="between" />

              {/* Applications (left of Trash) */}
              {(() => {
                const handleApplicationsContextMenu = (
                  e: React.MouseEvent<HTMLButtonElement>
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const containerRect =
                    dockContainerRef.current?.getBoundingClientRect();
                  if (!containerRect) {
                    setApplicationsContextMenuPos({ x: e.clientX, y: e.clientY });
                    return;
                  }

                  setApplicationsContextMenuPos({
                    x: e.clientX - containerRect.left,
                    y: e.clientY - containerRect.top,
                  });
                };

                return (
                  <IconButton
                    key="__applications__"
                    label={t("common.dock.applications")}
                    icon="/icons/default/applications.png"
                    idKey="__applications__"
                    onClick={() =>
                      focusFinderAtPathOrLaunch("/Applications", {
                        path: "/Applications",
                        viewType: "large",
                      })
                    }
                    onContextMenu={handleApplicationsContextMenu}
                    mouseX={mouseX}
                    magnifyEnabled={magnifyEnabled}
                    isNew={hasMounted && !seenIdsRef.current.has("__applications__")}
                    isHovered={hoveredId === "__applications__"}
                    isSwapping={isSwapping}
                    onHover={() => handleIconHover("__applications__")}
                    onLeave={handleIconLeave}
                  />
                );
              })()}

              {/* Trash (right side) */}
              {(() => {
                const handleTrashDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
                  // Check if this is a desktop shortcut being dragged
                  // We can't use getData in dragOver, so check types instead
                  const types = Array.from(e.dataTransfer.types);
                  if (types.includes("application/json")) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setIsDraggingOverTrash(true);
                  }
                };

                const handleTrashDrop = (e: React.DragEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverTrash(false);

                  try {
                    const data = e.dataTransfer.getData("application/json");
                    if (data) {
                      const parsed = JSON.parse(data);
                      // Only handle desktop shortcuts
                      if (parsed.path && parsed.path.startsWith("/Desktop/")) {
                        // Move shortcut to trash
                        fileStore.removeItem(parsed.path);
                      }
                    }
                  } catch (err) {
                    console.warn("[Dock] Failed to handle trash drop:", err);
                  }
                };

                const handleTrashDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverTrash(false);
                };

                const handleTrashContextMenu = (
                  e: React.MouseEvent<HTMLButtonElement>
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const containerRect =
                    dockContainerRef.current?.getBoundingClientRect();
                  if (!containerRect) {
                    setTrashContextMenuPos({ x: e.clientX, y: e.clientY });
                    return;
                  }

                  setTrashContextMenuPos({
                    x: e.clientX - containerRect.left,
                    y: e.clientY - containerRect.top,
                  });
                };

                return (
                  <motion.div
                    animate={{
                      scale: isDraggingOverTrash ? 1.2 : 1,
                      opacity: isDraggingOverTrash ? 0.7 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: "transparent",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <IconButton
                      key="__trash__"
                      label={t("common.dock.trash")}
                      icon={trashIcon}
                      idKey="__trash__"
                      onClick={() => {
                        focusFinderAtPathOrLaunch("/Trash");
                      }}
                      onDragOver={handleTrashDragOver}
                      onDrop={handleTrashDrop}
                      onDragLeave={handleTrashDragLeave}
                      onContextMenu={handleTrashContextMenu}
                      mouseX={mouseX}
                      magnifyEnabled={magnifyEnabled}
                      isNew={hasMounted && !seenIdsRef.current.has("__trash__")}
                      isHovered={hoveredId === "__trash__"}
                      isSwapping={isSwapping}
                      onHover={() => handleIconHover("__trash__")}
                      onLeave={handleIconLeave}
                    />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
      <RightClickMenu
        items={getFolderContextMenuItems("/Trash", true)}
        position={trashContextMenuPos}
        onClose={() => {
          setTrashContextMenuPos(null);
          mouseX.set(Infinity);
        }}
      />
      <RightClickMenu
        items={getFolderContextMenuItems("/Applications", false)}
        position={applicationsContextMenuPos}
        onClose={() => {
          setApplicationsContextMenuPos(null);
          mouseX.set(Infinity);
        }}
      />
      {appContextMenu && (
        <RightClickMenu
          items={getAppContextMenuItems(appContextMenu.appId, appContextMenu.instanceId)}
          position={appContextMenu}
          onClose={() => {
            setAppContextMenu(null);
            mouseX.set(Infinity);
          }}
        />
      )}
      <ConfirmDialog
        isOpen={isEmptyTrashDialogOpen}
        onOpenChange={setIsEmptyTrashDialogOpen}
        onConfirm={() => {
          fileStore.emptyTrash();
          setIsEmptyTrashDialogOpen(false);
        }}
        title={t("apps.finder.dialogs.emptyTrash.title")}
        description={t("apps.finder.dialogs.emptyTrash.description")}
      />
    </div>
  );
}

function OS1Dock() {
  // 复用 MacDock 的逻辑，但使用 macOS 26 风格的样式
  return <MacDock isOS1={true} />;
}

export function Dock() {
  const currentTheme = useThemeStore((s) => s.current);
  if (currentTheme === "macosx") {
    return <MacDock />;
  }
  if (currentTheme === "os1") {
    return <OS1Dock />;
  }
  return null;
}

