# macOS 系统声音提取指南

本指南介绍如何从 macOS 系统中提取系统声音文件用于项目。

## 方法 1: 使用提取脚本（推荐）

项目已包含一个自动化脚本，可以快速提取 macOS 系统声音：

```bash
# 列出所有可用的系统声音
./scripts/extract-macos-sounds.sh list

# 提取所有系统声音
./scripts/extract-macos-sounds.sh all

# 提取单个声音
./scripts/extract-macos-sounds.sh Sosumi

# 提取并自定义输出名称
./scripts/extract-macos-sounds.sh Basso alert-basso

# 提取到自定义目录
./scripts/extract-macos-sounds.sh all custom-sounds
```

### 可用的 macOS 系统声音

macOS 系统提供了以下声音文件（位于 `/System/Library/Sounds/`）：

- **Basso** - 低音提示音
- **Blow** - 吹气声
- **Bottle** - 瓶子声
- **Frog** - 青蛙声
- **Funk** - 放克音乐
- **Glass** - 玻璃声
- **Hero** - 英雄音效
- **Morse** - 摩尔斯电码
- **Ping** - 提示音
- **Pop** - 弹出声
- **Purr** - 呼噜声
- **Sosumi** - 经典 macOS 提示音（已用于项目）
- **Submarine** - 潜艇声
- **Tink** - 叮当声

## 方法 2: 手动提取

### 步骤 1: 找到系统声音文件

macOS 系统声音位于：
```bash
/System/Library/Sounds/
```

查看所有可用的声音文件：
```bash
ls -la /System/Library/Sounds/
```

### 步骤 2: 转换格式

系统声音文件是 `.aiff` 格式，需要转换为项目使用的 `.mp3` 或 `.m4a` 格式。

#### 使用 afconvert（macOS 自带）

```bash
# 转换为 M4A 格式（项目支持）
afconvert -f m4af -d aac -q 127 \
  /System/Library/Sounds/Sosumi.aiff \
  public/sounds/sosumi.m4a
```

#### 使用 ffmpeg（需要安装）

```bash
# 先转换为 M4A
afconvert -f m4af -d aac -q 127 \
  /System/Library/Sounds/Sosumi.aiff \
  /tmp/sosumi.m4a

# 再转换为 MP3
ffmpeg -i /tmp/sosumi.m4a \
  -codec:a libmp3lame -qscale:a 2 \
  public/sounds/sosumi.mp3

# 清理临时文件
rm /tmp/sosumi.m4a
```

## 方法 3: 批量提取所有声音

### 使用脚本（推荐）

```bash
# 提取所有系统声音到默认目录 (public/sounds)
./scripts/extract-macos-sounds.sh all
```

### 手动批量提取

```bash
# 创建输出目录
mkdir -p public/sounds

# 批量转换所有声音
for sound in /System/Library/Sounds/*.aiff; do
    name=$(basename "$sound" .aiff | tr '[:upper:]' '[:lower:]')
    afconvert -f m4af -d aac -q 127 "$sound" "public/sounds/${name}.m4a"
done
```

## 在代码中使用提取的声音

提取声音后，需要在 `src/hooks/useSound.ts` 中添加声音路径：

```typescript
export const Sounds = {
  // ... 现有声音
  ALERT_BASSO: "/sounds/basso.m4a",
  ALERT_GLASS: "/sounds/glass.m4a",
  ALERT_PING: "/sounds/ping.m4a",
  // ... 更多声音
} as const;
```

然后在组件中使用：

```typescript
import { useSound, Sounds } from "@/hooks/useSound";

function MyComponent() {
  const { play } = useSound(Sounds.ALERT_PING, 0.5);
  
  return <button onClick={play}>播放提示音</button>;
}
```

## 声音文件格式说明

### 支持的格式

项目支持以下音频格式：
- **MP3** (`.mp3`) - 推荐，兼容性最好
- **M4A** (`.m4a`) - macOS 原生格式，质量好

### 格式转换建议

1. **质量优先**: 使用 M4A 格式（AAC 编码），质量更好
2. **兼容性优先**: 使用 MP3 格式，浏览器兼容性更好
3. **文件大小**: M4A 通常比 MP3 稍小，但差异不大

### 转换参数说明

```bash
# afconvert 参数
-f m4af      # 输出格式为 M4A
-d aac       # 音频编码为 AAC
-q 127       # 质量设置（0-127，127 为最高质量）

# ffmpeg 参数（转换为 MP3）
-codec:a libmp3lame  # 使用 LAME MP3 编码器
-qscale:a 2          # 质量设置（0-9，2 为高质量）
```

## 声音主题化

目前项目中的所有主题共享相同的声音文件。如果需要为主题定制不同的声音：

1. 为不同主题创建不同的声音目录：
   ```
   public/sounds/macosx/
   public/sounds/os1/
   public/sounds/xp/
   ```

2. 在主题配置中添加声音映射：
   ```typescript
   // src/themes/types.ts
   export interface OsTheme {
     // ... 现有配置
     sounds?: {
       windowOpen?: string;
       windowClose?: string;
       buttonClick?: string;
       // ... 更多声音
     };
   }
   ```

3. 在 `useSound` hook 中根据当前主题选择声音路径。

## 注意事项

1. **版权**: macOS 系统声音受 Apple 版权保护，仅用于个人项目或获得授权的项目
2. **文件大小**: 注意声音文件大小，避免影响页面加载速度
3. **预加载**: 项目会自动预加载所有定义的声音，确保首次播放流畅
4. **格式兼容**: 确保转换后的格式在目标浏览器中支持
5. **音量控制**: 使用 `useSound` hook 的 `volume` 参数控制音量（0-1）

## 快速参考命令

```bash
# 列出所有可用声音
./scripts/extract-macos-sounds.sh list

# 提取所有声音
./scripts/extract-macos-sounds.sh all

# 提取单个声音
./scripts/extract-macos-sounds.sh Ping

# 提取并重命名
./scripts/extract-macos-sounds.sh Sosumi alert-sosumi

# 手动转换单个文件
afconvert -f m4af -d aac -q 127 \
  /System/Library/Sounds/Ping.aiff \
  public/sounds/ping.m4a
```

## 故障排除

### 问题：脚本无法访问系统声音目录

**解决方案**: 确保在 macOS 系统上运行，并且有读取系统目录的权限。

### 问题：转换失败

**解决方案**: 
- 检查是否安装了 `afconvert`（macOS 自带）
- 如需 MP3 格式，安装 `ffmpeg`: `brew install ffmpeg`

### 问题：声音文件太大

**解决方案**: 
- 降低转换质量参数（`-q` 值）
- 使用音频编辑工具裁剪或压缩
- 考虑使用更短的提示音片段

### 问题：浏览器不支持音频格式

**解决方案**: 
- 使用 MP3 格式（兼容性最好）
- 检查浏览器控制台的错误信息
- 确保服务器正确设置了 MIME 类型

