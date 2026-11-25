# OS1 Theme - Enhanced macOS Experience

The OS1 branch extends the base ryOS project with a comprehensive macOS-inspired theme that brings authentic macOS system sounds, SF Symbols integration, and refined UI/UX enhancements.

## Overview

OS1 is a modern macOS-inspired theme built on top of ryOS, featuring:
- **Authentic macOS System Sounds**: Real system sounds extracted from macOS
- **SF Symbols Integration**: Native Apple SF Symbols for icons
- **Enhanced Window Animations**: Smooth minimize/restore animations with Genie effect
- **Refined UI Components**: macOS 26-style design language
- **Theme-Aware Sound System**: Context-aware sound mapping based on active theme

## Key Features

### 1. macOS System Sounds Integration

OS1 theme uses authentic macOS system sounds extracted directly from the macOS system:

- **Window Operations**:
  - Window Open: `finder-invitation.m4a`
  - Window Close: `basso.mp3`
  - Window Expand: `hero.mp3`
  - Window Collapse: `basso.mp3`
  - Window Restore: `vo-guideprogress.m4a`

- **Window Interactions**:
  - Window Moving: `dwell-activate.m4a` (repeated every 200ms during drag)
  - Window Resizing: `dwell-activate.m4a` (repeated every 200ms during resize)
  - No stop sounds for window interactions (silent on release)

- **UI Sounds**:
  - Button Click: `pop.mp3`
  - Menu Open: `ping.mp3`
  - Menu Close: `tink.mp3`
  - Alert: `sosumi.mp3`
  - Volume Change: `ping.mp3`

**Implementation Details**:
- Theme-aware sound system in `useSound.ts` hook
- Automatic sound path resolution based on current theme
- Sound extraction script: `scripts/extract-macos-sounds.sh`
- Documentation: `docs/MACOS_SOUNDS_GUIDE.md`

### 2. SF Symbols Integration

Native Apple SF Symbols are used throughout the OS1 theme for authentic macOS iconography:

- **Icon Component Enhancement**:
  - Automatic SF Symbol mapping for Lucide icons
  - Fallback to Lucide icons for non-OS1 themes
  - Dynamic SVG loading with proper color inheritance
  - Support for SF Symbol weights and sizes

- **Implementation**:
  - `SFSymbol` component in `src/components/shared/SFSymbol.tsx`
  - Icon mapping utility in `src/utils/sfSymbolMap.ts`
  - SF Symbol assets in `public/icons/os1/sf-symbols/`
  - Documentation: `docs/SF_SYMBOLS_GUIDE.md`

### 3. Enhanced Window Animations

Improved window minimize and restore animations with macOS Genie effect:

- **Minimize Animation**:
  - Single-step smooth animation (350ms duration)
  - Genie effect: slight upward movement before collapsing to Dock
  - Optimized easing curve: `cubic-bezier(0.25, 0.1, 0.25, 1)`
  - Proper animation state management to prevent rendering issues

- **Restore Animation**:
  - Window bounces back from Dock position to original location
  - Smooth elastic animation with proper timing
  - Maintains window position and state

**Implementation**:
- Enhanced `handleMinimize` and `handleRestore` functions in `WindowFrame.tsx`
- Fixed animation rendering issues in `AppManager.tsx`
- Proper cleanup and state management

### 4. UI Component Refinements

#### Dock Enhancements
- **OS1 Theme Dock**:
  - Larger icons (56px vs 48px)
  - Rounded corners on all sides
  - Proper spacing from bottom (macOS Ventura style)
  - Fixed white background issues
  - Improved icon alignment

- **macOS Theme Dock**:
  - Uses same background texture as menu bar
  - Square corners
  - Consistent styling

#### Chat Application Styling
- **macOS 26 Design Language**:
  - Frosted glass tooltips
  - Refined icon button styles
  - Larger emoji avatars without borders
  - CSS variable-based styling for maintainability
  - Optimized selectors (reduced ~100+ lines of code)

- **Input Field Enhancements**:
  - Gray icon colors (gray-400, gray-500 on hover)
  - Removed button borders
  - Consistent styling across all icons

#### Tab Styling
- Transparent tab bar background
- Inactive tabs: text-only, no background or border
- Active tab: transparent background with blue bottom border
- All tabs aligned on same horizontal line
- Centered tab layout

#### Menu Bar
- Larger Apple logo (20px) in OS1 theme
- Consistent styling with macOS design language

### 5. Default Theme Configuration

OS1 is set as the default theme for new installations:
- Updated default theme in theme store
- Seamless theme switching support
- Backward compatibility with other themes

## Technical Implementation

### Sound System Architecture

```typescript
// Theme-aware sound path resolution
function getThemedSoundPath(originalPath: string, currentTheme: string): string {
  if (currentTheme !== "os1") {
    return originalPath;
  }
  // Map to macOS system sounds for OS1 theme
  return OS1_SOUND_OVERRIDES[soundKey] || originalPath;
}
```

### Window Animation System

- **State Management**:
  - `isMinimizing`: Tracks minimize animation state
  - `isRestoring`: Tracks restore animation state
  - Proper cleanup to prevent rendering issues

- **Animation Timing**:
  - Minimize: 350ms with optimized easing
  - Restore: 350ms with elastic bounce effect
  - Proper delay handling to ensure animations complete

