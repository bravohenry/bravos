# ZiOS — A web-based agentic AI OS, made with Cursor

A modern web-based desktop environment inspired by classic macOS and Windows, built with React, TypeScript, and AI. Features multiple built-in applications, a familiar desktop interface, and a system-aware AI assistant. Works on all devices—desktop, tablet, and mobile.

## Features

### Desktop Environment

- Authentic macOS and Windows-style desktop interactions
- Multi-instance window manager with drag, resize, and minimize
- Customizable wallpapers (photos, patterns, or videos)
- System-wide sampled and synthesizer sound effects
- System-wide UI, Chats, and Terminal sounds
- System-wide Zi AI, with tool calls and context of running applications
- Virtual file system with local storage persistence and one-click Backup / Restore

### Themes

- **Five switchable themes:** System 7, Aqua (Mac OS X), OS1 (macOS 26), Windows XP, Windows 98
  - **Menu & chrome:** mac themes use a top menubar with traffic-light controls; Windows themes use a bottom taskbar with a Start menu and classic window buttons
  - **Fonts & icons:** theme-specific system fonts and ThemedIcon assets for authentic look
  - **Wallpapers:** theme-specific default photo/tile/video wallpapers
  - **Controls:** select, dropdowns, buttons, and resizers are styled per theme, including mobile-safe resizers for XP/98

#### OS1 Theme (Default)

The OS1 branch extends ryOS with a comprehensive macOS-inspired theme featuring:

- **Authentic macOS System Sounds**: Real system sounds extracted from macOS, including VoiceOver and Dwell Control sounds for window interactions
- **SF Symbols Integration**: Native Apple SF Symbols for icons throughout the interface
- **Enhanced Window Animations**: Smooth minimize/restore animations with macOS Genie effect (350ms optimized timing)
- **macOS 26 Design Language**: Modern frosted glass effects, refined UI components, and authentic macOS styling
- **Theme-Aware Sound System**: Context-aware sound mapping that automatically uses macOS sounds when OS1 theme is active

**Key OS1 Features:**
- Window operations use authentic macOS sounds (`finder-invitation`, `basso`, `hero`, `vo-guideprogress`)
- Window dragging/resizing plays `dwell-activate` sound in rapid succession (200ms intervals)
- Dock with larger icons (56px), rounded corners, and proper spacing (macOS Ventura style)
- Chat application with macOS 26 styling, frosted glass tooltips, and refined iconography
- Tab styling with transparent backgrounds and blue bottom border for active tabs
- Enhanced menu bar with larger Apple logo

**Documentation:**
- See `docs/OS1_README.md` for detailed OS1 theme documentation
- See `docs/MACOS_SOUNDS_GUIDE.md` for macOS sound extraction guide
- See `docs/SF_SYMBOLS_GUIDE.md` for SF Symbols integration guide

### Built-in Applications

<<<<<<< HEAD
- **Finder**: File manager with Quick Access & Storage Info
- **TextEdit**: Rich text editing with markdown support and task lists
  - Multi-window support - open multiple documents simultaneously
  - Each window maintains independent document state
  - Automatic instance management and document tracking
  - Smart file opening with existing window detection
- **MacPaint**: Classic bitmap graphics editor
  - Drawing tools (pencil, brush, spray, eraser)
  - Shape tools (rectangle, oval, line)
  - Fill patterns and colors
  - Spray tool simulates a dithered airbrush and defaults to a larger size
  - Brush tool starts with a thicker stroke while the pencil starts thin
  - Selection and move tools
  - Undo/redo support
  - Image file import/export support
- **Videos**: Retro-style YouTube playlist player
  - VCR-style interface with LCD display
  - Add and manage YouTube videos
  - Playlist management with shuffle and repeat modes
  - Scrolling titles and classic CD player controls
  - Local storage persistence
- **Soundboard**: Create and manage custom soundboards
  - Record sounds directly from microphone
  - Multiple soundboards support
  - Waveform visualization
  - Keyboard shortcuts (1-9)
  - Import/export functionality
  - Emoji and title customization
  - Enhanced synth effects
