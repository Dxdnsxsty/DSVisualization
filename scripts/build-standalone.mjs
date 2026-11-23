/** 独立构建单文件版：把所有懒加载页面合并，保持 file:// 离线可用。 */
import { mkdir, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const result = await build({
  mode: 'standalone',
  build: {
    write: false,
    modulePreload: false,
    // 单文件分发有意合并全部代码；网站构建仍保留按页面拆包。
    chunkSizeWarningLimit: 1024,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
if (Array.isArray(result) || !('output' in result)) throw new Error('单文件构建产物格式不正确');
const outputs = new Map(result.output.map((item) => [item.fileName, item]));
const index = outputs.get('index.html');
if (index?.type !== 'asset') throw new Error('找不到构建产物 index.html');
const sourceText = (source) => typeof source === 'string' ? source : Buffer.from(source).toString('utf8');
let html = sourceText(index.source);
const chunks = result.output.filter((item) => item.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('单文件版仍包含外部 JavaScript 模块');
}

// 按 HTML 的真实引用定位资源，不依赖目录顺序；函数替换保留代码内的 $& 等字面量。
html = html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (_, href) => {
  const item = outputs.get(href.replace(/^\.\//, ''));
  if (item?.type !== 'chunk') throw new Error(`找不到 JavaScript 资源：${href}`);
  return `<script type="module">\n${item.code.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});
html = html.replace(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/g, (_, href) => {
  const item = outputs.get(href.replace(/^\.\//, ''));
  if (item?.type !== 'asset') throw new Error(`找不到 CSS 资源：${href}`);
  return `<style>\n${sourceText(item.source).replace(/<\/style/gi, '<\\/style')}\n</style>`;
});
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\bhref=/i.test(html)) {
  throw new Error('单文件版仍有未内联的资源引用');
}
await mkdir('dist', { recursive: true });
await writeFile('dist/standalone.html', html);
console.log(`已生成 dist/standalone.html（${Math.round(Buffer.byteLength(html) / 1024)} KB），可直接双击打开或分享`);
