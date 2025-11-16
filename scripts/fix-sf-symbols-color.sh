#!/bin/bash
# 修复 SF Symbols SVG 文件，将固定颜色替换为 currentColor

set -e

OUTPUT_DIR="public/icons/os1/sf-symbols"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}修复 SF Symbols SVG 颜色...${NC}"
echo ""

fixed_count=0
total_count=0

for svg in "$OUTPUT_DIR"/*.svg; do
  if [ -f "$svg" ]; then
    total_count=$((total_count + 1))
    filename=$(basename "$svg")
    
    # 检查是否需要修复
    if grep -q 'fill="white"\|fill="#[^"]*"\|stroke="white"\|stroke="#[^"]*"' "$svg" 2>/dev/null; then
      echo -e "${YELLOW}修复: $filename${NC}"
      
      # 备份原文件
      cp "$svg" "$svg.bak"
      
      # 替换固定颜色为 currentColor
      # 1. 替换 fill="white" 为 fill="currentColor"
      # 2. 替换 fill="#..." 为 fill="currentColor"
      # 3. 替换 stroke="white" 为 stroke="currentColor"
      # 4. 替换 stroke="#..." 为 stroke="currentColor"
      # 5. 移除 fill-opacity（currentColor 不需要透明度）
      # 6. 移除 stroke-opacity（如果需要）
      
      sed -i '' \
        -e 's/fill="white"/fill="currentColor"/g' \
        -e 's/fill="#[^"]*"/fill="currentColor"/g' \
        -e 's/stroke="white"/stroke="currentColor"/g' \
        -e 's/stroke="#[^"]*"/stroke="currentColor"/g' \
        -e 's/ fill-opacity="[^"]*"//g' \
        -e 's/ stroke-opacity="[^"]*"//g' \
        "$svg"
      
      fixed_count=$((fixed_count + 1))
      echo -e "  ${GREEN}✓${NC} 已修复"
    else
      echo -e "${GREEN}✓${NC} $filename (已使用 currentColor)"
    fi
  fi
done

echo ""
echo -e "${BLUE}修复完成:${NC}"
echo "  总计: $total_count 个文件"
echo "  修复: $fixed_count 个文件"
echo ""
echo -e "${YELLOW}提示:${NC} 备份文件已保存为 .bak，如需恢复可删除 .bak 后缀"


