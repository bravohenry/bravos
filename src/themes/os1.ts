import { OsTheme } from "./types";

export const os1: OsTheme = {
  id: "os1",
  name: "OS1",
  fonts: {
    ui: "Roboto, 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    mono: "SF Mono, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
  colors: {
    windowBg: "#F5F5F5", // Smartisan OS 8 浅灰色背景
    menubarBg: "#FAFAFA", // 纯色浅灰菜单栏
    menubarBorder: "rgba(0, 0, 0, 0.1)", // 浅灰边框
    windowBorder: "rgba(0, 0, 0, 0.1)",
    windowBorderInactive: "rgba(0, 0, 0, 0.06)",
    titleBar: {
      activeBg: "#E94E3C", // Smartisan 红色标题栏
      inactiveBg: "#CCCCCC",
      text: "#FFFFFF",
      inactiveText: "#999999",
      border: "rgba(0, 0, 0, 0.15)",
      borderInactive: "rgba(0, 0, 0, 0.08)",
      borderBottom: "rgba(0, 0, 0, 0.1)",
    },
    button: {
      face: "#FFFFFF", // 白色按钮
      highlight: "#FFFFFF",
      shadow: "rgba(0, 0, 0, 0.1)",
      activeFace: "#F0F0F0",
    },
    trafficLights: {
      close: "#E94E3C", // Smartisan 红色
      closeHover: "#D9453B",
      minimize: "#FFBB33", // 橙色
      minimizeHover: "#FFB020",
      maximize: "#00CC66", // 绿色
      maximizeHover: "#00B359",
    },
    selection: {
      bg: "#E94E3C", // Smartisan 红色选择
      text: "#FFFFFF",
    },
    text: {
      primary: "#333333", // Smartisan 深灰色文字
      secondary: "#666666",
      disabled: "#999999",
    },
  },
  metrics: {
    borderWidth: "1px", // 标准边框
    radius: "0.25rem", // 4px 小圆角
    titleBarHeight: "1.375rem",
    titleBarRadius: "4px 4px 0px 0px",
    windowShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // 扁平化阴影
  },
  wallpaperDefaults: {
    photo: "/wallpapers/photos/landscapes/beach.jpg",
    tile: "/wallpapers/tiles/poppy_light.png",
  },
};

