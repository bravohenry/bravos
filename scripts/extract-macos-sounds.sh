#!/bin/bash
# macOS 系统声音提取脚本
# 使用方法: ./scripts/extract-macos-sounds.sh [声音名称或"all"] [输出目录]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 解析参数
INPUT="${1:-all}"
# 如果第二个参数是 "all" 或 "list"，则它是输入，否则是输出目录
if [ "$1" == "all" ] || [ "$1" == "list" ] || [ -z "$1" ]; then
    OUTPUT_DIR="${2:-public/sounds}"
    OUTPUT_NAME=""
else
    # 第一个参数是声音名称，第二个参数可能是输出名称或输出目录
    if [ -n "$2" ] && [[ "$2" != *"/"* ]]; then
        # 第二个参数不包含路径分隔符，可能是输出名称
        OUTPUT_NAME="$2"
        OUTPUT_DIR="${3:-public/sounds}"
    else
        # 第二个参数包含路径分隔符或是目录，作为输出目录
        OUTPUT_DIR="${2:-public/sounds}"
        OUTPUT_NAME=""
    fi
fi

# macOS 系统声音位置
SYSTEM_SOUNDS_DIR="/System/Library/Sounds"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 函数：转换 AIFF 到 MP3
convert_aiff_to_mp3() {
    local aiff_file="$1"
    local output_name="$2"
    local output_path="$OUTPUT_DIR/${output_name}.mp3"
    
    if [ -f "$aiff_file" ]; then
        echo -e "${BLUE}转换声音: $(basename "$aiff_file") -> ${output_name}.mp3${NC}"
        # 使用 afconvert 转换为 MP3 格式
        # -f mp4f 表示 MPEG-4 Audio (实际上会生成 .m4a)
        # 或者使用 -f caff -d ima4 然后转换
        # 最简单的方式是转换为 m4a，但项目使用 mp3，所以我们用 afconvert 转 m4a 然后用 ffmpeg 转 mp3
        # 如果没有 ffmpeg，直接转 m4a 也可以
        
        # 检查是否有 ffmpeg
        if command -v ffmpeg &> /dev/null; then
            # 先转成临时 m4a，再转 mp3
            temp_m4a="/tmp/${output_name}.m4a"
            afconvert -f m4af -d aac -q 127 "$aiff_file" "$temp_m4a" 2>/dev/null
            ffmpeg -i "$temp_m4a" -codec:a libmp3lame -qscale:a 2 "$output_path" -y -loglevel error 2>/dev/null
            rm -f "$temp_m4a"
        elif command -v afconvert &> /dev/null; then
            # 如果没有 ffmpeg，直接转成 m4a（项目也支持 m4a）
            output_path="$OUTPUT_DIR/${output_name}.m4a"
            afconvert -f m4af -d aac -q 127 "$aiff_file" "$output_path" 2>/dev/null
        else
            echo -e "${YELLOW}⚠ 未找到音频转换工具 (afconvert 或 ffmpeg)${NC}"
            return 1
        fi
        
        if [ -f "$output_path" ]; then
            echo -e "${GREEN}✓ 已保存到: $output_path${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ 转换失败: $aiff_file${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ 文件不存在: $aiff_file${NC}"
        return 1
    fi
}

# 函数：提取单个系统声音
extract_system_sound() {
    local sound_name="$1"
    local output_name="${2:-$(echo "$sound_name" | tr '[:upper:]' '[:lower:]')}"
    
    # 构建完整路径
    local aiff_file="$SYSTEM_SOUNDS_DIR/${sound_name}.aiff"
    
    if [ -f "$aiff_file" ]; then
        convert_aiff_to_mp3 "$aiff_file" "$output_name"
        return 0
    else
        echo -e "${YELLOW}⚠ 未找到系统声音: $sound_name${NC}"
        return 1
    fi
}

# 函数：列出所有可用的系统声音
list_available_sounds() {
    echo -e "${BLUE}可用的 macOS 系统声音:${NC}"
    if [ -d "$SYSTEM_SOUNDS_DIR" ]; then
        for sound in "$SYSTEM_SOUNDS_DIR"/*.aiff; do
            if [ -f "$sound" ]; then
                echo "  - $(basename "$sound" .aiff)"
            fi
        done
    else
        echo -e "${YELLOW}⚠ 系统声音目录不存在: $SYSTEM_SOUNDS_DIR${NC}"
    fi
}

# 主逻辑
if [ -z "$1" ] || [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo -e "${BLUE}macOS 系统声音提取工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 [声音名称|all|list] [输出目录]"
    echo ""
    echo "示例:"
    echo "  $0 all                          # 提取所有系统声音"
    echo "  $0 Sosumi                       # 提取单个声音"
    echo "  $0 Basso basso-sound            # 提取并重命名"
    echo "  $0 list                         # 列出所有可用声音"
    echo "  $0 all custom-sounds            # 提取到自定义目录"
    echo ""
    echo "常用系统声音:"
    echo "  - Basso, Blow, Bottle, Frog, Funk"
    echo "  - Glass, Hero, Morse, Ping, Pop"
    echo "  - Purr, Sosumi, Submarine, Tink"
    echo ""
    exit 0
fi

# 检查系统声音目录是否存在
if [ ! -d "$SYSTEM_SOUNDS_DIR" ]; then
    echo -e "${YELLOW}⚠ 系统声音目录不存在: $SYSTEM_SOUNDS_DIR${NC}"
    echo -e "${YELLOW}⚠ 此脚本需要在 macOS 系统上运行${NC}"
    exit 1
fi

# 处理不同的输入
if [ "$INPUT" == "list" ]; then
    list_available_sounds
    exit 0
elif [ "$INPUT" == "all" ]; then
    echo -e "${BLUE}开始提取所有系统声音...${NC}"
    count=0
    success=0
    for sound_file in "$SYSTEM_SOUNDS_DIR"/*.aiff; do
        if [ -f "$sound_file" ]; then
            sound_name=$(basename "$sound_file" .aiff)
            output_name=$(echo "$sound_name" | tr '[:upper:]' '[:lower:]')
            if extract_system_sound "$sound_name" "$output_name"; then
                ((success++))
            fi
            ((count++))
        fi
    done
    echo ""
    echo -e "${GREEN}完成! 成功提取 $success/$count 个声音文件${NC}"
else
    # 提取单个声音
    sound_name="$INPUT"
    # 使用之前解析的输出名称，如果没有则使用默认名称
    if [ -z "$OUTPUT_NAME" ]; then
        output_name=$(echo "$sound_name" | tr '[:upper:]' '[:lower:]')
    else
        output_name="$OUTPUT_NAME"
    fi
    
    mkdir -p "$OUTPUT_DIR"
    extract_system_sound "$sound_name" "$output_name"
fi

