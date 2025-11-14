# macOS 图标获取指南

本指南介绍如何快速获取 macOS 系统图标用于 OS1 主题。

## 方法 1: 使用提取脚本（推荐）

项目已包含一个自动化脚本，可以快速提取 macOS 图标：

```bash
# 从应用程序提取图标
./scripts/extract-macos-icons.sh "/Applications/Safari.app"

# 从系统资源提取图标
./scripts/extract-macos-icons.sh "system:GenericFolderIcon"

# 从 .icns 文件提取
./scripts/extract-macos-icons.sh "/path/to/icon.icns" "output-name"
```

### 常用系统图标名称

- `GenericApplicationIcon` - 通用应用程序图标
- `GenericFolderIcon` - 文件夹图标
- `GenericDocumentIcon` - 文档图标
- `TrashIcon` - 垃圾桶图标
- `DesktopIcon` - 桌面图标
- `ApplicationsFolderIcon` - 应用程序文件夹
- `DocumentsFolderIcon` - 文档文件夹
- `DownloadsFolderIcon` - 下载文件夹

## 方法 2: 手动从系统资源提取

### 步骤 1: 找到图标文件

macOS 系统图标通常位于：
- `/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/`
- `/System/Library/CoreServices/Applications/`
- `/Applications/[AppName].app/Contents/Resources/`

### 步骤 2: 提取 .icns 文件

```bash
# 查看可用的 .icns 文件
ls /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/*.icns

# 使用 iconutil 转换为 PNG
iconutil --convert iconset --output /tmp/icon.iconset /path/to/icon.icns

# 提取最大尺寸的图标（通常是 512x512）
cp /tmp/icon.iconset/icon_512x512.png public/icons/os1/icon-name.png

# 清理临时文件
rm -rf /tmp/icon.iconset
```

## 方法 3: 从应用程序包提取

### 查找应用程序图标

```bash
# 查找应用程序的图标文件
find "/Applications/Safari.app/Contents/Resources" -name "*.icns"

# 通常路径为：
# /Applications/[AppName].app/Contents/Resources/[AppName].icns
# 或
# /Applications/[AppName].app/Contents/Resources/AppIcon.icns
```

### 提取并转换

```bash
# 使用脚本自动提取
./scripts/extract-macos-icons.sh "/Applications/Safari.app"

# 或手动提取
iconutil --convert iconset --output /tmp/safari.iconset \
  "/Applications/Safari.app/Contents/Resources/Safari.icns"
cp /tmp/safari.iconset/icon_512x512.png public/icons/os1/safari.png
rm -rf /tmp/safari.iconset
```

## 方法 4: 使用在线资源

### 推荐的图标资源网站

1. **SF Symbols** (macOS 系统图标)
   - 访问: https://developer.apple.com/sf-symbols/
   - 需要 Xcode 或 SF Symbols app

2. **macOS Icons Archive**
   - 访问: https://macosicons.com/
   - 提供大量 macOS 风格图标

3. **IconArchive**
   - 访问: https://www.iconarchive.com/
   - 搜索 "mac os" 或 "macOS"

## 方法 5: 使用 sips 直接转换

如果已有 PNG 或 JPEG 文件，可以使用 macOS 自带的 `sips` 工具调整大小：

```bash
# 调整图标大小到 512x512
sips -Z 512 input.png --out public/icons/os1/output.png

# 转换为 PNG 格式
sips -s format png input.jpg --out public/icons/os1/output.png
```

## 批量处理

### 批量提取多个应用程序图标

```bash
# 创建要提取的应用列表
apps=(
  "/Applications/Safari.app"
  "/Applications/Mail.app"
  "/Applications/Calendar.app"
)

# 批量提取
for app in "${apps[@]}"; do
  ./scripts/extract-macos-icons.sh "$app"
done
```

### 批量调整图标大小

```bash
# 将所有图标调整为 512x512
for icon in public/icons/os1/*.png; do
  sips -Z 512 "$icon" --out "$icon"
done
```

## 更新图标清单

提取图标后，需要更新图标清单：

```bash
bun run generate:icons
```

## 注意事项

1. **版权**: 确保你有权使用提取的图标，特别是商业项目
2. **尺寸**: 建议使用 512x512 或 256x256 的 PNG 图标
3. **命名**: 使用小写字母和连字符，如 `safari.png`、`mail-app.png`
4. **格式**: 使用 PNG 格式以支持透明背景
5. **优化**: 可以使用 `sips` 或 `pngquant` 优化图标文件大小

## 快速参考命令

```bash
# 提取 Safari 图标
./scripts/extract-macos-icons.sh "/Applications/Safari.app"

# 提取系统文件夹图标
./scripts/extract-macos-icons.sh "system:GenericFolderIcon"

# 调整图标大小
sips -Z 512 public/icons/os1/icon.png --out public/icons/os1/icon.png

# 更新清单
bun run generate:icons
```

