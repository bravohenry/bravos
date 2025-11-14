import { OsThemeId } from "@/themes/types";

export interface TabStyleConfig {
  tabListClasses: string;
  tabTriggerClasses: string;
  tabContentClasses: string;
  separatorStyle: React.CSSProperties;
}

export function getTabStyles(currentTheme: OsThemeId): TabStyleConfig {
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";
  const isMacOSXTheme = currentTheme === "macosx";
  const isOS1Theme = currentTheme === "os1";
  const isSystem7Theme = currentTheme === "system7";
  const isWindowsLegacyTheme = isXpTheme;

  const separatorColor = isMacOSXTheme
    ? "rgba(0, 0, 0, 0.2)"
    : isOS1Theme
    ? "rgba(0, 0, 0, 0.08)"
    : isSystem7Theme || isWindowsLegacyTheme
    ? "#808080"
    : "rgba(0, 0, 0, 0.2)";

  // 根据主题调整标签页间距
  // OS1 主题：按钮之间没有 gap，连在一起
  const tabListSpacing = isOS1Theme ? "" : isMacOSXTheme ? "space-x-0.5" : "space-x-0.5";
  
  const tabListBase = `flex w-full ${
    isMacOSXTheme || isOS1Theme ? "" : "h-6"
  } ${tabListSpacing} shadow-none`;

  // System 7 styling - classic, no gradients or gloss
  const tabListSystem7 = "bg-[#E3E3E3] border-b border-[#808080]";
  const tabTriggerSystem7 =
    "bg-[#D4D4D4] data-[state=active]:bg-[#E3E3E3] border border-[#808080] data-[state=active]:border-b-[#E3E3E3]";
  const tabContentSystem7 = "bg-[#E3E3E3] border border-t-0 border-[#808080]";

  // macOS styling - use aqua-button CSS classes
  const tabListMacOSX = "aqua-tab-bar";
  const tabTriggerMacOSX = "aqua-tab";
  const tabContentMacOSX = "aqua-tab-content";

  // OS1 styling - modern macOS 26 style
  // 样式主要通过 themes.css 中的 !important 规则控制，这里只提供基础类名
  // Tab bar 居左，padding 与内容区域相同（px-4）
  const tabListOS1 = "bg-transparent border-b border-black/8 pb-0 px-4 mt-4 justify-start";
  // 标签页样式由 CSS 控制，这里只提供基础类名
  const tabTriggerOS1 = "";
  // 内容区域：只有左右上角有圆角，底部无圆角（参考 aqua 设计）
  const tabContentOS1 = "mt-0 h-[calc(100%-2rem)] bg-white/98 backdrop-blur-xl border border-black/8 border-t-0 rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-none";

  // OS1 主题不使用 flex-1，让标签页根据内容自适应
  const tabTriggerBase = `relative ${isOS1Theme ? "" : "flex-1"} ${isMacOSXTheme || isOS1Theme ? "" : "h-6"} px-2 ${
    isMacOSXTheme || isOS1Theme ? "" : "-mb-[1px]"
  } ${isOS1Theme ? "" : "rounded-t"} shadow-none! text-[16px]`;
  const tabContentBase = `mt-0 h-[calc(100%-2rem)] ${
    isMacOSXTheme || isOS1Theme ? "" : "bg-white"
  } ${isOS1Theme ? "" : "border border-black/20"}`;

  return {
    tabListClasses: `${tabListBase} ${
      isSystem7Theme
        ? tabListSystem7
        : isMacOSXTheme
        ? tabListMacOSX
        : isOS1Theme
        ? tabListOS1
        : ""
    }`,
    tabTriggerClasses: `${tabTriggerBase} ${
      isSystem7Theme
        ? tabTriggerSystem7
        : isMacOSXTheme
        ? tabTriggerMacOSX
        : isOS1Theme
        ? tabTriggerOS1
        : ""
    }`,
    tabContentClasses: `${tabContentBase} ${
      isSystem7Theme
        ? tabContentSystem7
        : isMacOSXTheme
        ? tabContentMacOSX
        : isOS1Theme
        ? tabContentOS1
        : ""
    }`,
    separatorStyle: { borderColor: separatorColor },
  };
}

export function getWindowsLegacyTabMenuClasses() {
  return "h-7! flex justify-start! p-0 -mt-1 -mb-[2px] bg-transparent shadow-none /* Windows XP/98 tab strip */";
}