- **Synth**: Virtual synthesizer with retro aesthetics
  - Virtual keyboard with computer key support
  - Multiple oscillator waveforms (sine, square, sawtooth, triangle)
  - Effects including reverb, delay, and distortion
  - Customizable synth parameters
  - MIDI input support
  - Preset saving and loading
  - Classic synthesizer UI design
- **Photo Booth**: Camera app with effects
  - Take photos with your webcam
  - Multiple photo effects and filters
  - Brightness and contrast adjustments
  - Photo gallery with thumbnails
  - Multi-photo sequence mode
  - Export photos to Files
  - Real-time filter preview
- **Internet Explorer**: Classic browser with a temporal twist
  - Time Machine view to explore snapshots across different years
  - AI reimagines pre-1996 sites and generates futuristic designs
  - Save favorites by year and share time-travel links
- **Chats**: AI-powered chat with speech & tool calling
  - Natural conversation with Zi AI
  - **Public and private chat rooms** with real-time messaging via Pusher
  - Join public chat rooms with @zi mentions for AI-powered responses
  - Private conversations with other users
  - Real-time message synchronization across devices
  - Unread message notifications and counters
  - Push-to-talk voice messages with real-time transcription
  - Text-to-speech for AI responses with word highlighting
  - Control apps and edit documents via chat commands
  - Nudge system (👋) with context-aware responses
  - ZiOS FM DJ mode - when music plays, Zi becomes a radio DJ
  - Tool calling capabilities for system integration
  - Save transcript to Markdown
  - Speech synthesis with volume controls
  - User authentication system with secure token-based sessions
  - Message deletion and moderation capabilities
- **Control Panels**: System preferences & power tools
  - Appearance & shader selection (CRT, Galaxy, Aurora)
  - UI / typing / Terminal sound toggles
  - One-click full Backup / Restore
  - Format or reset the virtual file system
- **Minesweeper**: Classic game implementation
- **Virtual PC**: DOS game emulator
  - Play classic games like Doom and SimCity
  - DOS environment emulation
  - Game save states
- **Terminal**: Unix-like CLI with built-in AI
  - Familiar commands (ls, cd, cat, touch, vim, edit, …)
  - ↑ / ↓ history & auto-completion
  - "zi <prompt>" to chat with AI assistant
  - Open documents in TextEdit or Vim straight from prompt
  - Toggle distinctive Terminal sounds in View ▸ Sounds
- **iPod**: 1st-generation iPod-style music player
  - Import any YouTube URL to build your music library
  - Classic click-wheel navigation and back-light toggle
  - Shuffle and loop playback modes
  - Create playlists and organize tracks
  - Time-synced lyrics with multi-language translation
  - Interactive lyric offset adjustment via gestures
  - Multiple lyric alignment modes (Focus Three, Alternating, Center)
  - Chinese character variants (Traditional/Simplified) and Korean romanization
  - Fullscreen lyrics mode with video support
  - Real-time lyric highlighting during playback
  - Library persisted locally for offline playback
- **Applet Store**: Discover, install, and share HTML applets
  - Browse community-created applets in a curated store
  - Featured applets and update notifications
  - One-click install and update system
  - Share your own applets with shareable links
  - View applets in detail before installing
  - Search and filter applets by name or creator
  - Automatic update detection for installed applets
  - Bulk update all applets at once
  - Import/export applets as `.app` files (gzipped JSON) or HTML
  - Applet authentication bridge for secure API access
  - Custom window sizes per applet
  - Integration with Finder for file management
  - Create applets via ryOS Chat AI assistant

## Quick Start

1. Launch apps from the Finder, Desktop, or Apple/Start menu
2. Drag windows to move, drag edges to resize
3. Use Control Panels to customize appearance and sounds
4. Chat with Zi AI for help or to control apps
5. Files auto-save to browser storage

## Project Structure

