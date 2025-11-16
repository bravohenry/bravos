#!/bin/bash
# 自动导出 SF Symbols 图标
# 使用 AppleScript 自动化 SF Symbols app

set -e

OUTPUT_DIR="public/icons/os1/sf-symbols"
mkdir -p "$OUTPUT_DIR"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}SF Symbols 自动导出工具${NC}"
echo ""

# 检查 SF Symbols app 是否安装
if [ ! -d "/Applications/SF Symbols.app" ]; then
    echo -e "${RED}错误: 未找到 SF Symbols app${NC}"
    echo "请从 Mac App Store 安装 SF Symbols app"
    exit 1
fi

# 需要导出的符号列表（只导出 placeholder 的）
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

# 检查哪些是 placeholder
PLACEHOLDER_SYMBOLS=()
for symbol in "${SYMBOLS[@]}"; do
    icon_file="$OUTPUT_DIR/${symbol}.svg"
    if [ ! -f "$icon_file" ] || grep -q "stroke-dasharray" "$icon_file" 2>/dev/null; then
        PLACEHOLDER_SYMBOLS+=("$symbol")
    fi
done

if [ ${#PLACEHOLDER_SYMBOLS[@]} -eq 0 ]; then
    echo -e "${GREEN}所有图标都已导出！${NC}"
    exit 0
fi

echo -e "${YELLOW}需要导出 ${#PLACEHOLDER_SYMBOLS[@]} 个图标${NC}"
echo ""

# 创建 AppleScript 来导出单个符号
create_export_script() {
    local symbol_name=$1
    local output_path=$2
    
    cat <<EOF
tell application "SF Symbols"
    activate
    delay 1
    
    -- 搜索符号
    tell application "System Events"
        tell process "SF Symbols"
            -- 点击搜索框
            try
                set searchField to text field 1 of group 1 of toolbar 1 of window 1
                set focused of searchField to true
                set value of searchField to "$symbol_name"
                delay 0.5
                
                -- 按回车选择第一个结果
                key code 36 -- Enter
                delay 0.5
                
                -- 右键点击符号
                click at {400, 300} with right click
                delay 0.3
                
                -- 选择 Export Symbol...
                click menu item "Export Symbol…" of menu 1
                delay 1
                
                -- 在保存对话框中
                keystroke "G" using {command down, shift down} -- Go to folder
                delay 0.5
                keystroke "$output_path"
                delay 0.3
                key code 36 -- Enter
                delay 0.3
                
                -- 输入文件名
                keystroke "$symbol_name.svg"
                delay 0.3
                key code 36 -- Enter
                delay 1
                
                return true
            on error errMsg
                return false
            end try
        end tell
    end tell
end tell
EOF
}

# 由于 AppleScript 自动化 SF Symbols app 比较复杂，我们使用更简单的方法
# 创建一个交互式脚本，逐个提示用户导出

echo -e "${YELLOW}由于 SF Symbols app 的自动化限制，将使用交互式导出${NC}"
echo ""
echo -e "${BLUE}请按照以下步骤操作：${NC}"
echo ""

exported_count=0
failed_count=0

for symbol in "${PLACEHOLDER_SYMBOLS[@]}"; do
    icon_file="$OUTPUT_DIR/${symbol}.svg"
    
    echo -e "${YELLOW}正在导出: $symbol${NC}"
    echo "  1. 确保 SF Symbols app 已打开"
    echo "  2. 在搜索框中输入: $symbol"
    echo "  3. 选择符号，右键 → Export Symbol... → SVG"
    echo "  4. 保存到: $OUTPUT_DIR"
    echo "  5. 文件名: $symbol.svg"
    echo ""
    read -p "  按回车继续，或输入 's' 跳过，'q' 退出: " response
    
    if [ "$response" = "q" ]; then
        echo -e "${YELLOW}已取消${NC}"
        break
    elif [ "$response" = "s" ]; then
        echo -e "  ${YELLOW}跳过: $symbol${NC}"
        failed_count=$((failed_count + 1))
        continue
    fi
    
    # 等待文件出现
    echo -e "  ${BLUE}等待文件保存...${NC}"
    timeout=30
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if [ -f "$icon_file" ] && ! grep -q "stroke-dasharray" "$icon_file" 2>/dev/null; then
            echo -e "  ${GREEN}✓ 已导出: $symbol${NC}"
            exported_count=$((exported_count + 1))
            break
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        echo -n "."
    done
    echo ""
    
    if [ $elapsed -ge $timeout ]; then
        echo -e "  ${RED}✗ 超时: $symbol${NC}"
        failed_count=$((failed_count + 1))
    fi
done

echo ""
echo -e "${BLUE}导出完成:${NC}"
echo "  成功: $exported_count 个"
echo "  失败/跳过: $failed_count 个"
echo ""

if [ $exported_count -gt 0 ]; then
    echo -e "${YELLOW}正在修复 SVG 颜色...${NC}"
    if [ -f "scripts/fix-sf-symbols-color.sh" ]; then
        ./scripts/fix-sf-symbols-color.sh
    fi
fi

echo ""
echo -e "${GREEN}完成！${NC}"


