export const appMetadata = {
  name: "Minesweeper",
  version: "1.0.0",
  creator: {
    name: "Zihan Huang",
    url: "https://bravohenry.com",
  },
  github: "https://github.com/bravohenry/bravos",
  icon: "/icons/default/minesweeper.png",
};

export const helpItems = [
  {
    icon: "🖱️",
    title: "Desktop Controls",
    description:
      "Left-click to reveal, right-click to flag, double-click numbers to auto-reveal neighbors.",
  },
  {
    icon: "📱",
    title: "Mobile Controls",
    description: "Tap to reveal, long-press to flag a mine.",
  },
  {
    icon: "📖",
    title: "Game Rules",
    description:
      "Numbers show adjacent mines. Flag every mine and reveal all safe cells to win.",
  },
  {
    icon: "⏱️",
    title: "Timer & Counter",
    description: "Top bar shows elapsed time and remaining unflagged mines.",
  },
  {
    icon: "🔄",
    title: "Restart",
    description:
      "Press the smiley face or choose Game ▸ New to start a fresh board.",
  },
];
