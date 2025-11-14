import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AboutFinderDialog } from "@/components/dialogs/AboutFinderDialog";
import { AnyApp } from "@/apps/base/types";
import { AppId, getAppIconPath } from "@/config/appRegistry";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";
import { ThemedIcon } from "@/components/shared/ThemedIcon";

interface AppleMenuProps {
  apps: AnyApp[];
}

export function AppleMenu({ apps }: AppleMenuProps) {
  const [aboutFinderOpen, setAboutFinderOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const launchApp = useLaunchApp();
  const currentTheme = useThemeStore((state) => state.current);
  const isMacOsxTheme = currentTheme === "macosx";
  const isOS1Theme = currentTheme === "os1";

  const handleAppClick = (appId: string) => {
    // Simply launch the app - the instance system will handle focus if already open
    console.log(`[AppleMenu] Launching app: ${appId}`);
    try {
      launchApp(appId as AppId);
    } catch (error) {
      console.error(`[AppleMenu] Error launching app ${appId}:`, error);
    }
    // 关闭菜单
    setIsMenuOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className={cn(
              "h-6 px-3 py-1 border-none hover:bg-black/10 active:bg-black/20 focus-visible:ring-0",
              isMacOsxTheme ? "text-xl px-1 flex items-center justify-center" : isOS1Theme ? "text-2xl px-1 flex items-center justify-center" : "text-md"
            )}
            style={{ color: "inherit" }}
          >
            {isMacOsxTheme ? (
              <ThemedIcon
                name="apple.png"
                alt="Apple Menu"
                style={{ width: 30, height: 30, display: "block" }}
              />
            ) : (
              <span style={isOS1Theme ? { fontSize: "20px", lineHeight: 1 } : undefined}>
                {"\uf8ff"} {/*  */}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={() => setAboutFinderOpen(true)}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About This Computer
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          {apps.map((app) => {
            // Use getAppIconPath to get theme-aware icon path (e.g., console icon for control-panels in OS1)
            const iconPath = getAppIconPath(app.id as AppId);
            return (
              <DropdownMenuItem
                key={app.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleAppClick(app.id);
                }}
                className="text-md h-6 px-3 active:bg-gray-900 active:text-white flex items-center gap-2"
              >
                {typeof app.icon === "string" ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    {app.icon}
                  </div>
                ) : (
                  <ThemedIcon
                    name={iconPath}
                    alt={app.name}
                    className="w-4 h-4 [image-rendering:pixelated]"
                  />
                )}
                {app.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutFinderDialog
        isOpen={aboutFinderOpen}
        onOpenChange={setAboutFinderOpen}
      />
    </>
  );
}
