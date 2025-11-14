// Utility for resolving themed icon paths using a pre-generated manifest.
// Generated manifest: public/icons/manifest.json
// Initial implementation supports only the 'default' theme.

export interface IconManifest {
  version: number;
  generatedAt: string;
  themes: Record<string, string[]>;
}

let manifestCache: IconManifest | null = null;
let manifestPromise: Promise<IconManifest> | null = null;
let iconUrlVersion: string | null = null;

function bumpIconVersion(tag?: string) {
  iconUrlVersion = tag || String(Date.now());
}

function withVersion(url: string): string {
  if (!iconUrlVersion) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${iconUrlVersion}`;
}

async function loadManifest(): Promise<IconManifest> {
  if (manifestCache) return manifestCache;
  if (!manifestPromise) {
    manifestPromise = fetch("/icons/manifest.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load icon manifest: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        manifestCache = data;
        // If no version set yet, derive one from manifest timestamp for stability across sessions.
        if (!iconUrlVersion && data?.generatedAt) {
          iconUrlVersion = String(new Date(data.generatedAt).getTime());
        }
        return data;
      });
  }
  return manifestPromise;
}

export function invalidateIconCache(tag?: string) {
  manifestCache = null;
  manifestPromise = null;
  bumpIconVersion(tag);
}

export function getIconCacheVersion() {
  return iconUrlVersion;
}

export interface GetIconPathOptions {
  theme?: string | null;
  fallbackTheme?: string; // usually 'default'
  manifest?: IconManifest; // optional preloaded manifest
}

export function pickIconPath(
  name: string,
  { theme, fallbackTheme = "default", manifest }: GetIconPathOptions = {}
): string {
  // No theme provided: always fallback.
  if (!theme) {
    return withVersion(`/icons/${fallbackTheme}/${name}`);
  }
  // If theme explicitly equals fallback, just return fallback path.
  if (theme === fallbackTheme) {
    return withVersion(`/icons/${fallbackTheme}/${name}`);
  }
  const m = manifestCache || manifest; // allow pre-supplied
  // If manifest not yet loaded, optimistically return themed path to avoid flash.
  if (!m) {
    return withVersion(`/icons/${theme}/${name}`);
  }
  if (m.themes[theme] && m.themes[theme].includes(name)) {
    return withVersion(`/icons/${theme}/${name}`);
  }
  // Fallback if manifest knows the theme or icon missing.
  return withVersion(`/icons/${fallbackTheme}/${name}`);
}

// React helper hook (lazy, no suspense) to resolve icon path.
// Usage: const path = useIconPath('videos.png', theme);
import { useEffect, useState } from "react";
// --- Legacy-aware resolver ---
// Accepts legacy stored values like /icons/file-text.png (no theme segment) or
// themed paths (/icons/default/file-text.png) or plain logical names (file-text.png).
export function resolveIconLegacyAware(
  iconOrName: string,
  theme?: string | null
): string {
  // Pass through absolute/remote URLs & data/blob URIs
  if (/^(https?:|data:|blob:|\/\/)/i.test(iconOrName)) {
    return iconOrName;
  }
  // If it's already a full /icons/... path, try to reduce to relative name & re-theme.
  if (iconOrName.startsWith("/icons/")) {
    const rest = iconOrName.slice("/icons/".length); // e.g. default/file.png OR file.png OR macpaint/brush.png
    const parts = rest.split("/");
    const maybeTheme = parts[0];
    // Known themes (even before manifest loads). Include 'default'.
    const KNOWN_THEMES = ["default", "macosx", "system7", "xp", "win98", "os1"];
    const m = manifestCache;
    const isKnownTheme =
      (m && m.themes[maybeTheme]) || KNOWN_THEMES.includes(maybeTheme);
    if (isKnownTheme) {
      const relative = parts.slice(1).join("/");
      if (!relative) return withVersion(iconOrName); // nothing after theme
      return pickIconPath(relative, { theme });
    }
    // Not a known theme folder; treat whole rest as a logical name (already relative).
    return pickIconPath(rest, { theme });
  }
  // Otherwise treat as relative logical name.
  return pickIconPath(iconOrName, { theme });
}

export function useIconPath(name: string, theme?: string | null) {
  // Start with an optimistic themed path (or fallback) to prevent flash.
  const [path, setPath] = useState(pickIconPath(name, { theme }));
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await loadManifest();
        if (cancelled) return;
        // Re-evaluate with manifest; may fallback if icon not present.
        setPath(pickIconPath(name, { theme, manifest: m }));
      } catch {
        // ignore; optimistic path already set
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, theme]);
  return path;
}
