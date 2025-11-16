#!/bin/bash
# 简化版自动导出脚本 - 打开 SF Symbols app 并提示导出

set -e

OUTPUT_DIR="public/icons/os1/sf-symbols"
mkdir -p "$OUTPUT_DIR"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}SF Symbols 自动导出助手${NC}"
echo ""

# 检查 SF Symbols app 是否安装
if [ ! -d "/Applications/SF Symbols.app" ]; then
    echo -e "${RED}错误: 未找到 SF Symbols app${NC}"
    echo "请从 Mac App Store 安装 SF Symbols app"
    exit 1
fi

# 需要导出的符号列表
SYMBOLS=(
    "arrow.down"
    "arrow.left"
    "arrow.right"
    "square"
    "xmark"
    "plus"
    "trash.fill"
    "chevron.down"
    "chevron.left"
    "speaker.wave.2.fill"
    "slider.horizontal.3"
    "magnifyingglass"
    "photo.fill"
    "camera.fill"
    "video.fill"
    "music.note"
    "mic.fill"
    "star.fill"
    "sparkles"
    "exclamationmark.circle.fill"
    "arrow.clockwise"
    "clock.fill"
    "square.and.arrow.up"
    "clock.arrow.circlepath"
    "checkmark.circle.fill"
    "arrow.up.right.square"
    "timer"
)

# 找出需要导出的符号（placeholder 或缺失的）
NEED_EXPORT=()
for symbol in "${SYMBOLS[@]}"; do
    icon_file="$OUTPUT_DIR/${symbol}.svg"
    if [ ! -f "$icon_file" ] || grep -q "stroke-dasharray" "$icon_file" 2>/dev/null; then
        NEED_EXPORT+=("$symbol")
    fi
done

if [ ${#NEED_EXPORT[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 所有图标都已导出！${NC}"
    exit 0
fi

echo -e "${YELLOW}需要导出 ${#NEED_EXPORT[@]} 个图标${NC}"
echo ""

# 打开 SF Symbols app
echo -e "${BLUE}正在打开 SF Symbols app...${NC}"
open "/Applications/SF Symbols.app"
sleep 2

# 打开输出目录
echo -e "${BLUE}正在打开输出目录...${NC}"
open "$OUTPUT_DIR"

echo ""
echo -e "${YELLOW}导出步骤:${NC}"
echo "1. SF Symbols app 已打开"
echo "2. 输出目录已打开: $OUTPUT_DIR"
echo "3. 按照以下列表逐个导出："
echo ""

# 显示需要导出的符号列表
for i in "${!NEED_EXPORT[@]}"; do
    symbol="${NEED_EXPORT[$i]}"
    num=$((i + 1))
    echo -e "  ${YELLOW}$num.${NC} $symbol"
done

echo ""
echo -e "${BLUE}操作提示:${NC}"
echo "- 在 SF Symbols app 中搜索符号名称"
echo "- 右键点击符号 → Export Symbol... → SVG"
echo "- 保存到已打开的文件夹，文件名使用: {符号名称}.svg"
echo "- 导出时选择 'Primary' 颜色（稍后会自动修复为 currentColor）"
echo ""

# 等待用户完成导出
read -p "完成所有导出后，按回车继续修复颜色... "

# 修复颜色
echo ""
echo -e "${YELLOW}正在修复 SVG 颜色...${NC}"
if [ -f "scripts/fix-sf-symbols-color.sh" ]; then
    ./scripts/fix-sf-symbols-color.sh
else
    echo -e "${RED}错误: 未找到颜色修复脚本${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}完成！${NC}"


