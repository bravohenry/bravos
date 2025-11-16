import { BaseApp } from "../base/types";
import { AppletViewerAppComponent } from "./components/AppletViewerAppComponent";

export const helpItems = [
  {
    icon: "🛒",
    title: "Applet Store",
    description: "Browse and install applets from the community. Open the Store menu to discover new apps.",
  },
  {
    icon: "💬",
    title: "Create with ryOS Chat",
    description: "Ask ryOS Chat to create custom apps and applets for you. Share your ideas and get working apps instantly.",
  },
  {
    icon: "📄",
    title: "View Applets",
    description: "Open and run applets saved from ryOS Chat or downloaded from the store.",
  },
  {
    icon: "📤",
    title: "Share Applets",
    description: "Share your favorite applets with others using the Share Applet option in the File menu.",
  },
  {
    icon: "🤖",
    title: "Built-in AI",
    description:
        "Inside your applet, call fetch('/api/applet-ai') with JSON { prompt: \"...\" } for Gemini text or { mode: \"image\", prompt: \"...\", images: [{ mediaType: \"image/png\", data: \"<base64>\" }] } to stream or edit Gemini image previews. ZiOS injects your X-Username and Authorization headers automatically when available, so you can call the endpoint directly.",
  },
  {
    icon: "📂",
    title: "Open from Finder",
    description: "Browse and open applets saved on your system using the File menu.",
  },
  {
    icon: "🔄",
    title: "Keep Updated",
    description: "Check for updates in the Store menu to get the latest versions of your installed applets.",
  },
];

export const appMetadata = {
  name: "Applet Store",
  version: "1.0",
  creator: {
    name: "Zihan Huang",
    url: "https://bravohenry.com",
  },
  github: "https://github.com/bravohenry/bravos",
  icon: "/icons/default/app.png",
};

export interface AppletViewerInitialData {
  path: string;
  content: string;
  shareCode?: string;
  icon?: string;
  name?: string;
}

export const AppletViewerApp: BaseApp<AppletViewerInitialData> = {
  id: "applet-viewer",
  name: "Applet Store",
  icon: { type: "image", src: appMetadata.icon },
  description: "View HTML applets",
  component: AppletViewerAppComponent,
  helpItems,
  metadata: appMetadata,
};
