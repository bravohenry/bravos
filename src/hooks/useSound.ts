import { useCallback, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { getAudioContext, resumeAudioContext } from "@/lib/audioContext";

// Global audio context and cache
const audioBufferCache = new Map<string, AudioBuffer>();
const activeSources = new Set<AudioBufferSourceNode>();

// Track the AudioContext instance we last saw so we can invalidate caches if a
// new one is created by the shared helper.
let lastCtx: AudioContext | null = null;

// Preload a single sound and add it to cache
const preloadSound = async (soundPath: string): Promise<AudioBuffer> => {
  // If a new AudioContext was created (e.g., after the old one was closed by
  // iOS), invalidate the decoded buffer cache so that we don't feed AudioBuffers
  // that belong to a defunct context back into the pipeline.
  const currentCtx = getAudioContext();
  if (currentCtx !== lastCtx) {
    audioBufferCache.clear();
    lastCtx = currentCtx;
  }

  if (audioBufferCache.has(soundPath)) {
    return audioBufferCache.get(soundPath)!;
  }

  try {
    const response = await fetch(soundPath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
    audioBufferCache.set(soundPath, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.error("Error loading sound:", error);
    throw error;
  }
};

// Preload multiple sounds at once
export const preloadSounds = async (sounds: string[]) => {
  await Promise.all(sounds.map(preloadSound));
};

// Predefined sound paths for easy access
export const Sounds = {
  ALERT_SOSUMI: "/sounds/AlertSosumi.mp3",
  WINDOW_CLOSE: "/sounds/WindowClose.mp3",
  WINDOW_OPEN: "/sounds/WindowOpen.mp3",
  WINDOW_EXPAND: "/sounds/WindowExpand.mp3",
  WINDOW_COLLAPSE: "/sounds/WindowCollapse.mp3",
  BUTTON_CLICK: "/sounds/ButtonClickDown.mp3",
  MENU_OPEN: "/sounds/MenuOpen.mp3",
  MENU_CLOSE: "/sounds/MenuClose.mp3",
  // Window movement and resize sounds
  WINDOW_MOVE_MOVING: "/sounds/WindowMoveMoving.mp3",
  WINDOW_MOVE_STOP: "/sounds/WindowMoveStop.mp3",
  WINDOW_RESIZE_RESIZING: "/sounds/WindowResizeResizing.mp3",
  WINDOW_RESIZE_STOP: "/sounds/WindowResizeStop.mp3",
  // Minesweeper sounds
  CLICK: "/sounds/Click.mp3",
  ALERT_BONK: "/sounds/AlertBonk.mp3",
  ALERT_INDIGO: "/sounds/AlertIndigo.mp3",
  MSN_NUDGE: "/sounds/MSNNudge.mp3",
  // Video player sounds
  VIDEO_TAPE: "/sounds/VideoTapeIn.mp3",
  // Photo booth sounds
  PHOTO_SHUTTER: "/sounds/PhotoShutter.mp3",
  // Boot sound
  BOOT: "/sounds/Boot.mp3",
  VOLUME_CHANGE: "/sounds/Volume.mp3",
  // iPod sounds
  IPOD_CLICK_WHEEL: "/sounds/WheelsOfTime.m4a",
} as const;

// OS1 主题使用 macOS 系统声音的映射（仅在 OS1 主题下生效）
const OS1_SOUND_OVERRIDES: Partial<Record<keyof typeof Sounds, string>> = {
  ALERT_SOSUMI: "/sounds/sosumi.mp3",
  BUTTON_CLICK: "/sounds/pop.mp3",
  MENU_OPEN: "/sounds/ping.mp3",
  MENU_CLOSE: "/sounds/tink.mp3",
  WINDOW_OPEN: "/sounds/vo-guideprogress.m4a",
  WINDOW_CLOSE: "/sounds/basso.mp3",
  WINDOW_EXPAND: "/sounds/hero.mp3",
  WINDOW_COLLAPSE: "/sounds/basso.mp3",
  CLICK: "/sounds/tink.mp3",
  VOLUME_CHANGE: "/sounds/ping.mp3",
  // 窗口移动和调整大小声音 - 使用 Dwell Control 声音
  WINDOW_MOVE_MOVING: "/sounds/dwell-activate.m4a",    // Dwell Control 激活声，适合重复快速播放
  WINDOW_RESIZE_RESIZING: "/sounds/dwell-activate.m4a", // 与移动中一致
  // 注意：WINDOW_MOVE_STOP 和 WINDOW_RESIZE_STOP 在 OS1 主题下不使用（不播放声音）
};

// 根据当前主题获取正确的声音路径
function getThemedSoundPath(originalPath: string, currentTheme: string): string {
  // 仅在 OS1 主题下使用 macOS 系统声音
  if (currentTheme !== "os1") {
    return originalPath;
  }

  // 查找原始路径对应的 Sounds key
  const soundKey = (Object.entries(Sounds) as [keyof typeof Sounds, string][]).find(
    ([_, path]) => path === originalPath
  )?.[0];

  // 如果找到对应的 key 且有 OS1 覆盖，使用覆盖路径
  if (soundKey && OS1_SOUND_OVERRIDES[soundKey]) {
    return OS1_SOUND_OVERRIDES[soundKey];
  }

  return originalPath;
}

export function useSound(soundPath: string, volume: number = 0.3) {
  const gainNodeRef = useRef<GainNode | null>(null);
  // Reactively track global UI volume
  const uiVolume = useAppStore((s) => s.uiVolume);
  const masterVolume = useAppStore((s) => s.masterVolume); // Get masterVolume
  const currentTheme = useThemeStore((s) => s.current);

  // 根据主题获取正确的声音路径
  const themedSoundPath = useMemo(
    () => getThemedSoundPath(soundPath, currentTheme),
    [soundPath, currentTheme]
  );

  useEffect(() => {
    // Create gain node for volume control
    gainNodeRef.current = getAudioContext().createGain();
    gainNodeRef.current.gain.value = volume * uiVolume * masterVolume; // Apply masterVolume

    // Connect to destination
    gainNodeRef.current.connect(getAudioContext().destination);

    return () => {
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
    };
  }, [volume, uiVolume, masterVolume]);

  const play = useCallback(async () => {
    // Check if UI sounds are enabled via global store
    if (!useAppStore.getState().uiSoundsEnabled) {
      return;
    }

    try {
      // Ensure audio context is running before playing
      await resumeAudioContext();

      const audioBuffer = await preloadSound(themedSoundPath);
      // If the gain node belongs to a stale AudioContext (closed), recreate it
      if (
        !gainNodeRef.current ||
        gainNodeRef.current.context.state === "closed"
      ) {
        if (gainNodeRef.current) {
          try {
            gainNodeRef.current.disconnect();
          } catch {
            console.error("Error disconnecting gain node");
          }
        }
        gainNodeRef.current = getAudioContext().createGain();
        gainNodeRef.current.gain.value = volume * uiVolume * masterVolume; // Apply masterVolume
        gainNodeRef.current.connect(getAudioContext().destination);
      }

      const source = getAudioContext().createBufferSource();
      source.buffer = audioBuffer;

      // Connect to (possibly re-created) gain node
      source.connect(gainNodeRef.current);

      // Set volume (apply global scaling)
      gainNodeRef.current.gain.value = volume * uiVolume * masterVolume; // Apply masterVolume

      // If too many concurrent sources are active, skip to avoid audio congestion
      if (activeSources.size > 32) {
        console.debug("Skipping sound – too many concurrent sources");
        return;
      }

      // Play the sound
      source.start(0);

      // Add to active sources
      activeSources.add(source);

      // Clean up when done
      source.onended = () => {
        activeSources.delete(source);
      };
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [volume, themedSoundPath, uiVolume, masterVolume]);

  // Additional control methods
  const stop = useCallback(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 0;
    }
  }, []);

  const fadeOut = useCallback(
    (duration: number = 0.5) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(
          volume,
          getAudioContext().currentTime
        );
        gainNodeRef.current.gain.linearRampToValueAtTime(
          0,
          getAudioContext().currentTime + duration
        );
      }
    },
    [volume]
  );

  const fadeIn = useCallback(
    (duration: number = 0.5) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(
          0,
          getAudioContext().currentTime
        );
        gainNodeRef.current.gain.linearRampToValueAtTime(
          volume,
          getAudioContext().currentTime + duration
        );
      }
    },
    [volume]
  );

  return { play, stop, fadeOut, fadeIn };
}

// Lazily preload sounds after the first user interaction (click or touch)
if (typeof document !== "undefined") {
  const handleFirstInteraction = () => {
    preloadSounds(Object.values(Sounds));
    // Remove listeners after first invocation to avoid repeated work
    document.removeEventListener("click", handleFirstInteraction);
    document.removeEventListener("touchstart", handleFirstInteraction);
  };

  // Use `once: true` to ensure the handler fires a single time
  document.addEventListener("click", handleFirstInteraction, { once: true });
  document.addEventListener("touchstart", handleFirstInteraction, {
    once: true,
  });
}
