import React from "react";
import { LucideIcon } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { SFSymbol, SFSymbolProps } from "./SFSymbol";
import { getSFSymbolName, LucideIconName } from "@/utils/sfSymbolMap";
import { cn } from "@/lib/utils";

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  /**
   * Lucide React 图标组件
   */
  icon: LucideIcon;
  /**
   * Lucide 图标名称（用于映射到 SF Symbol）
   * 如果不提供，会尝试从 icon 组件中提取
   */
  name?: LucideIconName;
  /**
   * 图标大小（像素）
   * @default 16
   */
  size?: number;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * SF Symbol 权重（仅在 OS1 主题下生效）
   */
  sfWeight?: SFSymbolProps["weight"];
  /**
   * 是否强制使用 lucide-react（忽略主题）
   */
  forceLucide?: boolean;
}

/**
 * 统一的图标组件
 * 
 * 功能：
 * - 在 OS1 主题下自动使用 SF Symbols
 * - 在其他主题下使用 lucide-react
 * - 保持与 lucide-react 相同的 API
 * 
 * @example
 * ```tsx
 * import { Icon } from "@/components/shared/Icon";
 * import { ArrowUp } from "lucide-react";
 * 
 * <Icon icon={ArrowUp} name="ArrowUp" size={24} className="text-blue-500" />
 * ```
 */
export const Icon = React.memo<IconProps>(
  ({
    icon: LucideIcon,
    name: iconName,
    size = 16,
    className,
    style,
    sfWeight = "regular",
    forceLucide = false,
    ...props
  }) => {
    const currentTheme = useThemeStore((state) => state.current);
    const isOS1Theme = currentTheme === "os1";

    // 如果强制使用 lucide-react 或不是 OS1 主题，使用 lucide-react
    if (forceLucide || !isOS1Theme) {
      return (
        <LucideIcon
          size={size}
          className={cn(className)}
          style={style}
          {...props}
        />
      );
    }

    // OS1 主题：尝试使用 SF Symbol
    // 优先使用传入的 name，否则尝试从组件中提取
    const resolvedIconName =
      iconName ||
      (LucideIcon as any).displayName ||
      (LucideIcon as any).name ||
      "";
    const sfSymbolName = resolvedIconName
      ? getSFSymbolName(resolvedIconName)
      : null;

    // 如果有映射，使用 SF Symbol
    if (sfSymbolName) {
      // 过滤掉 SVG 特定的属性，只保留兼容的 HTML 属性
      const {
        onCopy,
        onCopyCapture,
        onCut,
        onCutCapture,
        onPaste,
        onPasteCapture,
        ...htmlProps
      } = props as any;
      
      return (
        <SFSymbol
          name={sfSymbolName}
          size={size}
          weight={sfWeight}
          className={className}
          style={style}
          os1Only={false} // Icon 组件已经处理了主题检测
          {...htmlProps}
        />
      );
    }

    // 如果没有映射，回退到 lucide-react
    return (
      <LucideIcon
        size={size}
        className={cn(className)}
        style={style}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，优化性能
    return (
      prevProps.icon === nextProps.icon &&
      prevProps.name === nextProps.name &&
      prevProps.size === nextProps.size &&
      prevProps.className === nextProps.className &&
      prevProps.sfWeight === nextProps.sfWeight &&
      prevProps.forceLucide === nextProps.forceLucide &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    );
  }
);

Icon.displayName = "Icon";

