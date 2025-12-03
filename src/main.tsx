import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { useThemeStore } from "./stores/useThemeStore";
import { Analytics } from "@vercel/analytics/react";
import { useLanguageStore } from "./stores/useLanguageStore";
import { preloadFileSystemData } from "./stores/useFilesStore";
import { preloadIpodData } from "./stores/useIpodStore";
import { initPrefetch } from "./utils/prefetch";
import "./lib/i18n";
import { primeReactResources } from "./lib/reactResources";

// Prime React 19 resource hints before anything else runs
primeReactResources();

// ============================================================================
// CHUNK LOAD ERROR HANDLING - Reload when old assets 404 after deployment
// ============================================================================
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[ryOS] Chunk load failed, reloading for fresh assets...", event);
  window.location.reload();
});

// ============================================================================
// PRELOADING - Start fetching JSON data early (non-blocking)
// These run in parallel before React even mounts
// ============================================================================
preloadFileSystemData();
preloadIpodData();

// ============================================================================
// PREFETCHING - Cache icons, sounds, and app components after boot
// This runs during idle time to populate the service worker cache
// ============================================================================
initPrefetch();

// Hydrate theme and language from localStorage before rendering
try {
  useThemeStore.getState().hydrate();
  useLanguageStore.getState().hydrate();
} catch (error) {
  console.error("主题初始化失败:", error);
}

// 检查 root 元素是否存在
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("找不到 root 元素！");
  throw new Error("找不到 root 元素");
}

console.log("开始渲染 React 应用...");

try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
      <Analytics />
    </React.StrictMode>
  );
  
  console.log("React 应用已成功挂载");
} catch (error) {
  console.error("React 应用挂载失败:", error);
  // 显示错误信息
  rootElement.innerHTML = `
    <div style="color: white; padding: 20px; font-family: monospace;">
      <h1>应用加载失败</h1>
      <p>错误信息: ${error instanceof Error ? error.message : String(error)}</p>
      <p>请查看浏览器控制台获取更多信息。</p>
    </div>
  `;
}
