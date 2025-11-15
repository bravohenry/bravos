import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

// SVG 内容缓存，避免重复加载相同的 SVG 文件
const svgCache = new Map<string, string>();

/**
 * 加载并处理 SVG 内容
 */
async function loadSvgContent(svgPath: string, size: number): Promise<string> {
  // 检查缓存
  const cacheKey = `${svgPath}:${size}`;
  if (svgCache.has(cacheKey)) {
    return svgCache.get(cacheKey)!;
  }

  const response = await fetch(svgPath);
  if (!response.ok) {
    throw new Error(`Failed to load SVG: ${response.status}`);
  }

  const text = await response.text();

  // 提取 SVG 内容（移除 XML 声明和 DOCTYPE）
  const svgMatch = text.match(/<svg[^>]*>[\s\S]*<\/svg>/i);
  if (!svgMatch) {
    throw new Error("Invalid SVG format");
  }

  let svgHtml = svgMatch[0];

  // 确保 SVG 使用 currentColor（修复脚本已经处理，这里作为双重保险）
  svgHtml = svgHtml
    .replace(/fill="white"/gi, 'fill="currentColor"')
    .replace(/fill="#[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="white"/gi, 'stroke="currentColor"')
    .replace(/stroke="#[^"]*"/gi, 'stroke="currentColor"')
    .replace(/\s+fill-opacity="[^"]*"/gi, "")
    .replace(/\s+stroke-opacity="[^"]*"/gi, "");

  // 更新 viewBox 和尺寸
  svgHtml = svgHtml.replace(
    /<svg([^>]*)>/i,
    `<svg$1 width="${size}" height="${size}">`
  );

  // 缓存结果
  svgCache.set(cacheKey, svgHtml);
  return svgHtml;
}

export interface SFSymbolProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "width" | "height"> {
  /**
   * SF Symbol 名称，如 "arrow.up", "square.fill"
   * 对应 SF Symbols app 中的符号名称
   */
  name: string;
  /**
   * 图标大小（像素）
   * @default 16
   */
  size?: number;
  /**
   * 图标权重（保留用于未来扩展）
   * @default "regular"
   */
  weight?:
    | "ultralight"
    | "thin"
    | "light"
    | "regular"
    | "medium"
    | "semibold"
    | "bold"
    | "heavy"
    | "black";
  /**
   * 是否仅在 OS1 主题下显示
   * @default true
   */
  os1Only?: boolean;
}

/**
 * SF Symbol 组件
 * 仅在 OS1 主题下渲染 SF Symbols 图标
 * 使用内联 SVG 方式，确保 currentColor 正确工作
 */
export const SFSymbol = React.memo<SFSymbolProps>(
  ({
    name,
    size = 16,
    weight = "regular",
    os1Only = true,
    className,
    style,
    ...props
  }) => {
    const currentTheme = useThemeStore((state) => state.current);
    const isOS1Theme = currentTheme === "os1";
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // 如果设置了 os1Only 且不是 OS1 主题，不渲染
    if (os1Only && !isOS1Theme) {
      return null;
    }

    // SF Symbol SVG 文件路径
    const svgPath = `/icons/os1/sf-symbols/${name}.svg`;

    // 加载 SVG 内容并内联渲染，这样 currentColor 才能正确工作
    useEffect(() => {
      let cancelled = false;

      setIsLoading(true);
      setHasError(false);

      loadSvgContent(svgPath, size)
        .then((svgHtml) => {
          if (!cancelled) {
            setSvgContent(svgHtml);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn(`Failed to load SF Symbol: ${name}`, err);
            setHasError(true);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [svgPath, name, size]);

    // 加载中或错误时不渲染
    if (isLoading || hasError || !svgContent) {
      return null;
    }

    // 使用 dangerouslySetInnerHTML 内联 SVG，这样 currentColor 才能正确工作
    return (
      <span
        className={cn("sf-symbol inline-block", className)}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

SFSymbol.displayName = "SFSymbol";

