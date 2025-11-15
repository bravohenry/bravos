/**
 * Lucide React 图标名到 SF Symbol 名称的映射表
 * 
 * 映射规则：
 * - 使用 SF Symbols app 中的标准符号名称
 * - 保持命名一致性（小写，点分隔）
 * - 优先使用 .fill 变体（实心图标）
 */

export type LucideIconName =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Square"
  | "SquareFill"
  | "Hand"
  | "AtSign"
  | "Check"
  | "ChevronRight"
  | "ChevronLeft"
  | "ChevronUp"
  | "ChevronDown"
  | "Circle"
  | "Volume1"
  | "Volume2"
  | "VolumeX"
  | "Settings"
  | "Plus"
  | "Trash"
  | "Trash2"
  | "X"
  | "Loader2"
  | "Images"
  | "Timer"
  | "Camera"
  | "Mic"
  | "Search"
  | "Share"
  | "History"
  | "Star"
  | "Sparkles"
  | "AlertCircle"
  | "Music"
  | "ExternalLink"
  | "Videotape"
  | "Sliders"
  | "CheckCircle"
  | "RefreshCw"
  | "Clock";

export type SFSymbolName = string;

/**
 * Lucide React 图标到 SF Symbol 的映射表
 * 
 * 映射基于功能相似性，确保视觉一致性
 */
export const LUCIDE_TO_SF_SYMBOL: Record<LucideIconName, SFSymbolName> = {
  // 箭头
  ArrowUp: "arrow.up",
  ArrowDown: "arrow.down",
  ArrowLeft: "arrow.left",
  ArrowRight: "arrow.right",

  // 形状
  Square: "square",
  SquareFill: "square.fill",
  Circle: "circle.fill",

  // 手势和交互
  Hand: "hand.raised.fill",
  AtSign: "at",

  // 导航
  ChevronRight: "chevron.right",
  ChevronLeft: "chevron.left",
  ChevronUp: "chevron.up",
  ChevronDown: "chevron.down",

  // 状态
  Check: "checkmark",
  CheckCircle: "checkmark.circle.fill",
  X: "xmark",

  // 音量控制
  Volume1: "speaker.wave.1.fill",
  Volume2: "speaker.wave.2.fill",
  VolumeX: "speaker.slash.fill",

  // 设置和工具
  Settings: "gearshape.fill",
  Sliders: "slider.horizontal.3",

  // 操作
  Plus: "plus",
  Trash: "trash.fill",
  Trash2: "trash.fill",
  Share: "square.and.arrow.up",

  // 媒体
  Images: "photo.fill",
  Camera: "camera.fill",
  Videotape: "video.fill",
  Music: "music.note",
  Mic: "mic.fill",
  Timer: "timer",

  // 搜索和导航
  Search: "magnifyingglass",
  History: "clock.arrow.circlepath",
  ExternalLink: "arrow.up.right.square",

  // 其他
  Star: "star.fill",
  Sparkles: "sparkles",
  AlertCircle: "exclamationmark.circle.fill",
  Loader2: "arrow.clockwise",
  RefreshCw: "arrow.clockwise",
  Clock: "clock.fill",
};

/**
 * 检查是否有对应的 SF Symbol 映射
 */
export function hasSFSymbolMapping(iconName: string): boolean {
  return iconName in LUCIDE_TO_SF_SYMBOL;
}

/**
 * 获取对应的 SF Symbol 名称
 */
export function getSFSymbolName(iconName: string): SFSymbolName | null {
  return (LUCIDE_TO_SF_SYMBOL as Record<string, SFSymbolName>)[iconName] || null;
}

