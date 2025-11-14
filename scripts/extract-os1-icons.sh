#!/bin/bash
# 批量提取 macOS 系统图标到 os1 目录

OUTPUT_DIR="public/icons/os1"
mkdir -p "$OUTPUT_DIR"

SYSTEM_PATH="/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources"

# 提取单个图标的函数
extract_icon() {
    local icon_name="$1"
    local output_name="$2"
    local icns_file="$SYSTEM_PATH/${icon_name}.icns"
    
    if [ -f "$icns_file" ]; then
        echo "提取: $icon_name -> $output_name.png"
        iconutil --convert iconset --output "/tmp/temp_${output_name}.iconset" "$icns_file" 2>/dev/null || return 1
        
        if [ -d "/tmp/temp_${output_name}.iconset" ]; then
            # 优先使用 512x512，其次 256x256，最后 128x128
            if [ -f "/tmp/temp_${output_name}.iconset/icon_512x512.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_512x512.png" "$OUTPUT_DIR/${output_name}.png"
            elif [ -f "/tmp/temp_${output_name}.iconset/icon_256x256.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_256x256.png" "$OUTPUT_DIR/${output_name}.png"
            elif [ -f "/tmp/temp_${output_name}.iconset/icon_128x128.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_128x128.png" "$OUTPUT_DIR/${output_name}.png"
            else
                first_icon=$(ls "/tmp/temp_${output_name}.iconset"/*.png 2>/dev/null | head -1)
                if [ -n "$first_icon" ]; then
                    cp "$first_icon" "$OUTPUT_DIR/${output_name}.png"
                fi
            fi
            rm -rf "/tmp/temp_${output_name}.iconset"
            return 0
        fi
    else
        echo "⚠ 未找到: $icon_name"
        return 1
    fi
}

# 批量提取图标
echo "开始批量提取 macOS 系统图标..."

# 基础图标
extract_icon "GenericApplicationIcon" "app"
extract_icon "GenericFolderIcon" "folder"
extract_icon "GenericDocumentIcon" "file"
extract_icon "GenericDocumentIcon" "file-text"
extract_icon "DesktopIcon" "desktop"
extract_icon "GenericDiskIcon" "disk"
extract_icon "GenericCDROMIcon" "cdrom"

# 文件夹图标
extract_icon "ApplicationsFolderIcon" "applications"
extract_icon "DocumentsFolderIcon" "documents"
extract_icon "PicturesFolderIcon" "images"
extract_icon "MoviesFolderIcon" "movies"
extract_icon "MusicFolderIcon" "sounds"
extract_icon "SitesFolderIcon" "sites"

# 系统图标
extract_icon "TrashIcon" "trash-empty"
extract_icon "TrashFullIcon" "trash-full"
extract_icon "AppleLogoIcon" "apple"
extract_icon "GenericQuestionMarkIcon" "question"
extract_icon "AlertStopIcon" "error"
extract_icon "AlertCautionIcon" "warn"

# 尝试提取一些应用图标
echo ""
echo "尝试提取应用程序图标..."

# Terminal
if [ -f "/System/Applications/Utilities/Terminal.app/Contents/Resources/Terminal.icns" ]; then
    extract_icon_from_app "/System/Applications/Utilities/Terminal.app" "terminal"
fi

# TextEdit
if [ -f "/System/Applications/TextEdit.app/Contents/Resources/TextEdit.icns" ]; then
    extract_icon_from_app "/System/Applications/TextEdit.app" "textedit"
fi

# 从应用程序提取图标的函数
extract_icon_from_app() {
    local app_path="$1"
    local output_name="$2"
    local app_name=$(basename "$app_path" .app)
    local icns_path="$app_path/Contents/Resources/$app_name.icns"
    
    if [ ! -f "$icns_path" ]; then
        icns_path="$app_path/Contents/Resources/AppIcon.icns"
    fi
    
    if [ ! -f "$icns_path" ]; then
        icns_path=$(find "$app_path/Contents/Resources" -name "*.icns" 2>/dev/null | head -1)
    fi
    
    if [ -f "$icns_path" ]; then
        echo "提取应用图标: $app_name -> $output_name.png"
        iconutil --convert iconset --output "/tmp/temp_${output_name}.iconset" "$icns_path" 2>/dev/null || return 1
        
        if [ -d "/tmp/temp_${output_name}.iconset" ]; then
            if [ -f "/tmp/temp_${output_name}.iconset/icon_512x512.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_512x512.png" "$OUTPUT_DIR/${output_name}.png"
            elif [ -f "/tmp/temp_${output_name}.iconset/icon_256x256.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_256x256.png" "$OUTPUT_DIR/${output_name}.png"
            elif [ -f "/tmp/temp_${output_name}.iconset/icon_128x128.png" ]; then
                cp "/tmp/temp_${output_name}.iconset/icon_128x128.png" "$OUTPUT_DIR/${output_name}.png"
            else
                first_icon=$(ls "/tmp/temp_${output_name}.iconset"/*.png 2>/dev/null | head -1)
                if [ -n "$first_icon" ]; then
                    cp "$first_icon" "$OUTPUT_DIR/${output_name}.png"
                fi
            fi
            rm -rf "/tmp/temp_${output_name}.iconset"
        fi
    fi
}

# 尝试提取 Terminal 和 TextEdit
if [ -d "/System/Applications/Utilities/Terminal.app" ]; then
    extract_icon_from_app "/System/Applications/Utilities/Terminal.app" "terminal"
fi

if [ -d "/System/Applications/TextEdit.app" ]; then
    extract_icon_from_app "/System/Applications/TextEdit.app" "textedit"
fi

# 尝试提取其他常用图标
extract_icon "GenericImageIcon" "image" || true
extract_icon "GenericMovieIcon" "video-tape" || true
extract_icon "GenericMusicIcon" "sound" || true

echo ""
echo "✓ 批量提取完成！"
echo "已提取的图标保存在: $OUTPUT_DIR"