### CSS Architecture

- **CSS Variables**: Extensive use of CSS custom properties for theming
- **Modular Styles**: Organized by component and feature
- **Performance**: Optimized selectors and reduced redundancy

## File Structure

```
os1-branch/
├── src/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── SFSymbol.tsx          # SF Symbols component
│   │   │   └── Icon.tsx              # Enhanced icon component
│   │   └── layout/
│   │       └── WindowFrame.tsx       # Enhanced window animations
│   ├── hooks/
│   │   └── useSound.ts               # Theme-aware sound system
│   ├── styles/
│   │   └── themes.css                # OS1 theme styles
│   └── utils/
│       └── sfSymbolMap.ts            # SF Symbol mapping
├── public/
│   ├── icons/os1/                    # OS1 theme icons
│   │   └── sf-symbols/               # SF Symbol SVG files
│   └── sounds/                       # macOS system sounds
│       ├── *.mp3                     # Standard sounds
│       └── *.m4a                     # VoiceOver/Dwell sounds
├── scripts/
│   └── extract-macos-sounds.sh       # Sound extraction script
└── docs/
    ├── MACOS_SOUNDS_GUIDE.md         # Sound extraction guide
    ├── SF_SYMBOLS_GUIDE.md           # SF Symbols guide
    └── OS1_README.md                 # This file
```

## Commits Summary

Key commits on the OS1 branch:

1. **Theme Foundation**:
   - Set OS1 as default theme
   - Added OS1 theme configuration
   - Enhanced About This Computer dialog

2. **Sound System**:
   - Implemented theme-aware sound mapping
   - Added macOS system sound extraction
   - Integrated VoiceOver and Dwell Control sounds

3. **UI Refinements**:
   - Dock styling improvements
   - Chat application redesign
   - Tab styling updates
   - Menu bar enhancements

4. **Animation Enhancements**:
   - Window minimize/restore animations
   - Optimized animation timing and easing
   - Fixed rendering issues

5. **Code Quality**:
   - CSS variable refactoring
   - Selector optimization
   - TypeScript error fixes
   - Code cleanup and documentation

## Usage

### Setting OS1 as Default Theme

OS1 is already set as the default theme. To switch themes:

```typescript
import { useThemeStore } from "@/stores/useThemeStore";

// Switch to OS1 theme
useThemeStore.getState().setTheme("os1");
```

### Extracting macOS Sounds

To extract additional macOS system sounds:

```bash
# List available sounds
./scripts/extract-macos-sounds.sh list

# Extract all sounds
./scripts/extract-macos-sounds.sh all

# Extract specific sound
./scripts/extract-macos-sounds.sh Ping
```

See `docs/MACOS_SOUNDS_GUIDE.md` for detailed instructions.

### Using SF Symbols

SF Symbols are automatically used when:
- Current theme is OS1
- Icon has a corresponding SF Symbol mapping
- Icon component is used (not forced to Lucide)

```tsx
// Automatically uses SF Symbol in OS1 theme
<Icon icon={ArrowUp} name="arrow-up" />

// Force Lucide icon
<Icon icon={ArrowUp} forceLucide />
```

See `docs/SF_SYMBOLS_GUIDE.md` for detailed instructions.

## Differences from Base ryOS

### Added Features
- OS1 theme with macOS 26 design language
- macOS system sounds integration
- SF Symbols icon system
- Enhanced window animations
- Theme-aware sound mapping

### Modified Components
- `WindowFrame.tsx`: Enhanced animations
- `useSound.ts`: Theme-aware sound system
- `Icon.tsx`: SF Symbol support
- `Dock.tsx`: OS1-specific styling
- `ChatsAppComponent.tsx`: macOS 26 styling
- `MenuBar.tsx`: OS1 menu bar styling

### New Files
- `src/components/shared/SFSymbol.tsx`
- `src/utils/sfSymbolMap.ts`
- `scripts/extract-macos-sounds.sh`
- `docs/MACOS_SOUNDS_GUIDE.md`
- `docs/SF_SYMBOLS_GUIDE.md`
- `docs/OS1_README.md`

### Configuration Changes
- Default theme changed from `macosx` to `os1`
- Added OS1 sound overrides
- Added OS1 CSS variables
- Enhanced theme configuration

## Browser Compatibility

- **SF Symbols**: Requires SVG support (all modern browsers)
- **System Sounds**: Requires Web Audio API (all modern browsers)
- **Animations**: Requires CSS transforms and transitions (all modern browsers)

## Performance Considerations

- **Sound Preloading**: All sounds are preloaded on first user interaction
- **SF Symbol Loading**: Lazy-loaded SVG content with caching
- **Animation Performance**: Hardware-accelerated CSS transforms
- **CSS Optimization**: Reduced selector complexity and redundancy

## Future Enhancements

Potential improvements for OS1 theme:
- Additional SF Symbol mappings
- More macOS system sounds
- Enhanced animation effects
- Additional UI component refinements
- Performance optimizations

## License

This branch maintains the same license as the base ryOS project (AGPL-3.0).

## Contributing

Contributions to the OS1 theme are welcome! Please ensure:
- Maintains compatibility with other themes
- Follows existing code style
- Includes appropriate documentation
- Tests across different browsers

