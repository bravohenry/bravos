#!/bin/bash
# macOS 图标提取脚本
# 使用方法: ./scripts/extract-macos-icons.sh [应用名称或路径] [输出名称] [输出目录]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 解析参数
INPUT="$1"
OUTPUT_NAME="$2"
OUTPUT_DIR="${3:-public/icons/os1}"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 函数：从 .icns 文件提取 PNG
extract_from_icns() {
    local icns_file="$1"
    local output_name="$2"
    local output_path="$OUTPUT_DIR/${output_name}.png"
    
    if [ -f "$icns_file" ]; then
        echo -e "${BLUE}提取图标: $icns_file${NC}"
        # 使用 iconutil 提取最大的图标尺寸 (512x512)
        iconutil --convert iconset --output /tmp/temp.iconset "$icns_file" 2>/dev/null || true
        if [ -d "/tmp/temp.iconset" ]; then
            # 尝试获取最大的图标
            if [ -f "/tmp/temp.iconset/icon_512x512.png" ]; then
                cp "/tmp/temp.iconset/icon_512x512.png" "$output_path"
            elif [ -f "/tmp/temp.iconset/icon_256x256.png" ]; then
                cp "/tmp/temp.iconset/icon_256x256.png" "$output_path"
            elif [ -f "/tmp/temp.iconset/icon_128x128.png" ]; then
                cp "/tmp/temp.iconset/icon_128x128.png" "$output_path"
            else
                # 获取第一个可用的图标
                first_icon=$(ls /tmp/temp.iconset/*.png 2>/dev/null | head -1)
                if [ -n "$first_icon" ]; then
                    cp "$first_icon" "$output_path"
                fi
            fi
            rm -rf /tmp/temp.iconset
            echo -e "${GREEN}✓ 已保存到: $output_path${NC}"
        fi
    fi
}

# 函数：从应用程序包提取图标
extract_from_app() {
    local app_path="$1"
    local app_name=$(basename "$app_path" .app)
    local icns_path="$app_path/Contents/Resources/$app_name.icns"
    
    # 尝试多个可能的图标路径
    if [ ! -f "$icns_path" ]; then
        icns_path="$app_path/Contents/Resources/AppIcon.icns"
    fi
    
    if [ ! -f "$icns_path" ]; then
        # 查找所有 .icns 文件
        icns_path=$(find "$app_path/Contents/Resources" -name "*.icns" 2>/dev/null | head -1)
    fi
    
    if [ -f "$icns_path" ]; then
        extract_from_icns "$icns_path" "$app_name"
    else
        echo -e "${YELLOW}⚠ 未找到图标文件: $app_path${NC}"
    fi
}

# 函数：从系统资源提取图标
extract_system_icon() {
    local icon_name="$1"
    local output_name="${2:-$(echo "$icon_name" | tr '[:upper:]' '[:lower:]' | sed 's/Icon$//')}"
    
    # macOS 系统图标位置
    local system_paths=(
        "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources"
        "/System/Library/CoreServices/Applications"
        "/Applications"
        "/System/Applications"
    )
    
    for path in "${system_paths[@]}"; do
        if [ -d "$path" ]; then
            # 查找 .icns 文件
            local icns_file=$(find "$path" -name "${icon_name}.icns" -o -name "*${icon_name}*.icns" 2>/dev/null | head -1)
            if [ -n "$icns_file" ]; then
                extract_from_icns "$icns_file" "$output_name"
                return 0
            fi
        fi
    done
    
    echo -e "${YELLOW}⚠ 未找到系统图标: $icon_name${NC}"
}

# 主逻辑
if [ -z "$1" ]; then
    echo -e "${BLUE}macOS 图标提取工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  1. 从应用程序提取:"
    echo "     $0 '/Applications/Safari.app' [输出名称] [输出目录]"
    echo ""
    echo "  2. 从系统资源提取:"
    echo "     $0 'system:GenericFolderIcon' [输出名称] [输出目录]"
    echo ""
    echo "  3. 从 .icns 文件提取:"
    echo "     $0 '/path/to/icon.icns' [输出名称] [输出目录]"
    echo ""
    echo "示例:"
    echo "  $0 'system:GenericFolderIcon' 'folder' 'public/icons/os1'"
    echo "  $0 '/Applications/Safari.app' 'safari' 'public/icons/os1'"
    echo ""
    echo "常用系统图标名称:"
    echo "  - GenericApplicationIcon (通用应用)"
    echo "  - GenericFolderIcon (文件夹)"
    echo "  - GenericDocumentIcon (文档)"
    echo "  - TrashIcon (垃圾桶)"
    echo "  - DesktopIcon (桌面)"
    echo ""
    exit 0
fi

# 判断输入类型
if [[ "$INPUT" == system:* ]]; then
    # 系统图标
    icon_name="${INPUT#system:}"
    output_name="${OUTPUT_NAME:-$(echo "$icon_name" | tr '[:upper:]' '[:lower:]' | sed 's/Icon$//')}"
    extract_system_icon "$icon_name" "$output_name"
elif [ -d "$INPUT" ] && [[ "$INPUT" == *.app ]]; then
    # 应用程序包
    app_name="${OUTPUT_NAME:-$(basename "$INPUT" .app)}"
    extract_from_app "$INPUT"
    # 如果指定了输出名称，重命名文件
    if [ -n "$OUTPUT_NAME" ] && [ "$app_name" != "$OUTPUT_NAME" ]; then
        if [ -f "$OUTPUT_DIR/${app_name}.png" ]; then
            mv "$OUTPUT_DIR/${app_name}.png" "$OUTPUT_DIR/${OUTPUT_NAME}.png"
        fi
    fi
elif [ -f "$INPUT" ] && [[ "$INPUT" == *.icns ]]; then
    # .icns 文件
    output_name="${OUTPUT_NAME:-$(basename "$INPUT" .icns)}"
    extract_from_icns "$INPUT" "$output_name"
elif [ -f "$INPUT" ]; then
    # 其他文件，尝试作为应用路径
    if [[ "$INPUT" == *".app"* ]]; then
        extract_from_app "$INPUT"
    else
        echo -e "${YELLOW}⚠ 无法识别输入类型: $INPUT${NC}"
        exit 1
    fi
else
    # 尝试作为系统图标名称
    output_name="${OUTPUT_NAME:-$(echo "$INPUT" | tr '[:upper:]' '[:lower:]' | sed 's/Icon$//')}"
    extract_system_icon "$INPUT" "$output_name"
fi

