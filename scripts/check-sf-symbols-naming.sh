#!/bin/bash
# 检查 SF Symbols 文件命名是否正确

set -e

OUTPUT_DIR="public/icons/os1/sf-symbols"

# 从映射表中提取所有需要的 SF Symbol 名称
REQUIRED_SYMBOLS=(
    "arrow.up"
    "arrow.down"
    "arrow.left"
    "arrow.right"
    "square"
    "square.fill"
    "circle.fill"
    "checkmark"
    "checkmark.circle.fill"
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
    "arrow.up.right.square"
    "timer"
)

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}检查 SF Symbols 文件命名...${NC}"
echo ""

# 检查每个需要的符号
missing_count=0
found_count=0
placeholder_count=0

echo -e "${YELLOW}需要的符号列表 (${#REQUIRED_SYMBOLS[@]} 个):${NC}"
for symbol in "${REQUIRED_SYMBOLS[@]}"; do
    icon_file="$OUTPUT_DIR/${symbol}.svg"
    if [ -f "$icon_file" ]; then
        if grep -q "stroke-dasharray" "$icon_file" 2>/dev/null; then
            echo -e "  ${YELLOW}○${NC} $symbol ${BLUE}(placeholder)${NC}"
            placeholder_count=$((placeholder_count + 1))
        else
            echo -e "  ${GREEN}✓${NC} $symbol"
            found_count=$((found_count + 1))
        fi
    else
        echo -e "  ${RED}✗${NC} $symbol ${YELLOW}(缺失)${NC}"
        missing_count=$((missing_count + 1))
    fi
done

echo ""
echo -e "${BLUE}统计结果:${NC}"
echo "  ${GREEN}已导出:${NC} $found_count 个"
echo "  ${YELLOW}Placeholder:${NC} $placeholder_count 个"
echo "  ${RED}缺失:${NC} $missing_count 个"
echo ""

# 检查是否有不在列表中的文件
echo -e "${YELLOW}检查多余的文件:${NC}"
extra_files=0
for svg_file in "$OUTPUT_DIR"/*.svg; do
    if [ -f "$svg_file" ]; then
        filename=$(basename "$svg_file" .svg)
        if [[ ! " ${REQUIRED_SYMBOLS[@]} " =~ " ${filename} " ]]; then
            echo -e "  ${YELLOW}⚠${NC} $filename.svg (不在映射表中)"
            extra_files=$((extra_files + 1))
        fi
    fi
done

if [ $extra_files -eq 0 ]; then
    echo -e "  ${GREEN}✓ 没有多余的文件${NC}"
fi

echo ""
if [ $missing_count -eq 0 ] && [ $placeholder_count -eq 0 ]; then
    echo -e "${GREEN}✓ 所有文件命名正确！${NC}"
else
    echo -e "${YELLOW}提示:${NC} 请确保所有文件都已导出并命名正确"
fi


