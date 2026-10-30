import { _electron as electron } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const data = await mkdtemp(path.join(os.tmpdir(), 'reader-packaged-'));
const executablePath = process.platform === 'darwin'
  ? path.resolve('release/mac-arm64/Reader.app/Contents/MacOS/Reader')
  : path.resolve('release/win-unpacked/Reader.exe');
let app;
try {
  app = await electron.launch({ executablePath, env: { ...process.env, READER_TEST_DATA: data } });
  const page = await app.firstWindow();
  await page.locator('.word-app').waitFor();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: '文件', exact: true }).click();
  await page.getByRole('button', { name: '打开示例文档', exact: true }).click();
  await page.locator('.loading-overlay').waitFor({ state: 'hidden' });
  const navigation = page.getByRole('button', { name: '导航', exact: true });
  await navigation.click();
  await page.locator('.navigation').waitFor();
  await navigation.click();
  await page.locator('.navigation').waitFor({ state: 'hidden' });
  await navigation.click();
  await page.locator('.nav-summary').waitFor();
  if (process.env.READER_SCREENSHOT_PATH) await page.screenshot({ path: process.env.READER_SCREENSHOT_PATH });
  const result = { title: await page.title(), chapters: await page.locator('.nav-summary').textContent(), text: await page.locator('.paper').first().innerText(), errors };
  console.log(JSON.stringify({ ...result, text: result.text.slice(0, 70) }, null, 2));
  if (!result.chapters?.includes('6 项') || errors.length) throw new Error('打包应用检查失败');
} finally { await app?.close(); await rm(data, { recursive: true, force: true }); }
