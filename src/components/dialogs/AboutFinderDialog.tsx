import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getNonFinderApps } from "@/config/appRegistry";
import { useAppContext } from "@/contexts/AppContext";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ThemedIcon } from "@/components/shared/ThemedIcon";

interface AboutFinderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AppMemoryUsage {
  name: string;
  memoryMB: number;
  percentage: number;
}

export function AboutFinderDialog({
  isOpen,
  onOpenChange,
}: AboutFinderDialogProps) {
  const { appStates } = useAppContext();
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";
  const isOS1Theme = currentTheme === "os1";

  const memoryUsage = useMemo(() => {
    const totalMemory = 32; // 32MB total memory
    const systemUsage = 8.5; // System takes about 8.5MB
    const apps = getNonFinderApps();

    // Get only open apps
    const openApps = apps.filter((app) => appStates[app.id]?.isOpen);

    // Calculate memory usage for system and open apps (limited to 4)
    const appUsages: AppMemoryUsage[] = [
      {
        name: "System",
        memoryMB: systemUsage,
        percentage: (systemUsage / totalMemory) * 100,
      },
      ...openApps.map((app, index) => {
        const memory = 1.5 + index * 0.5; // Simulate different memory usage per app
        return {
          name: app.name,
          memoryMB: memory,
          percentage: (memory / totalMemory) * 100,
        };
      }),
    ];

    return appUsages;
  }, [appStates]);

  const totalUsedMemory = useMemo(() => {
    return memoryUsage.reduce((acc, app) => acc + app.memoryMB, 0);
  }, [memoryUsage]);

  const dialogContent = (
    <div className={isXpTheme ? "p-2 px-4" : isOS1Theme ? "p-6" : "p-4"}>
      <div className="flex">
        {/* Right side with system info */}
        <div className={cn("flex-1", isOS1Theme ? "space-y-5" : "space-y-3")}>
          {isOS1Theme ? (
            // OS1 主题：居中布局
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* 图标和标题区域 - 居中 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <ThemedIcon
                  name="mac-classic.png"
                  alt="Happy Mac"
                  className="w-16 h-16 mb-4"
                />
                <span
                  style={{
                    fontFamily: "var(--os-font-ui)",
                    fontSize: "36px",
                    fontWeight: 600,
                    color: "var(--os-color-text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.2",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  ZiOS
                </span>
              </div>

              {/* 规格信息区域 - 居中 */}
              <div
                style={{
                  fontFamily: "var(--os-font-ui)",
                  fontSize: "13px",
                  color: "var(--os-color-text-primary)",
                  lineHeight: "1.6",
                  letterSpacing: "-0.01em",
                  width: "100%",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  Built-in Memory: 32MB
                </div>
                <div style={{ marginBottom: "4px" }}>
                  Virtual Memory: Off
                </div>
                <div style={{ marginBottom: "16px" }}>
                  Largest Unused Block: {(32 - totalUsedMemory).toFixed(1)}MB
                </div>

                {/* More Info 按钮 - 居中 */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <a
                    href="https://bravohenry.com/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "6px 16px",
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                      borderRadius: "6px",
                      fontFamily: "var(--os-font-ui)",
                      fontSize: "13px",
                      color: "var(--os-color-text-primary)",
                      textDecoration: "none",
                      transition: "background-color 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    More Info...
                  </a>
                </div>
              </div>

              {/* 分隔线 */}
              <hr
                style={{
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  borderWidth: "1px",
                  width: "100%",
                  margin: "0 0 16px 0",
                }}
              />
            </div>
          ) : (
            // 其他主题：保持原有布局
            <>
              <div className={cn(
                "flex flex-row items-start",
                "space-x-2 p-2 px-4"
              )}>
                <div className={cn(
                  "flex flex-col items-center",
                  "w-1/3"
                )}>
                  <ThemedIcon
                    name="mac-classic.png"
                    alt="Happy Mac"
                    className="w-10 h-10 mb-1 mr-0"
                  />
                  <div
                    className={cn(
                      isXpTheme
                        ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[16px]"
                        : "font-apple-garamond text-2xl"
                    )}
                  >
                    ZiOS
                    {currentTheme === "system7"
                      ? " 7"
                      : currentTheme === "macosx"
                      ? " X"
                      : currentTheme === "win98"
                      ? " 98"
                      : currentTheme === "xp"
                      ? " XP"
                      : ""}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex-1",
                    isXpTheme
                      ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[10px] space-y-4"
                      : "font-geneva-12 text-[10px] space-y-4"
                  )}
                  style={{
                    fontFamily: isXpTheme
                      ? '"Pixelated MS Sans Serif", Arial'
                      : undefined,
                    fontSize: isXpTheme ? "10px" : undefined,
                  }}
                >
                  <div>
                    <div>Built-in Memory: 32MB</div>
                    <div>Virtual Memory: Off</div>
                    <div>
                      Largest Unused Block: {(32 - totalUsedMemory).toFixed(1)}MB
                    </div>
                  </div>
                </div>
              </div>
              <hr
                className={cn(
                  "border-gray-300"
                )}
              />
            </>
          )}

          {/* Memory usage bars */}
          <div
            className={cn(
              isXpTheme
                ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[10px] space-y-2 p-2 px-4 pb-4"
                : isOS1Theme
                ? "font-os-ui space-y-3 px-2 pb-2"
                : "font-geneva-12 text-[10px] space-y-2 p-2 px-4 pb-4"
            )}
            style={
              isOS1Theme
                ? {
                    fontFamily: "var(--os-font-ui)",
                    fontSize: "12px",
                    color: "var(--os-color-text-primary)",
                    lineHeight: "1.5",
                    letterSpacing: "-0.01em",
                    width: "100%",
                  }
                : {
                    fontFamily: isXpTheme
                      ? '"Pixelated MS Sans Serif", Arial'
                      : undefined,
                    fontSize: isXpTheme ? "10px" : undefined,
                  }
            }
          >
            {memoryUsage.map((app, index) => (
              <div
                key={index}
                style={
                  isOS1Theme
                    ? {
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }
                    : {
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }
                }
              >
                <div
                  style={
                    isOS1Theme
                      ? {
                          display: "flex",
                          alignItems: "baseline",
                          width: "180px",
                          gap: "8px",
                        }
                      : {
                          display: "flex",
                          alignItems: "baseline",
                          width: "160px",
                          gap: "8px",
                        }
                  }
                >
                  <span
                    style={
                      isOS1Theme
                        ? {
                            fontFamily: "var(--os-font-ui)",
                            fontSize: "12px",
                            color: "var(--os-color-text-primary)",
                            fontWeight: 500,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }
                        : isXpTheme
                        ? {
                            fontFamily: '"Pixelated MS Sans Serif", Arial',
                            fontSize: "10px",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }
                        : {
                            fontFamily: "var(--font-geneva-12)",
                            fontSize: "10px",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }
                    }
                  >
                    {app.name}
                  </span>
                  <span
                    style={
                      isOS1Theme
                        ? {
                            fontFamily: "var(--os-font-ui)",
                            fontSize: "12px",
                            color: "var(--os-color-text-secondary)",
                            minWidth: "58px",
                            textAlign: "right",
                          }
                        : isXpTheme
                        ? {
                            fontFamily: '"Pixelated MS Sans Serif", Arial',
                            fontSize: "10px",
                            minWidth: "50px",
                            textAlign: "right",
                          }
                        : {
                            fontFamily: "var(--font-geneva-12)",
                            fontSize: "10px",
                            minWidth: "50px",
                            textAlign: "right",
                          }
                    }
                  >
                    {app.memoryMB.toFixed(1)} MB
                  </span>
                </div>
                <div
                  className={
                    currentTheme === "macosx" && !isOS1Theme
                      ? "aqua-progress flex-1 h-2 rounded"
                      : undefined
                  }
                  style={
                    isOS1Theme
                      ? {
                          flexGrow: 1,
                          height: "6px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(0, 0, 0, 0.1)",
                        }
                      : currentTheme === "macosx"
                      ? {
                          flexGrow: 1,
                        }
                      : {
                          flexGrow: 1,
                          height: "8px",
                          borderRadius: "4px",
                          backgroundColor: "#e5e5e5",
                        }
                  }
                >
                  <div
                    className={
                      currentTheme === "macosx" && !isOS1Theme
                        ? "aqua-progress-fill h-full rounded transition-all duration-200"
                        : undefined
                    }
                    style={
                      isOS1Theme
                        ? {
                            width: `${app.percentage}%`,
                            maxWidth: "100%",
                            height: "100%",
                            borderRadius: "999px",
                            backgroundColor: "var(--os-color-traffic-light-close)",
                            transition: "width 0.2s ease",
                          }
                        : currentTheme === "macosx"
                        ? {
                            width: `${app.percentage}%`,
                          }
                        : {
                            width: `${app.percentage}%`,
                            height: "100%",
                            borderRadius: "4px",
                            backgroundColor: "#3b82f6",
                            transition: "width 0.2s ease",
                          }
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 底部信息区域 - 仅在 OS1 主题显示 */}
          {isOS1Theme && (
            <div
              style={{
                paddingTop: "20px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                data-about-finder-footer
                style={{
                  fontFamily: "var(--os-font-ui)",
                  fontSize: "10px",
                  color: "var(--os-color-text-secondary)",
                  lineHeight: "1.4",
                  textAlign: "center",
                  display: "block",
                }}
              >
                Open Source By{" "}
                <a
                  href="https://github.com/ryokun6/ryos"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--os-color-text-primary)";
                    e.currentTarget.style.textDecorationColor = "var(--os-color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--os-color-text-secondary)";
                    e.currentTarget.style.textDecorationColor = "rgba(0, 0, 0, 0.2)";
                  }}
                >
                  RyOS
                </a>
              </span>
              <span
                data-about-finder-footer
                style={{
                  fontFamily: "var(--os-font-ui)",
                  fontSize: "10px",
                  color: "var(--os-color-text-secondary)",
                  lineHeight: "1.4",
                  textAlign: "center",
                  display: "block",
                }}
              >
                @Zihan Huang 2025
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-[400px]", isXpTheme && "p-0 overflow-hidden")}
        style={isXpTheme ? { fontSize: "11px" } : undefined}
      >
        {isXpTheme ? (
          <>
            <DialogHeader>About This Computer</DialogHeader>
            <div className="window-body">{dialogContent}</div>
          </>
        ) : currentTheme === "macosx" ? (
          <>
            <DialogHeader>About This Computer</DialogHeader>
            {dialogContent}
          </>
        ) : isOS1Theme ? (
          <>
            <DialogHeader>About This Computer</DialogHeader>
            {dialogContent}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-normal text-[16px]">
                About This Computer
              </DialogTitle>
              <DialogDescription className="sr-only">
                Information about ZiOS on this computer
              </DialogDescription>
            </DialogHeader>
            {dialogContent}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
