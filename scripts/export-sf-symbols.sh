#!/bin/bash
# SF Symbols 导出助手脚本
# 此脚本帮助批量导出 SF Symbols 为 SVG 文件

set -e

OUTPUT_DIR="public/icons/os1/sf-symbols"
mkdir -p "$OUTPUT_DIR"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}SF Symbols 导出助手${NC}"
echo ""

# 检查 SF Symbols app 是否安装
if [ ! -d "/Applications/SF Symbols.app" ]; then
    echo -e "${RED}错误: 未找到 SF Symbols app${NC}"
    echo "请从 Mac App Store 安装 SF Symbols app"
    exit 1
fi

# 需要导出的符号列表
SYMBOLS=(
    "arrow.up"
    "arrow.down"
    "arrow.left"
    "arrow.right"
    "square"
    "square.fill"
    "circle.fill"
    "checkmark"
    "xmark"
    "plus"
    "trash.fill"
    "chevron.up"
    "chevron.down"
    "chevron.left"
    "chevron.right"
    "speaker.wave.1.fill"
    "speaker.wave.2.fill"
    "speaker.slash.fill"
    "gearshape.fill"
    "slider.horizontal.3"
    "magnifyingglass"
    "at"
    "hand.raised.fill"
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
)

echo -e "${YELLOW}需要导出的符号列表:${NC}"
for symbol in "${SYMBOLS[@]}"; do
    icon_file="$OUTPUT_DIR/${symbol}.svg"
    if [ -f "$icon_file" ]; then
        # 检查是否是 placeholder（包含 stroke-dasharray）
        if grep -q "stroke-dasharray" "$icon_file" 2>/dev/null; then
            echo -e "  ${YELLOW}○${NC} $symbol ${BLUE}(placeholder)${NC}"
        else
            echo -e "  ${GREEN}✓${NC} $symbol"
        fi
    else
        echo -e "  ${RED}✗${NC} $symbol ${YELLOW}(缺失)${NC}"
    fi
done

echo ""
echo -e "${BLUE}导出步骤:${NC}"
echo "1. 打开 SF Symbols app: open '/Applications/SF Symbols.app'"
echo "2. 搜索符号名称，右键 → Export Symbol... → SVG"
echo "3. 保存到: $OUTPUT_DIR"
echo "4. 导出后运行: ./scripts/fix-sf-symbols-color.sh"

