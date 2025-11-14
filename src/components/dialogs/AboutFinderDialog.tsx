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
    <div className={isXpTheme ? "p-2 px-4" : "p-4"}>
      <div className="flex">
        {/* Right side with system info */}
        <div className="space-y-3 flex-1 ">
          <div className="flex flex-row items-center space-x-2 p-2 px-4">
            <div className="flex flex-col w-1/3 items-center space-x-2">
              <ThemedIcon
                name="mac-classic.png"
                alt="Happy Mac"
                className="w-10 h-10 mb-1 mr-0"
              />
              <div
                className={cn(
                  isXpTheme
                    ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[16px]"
                    : isOS1Theme
                    ? "font-os-ui text-2xl font-semibold"
                    : "font-apple-garamond text-2xl"
                )}
                style={
                  isOS1Theme
                    ? {
                        fontFamily: "var(--os-font-ui)",
                        color: "var(--os-color-text-primary)",
                      }
                    : undefined
                }
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
                "space-y-4",
                isXpTheme
                  ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[10px]"
                  : isOS1Theme
                  ? "font-os-ui text-[13px]"
                  : "font-geneva-12 text-[10px]"
              )}
              style={{
                fontFamily: isXpTheme
                  ? '"Pixelated MS Sans Serif", Arial'
                  : isOS1Theme
                  ? "var(--os-font-ui)"
                  : undefined,
                fontSize: isXpTheme ? "10px" : isOS1Theme ? "13px" : undefined,
                color: isOS1Theme ? "var(--os-color-text-primary)" : undefined,
              }}
            >
              <div>
                <div>Built-in Memory: 32MB</div>
                <div>Virtual Memory: Off</div>
                <div>
                  Largest Unused Block: {(32 - totalUsedMemory).toFixed(1)}MB
                </div>
                <div
                  className={cn(
                    "text-[10px] mt-2",
                    isXpTheme
                      ? "font-['Pixelated_MS_Sans_Serif',Arial] text-gray-500"
                      : isOS1Theme
                      ? "font-os-ui text-[11px]"
                      : "font-geneva-12 text-gray-500"
                  )}
                  style={{
                    fontFamily: isXpTheme
                      ? '"Pixelated MS Sans Serif", Arial'
                      : isOS1Theme
                      ? "var(--os-font-ui)"
                      : undefined,
                    fontSize: isOS1Theme ? "11px" : undefined,
                    color: isOS1Theme
                      ? "var(--os-color-text-secondary)"
                      : undefined,
                  }}
                >
                  © Zihan. {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </div>
          <hr
            className={cn(
              isOS1Theme ? "border-gray-200" : "border-gray-300"
            )}
            style={
              isOS1Theme
                ? { borderColor: "rgba(0, 0, 0, 0.08)", borderWidth: "1px" }
                : undefined
            }
          />

          {/* Memory usage bars */}
          <div
            className={cn(
              "space-y-2 p-2 px-4 pb-4",
              isXpTheme
                ? "font-['Pixelated_MS_Sans_Serif',Arial] text-[10px]"
                : isOS1Theme
                ? "font-os-ui text-[13px]"
                : "font-geneva-12 text-[10px]"
            )}
            style={{
              fontFamily: isXpTheme
                ? '"Pixelated MS Sans Serif", Arial'
                : isOS1Theme
                ? "var(--os-font-ui)"
                : undefined,
              fontSize: isXpTheme ? "10px" : isOS1Theme ? "13px" : undefined,
              color: isOS1Theme ? "var(--os-color-text-primary)" : undefined,
            }}
          >
            {memoryUsage.map((app, index) => (
              <div className="flex flex-row items-center gap-1" key={index}>
                <div className="flex justify-between w-full">
                  <div className="w-1/2 truncate">{app.name}</div>
                  <div className="w-1/3">{app.memoryMB.toFixed(1)} MB</div>
                </div>
                <div
                  className={cn(
                    "h-2 w-full rounded",
                    currentTheme === "macosx"
                      ? "aqua-progress"
                      : isOS1Theme
                      ? "bg-gray-200/50"
                      : "bg-gray-200"
                  )}
                  style={
                    isOS1Theme
                      ? {
                          backgroundColor: "rgba(0, 0, 0, 0.08)",
                          borderRadius: "4px",
                        }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-200 rounded",
                      currentTheme === "macosx"
                        ? "aqua-progress-fill"
                        : isOS1Theme
                        ? ""
                        : "bg-blue-500"
                    )}
                    style={{
                      width: `${app.percentage}%`,
                      ...(isOS1Theme
                        ? {
                            backgroundColor: "var(--os-color-traffic-light-close)",
                            borderRadius: "4px",
                          }
                        : {}),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
