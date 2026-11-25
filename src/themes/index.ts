import { system7 } from "./system7";
import { macosx } from "./macosx";
import { xp } from "./xp";
import { win98 } from "./win98";
import { os1 } from "./os1";
import { OsTheme, OsThemeId, ThemeMetadata } from "./types";

export const themes: Record<OsThemeId, OsTheme> = {
  system7,
  macosx,
  xp,
  win98,
  os1,
};

export function getTheme(id: OsThemeId): OsTheme {
  return themes[id];
}

export function getThemeMetadata(id: OsThemeId): ThemeMetadata {
  return themes[id].metadata;
}

export type { OsTheme, OsThemeId, ThemeMetadata } from "./types";
