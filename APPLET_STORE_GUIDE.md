# 📱 Applet Store 完整指南

## 🎯 系统架构

### 1. **核心组件**

```
┌─────────────────────────────────────────┐
│  Applet Store 架构                        │
├─────────────────────────────────────────┤
│                                          │
│  Frontend (React)                        │
│  ├── AppStore.tsx (主商店界面)            │
│  ├── AppStoreFeed.tsx (Feed 视图)        │
│  ├── AppletViewerAppComponent.tsx       │
│  └── appletActions.ts (操作逻辑)         │
│                                          │
│  Backend (Vercel Edge Function)          │
│  └── api/share-applet.ts                │
│      ├── GET: 获取 applet 列表           │
│      ├── POST: 创建/更新 applet          │
│      ├── PATCH: 更新 featured 状态      │
│      └── DELETE: 删除 applet             │
│                                          │
│  Storage (Upstash Redis)                 │
│  └── Key: applet:share:{id}             │
│      └── Value: Applet JSON data        │
└─────────────────────────────────────────┘
```

## 📦 Applet 数据结构

### Redis 存储格式

```typescript
{
  id: string;              // 32位随机hex ID
  content: string;         // HTML 内容
  title?: string;          // 显示标题
  name?: string;           // 文件名
  icon?: string;           // 图标 (emoji 或 URL)
  windowWidth?: number;    // 窗口宽度
  windowHeight?: number;   // 窗口高度
  createdAt: number;       // 创建时间戳
  createdBy?: string;      // 创建者用户名
  updatedAt?: number;      // 更新时间戳
  featured?: boolean;      // 是否为精选 (admin only)
}
```

## 🚀 如何添加新 Applet

### 方法 1：通过 UI (推荐)

#### Step 1: 创建 HTML Applet
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Applet</title>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: system-ui; 
      padding: 20px;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>🎨 My Awesome Applet</h1>
  <p>This is my custom applet!</p>
  
  <script>
    // Your JavaScript code here
    console.log('Applet loaded!');
  </script>
</body>
</html>
```

#### Step 2: 在 Applet Viewer 中打开
1. 打开 **Applet Viewer** 应用
2. 点击「Import」按钮
3. 选择你的 `.html` 文件

#### Step 3: 分享到 Store
1. 点击菜单栏的「Share」→「Share Applet」
2. 系统会生成一个 share code (例如：`a1b2c3d4...`)
3. Applet 自动保存到 `/Applets/` 目录

### 方法 2：通过 API

#### 创建新 Applet

```bash
curl -X POST https://os.bravohenry.com/api/share-applet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "X-Username: YOUR_USERNAME" \
  -d '{
    "content": "<!DOCTYPE html><html>...</html>",
    "title": "My Applet",
    "name": "🎨 My App",
    "icon": "🎨",
    "windowWidth": 600,
    "windowHeight": 400
  }'
```

**响应：**
```json
{
  "id": "a1b2c3d4e5f6...",
  "message": "Applet saved successfully"
}
```

#### 更新现有 Applet

```bash
curl -X POST https://os.bravohenry.com/api/share-applet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "X-Username: YOUR_USERNAME" \
  -d '{
    "shareId": "a1b2c3d4e5f6...",
    "content": "<!DOCTYPE html><html>...</html>",
    "title": "Updated Title"
  }'
```

#### 获取所有 Applets

```bash
curl https://os.bravohenry.com/api/share-applet?list=true
```

**响应：**
```json
{
  "applets": [
    {
      "id": "a1b2c3d4...",
      "title": "My Applet",
      "name": "🎨 My App",
      "icon": "🎨",
      "createdAt": 1762896273580,
      "createdBy": "bravo",
      "featured": false
    },
    ...
  ]
}
```

#### 获取单个 Applet

```bash
curl https://os.bravohenry.com/api/share-applet?id=a1b2c3d4...
```

#### 删除 Applet (需要认证)

```bash
curl -X DELETE https://os.bravohenry.com/api/share-applet?id=a1b2c3d4... \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "X-Username: YOUR_USERNAME"
```

### 方法 3：直接操作文件系统

Applets 保存在本地文件系统：
- **路径**: `/Applets/`
- **格式**: `.app` 文件 (实际是 HTML)
- **存储**: IndexedDB (`applets` store)

## ⭐ Featured Applets (管理员功能)

### 设置为精选

只有管理员（`username === "zihan"`）可以标记 applet 为精选：

```bash
curl -X PATCH https://os.bravohenry.com/api/share-applet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "X-Username: zihan" \
  -d '{
    "id": "a1b2c3d4...",
    "featured": true
  }'
```

精选 applet 会在 Store 中优先显示。

## 🎨 Applet 最佳实践

### 1. **图标 (Icon)**
- 推荐使用 emoji：`🎨 🎮 📱 🎵 ⚙️`
- 或使用图片 URL
- 系统会自动从标题中提取 emoji

### 2. **窗口尺寸**
```javascript
// 建议尺寸
windowWidth: 600,   // 默认宽度
windowHeight: 400   // 默认高度
```

### 3. **命名规范**
```typescript
name: "🎨 My App"        // 带 emoji 的显示名
title: "My App"          // 纯文本标题
```

### 4. **HTML 模板**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Applet Title</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #fff;
      color: #000;
    }
  </style>
</head>
<body>
  <!-- Your content here -->
  
  <script>
    // Your JavaScript here
  </script>
</body>
</html>
```

## 🔍 Applet 排序规则

Store 中的 applet 按以下优先级排序：

1. **Featured** (精选) - 管理员标记
2. **Has Updates** (有更新) - 已安装但有新版本
3. **Not Installed** (未安装) - 新 applet
4. **Others** (其他) - 已安装且无更新

