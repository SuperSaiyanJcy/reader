import { spawn } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const vite = spawn(npm, ['run', 'dev:web'], { stdio: 'inherit', shell: process.platform === 'win32' });
let electron;
const stop = () => { vite.kill(); electron?.kill(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
for (let i = 0; i < 100; i++) {
  try { if ((await fetch('http://127.0.0.1:5173')).ok) break; } catch {}
  await new Promise(resolve => setTimeout(resolve, 100));
}
electron = spawn(npm, ['exec', '--', 'electron', '.'], { stdio: 'inherit', env: { ...process.env, READER_DEV_URL: 'http://127.0.0.1:5173' }, shell: process.platform === 'win32' });
electron.on('exit', code => { stop(); process.exit(code ?? 0); });
