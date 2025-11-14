#!/usr/bin/env node
/**
 * Applet 上传脚本
 * 使用方法: node upload-applet.js <html-file-path> [options]
 * 
 * 示例:
 *   node upload-applet.js my-applet.html
 *   node upload-applet.js my-applet.html --title "My App" --icon "🎨" --name "My Applet"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置信息
const CONFIG = {
  username: 'zihan',
  authToken: 'f6f025d3d5d30a9fc3ecd803cad91f0e1864590cd645ff0efc314f25c783f35e',
  apiUrl: 'https://os.bravohenry.com/api/share-applet',
  // 如果本地开发，可以使用: 'http://localhost:3000/api/share-applet'
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    title: null,
    icon: null,
    name: null,
    windowWidth: null,
    windowHeight: null,
    shareId: null, // 用于更新现有 applet
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--title':
        options.title = args[++i];
        break;
      case '--icon':
        options.icon = args[++i];
        break;
      case '--name':
        options.name = args[++i];
        break;
      case '--width':
        options.windowWidth = parseInt(args[++i], 10);
        break;
      case '--height':
        options.windowHeight = parseInt(args[++i], 10);
        break;
      case '--share-id':
        options.shareId = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
使用方法: node upload-applet.js <html-file-path> [options]

参数:
  <html-file-path>    要上传的 HTML 文件路径（必需）

选项:
  --title <title>      Applet 标题
  --icon <icon>        Applet 图标（emoji 或 URL）
  --name <name>        Applet 名称
  --width <width>      窗口宽度（像素）
  --height <height>    窗口高度（像素）
  --share-id <id>      更新现有 applet 的 ID

示例:
  node upload-applet.js my-applet.html
  node upload-applet.js my-applet.html --title "My App" --icon "🎨" --name "My Applet"
  node upload-applet.js my-applet.html --share-id abc123... --title "Updated Title"
        `);
        process.exit(0);
        break;
      default:
        if (!options.file && !arg.startsWith('--')) {
          options.file = arg;
        }
        break;
    }
  }

  return options;
}

// 从 HTML 文件中提取标题和图标
function extractMetadata(htmlContent) {
  const metadata = {
    title: null,
    icon: null,
  };

  // 提取 <title> 标签
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // 提取 favicon 或图标
  const iconMatch = htmlContent.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
  if (iconMatch) {
    metadata.icon = iconMatch[1];
  }

  // 尝试从 body 中提取第一个 emoji 作为图标
  if (!metadata.icon) {
    const emojiMatch = htmlContent.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
    if (emojiMatch) {
      metadata.icon = emojiMatch[0];
    }
  }

  return metadata;
}

// 上传 applet
async function uploadApplet(options) {
  try {
    // 读取 HTML 文件
    if (!options.file) {
      console.error('❌ 错误: 请指定要上传的 HTML 文件路径');
      console.log('使用 --help 查看帮助信息');
      process.exit(1);
    }

    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 错误: 文件不存在: ${filePath}`);
      process.exit(1);
    }

    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`📄 读取文件: ${filePath} (${htmlContent.length} 字符)`);

    // 提取元数据
    const extracted = extractMetadata(htmlContent);
    console.log('📋 提取的元数据:', extracted);

    // 构建请求体
    const body = {
      content: htmlContent,
      title: options.title || extracted.title || undefined,
      icon: options.icon || extracted.icon || undefined,
      name: options.name || undefined,
      windowWidth: options.windowWidth || undefined,
      windowHeight: options.windowHeight || undefined,
      shareId: options.shareId || undefined,
    };

    // 移除 undefined 值
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    console.log('\n🚀 正在上传 applet...');
    console.log('请求体:', JSON.stringify(body, null, 2).replace(body.content, `[HTML内容: ${body.content.length} 字符]`));

    // 发送请求
    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.authToken}`,
        'X-Username': CONFIG.username,
        'Origin': 'https://os.bravohenry.com', // 添加 Origin header 以通过 CORS 验证
      },
      body: JSON.stringify(body),
    });

    let responseData;
    const responseText = await response.text();
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // 如果不是 JSON，可能是纯文本错误
      console.error('❌ 上传失败:');
      console.error('状态码:', response.status);
      console.error('响应内容:', responseText);
      if (response.status === 401) {
        console.error('\n💡 提示: 认证失败，请检查:');
        console.error('  1. 认证 token 是否有效');
        console.error('  2. 用户名是否正确');
        console.error('  3. 是否已登录');
      }
      process.exit(1);
    }

    if (!response.ok) {
      console.error('❌ 上传失败:');
      console.error('状态码:', response.status);
      console.error('错误信息:', responseData);
      if (response.status === 401) {
        console.error('\n💡 提示: 认证失败，请检查:');
        console.error('  1. 认证 token 是否有效');
        console.error('  2. 用户名是否正确');
        console.error('  3. 是否已登录');
      }
      process.exit(1);
    }

    console.log('\n✅ 上传成功！');
    console.log('='.repeat(50));
    console.log('Applet ID:', responseData.id);
    console.log('分享链接:', responseData.shareUrl);
    console.log('是否更新:', responseData.updated ? '是' : '否');
    console.log('创建时间:', new Date(responseData.createdAt).toLocaleString('zh-CN'));
    console.log('='.repeat(50));

    return responseData;
  } catch (error) {
    console.error('❌ 发生错误:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 主函数
async function main() {
  const options = parseArgs();
  await uploadApplet(options);
}

// 运行
main();

export { uploadApplet, CONFIG };