每个分类内部使用确定性随机打乱（seeded shuffle）。

## 📝 代码示例

### 前端：安装 Applet

```typescript
import { useAppletActions } from '../utils/appletActions';

function MyComponent() {
  const actions = useAppletActions();
  
  const handleInstall = async (applet: Applet) => {
    await actions.handleInstall(applet, () => {
      console.log('Applet installed!');
    });
  };
  
  return <button onClick={() => handleInstall(myApplet)}>Install</button>;
}
```

### 前端：检查更新

```typescript
const needsUpdate = actions.needsUpdate(applet);
const isInstalled = actions.isAppletInstalled(applet.id);

if (needsUpdate) {
  console.log('Update available!');
}
```

### 后端：自定义 API 路由

```typescript
// api/my-custom-applet.ts
export default async function handler(req: Request) {
  const redis = new Redis({
    url: process.env.REDIS_KV_REST_API_URL,
    token: process.env.REDIS_KV_REST_API_TOKEN,
  });
  
  // Your custom logic here
  const applets = await redis.keys('applet:share:*');
  
  return new Response(JSON.stringify({ applets }));
}
```

## 🛠️ 开发工具

### 1. **Import/Export**
- Import: 支持 `.html`, `.htm`, `.app`, `.json`, `.gz` 格式
- Export: 导出为 `.app` 文件（实际是 HTML）

### 2. **Live Preview**
- 在 Applet Viewer 中编辑时实时预览
- 支持 HTML/CSS/JavaScript

### 3. **Share Code**
- 每个 applet 有唯一的 32 字符 hex ID
- 可通过 share code 分享给其他用户

## 🔐 权限控制

### 用户权限
- ✅ 创建自己的 applet
- ✅ 更新自己创建的 applet
- ✅ 删除自己创建的 applet
- ✅ 安装任何公开的 applet
- ❌ 不能修改他人的 applet

### 管理员权限 (`username === "zihan"`)
- ✅ 所有用户权限
- ✅ 标记 applet 为 featured
- ✅ 删除任何 applet
- ✅ 批量更新 applet

## 📊 数据流程

```
┌──────────────┐
│ Create Applet│
└──────┬───────┘
       │
       v
┌──────────────┐
│ Save to      │
│ /Applets/    │ ← IndexedDB
└──────┬───────┘
       │
       v
┌──────────────┐
│ Share to     │
│ Store        │ → POST /api/share-applet
└──────┬───────┘
       │
       v
┌──────────────┐
│ Save to      │
│ Redis        │ ← Upstash Redis (applet:share:*)
└──────┬───────┘
       │
       v
┌──────────────┐
│ Show in      │
│ Store Feed   │ → GET /api/share-applet?list=true
└──────────────┘
```

## 🎓 示例 Applets

### 1. 简单计算器
```html
<!DOCTYPE html>
<html>
<head>
  <title>🧮 Calculator</title>
  <style>
    .calculator { max-width: 300px; margin: 20px auto; }
    button { width: 50px; height: 50px; margin: 5px; }
  </style>
</head>
<body>
  <div class="calculator">
    <input id="display" readonly>
    <div>
      <button onclick="calc('1')">1</button>
      <button onclick="calc('2')">2</button>
      <button onclick="calc('+')">+</button>
      <button onclick="calculate()">=</button>
    </div>
  </div>
  <script>
    let current = '';
    function calc(val) {
      current += val;
      document.getElementById('display').value = current;
    }
    function calculate() {
      try {
        current = eval(current).toString();
        document.getElementById('display').value = current;
      } catch(e) {
        current = 'Error';
      }
    }
  </script>
</body>
</html>
```

### 2. To-Do List
```html
<!DOCTYPE html>
<html>
<head>
  <title>✅ Todo List</title>
  <style>
    .todo-app { padding: 20px; max-width: 400px; margin: 0 auto; }
    .todo-item { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="todo-app">
    <h1>✅ My Tasks</h1>
    <input id="newTodo" placeholder="Add a task...">
    <button onclick="addTodo()">Add</button>
    <div id="todos"></div>
  </div>
  <script>
    let todos = [];
    function addTodo() {
      const input = document.getElementById('newTodo');
      if (input.value.trim()) {
        todos.push(input.value);
        input.value = '';
        render();
      }
    }
    function render() {
      document.getElementById('todos').innerHTML = 
        todos.map((todo, i) => 
          `<div class="todo-item">${todo} <button onclick="remove(${i})">✕</button></div>`
        ).join('');
    }
    function remove(i) {
      todos.splice(i, 1);
      render();
    }
  </script>
</body>
</html>
```

## 🚨 注意事项

1. **安全性**
   - 所有 HTML 内容都在 iframe 中沙箱化运行
   - 不要在 applet 中包含敏感信息
   - API 调用需要认证

2. **性能**
   - Applet 内容存储在 Redis 中
   - 大文件可能影响加载速度
   - 建议 HTML 文件 < 500KB

3. **兼容性**
   - 支持现代浏览器的所有 HTML5 功能
   - 支持 localStorage 和其他 Web APIs
   - 不支持服务端渲染

## 📚 相关文件

- `src/apps/applet-viewer/components/AppStore.tsx` - 主商店界面
- `src/apps/applet-viewer/components/AppStoreFeed.tsx` - Feed 视图
- `src/apps/applet-viewer/utils/appletActions.ts` - Applet 操作逻辑
- `api/share-applet.ts` - API 端点
- `src/apps/applet-viewer/components/AppletViewerAppComponent.tsx` - Viewer 组件

## 🎯 下一步

1. 创建你的第一个 applet
2. 在本地测试
3. 分享到 Store
4. (可选) 请求管理员标记为 featured

---

**Happy Coding! 🚀**