```
├── api/              # Vercel API endpoints (AI, chat, lyrics, etc.)
├── public/           # Static assets (icons, wallpapers, sounds, fonts)
├── src/
│   ├── apps/         # Individual app modules
│   ├── components/   # Shared React components (ui, dialogs, layout)
│   ├── config/       # Configuration files
│   ├── contexts/     # React context providers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Libraries and utilities
│   ├── stores/       # Zustand state management
│   ├── styles/       # CSS and styling
│   └── types/        # TypeScript definitions
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Audio:** Tone.js, WaveSurfer.js
- **3D:** Three.js (shaders)
- **Text Editor:** TipTap
- **State:** Zustand
- **Storage:** IndexedDB, LocalStorage, Redis (Upstash)
- **AI:** OpenAI, Anthropic, Google via Vercel AI SDK
- **Real-time:** Pusher
- **Build:** Vite, Bun
- **Deployment:** Vercel

## Scripts

```bash
bun dev              # Start development server
bun run build        # Build for production
bun run lint         # Run ESLint
bun run preview      # Preview production build
vercel dev           # Run with Vercel dev server (recommended)
```

## License

AGPL-3.0 — See [LICENSE](LICENSE) for details.

## OS1 Branch Enhancements

The OS1 branch (default) includes significant enhancements built on top of the base ryOS:

### What's New in OS1

1. **macOS System Sounds Integration**
   - Theme-aware sound system that automatically uses macOS system sounds
   - Extracted sounds from `/System/Library/Sounds/` and VoiceOver/Dwell Control frameworks
   - Sound extraction script: `scripts/extract-macos-sounds.sh`
   - 14+ authentic macOS sounds for window operations, UI interactions, and alerts

2. **SF Symbols Icon System**
   - Native Apple SF Symbols integration for authentic macOS iconography
   - Automatic mapping from Lucide icons to SF Symbols
   - Lazy-loaded SVG content with proper color inheritance
   - Fallback to Lucide icons for non-OS1 themes

3. **Enhanced Window Animations**
   - macOS Genie effect for minimize/restore animations
   - Optimized 350ms animation timing with smooth easing curves
   - Proper state management to prevent rendering issues
   - Window bounces back from Dock position on restore

4. **UI Component Refinements**
   - **Dock**: Larger icons (56px), rounded corners, macOS Ventura spacing
   - **Chat**: macOS 26 design with frosted glass effects, refined iconography
   - **Tabs**: Transparent backgrounds, blue bottom border for active tabs
   - **Menu Bar**: Larger Apple logo, consistent macOS styling
   - CSS variable-based styling for better maintainability

5. **Code Quality Improvements**
   - Reduced CSS selector complexity (~100+ lines removed)
   - Enhanced TypeScript type safety
   - Improved component organization and reusability
   - Comprehensive documentation

### Technical Implementation

- **Sound System**: `src/hooks/useSound.ts` - Theme-aware sound path resolution
- **SF Symbols**: `src/components/shared/SFSymbol.tsx` - Dynamic SVG loading
- **Window Animations**: `src/components/layout/WindowFrame.tsx` - Genie effect implementation
- **Theme Styles**: `src/styles/themes.css` - OS1-specific CSS variables and styles

### Files Added/Modified

**New Files:**
- `src/components/shared/SFSymbol.tsx`
- `src/utils/sfSymbolMap.ts`
- `scripts/extract-macos-sounds.sh`
- `docs/OS1_README.md`
- `docs/MACOS_SOUNDS_GUIDE.md`
- `docs/SF_SYMBOLS_GUIDE.md`
- `public/icons/os1/sf-symbols/` (SF Symbol SVG files)
- `public/sounds/*.mp3` and `*.m4a` (macOS system sounds)

**Modified Files:**
- `src/components/layout/WindowFrame.tsx` - Enhanced animations
- `src/hooks/useSound.ts` - Theme-aware sound system
- `src/components/shared/Icon.tsx` - SF Symbol support
- `src/apps/base/AppManager.tsx` - Animation rendering fixes
- `src/hooks/useWindowManager.ts` - Sound loop improvements
- `src/styles/themes.css` - OS1 theme styles
- Theme configuration - OS1 set as default

For complete details, see `docs/OS1_README.md`.

## Contributing

Contributions welcome! Please submit a Pull Request.
