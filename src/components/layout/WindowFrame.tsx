import { useWindowManager } from "@/hooks/useWindowManager";
import { ResizeType } from "@/types/types";
import { useAppContext } from "@/contexts/AppContext";
import { useSound, Sounds } from "@/hooks/useSound";
import { useVibration } from "@/hooks/useVibration";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { getWindowConfig, getAppIconPath } from "@/config/appRegistry";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { AppId } from "@/config/appIds";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useAppStoreShallow } from "@/stores/helpers";
import { useThemeStore } from "@/stores/useThemeStore";
import { getTheme } from "@/themes";
import { ThemedIcon } from "@/components/shared/ThemedIcon";

interface WindowFrameProps {
  children: React.ReactNode;
  title: string;
  onClose?: () => void;
  isForeground?: boolean;
  appId: AppId;
  isShaking?: boolean;
  transparentBackground?: boolean;
  skipInitialSound?: boolean;
  windowConstraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
  // Instance support
  instanceId?: string;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  // Close interception support
  interceptClose?: boolean;
  menuBar?: React.ReactNode; // Add menuBar prop
}

export function WindowFrame({
  children,
  title,
  onClose,
  isForeground = true,
  isShaking = false,
  appId,
  transparentBackground = false,
  skipInitialSound = false,
  windowConstraints = {},
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
  interceptClose = false,
  menuBar, // Add menuBar to destructured props
}: WindowFrameProps) {
  const config = getWindowConfig(appId);
  const defaultConstraints = {
    minWidth: config.minSize?.width,
    minHeight: config.minSize?.height,
    maxWidth: config.maxSize?.width,
    maxHeight: config.maxSize?.height,
    defaultSize: config.defaultSize,
  };

  // Merge provided constraints with defaults from config
  const mergedConstraints = {
    ...defaultConstraints,
    ...windowConstraints,
  };

  const [isOpen, setIsOpen] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const previousMinimizedStateRef = useRef<boolean | undefined>(undefined);
  const { bringToForeground } = useAppContext();
  const {
    bringInstanceToForeground,
    minimizeInstance,
    debugMode,
    updateWindowState,
    updateInstanceWindowState,
  } = useAppStoreShallow((state) => ({
    bringInstanceToForeground: state.bringInstanceToForeground,
    minimizeInstance: state.minimizeInstance,
    debugMode: state.debugMode,
    updateWindowState: state.updateWindowState,
    updateInstanceWindowState: state.updateInstanceWindowState,
  }));
  const { play: playWindowOpen } = useSound(Sounds.WINDOW_OPEN);
  const { play: playWindowClose } = useSound(Sounds.WINDOW_CLOSE);
  const { play: playWindowExpand } = useSound(Sounds.WINDOW_EXPAND);
  const { play: playWindowCollapse } = useSound(Sounds.WINDOW_COLLAPSE);
  const { play: playWindowMoveStop } = useSound(Sounds.WINDOW_MOVE_STOP);
  const vibrateMaximize = useVibration(50, 100);
  const vibrateClose = useVibration(50, 50);
  const vibrateSwap = useVibration(30, 50);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isClosingRef = useRef(false);
  const isMobile = useIsMobile();
  const isPhone = useIsPhone();
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingTapRef = useRef(false);
  const lastToggleTimeRef = useRef<number>(0);
  // Keep track of window size before maximizing to restore it later
  const previousSizeRef = useRef({ width: 0, height: 0 });

  // Get current theme
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";
  const theme = getTheme(currentTheme);
  // Treat all macOS windows as using a transparent outer background so titlebar/content can be styled separately
  const effectiveTransparentBackground =
    currentTheme === "macosx" ? true : transparentBackground;

  // Theme-aware z-index for resizer layer:
  // - macOSX: above titlebar (no controls in top-right)
  // - XP/Win98: below titlebar controls (avoid occluding close button)
  // - Others: default above content
  const resizerZIndexClass =
    currentTheme === "macosx" ? "z-[60]" : isXpTheme ? "z-40" : "z-50";

  // Setup swipe navigation for phones only
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isSwiping,
    swipeDirection,
  } = useSwipeNavigation({
    currentAppId: appId as AppId,
    isActive: isPhone && isForeground,
    onSwipeLeft: () => {
      playWindowMoveStop();
      vibrateSwap();
      onNavigateNext?.();
    },
    onSwipeRight: () => {
      playWindowMoveStop();
      vibrateSwap();
      onNavigatePrevious?.();
    },
    threshold: 100,
  });

  useEffect(() => {
    if (!skipInitialSound) {
      playWindowOpen();
    }
    // Remove initial mount state after animation
    const timer = setTimeout(() => setIsInitialMount(false), 200);
    return () => clearTimeout(timer);
  }, []); // Play sound when component mounts

  // 获取当前实例的最小化状态
  const currentInstance = useAppStoreShallow((state) =>
    instanceId ? state.instances[instanceId] : null
  );
  const isMinimized = currentInstance?.isMinimized ?? false;

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (
        e.target === e.currentTarget &&
        !isOpen &&
        e.propertyName === "opacity"
      ) {
        setIsVisible(false);
        // For normal closes (non-intercepted), call onClose here
        if (!interceptClose) {
          onClose?.();
        }
        isClosingRef.current = false;
      }
    },
    [isOpen, interceptClose, onClose]
  );

  const handleClose = () => {
    if (interceptClose) {
      // Call the parent's onClose handler for interception (like confirmation dialogs)
      onClose?.();
    } else {
      // Normal close behavior with animation and sounds
      isClosingRef.current = true;
      vibrateClose();
      playWindowClose();
      setIsOpen(false);
    }
  };

  // Function to actually perform the close operation
  // This should be called by the parent component after confirmation
  const performClose = useCallback(() => {
    isClosingRef.current = true;
    vibrateClose();
    playWindowClose();
    setIsOpen(false);
  }, [vibrateClose, playWindowClose, setIsOpen]);

  // 处理窗口最小化动画（类似 macOS Genie 效果）
  const handleMinimize = useCallback(() => {
    if (!instanceId || isMinimizing) return;

    setIsMinimizing(true);
    playWindowCollapse();

    // 获取窗口当前位置和大小
    const windowRect = windowRef.current?.getBoundingClientRect();
    if (!windowRect) {
      // 如果无法获取位置，直接最小化
      minimizeInstance(instanceId);
      setIsMinimizing(false);
      return;
    }

    // 计算 Dock 的位置
    // OS1 主题：Dock 在底部 12px，图标大小约 68px，中心在底部 12 + 34 = 46px
    // macOS 主题：Dock 在底部 0px，图标大小约 58px，中心在底部 29px
    const isOS1Theme = currentTheme === "os1";
    const dockIconSize = isOS1Theme ? 68 : 58;
    const dockBottomOffset = isOS1Theme ? 12 : 0;
    const dockY = window.innerHeight - dockBottomOffset - dockIconSize / 2;
    const dockX = window.innerWidth / 2; // 屏幕中央

    // 窗口中心点
    const startX = windowRect.left + windowRect.width / 2;
    const startY = windowRect.top + windowRect.height / 2;

    // 计算需要移动的距离
    const deltaX = dockX - startX;
    const deltaY = dockY - startY;

    // macOS Genie 效果：先稍微向上，然后向下折叠
    const finalScale = 0.05; // 缩小到 5%

    // 设置 transform origin 为窗口中心
    const originX = windowRect.width / 2;
    const originY = windowRect.height / 2;

    // 使用 requestAnimationFrame 确保样式更新
    requestAnimationFrame(() => {
      if (windowRef.current) {
        // 使用流畅的 cubic-bezier 缓动函数，模拟 macOS 的 Genie 效果
        // cubic-bezier(0.25, 0.1, 0.25, 1) 提供流畅的加速和减速，类似 macOS 的动画曲线
        // 缩短总时长到 350ms，让动画更快速流畅
        const animationDuration = "0.35s";
        const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)"; // 流畅的缓动曲线，类似 macOS
        
        windowRef.current.style.transition = `transform ${animationDuration} ${easing}, opacity ${animationDuration} ${easing}`;
        windowRef.current.style.transformOrigin = `${originX}px ${originY}px`;
        
        // 使用单步动画，直接完成整个折叠过程
        // 通过调整 translate 的 Y 值来模拟先向上再向下的效果
        // 使用稍微向上的偏移来模拟 Genie 效果的弹跳
        const upwardOffset = -15; // 减少向上偏移，让动画更流畅
        
        // 直接设置最终状态，让 CSS transition 处理整个动画
        requestAnimationFrame(() => {
          if (windowRef.current) {
            windowRef.current.style.transform = `translate(${deltaX}px, ${deltaY + upwardOffset}px) scale(${finalScale})`;
            windowRef.current.style.opacity = "0";
          }
        });
      }
    });

    // 动画完成后调用最小化（350ms + 50ms 缓冲）
    setTimeout(() => {
      if (windowRef.current) {
        // 清理动画样式
        windowRef.current.style.transition = "";
        windowRef.current.style.transform = "";
        windowRef.current.style.opacity = "";
        windowRef.current.style.transformOrigin = "";
      }
      // 延迟一帧再调用最小化，确保样式已清理
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          minimizeInstance(instanceId);
          setIsMinimizing(false);
        });
      });
    }, 400); // 350ms 动画 + 50ms 缓冲
  }, [instanceId, isMinimizing, playWindowCollapse, minimizeInstance, currentTheme]);

  // 处理窗口恢复动画（从 Dock 弹回原位置）
  const handleRestore = useCallback(() => {
    if (!instanceId || isRestoring || !windowRef.current) return;

    setIsRestoring(true);
    playWindowOpen();

    // 计算 Dock 的位置（与最小化时相同）
    const isOS1Theme = currentTheme === "os1";
    const dockIconSize = isOS1Theme ? 68 : 58;
    const dockBottomOffset = isOS1Theme ? 12 : 0;
    const dockY = window.innerHeight - dockBottomOffset - dockIconSize / 2;
    const dockX = window.innerWidth / 2;

    // 获取窗口目标位置和大小
    const windowRect = windowRef.current.getBoundingClientRect();
    const targetX = windowRect.left + windowRect.width / 2;
    const targetY = windowRect.top + windowRect.height / 2;

    // 计算从 Dock 到窗口的移动距离
    const deltaX = targetX - dockX;
    const deltaY = targetY - dockY;

    // 设置 transform origin 为窗口中心
    const originX = windowRect.width / 2;
    const originY = windowRect.height / 2;

    // 先设置窗口在 Dock 位置（缩小状态）
    if (windowRef.current) {
      windowRef.current.style.transition = "none";
      windowRef.current.style.transformOrigin = `${originX}px ${originY}px`;
      windowRef.current.style.transform = `translate(${-deltaX}px, ${-deltaY}px) scale(0.05)`;
      windowRef.current.style.opacity = "0";
    }

    // 然后动画回到原位置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (windowRef.current) {
          // 反向动画：从 Dock 弹回，使用流畅的缓动曲线
          // 缩短时长到 350ms，与最小化动画保持一致
          windowRef.current.style.transition = "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.35s ease-out";
          windowRef.current.style.transform = "translate(0, 0) scale(1)";
          windowRef.current.style.opacity = "1";
        }

        // 动画完成后清理
        setTimeout(() => {
          if (windowRef.current) {
            windowRef.current.style.transition = "";
            windowRef.current.style.transform = "";
            windowRef.current.style.opacity = "";
            windowRef.current.style.transformOrigin = "";
          }
          setIsRestoring(false);
        }, 350);
      });
    });
  }, [instanceId, isRestoring, playWindowOpen, currentTheme]);

  // 检测从最小化状态恢复
  useEffect(() => {
    // 初始化 previousMinimizedStateRef
    if (previousMinimizedStateRef.current === undefined) {
      previousMinimizedStateRef.current = isMinimized;
      return;
    }
    
    // 如果之前是最小化状态，现在不是，且不在恢复动画中，则触发恢复动画
    if (previousMinimizedStateRef.current && !isMinimized && !isRestoring && instanceId && windowRef.current) {
      // 延迟一帧确保窗口已渲染
      requestAnimationFrame(() => {
        handleRestore();
      });
    }
    previousMinimizedStateRef.current = isMinimized;
  }, [isMinimized, isRestoring, instanceId, handleRestore]);

  // Expose performClose to parent component through a custom event (only for intercepted closes)
  useEffect(() => {
    if (!interceptClose) return;

    const handlePerformClose = (event: CustomEvent) => {
      const onComplete = event.detail?.onComplete;
      performClose();

      // Call the completion callback after the close animation finishes
      if (onComplete) {
        // Wait for the transition to complete (200ms as per the transition duration)
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    };

    // Listen for close confirmation from parent
    window.addEventListener(
      `closeWindow-${instanceId || appId}`,
      handlePerformClose as EventListener
    );

    return () => {
      window.removeEventListener(
        `closeWindow-${instanceId || appId}`,
        handlePerformClose as EventListener
      );
    };
  }, [instanceId, appId, performClose, interceptClose]);

  const {
    windowPosition,
    windowSize,
    isDragging,
    resizeType,
    handleMouseDown,
    handleResizeStart,
    setWindowSize,
    setWindowPosition,
    getSafeAreaBottomInset,
  } = useWindowManager({ appId, instanceId });

  // Centralized insets per theme
  const computeInsets = useCallback(() => {
    const safe = getSafeAreaBottomInset();
    const menuBarHeight =
      currentTheme === "system7" ? 30 : currentTheme === "macosx" ? 25 : 0;
    const taskbarHeight = isXpTheme ? 30 : 0;
    const dockHeight = currentTheme === "macosx" ? 56 : 0; // Dock visual height
    const topInset = menuBarHeight;
    const bottomInset = taskbarHeight + dockHeight + safe;
    return {
      menuBarHeight,
      taskbarHeight,
      safeAreaBottom: safe,
      topInset,
      bottomInset,
      dockHeight,
    };
  }, [currentTheme, isXpTheme, getSafeAreaBottomInset]);

  // No longer track maximized state based on window dimensions
  useEffect(() => {
    const { topInset, bottomInset } = computeInsets();
    const maxPossibleHeight = window.innerHeight - topInset - bottomInset;
    // Consider window at full height if it's within 5px of max height (to account for rounding)
    setIsFullHeight(Math.abs(windowSize.height - maxPossibleHeight) < 5);
  }, [windowSize.height, computeInsets]);

  const handleMouseDownWithForeground = (
    e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) => {
    handleMouseDown(e);
    if (!isForeground) {
      if (instanceId) {
        bringInstanceToForeground(instanceId);
      } else {
        bringToForeground(appId);
      }
    }
  };

  const handleResizeStartWithForeground = (
    e: React.MouseEvent | React.TouchEvent,
    type: ResizeType
  ) => {
    handleResizeStart(e, type);
    if (!isForeground) {
      if (instanceId) {
        bringInstanceToForeground(instanceId);
      } else {
        bringToForeground(appId);
      }
    }
  };

  // Guard: avoid maximizing when the event originates from titlebar control areas
  const isFromTitlebarControls = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    if (el.closest("[data-titlebar-controls]")) return true;
    if (el.closest(".title-bar-controls")) return true; // XP/98
    if (el.closest('button,[role="button"]')) return true;
    return false;
  };

  // This function only maximizes height (for bottom resize handle)
  const handleHeightOnlyMaximize = (e: React.MouseEvent | React.TouchEvent) => {
    if (isClosingRef.current) return;
    vibrateMaximize();
    e.stopPropagation();

    // If window is already fully maximized, do nothing - let handleFullMaximize handle the restoration
    if (isMaximized) return;

    if (isFullHeight) {
      // Play collapse sound when restoring height
      playWindowCollapse();

      // Restore to default height from app's configuration
      setIsFullHeight(false);
      const newSize = {
        ...windowSize,
        height: mergedConstraints.defaultSize.height,
      };
      setWindowSize(newSize);
      // Save the window state to global store
      if (instanceId) {
        updateInstanceWindowState(instanceId, windowPosition, newSize);
      } else {
        updateWindowState(appId, windowPosition, newSize);
      }
    } else {
      // Play expand sound when maximizing height
      playWindowExpand();

      // Set to full height
      setIsFullHeight(true);
      const { topInset, bottomInset } = computeInsets();
      const maxPossibleHeight = window.innerHeight - topInset - bottomInset;
      const maxHeight = mergedConstraints.maxHeight
        ? typeof mergedConstraints.maxHeight === "string"
          ? parseInt(mergedConstraints.maxHeight)
          : mergedConstraints.maxHeight
        : maxPossibleHeight;
      const newHeight = Math.min(maxPossibleHeight, maxHeight);
      const newSize = {
        ...windowSize,
        height: newHeight,
      };
      const newPosition = {
        ...windowPosition,
        y: topInset,
      };
      setWindowSize(newSize);
      setWindowPosition(newPosition);
      // Save the window state to global store
      if (instanceId) {
        updateInstanceWindowState(instanceId, newPosition, newSize);
      } else {
        updateWindowState(appId, newPosition, newSize);
      }
    }
  };

  // This function maximizes both width and height (for titlebar)
  const handleFullMaximize = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isClosingRef.current) return;
      vibrateMaximize();
      e.stopPropagation();

      const now = Date.now();
      // Add cooldown to prevent rapid toggling (300ms)
      if (now - lastToggleTimeRef.current < 300) {
        return;
      }
      lastToggleTimeRef.current = now;

      // Toggle the maximized state directly
      const newMaximizedState = !isMaximized;
      setIsMaximized(newMaximizedState);

      if (!newMaximizedState) {
        // Play collapse sound when minimizing
        playWindowCollapse();

        // Restoring to default size
        const defaultSize = mergedConstraints.defaultSize;

        const newPosition = {
          x: Math.max(0, (window.innerWidth - defaultSize.width) / 2),
          y: Math.max(30, (window.innerHeight - defaultSize.height) / 2),
        };

        setWindowSize({
          width: defaultSize.width,
          height: defaultSize.height,
        });

        // Center the window if we're restoring from a maximized state
        if (window.innerWidth >= 768) {
          setWindowPosition(newPosition);
        }

        // Save the new window state to global store
        if (instanceId) {
          updateInstanceWindowState(
            instanceId,
            window.innerWidth >= 768 ? newPosition : windowPosition,
            defaultSize
          );
        } else {
          updateWindowState(
            appId,
            window.innerWidth >= 768 ? newPosition : windowPosition,
            defaultSize
          );
        }
      } else {
        // Play expand sound when maximizing
        playWindowExpand();

        // Maximizing the window
        // Save current size before maximizing
        previousSizeRef.current = {
          width: windowSize.width,
          height: windowSize.height,
        };

        // Set to full width and height
        const { topInset, bottomInset } = computeInsets();
        const maxPossibleHeight = window.innerHeight - topInset - bottomInset;
        const maxHeight = mergedConstraints.maxHeight
          ? typeof mergedConstraints.maxHeight === "string"
            ? parseInt(mergedConstraints.maxHeight)
            : mergedConstraints.maxHeight
          : maxPossibleHeight;
        const newHeight = Math.min(maxPossibleHeight, maxHeight);

        // For width we use the full window width on mobile, otherwise respect constraints
        let newWidth = window.innerWidth;
        if (window.innerWidth >= 768) {
          const maxWidth = mergedConstraints.maxWidth
            ? typeof mergedConstraints.maxWidth === "string"
              ? parseInt(mergedConstraints.maxWidth)
              : mergedConstraints.maxWidth
            : window.innerWidth;
          newWidth = Math.min(window.innerWidth, maxWidth);
        }

        const newSize = {
          width: newWidth,
          height: newHeight,
        };

        const newPosition = {
          x: window.innerWidth >= 768 ? (window.innerWidth - newWidth) / 2 : 0,
          y: topInset,
        };

        setWindowSize(newSize);

        // Position at top of screen
        setWindowPosition(newPosition);

        // Save the new window state to global store
        if (instanceId) {
          updateInstanceWindowState(instanceId, newPosition, newSize);
        } else {
          updateWindowState(appId, newPosition, newSize);
        }
      }
    },
    [
      isMaximized,
      mergedConstraints,
      windowPosition,
      windowSize,
      appId,
      getSafeAreaBottomInset,
      updateInstanceWindowState,
    ]
  );

  // Handle double tap for titlebar
  const handleTitleBarTap = useCallback(
    (e: React.TouchEvent) => {
      if (isClosingRef.current) return;
      // Don't stop propagation by default, only if we detect a double tap
      e.preventDefault();

      const now = Date.now();

      // If we're currently processing a tap or in cooldown, ignore this tap
      if (isProcessingTapRef.current || now - lastToggleTimeRef.current < 300) {
        return;
      }

      const timeSinceLastTap = now - lastTapTimeRef.current;

      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }

      // Check if this is a double tap (less than 300ms between taps)
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Only stop propagation if we detect a double tap
        e.stopPropagation();
        isProcessingTapRef.current = true;
        handleFullMaximize(e);
        // Reset the last tap time
        lastTapTimeRef.current = 0;

        // Reset processing flag after a delay that matches our cooldown
        setTimeout(() => {
          isProcessingTapRef.current = false;
        }, 300);
      } else {
        // Set timeout to reset last tap time if no second tap occurs
        doubleTapTimeoutRef.current = setTimeout(() => {
          lastTapTimeRef.current = 0;
        }, 300);

        // Update last tap time
        lastTapTimeRef.current = now;
      }
    },
    [handleFullMaximize]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  // 如果窗口正在最小化动画中，仍然渲染（等待动画完成）
  // 如果窗口已最小化且不在恢复动画中，不渲染
  if (!isVisible || (isMinimized && !isMinimizing && !isRestoring)) return null;

  // Calculate dynamic style for swipe animation feedback
  const getSwipeStyle = () => {
    if (!isPhone || !isSwiping || !swipeDirection) {
      return {};
    }

    // Apply a slight translation effect during swipe
    const translateAmount = swipeDirection === "left" ? -10 : 10;
    return {
      transform: `translateX(${translateAmount}px)`,
      transition: "transform 0.1s ease",
    };
  };

  return (
    <div
      ref={windowRef}
      className={cn(
        "absolute p-2 md:p-0 w-full md:h-full md:mt-0 select-none",
        "transition-all duration-200 ease-in-out",
        isInitialMount && "animate-in fade-in-0 zoom-in-95 duration-200",
        isShaking && "animate-shake",
        // Disable all pointer events when window is closing, minimizing, or restoring
        (!isOpen || isMinimizing || isRestoring) && "pointer-events-none"
      )}
      onClick={() => {
        if (!isForeground && !isMinimizing && !isRestoring) {
          if (instanceId) {
            bringInstanceToForeground(instanceId);
          } else {
            bringToForeground(appId);
          }
        }
      }}
      onTransitionEnd={handleTransitionEnd}
      style={{
        left: windowPosition.x,
        top: Math.max(0, windowPosition.y),
        width: window.innerWidth >= 768 ? windowSize.width : "100%",
        height: Math.max(windowSize.height, mergedConstraints.minHeight || 0),
        minWidth:
          window.innerWidth >= 768 ? mergedConstraints.minWidth : "100%",
        minHeight: mergedConstraints.minHeight,
        maxWidth: mergedConstraints.maxWidth || undefined,
        maxHeight: mergedConstraints.maxHeight || undefined,
        // 在最小化或恢复动画期间，禁用默认 transition，使用动画函数中的样式
        transition: isDragging || resizeType || isMinimizing || isRestoring ? "none" : undefined,
        // 只有在非最小化/恢复状态下才应用关闭动画
        transform: !isInitialMount && !isOpen && !isMinimizing && !isRestoring ? "scale(0.95)" : undefined,
        opacity: !isInitialMount && !isOpen && !isMinimizing && !isRestoring ? 0 : undefined,
        transformOrigin: "center",
      }}
    >
      <div className="relative w-full h-full">
        {/* Resize handles - positioned outside main content */}
        <div
          className={cn(
            "absolute -top-2 -left-2 -right-2 -bottom-2 pointer-events-none select-none",
            resizerZIndexClass
          )}
        >
          {/* Top resize handle */}
          <div
            className={cn(
              "absolute cursor-n-resize pointer-events-auto transition-[top,height] select-none resize-handle",
              "left-1 right-0", // Full width for all cases
              debugMode && "bg-red-500/50",
              resizeType?.includes("n")
                ? "top-[-100px] h-[200px]"
                : isMobile
                ? isXpTheme
                  ? "top-0 h-4" // Start from top but be shorter for XP/98 themes
                  : currentTheme === "macosx"
                  ? "top-1 h-2" // Extend above window for macOS to avoid traffic lights
                  : "top-0 h-8"
                : "top-1 h-2"
            )}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "n" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "n" as ResizeType)
            }
            onDoubleClick={handleHeightOnlyMaximize}
          />

          {/* Bottom resize handle */}
          <div
            className={cn(
              "absolute left-1 right-1 cursor-s-resize pointer-events-auto transition-[bottom,height] select-none resize-handle",
              debugMode && "bg-red-500/50",
              resizeType?.includes("s")
                ? "bottom-[-100px] h-[200px]"
                : isMobile
                ? "bottom-0 h-6"
                : "bottom-1 h-2"
            )}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "s" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "s" as ResizeType)
            }
            onDoubleClick={handleHeightOnlyMaximize}
          />

          {/* Left resize handle */}
          <div
            className={cn(
              "absolute top-3 cursor-w-resize pointer-events-auto transition-[left,width] select-none resize-handle",
              debugMode && "bg-red-500/50",
              resizeType?.includes("w")
                ? "left-[-100px] w-[200px]"
                : "left-1 w-2"
            )}
            style={{ bottom: resizeType?.includes("s") ? "32px" : "24px" }}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "w" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "w" as ResizeType)
            }
          />

          {/* Right resize handle */}
          <div
            className={cn(
              "absolute top-6 cursor-e-resize pointer-events-auto transition-[right,width] select-none resize-handle",
              debugMode && "bg-red-500/50",
              resizeType?.includes("e")
                ? "right-[-100px] w-[200px]"
                : "right-1 w-2"
            )}
            style={{ bottom: resizeType?.includes("s") ? "32px" : "24px" }}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "e" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "e" as ResizeType)
            }
          />

          {/* Corner resize handles */}
          <div
            className={cn(
              "absolute cursor-ne-resize pointer-events-auto transition-all select-none resize-handle",
              debugMode && "bg-red-500/50",
              isMobile && "hidden",
              resizeType === "ne"
                ? "top-[-100px] right-[-100px] w-[200px] h-[200px]"
                : "top-0 right-0 w-6 h-6"
            )}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "ne" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "ne" as ResizeType)
            }
          />

          <div
            className={cn(
              "absolute cursor-sw-resize pointer-events-auto transition-all select-none resize-handle",
              debugMode && "bg-red-500/50",
              isMobile && "hidden",
              resizeType === "sw"
                ? "bottom-[-100px] left-[-100px] w-[200px] h-[200px]"
                : "bottom-0 left-0 w-6 h-6"
            )}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "sw" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "sw" as ResizeType)
            }
          />

          <div
            className={cn(
              "absolute cursor-se-resize pointer-events-auto transition-all select-none resize-handle",
              debugMode && "bg-red-500/50",
              isMobile && "hidden",
              resizeType === "se"
                ? "bottom-[-100px] right-[-100px] w-[200px] h-[200px]"
                : "bottom-0 right-0 w-6 h-6"
            )}
            onMouseDown={(e) =>
              handleResizeStartWithForeground(e, "se" as ResizeType)
            }
            onTouchStart={(e) =>
              handleResizeStartWithForeground(e, "se" as ResizeType)
            }
          />
        </div>

        <div
          className={cn(
            isXpTheme
              ? "window flex flex-col h-full" // Use xp.css window class with flex layout
              : "window w-full h-full flex flex-col border-[length:var(--os-metrics-border-width)] border-os-window rounded-os overflow-hidden",
            !effectiveTransparentBackground && !isXpTheme && "bg-os-window-bg",
            !isXpTheme && (currentTheme !== "system7" || isForeground)
              ? "shadow-os-window"
              : "",
            isForeground ? "is-foreground" : ""
          )}
          style={{
            ...(!isXpTheme ? getSwipeStyle() : undefined),
          }}
        >
          {/* Title bar */}
          {isXpTheme ? (
            // XP/98 theme title bar structure
            <div
              className={cn(
                "title-bar relative z-50",
                !isForeground && "inactive" // Add inactive class when not in foreground
              )}
              style={{
                ...(currentTheme === "xp" ? { minHeight: "30px" } : undefined),
                ...(!isForeground
                  ? {
                      background: theme.colors.titleBar.inactiveBg,
                    }
                  : undefined),
              }}
              onMouseDown={handleMouseDownWithForeground}
              onDoubleClick={(e) => {
                if (isFromTitlebarControls(e.target)) return;
                handleFullMaximize(e);
              }}
              onTouchStart={(e: React.TouchEvent<HTMLElement>) => {
                if (isFromTitlebarControls(e.target)) {
                  e.stopPropagation();
                  return;
                }
                handleTitleBarTap(e);
                handleMouseDownWithForeground(e);
                if (isPhone) {
                  handleTouchStart(e);
                }
              }}
              onTouchMove={(e: React.TouchEvent<HTMLElement>) => {
                if (isPhone) {
                  handleTouchMove(e);
                }
              }}
              onTouchEnd={() => {
                if (isPhone) {
                  handleTouchEnd();
                }
              }}
            >
              <div
                className={cn(
                  "title-bar-text",
                  !isForeground && "inactive" // Add inactive class for text too
                )}
                style={{
                  display: "flex",
                  alignItems: "center",
                  ...(!isForeground
                    ? {
                        color: theme.colors.titleBar.inactiveText,
                      }
                    : {}),
                }}
                onTouchMove={(e) => e.preventDefault()}
              >
                <ThemedIcon
                  name={getAppIconPath(appId)}
                  alt={title}
                  className="w-4 h-4 mr-1 [image-rendering:pixelated]"
                  style={{
                    filter: !isForeground ? "grayscale(100%)" : "none",
                  }}
                />
                {title}
              </div>
              <div className="title-bar-controls" data-titlebar-controls>
                <button
                  aria-label="Minimize"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (instanceId) {
                      handleMinimize();
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <button
                  aria-label="Maximize"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullMaximize(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <button
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ) : currentTheme === "os1" ? (
            <div
              className={cn(
                "title-bar os1-title-bar flex items-center h-os-titlebar min-h-[1.375rem] px-3 select-none cursor-move user-select-none z-50",
                // 添加透明背景和毛玻璃效果
                "bg-white/80 backdrop-blur-xl"
              )}
              style={{
                // 移除原来的 background，改用透明背景
                // background: isForeground
                //   ? theme.colors.titleBar.activeBg
                //   : theme.colors.titleBar.inactiveBg,
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                color: isForeground
                  ? theme.colors.titleBar.text
                  : theme.colors.titleBar.inactiveText,
                borderRadius: theme.metrics.titleBarRadius,
                borderBottom: `1px solid ${
                  isForeground
                    ? theme.colors.titleBar.borderBottom ||
                      theme.colors.titleBar.border ||
                      "rgba(0, 0, 0, 0.12)"
                    : theme.colors.titleBar.borderInactive ||
                      "rgba(0, 0, 0, 0.08)"
                }`,
                opacity: isForeground ? 1 : 0.85,
              }}
              onMouseDown={handleMouseDownWithForeground}
              onDoubleClick={(e) => {
                if (isFromTitlebarControls(e.target)) return;
                handleFullMaximize(e);
              }}
              onTouchStart={(e: React.TouchEvent<HTMLElement>) => {
                if (isFromTitlebarControls(e.target)) {
                  e.stopPropagation();
                  return;
                }
                handleTitleBarTap(e);
                handleMouseDownWithForeground(e);
                if (isPhone) {
                  handleTouchStart(e);
                }
              }}
              onTouchMove={(e: React.TouchEvent<HTMLElement>) => {
                if (isPhone) {
                  handleTouchMove(e);
                }
              }}
              onTouchEnd={() => {
                if (isPhone) {
                  handleTouchEnd();
                }
              }}
            >
              {/* 窗口控制按钮 - 放在左侧 */}
              <div
                className={cn(
                  "os1-window-controls flex items-center gap-2 mr-3",
                  !isForeground && "inactive"
                )}
                data-titlebar-controls
              >
                <button
                  type="button"
                  aria-label="Close"
                  className="os1-window-control os1-window-control--close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <span aria-hidden="true" className="os1-window-control-icon">
                    &times;
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Minimize"
                  className="os1-window-control os1-window-control--ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (instanceId) {
                      handleMinimize();
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <span aria-hidden="true" className="os1-window-control-icon">
                    &minus;
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Maximize"
                  className="os1-window-control os1-window-control--ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullMaximize(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <span aria-hidden="true" className="os1-window-control-icon">
                    &#9633;
                  </span>
                </button>
              </div>
              {/* 图标和标题 - 放在右侧 */}
              {/* OS1 主题下隐藏图标和标题，标题显示在菜单栏中 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* OS1 主题下不显示任何内容 */}
              </div>
            </div>
          ) : currentTheme === "macosx" ? (
            // Mac OS X theme title bar with traffic light buttons
            <div
              className={cn(
                "title-bar flex items-center shrink-0 h-6 min-h-[1.25rem] mx-0 mb-0 px-[0.1rem] py-[0.1rem] select-none cursor-move user-select-none z-50 draggable-area",
                effectiveTransparentBackground && "mt-0"
              )}
              style={{
                borderRadius: "8px 8px 0px 0px",
                ...(isForeground
                  ? {
                      backgroundColor: "var(--os-color-window-bg)",
                      backgroundImage:
                        "var(--os-pinstripe-titlebar), var(--os-pinstripe-window)",
                    }
                  : {
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                      backgroundImage: "var(--os-pinstripe-window)",
                      opacity: "0.85",
                    }),
                borderBottom: `1px solid ${
                  isForeground
                    ? theme.colors.titleBar.borderBottom ||
                      theme.colors.titleBar.border ||
                      "rgba(0, 0, 0, 0.1)"
                    : theme.colors.titleBar.borderInactive ||
                      "rgba(0, 0, 0, 0.05)"
                }`,
              }}
              onMouseDown={handleMouseDownWithForeground}
              onDoubleClick={(e) => {
                if (isFromTitlebarControls(e.target)) return;
                handleFullMaximize(e);
              }}
              onTouchStart={(e: React.TouchEvent<HTMLElement>) => {
                if (isFromTitlebarControls(e.target)) {
                  e.stopPropagation();
                  return;
                }
                handleTitleBarTap(e);
                handleMouseDownWithForeground(e);
                if (isPhone) {
                  handleTouchStart(e);
                }
              }}
              onTouchMove={(e: React.TouchEvent<HTMLElement>) => {
                if (isPhone) {
                  handleTouchMove(e);
                }
              }}
              onTouchEnd={() => {
                if (isPhone) {
                  handleTouchEnd();
                }
              }}
            >
              {/* Traffic Light Buttons */}
              <div
                className="flex items-center gap-2 ml-1.5 relative"
                data-titlebar-controls
              >
                {/* Close Button (Red) */}
                <div
                  className="relative"
                  style={{ width: "13px", height: "13px" }}
                >
                  <div
                    aria-hidden="true"
                    className="rounded-full relative overflow-hidden cursor-default outline-none box-border"
                    style={{
                      width: "13px",
                      height: "13px",
                      background: isForeground
                        ? "linear-gradient(rgb(193, 58, 45), rgb(205, 73, 52))"
                        : "linear-gradient(rgba(160, 160, 160, 0.625), rgba(255, 255, 255, 0.625))",
                      boxShadow: isForeground
                        ? "rgba(0, 0, 0, 0.5) 0px 2px 4px, rgba(0, 0, 0, 0.4) 0px 1px 2px, rgba(225, 70, 64, 0.5) 0px 1px 1px, rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px inset, rgba(150, 40, 30, 0.8) 0px 1px 3px inset, rgba(225, 70, 64, 0.75) 0px 2px 3px 1px inset"
                        : "0 2px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.3), inset 0 0 0 0.5px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.4), inset 0 2px 3px 1px #bbbbbb",
                    }}
                  >
                    {/* Top shine */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                      style={{
                        height: "28%",
                        background:
                          "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3))",
                        width: "calc(100% - 6px)",
                        borderRadius: "6px 6px 0 0",
                        top: "1px",
                        filter: "blur(0.2px)",
                        zIndex: 2,
                      }}
                    />
                    {/* Bottom glow */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                      style={{
                        height: "33%",
                        background:
                          "linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.5))",
                        width: "calc(100% - 3px)",
                        borderRadius: "0 0 6px 6px",
                        bottom: "1px",
                        filter: "blur(0.3px)",
                      }}
                    />
                  </div>
                  <button
                    aria-label="Close"
                    className={cn(
                      "absolute -inset-2 z-10 rounded-none outline-none cursor-default",
                      debugMode ? "bg-red-500/50" : "opacity-0"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Minimize Button (Yellow) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (instanceId) {
                      handleMinimize();
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="rounded-full relative overflow-hidden cursor-default outline-none box-border"
                  style={{
                    width: "13px",
                    height: "13px",
                    background: isForeground
                      ? "linear-gradient(rgb(202, 130, 13), rgb(253, 253, 149))"
                      : "linear-gradient(rgba(160, 160, 160, 0.625), rgba(255, 255, 255, 0.625))",
                    boxShadow: isForeground
                      ? "rgba(0, 0, 0, 0.5) 0px 2px 4px, rgba(0, 0, 0, 0.4) 0px 1px 2px, rgba(223, 161, 35, 0.5) 0px 1px 1px, rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px inset, rgb(155, 78, 21) 0px 1px 3px inset, rgb(241, 157, 20) 0px 2px 3px 1px inset"
                      : "0 2px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.3), inset 0 0 0 0.5px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.4), inset 0 2px 3px 1px #bbbbbb",
                  }}
                  aria-label="Minimize"
                >
                  {/* Top shine */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                    style={{
                      height: "28%",
                      background:
                        "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3))",
                      width: "calc(100% - 6px)",
                      borderRadius: "6px 6px 0 0",
                      top: "1px",
                      filter: "blur(0.2px)",
                      zIndex: 2,
                    }}
                  />
                  {/* Bottom glow */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                    style={{
                      height: "33%",
                      background:
                        "linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.5))",
                      width: "calc(100% - 3px)",
                      borderRadius: "0 0 6px 6px",
                      bottom: "1px",
                      filter: "blur(0.3px)",
                    }}
                  />
                </button>

                {/* Maximize Button (Green) */}
                <div
                  className="relative"
                  style={{ width: "13px", height: "13px" }}
                >
                  <div
                    aria-hidden="true"
                    className="rounded-full relative overflow-hidden cursor-default outline-none box-border"
                    style={{
                      width: "13px",
                      height: "13px",
                      background: isForeground
                        ? "linear-gradient(rgb(111, 174, 58), rgb(138, 192, 50))"
                        : "linear-gradient(rgba(160, 160, 160, 0.625), rgba(255, 255, 255, 0.625))",
                      boxShadow: isForeground
                        ? "rgba(0, 0, 0, 0.5) 0px 2px 4px, rgba(0, 0, 0, 0.4) 0px 1px 2px, rgb(59, 173, 29, 0.5) 0px 1px 1px, rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px inset, rgb(53, 91, 17) 0px 1px 3px inset, rgb(98, 187, 19) 0px 2px 3px 1px inset"
                        : "0 2px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.3), inset 0 0 0 0.5px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.4), inset 0 2px 3px 1px #bbbbbb",
                    }}
                  >
                    {/* Top shine */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                      style={{
                        height: "28%",
                        background:
                          "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3))",
                        width: "calc(100% - 6px)",
                        borderRadius: "6px 6px 0 0",
                        top: "1px",
                        filter: "blur(0.2px)",
                        zIndex: 2,
                      }}
                    />
                    {/* Bottom glow */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                      style={{
                        height: "33%",
                        background:
                          "linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.5))",
                        width: "calc(100% - 3px)",
                        borderRadius: "0 0 6px 6px",
                        bottom: "1px",
                        filter: "blur(0.3px)",
                      }}
                    />
                  </div>
                  <button
                    aria-label="Maximize"
                    className={cn(
                      "absolute -inset-2 z-10 rounded-none outline-none cursor-default",
                      debugMode ? "bg-red-500/50" : "opacity-0"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFullMaximize(e);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Title - removed white background */}
              <span
                className={cn(
                  "select-none mx-auto px-2 py-0 h-full flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%] text-[13px]",
                  isForeground
                    ? "text-os-titlebar-active-text"
                    : "text-os-titlebar-inactive-text"
                )}
                style={{
                  textShadow: isForeground
                    ? "0 2px 3px rgba(0, 0, 0, 0.25)"
                    : "none",
                  fontWeight: 500,
                }}
                onTouchMove={(e) => e.preventDefault()}
              >
                <span className="truncate">{title}</span>
              </span>

              {/* Spacer to balance the traffic lights */}
              <div className="mr-2 w-12 h-4" />
            </div>
          ) : (
            // Original Mac theme title bar (for System 7)
            <div
              className={cn(
                "flex items-center shrink-0 h-os-titlebar min-h-[1.5rem] mx-0 my-[0.1rem] mb-0 px-[0.1rem] py-[0.2rem] select-none cursor-move border-b-[1.5px] user-select-none z-50 draggable-area",
                transparentBackground && "mt-0",
                isForeground
                  ? transparentBackground
                    ? "bg-white/70 backdrop-blur-sm border-b-os-window"
                    : "bg-os-titlebar-active-bg bg-os-titlebar-pattern bg-clip-content bg-[length:6.6666666667%_13.3333333333%] border-b-os-window"
                  : transparentBackground
                  ? "bg-white/20 backdrop-blur-sm border-b-os-window"
                  : "bg-os-titlebar-inactive-bg border-b-gray-400"
              )}
              onMouseDown={handleMouseDownWithForeground}
              onDoubleClick={(e) => {
                if (isFromTitlebarControls(e.target)) return;
                handleFullMaximize(e);
              }}
              onTouchStart={(e: React.TouchEvent<HTMLElement>) => {
                if (isFromTitlebarControls(e.target)) {
                  e.stopPropagation();
                  return;
                }
                handleTitleBarTap(e);
                handleMouseDownWithForeground(e);
                if (isPhone) {
                  handleTouchStart(e);
                }
              }}
              onTouchMove={(e: React.TouchEvent<HTMLElement>) => {
                if (isPhone) {
                  handleTouchMove(e);
                }
              }}
              onTouchEnd={() => {
                if (isPhone) {
                  handleTouchEnd();
                }
              }}
            >
              <div
                onClick={handleClose}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="relative ml-2 w-4 h-4 cursor-default select-none"
                data-titlebar-controls
              >
                <div className="absolute inset-0 -m-2" />{" "}
                {/* Larger click area */}
                <div
                  className={`w-4 h-4 ${
                    !transparentBackground &&
                    "bg-os-button-face shadow-[0_0_0_1px_var(--os-color-button-face)]"
                  } border-2 border-os-window hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center ${
                    !isForeground && "invisible"
                  }`}
                />
              </div>
              <span
                className={cn(
                  "select-none mx-auto px-2 py-0 h-full flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%]",
                  !transparentBackground && "bg-os-button-face",
                  isForeground
                    ? "text-os-titlebar-active-text"
                    : "text-os-titlebar-inactive-text"
                )}
                onTouchMove={(e) => e.preventDefault()}
              >
                <span className="truncate">{title}</span>
              </span>
              <div className="mr-2 w-4 h-4" />
            </div>
          )}

          {/* For XP/98 themes, render the menuBar inside the window */}
          {isXpTheme && menuBar && (
            <div
              className="menubar-container"
              style={{
                background: "var(--button-face)",
                borderBottom: "1px solid var(--button-shadow)",
              }}
            >
              {menuBar}
            </div>
          )}

          {/* Window content */}
          <div
            className={cn(
              "flex flex-1 min-h-0 flex-col md:flex-row",
              isXpTheme && "window-body flex-1",
              // OS1 主题下添加上边左右圆角
              currentTheme === "os1" && "rounded-tl-xl rounded-tr-xl overflow-hidden"
            )}
            style={
              isXpTheme
                ? { margin: currentTheme === "xp" ? "0px 3px" : "0" }
                : currentTheme === "macosx"
                ? transparentBackground
                  ? undefined
                  : isForeground
                  ? {
                      backgroundColor: "var(--os-color-window-bg)",
                      backgroundImage: "var(--os-pinstripe-window)",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.6)",
                      backgroundImage: "var(--os-pinstripe-window)",
                    }
                : undefined
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
