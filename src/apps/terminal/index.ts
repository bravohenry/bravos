import { TerminalAppComponent } from "./components/TerminalAppComponent";

export const helpItems = [
  {
    icon: "💻",
    title: "Basic Commands",
    description:
      "Use commands like ls, cd, cat, pwd, clear, and touch to navigate and manage files.",
  },
  {
    icon: "🧭",
    title: "Navigation",
    description:
      "Browse the same virtual file system as Finder with familiar Unix commands.",
  },
  {
    icon: "⌨️",
    title: "Command History",
    description:
      "Press ↑ / ↓ arrows to cycle through previous commands and re-run them quickly.",
  },
  {
    icon: "🤖",
    title: "AI Assistant",
    description:
      'Type "ryo &lt;prompt&gt;" to chat with Ryo AI directly inside the terminal.',
  },
  {
    icon: "📝",
    title: "File Editing",
    description:
      "Open documents in TextEdit (edit) or Vim-style editor (vim) right from the prompt.",
  },
  {
    icon: "🔊",
    title: "Terminal Sounds",
    description:
      "Distinct sounds for output, errors & AI replies. Toggle in View ▸ Sounds.",
  },
];

export const appMetadata = {
  name: "Terminal",
  version: "1.0",
  creator: {
    name: "Zihan",
    url: "https://bravohenry.com",
  },
  github: "https://github.com/bravohenry/bravos",
  icon: "/icons/default/terminal.png",
  component: TerminalAppComponent as any,
  helpItems: [
    {
      icon: "💻",
      title: "Basic Commands",
      description:
        "Use commands like ls, cd, cat, pwd, clear, and touch to navigate and manage files.",
    },
    {
      icon: "🧭",
      title: "Navigation",
      description:
        "Browse the same virtual file system as Finder with familiar Unix commands.",
    },
    {
      icon: "⌨️",
      title: "Command History",
      description:
        "Press ↑ / ↓ arrows to cycle through previous commands and re-run them quickly.",
    },
    {
      icon: "🤖",
      title: "AI Assistant",
      description:
        'Type "zi &lt;prompt&gt;" to chat with Zi AI directly inside the terminal.',
    },
    {
      icon: "📝",
      title: "File Editing",
      description:
        "Open documents in TextEdit (edit) or Vim-style editor (vim) right from the prompt.",
    },
    {
      icon: "🔊",
      title: "Terminal Sounds",
      description:
        "Distinct sounds for output, errors & AI replies. Toggle in View ▸ Sounds.",
    },
  ],
};
