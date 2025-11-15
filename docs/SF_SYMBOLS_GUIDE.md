# SF Symbols 获取指南

本指南介绍如何正确获取 SF Symbols 的 SVG 文件用于 OS1 主题。

## 方法 1: 使用 SF Symbols App（推荐）

### 步骤 1: 打开 SF Symbols App
```bash
open "/Applications/SF Symbols.app"
```

### 步骤 2: 搜索并导出符号

1. 在搜索框中输入符号名称（如 `arrow.up`、`square.fill`）
2. 选择需要的符号
3. 右键点击符号 → 选择 "Export Symbol..."
4. 选择导出格式为 **SVG**
5. 保存到 `public/icons/os1/sf-symbols/` 目录

### 批量导出技巧

1. 在 SF Symbols app 中，可以一次选择多个符号
2. 使用菜单：**File → Export → SVG...**
3. 选择输出目录为 `public/icons/os1/sf-symbols/`

## 方法 2: 使用在线工具

### SF Symbols Online
访问：https://sf-symbols-online.com/

1. 搜索符号名称
2. 点击符号查看详情
3. 下载 SVG 格式

### 注意事项
- 确保 SVG 文件使用 `currentColor` 而不是固定颜色
- 检查 viewBox 是否正确（通常是 `0 0 16 16` 或 `0 0 20 20`）

## 方法 3: 使用 AppleScript 自动化（高级）

可以创建一个 AppleScript 来自动化导出过程，但需要手动操作 SF Symbols app。

## 常用符号列表

以下是项目中需要导出的符号：

### 箭头和导航
- `arrow.up`
- `arrow.down`
- `arrow.left`
- `arrow.right`
- `chevron.up`
- `chevron.down`
- `chevron.left`
- `chevron.right`

### 形状
- `square`
- `square.fill`
- `circle.fill`

### 操作
- `checkmark`
- `xmark`
- `plus`
- `trash.fill`

### 媒体
- `speaker.wave.1.fill`
- `speaker.wave.2.fill`
- `speaker.slash.fill`
- `photo.fill`
- `camera.fill`
- `video.fill`
- `music.note`
- `mic.fill`

### 工具
- `gearshape.fill`
- `slider.horizontal.3`
- `magnifyingglass`
- `at`

### 其他
- `hand.raised.fill`
- `star.fill`
- `sparkles`
- `exclamationmark.circle.fill`
- `arrow.clockwise`
- `clock.fill`
- `square.and.arrow.up`
- `clock.arrow.circlepath`

## 验证导出的 SVG

导出的 SVG 应该：
1. 使用 `fill="currentColor"` 或 `stroke="currentColor"` 以支持主题颜色
2. 有正确的 viewBox（通常是 `0 0 16 16` 或 `0 0 20 20`）
3. 文件大小合理（通常 < 5KB）

## 快速检查脚本

```bash
# 检查 SVG 文件是否包含 currentColor
grep -l "currentColor" public/icons/os1/sf-symbols/*.svg

# 检查所有需要的符号是否已导出
for symbol in arrow.up square.fill checkmark chevron.right; do
  if [ -f "public/icons/os1/sf-symbols/${symbol}.svg" ]; then
    echo "✓ $symbol"
  else
    echo "✗ $symbol (缺失)"
  fi
done
```

