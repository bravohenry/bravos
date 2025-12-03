import { OsTheme } from "./types";

export const os1: OsTheme = {
  id: "os1",
  name: "OS1",
  fonts: {
    ui: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
  colors: {
    windowBg: "rgba(245, 245, 255, 0.65)",
    menubarBg: "rgba(255, 255, 255, 0.35)",
    menubarBorder: "rgba(255, 255, 255, 0.2)",
    windowBorder: "rgba(255, 255, 255, 0.4)",
    windowBorderInactive: "rgba(255, 255, 255, 0.2)",
    titleBar: {
      activeBg: "transparent",
      inactiveBg: "transparent",
      text: "#1d1d1f",
      inactiveText: "rgba(29, 29, 31, 0.5)",
      border: "transparent",
      borderInactive: "transparent",
      borderBottom: "transparent",
    },
    button: {
      face: "rgba(255, 255, 255, 0.5)",
      highlight: "rgba(255, 255, 255, 0.8)",
      shadow: "rgba(0, 0, 0, 0.05)",
      activeFace: "rgba(255, 255, 255, 0.3)",
    },
    trafficLights: {
      close: "#FF605C",
      closeHover: "#FF605C",
      minimize: "#FFBD44",
      minimizeHover: "#FFBD44",
      maximize: "#00CA4E",
      maximizeHover: "#00CA4E",
    },
    selection: {
      bg: "rgba(0, 122, 255, 0.2)",
      text: "#007aff",
    },
    text: {
      primary: "#1d1d1f",
      secondary: "rgba(29, 29, 31, 0.6)",
      disabled: "rgba(29, 29, 31, 0.3)",
    },
  },
  metrics: {
    borderWidth: "1px",
    radius: "1.25rem",
    titleBarHeight: "2.5rem",
    titleBarRadius: "20px 20px 0px 0px",
    windowShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset, 0 0 40px rgba(255, 255, 255, 0.3) inset",
  },
  wallpaperDefaults: {
    photo: "/wallpapers/photos/landscapes/beach.jpg",
    tile: "/wallpapers/tiles/poppy_light.png",
  },
};

