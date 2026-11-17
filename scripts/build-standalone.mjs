/**
 * 把 dist 的 JS/CSS 内联成一个 standalone.html：双击即可打开，也可以直接发给同学，
 * 不需要 Node、不需要服务器、不需要联网。运行：npm run standalone
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = 'dist';
let html = await readFile(join(dist, 'index.html'), 'utf8');
const assets = await readdir(join(dist, 'assets'));
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('找不到构建产物，请先执行 npm run build');

const js = (await readFile(join(dist, 'assets', jsFile), 'utf8')).replace(/<\/script/gi, '<\\/script');
const css = (await readFile(join(dist, 'assets', cssFile), 'utf8')).replace(/<\/style/gi, '<\\/style');

// 必须用函数式替换：bundle 里可能含 $& / $' 等字符，字符串形式会被当成替换模式解析
html = html.replace(/<script[^>]*src="[^"]+\.js"[^>]*><\/script>/, () => `<script type="module">\n${js}\n</script>`);
html = html.replace(/<link[^>]*href="[^"]+\.css"[^>]*>/, () => `<style>\n${css}\n</style>`);
// 只检查标签属性；内联 JS 自身可能包含相对路径字符串，不能简单 includes
if (/<script[^>]*src="\.\/assets\//.test(html) || /<link[^>]*href="\.\/assets\//.test(html)) {
  throw new Error('仍有未内联的资源引用，请检查 index.html');
}

await writeFile(join(dist, 'standalone.html'), html);
console.log(`已生成 dist/standalone.html（${Math.round(Buffer.byteLength(html) / 1024)} KB），可直接双击打开或分享`);
