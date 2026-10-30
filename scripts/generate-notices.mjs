import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 从锁文件读取生产依赖，保留其许可证正文；输出不包含本机路径或时间戳。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
const parts = [
  'Reader - Third-party notices',
  'Original Reader source code is licensed under the MIT License.',
  'The following production dependencies retain their own licenses.',
  'Electron and Chromium license notices are also included with the Electron runtime.',
  '',
];
for (const [relative, metadata] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!relative.startsWith('node_modules/') || metadata.dev) continue;
  const directory = path.join(root, relative);
  const pkg = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
  const files = (await fs.readdir(directory)).filter(name => /^(licen[cs]e|copying)(\.|$)/i.test(name));
  if (!files.length) throw new Error(`Missing license text for ${pkg.name}`);
  parts.push('='.repeat(72), `${pkg.name} ${pkg.version} (${pkg.license ?? metadata.license ?? 'see below'})`, '');
  for (const name of files.sort()) parts.push(await fs.readFile(path.join(directory, name), 'utf8'), '');
}
await fs.writeFile(path.join(root, 'resources', 'THIRD_PARTY_NOTICES.txt'), parts.join('\n').trimEnd() + '\n');
