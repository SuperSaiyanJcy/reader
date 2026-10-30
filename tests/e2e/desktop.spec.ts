import { _electron as electron, test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtemp, writeFile, rm, readFile, copyFile, rename, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
let app:ElectronApplication,page:Page,folder:string,file:string;
const mod=process.platform==='darwin'?'Meta':'Control';
test.describe.configure({mode:'serial'});
test.beforeAll(async()=>{
  folder=await mkdtemp(path.join(os.tmpdir(),'reader-e2e-'));file=path.join(folder,'测试小说.txt');
  await writeFile(file,Array.from({length:35},(_,i)=>`第${i+1}章 山海${i+1}\n\n${'山风穿过松林，河流向远方延伸。这是本地测试正文。'.repeat(80)}\n\n`).join(''),'utf8');
  app=await electron.launch({args:['.'],env:{...process.env,READER_TEST_DATA:path.join(folder,'data')}});page=await app.firstWindow();await page.locator('.word-app').waitFor();
});
test.afterAll(async()=>{await app?.close();await rm(folder,{recursive:true,force:true});});
test('Word 窗口、打开 TXT、字体、导航、自定义规则、续读',async()=>{
  await expect(page).toHaveTitle('文档1 - Word');
  await expect(page.getByLabel('字体',{exact:true})).toHaveValue('宋体');
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},file);
  await page.getByRole('button',{name:'文件',exact:true}).click();
  await page.getByRole('button',{name:/浏览/}).click();
  await expect(page.locator('.paper h2').first()).toContainText('第1章 山海1');
  await page.getByLabel('字号',{exact:true}).selectOption('18');
  await expect(page.locator('.loading-overlay')).toHaveCount(0);
  await expect(page.locator('.paper').first()).toHaveCSS('font-size','24px');
  await page.getByRole('button',{name:'视图',exact:true}).click();
  await page.getByRole('checkbox',{name:'导航窗格',exact:true}).check();
  await expect(page.locator('.nav-summary')).toContainText('35 项');
  const target=page.locator('.toc-item').filter({hasText:'第8章 山海8'});
  await target.click();await expect(page.locator('.toc-item.current')).toContainText('第8章 山海8');
  await page.getByRole('button',{name:'目录选项',exact:true}).click();
  await page.getByLabel('识别方式').selectOption('custom');
  await page.getByLabel('正则表达式').fill('^第[0-9]+章 (?<title>.+)$');
  await expect(page.locator('.preview-heading')).toContainText('35 个标题');
  await page.getByRole('button',{name:'应用',exact:true}).click();
  await expect(page.locator('.toc-item.current')).toContainText('山海8');
  await page.keyboard.press(`${mod}+f`);await page.getByLabel('搜索文档',{exact:true}).fill('山风');
  await expect(page.locator('.nav-summary')).toContainText('找到');
  await expect(page.locator('mark').first()).toHaveText('山风');
  await page.keyboard.press('Escape');
  await expect(page.locator('.navigation')).toHaveCount(0);
  await expect(page.locator('.paper h2').first()).toContainText('项目阶段工作汇报');
  await page.keyboard.press(`${mod}+Shift+r`);
  await expect(page.locator('.navigation')).toBeVisible();
  await page.getByRole('button',{name:'标题',exact:true}).click();
  await page.getByRole('button',{name:'开始',exact:true}).click();
  await page.getByRole('button',{name:'加粗',exact:true}).click();
  await expect(page.locator('.paper').first()).toHaveCSS('font-weight','700');
  await page.getByRole('button',{name:'加粗',exact:true}).click();
  await page.getByLabel('字号',{exact:true}).selectOption('12');await expect(page.locator('.loading-overlay')).toHaveCount(0);
  await page.screenshot({path:path.resolve('test-results/reader-preview.png')});
  await page.keyboard.press(`${mod}+s`);
  await app.close();
  const saved=JSON.parse(await readFile(path.join(folder,'data','reader-state.json'),'utf8'));
  expect(saved.recent[0].offset).toBeGreaterThan(0);expect(saved.recent[0].rule.mode).toBe('custom');
  app=await electron.launch({args:['.'],env:{...process.env,READER_TEST_DATA:path.join(folder,'data')}});page=await app.firstWindow();
  await expect(page.locator('.navigation')).toBeVisible();
  await expect(page.locator('.nav-summary')).toContainText('35 项');
  await expect(page.locator('.reading-percent')).not.toHaveText('0%');
  await page.getByRole('button',{name:'文件',exact:true}).click();
  await page.getByLabel('文字编码').selectOption('utf-8');
  await expect(page.locator('.navigation')).toBeVisible();
  await expect(page.locator('.loading-overlay')).toHaveCount(0);
  await expect(page.locator('.paper h2').first()).toContainText('第');
});
test('文件取消、无效表达式与窗口失焦保护',async()=>{
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});
  await page.keyboard.press(`${mod}+o`);
  await expect(page.locator('.navigation')).toBeVisible();
  await page.getByRole('button',{name:'目录选项',exact:true}).click();
  await page.getByLabel('识别方式').selectOption('custom');
  await page.getByLabel('正则表达式').fill('[');
  await expect(page.getByRole('alert')).toContainText('正则表达式无效');
  await expect(page.getByRole('button',{name:'应用',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'取消',exact:true}).click();
  await page.getByRole('button',{name:'视图',exact:true}).click();
  await page.getByRole('checkbox',{name:'切换窗口时显示工作文档',exact:true}).check();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await expect(page.locator('.paper h2').first()).toContainText('项目阶段工作汇报');
});
test('复杂正则超时后界面仍可使用',async()=>{
  const slowFile=path.join(folder,'正则测试.txt');await writeFile(slowFile,'第一章 测试\n'+ 'a'.repeat(44)+'!','utf8');
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},slowFile);
  await page.getByRole('checkbox',{name:'切换窗口时显示工作文档',exact:true}).uncheck();
  await page.keyboard.press(`${mod}+o`);
  await expect(page.locator('.paper h2').first()).toContainText('第一章 测试');
  await page.getByRole('button',{name:'目录选项',exact:true}).click();
  await page.getByLabel('识别方式').selectOption('custom');
  await page.getByLabel('正则表达式').fill('^(a+)+$');
  await expect(page.locator('.error-message')).toContainText('正则匹配超时',{timeout:8000});
  await page.getByRole('button',{name:'取消',exact:true}).click();
  await expect(page.locator('.navigation')).toBeVisible();
});

// 用逐字的原文偏移识别屏内文字行，验证保留的是同一段原文，而不只是滚动像素。
async function visibleTextLines() {
  return page.locator('.document-scroll').evaluate(viewport => {
    const bounds=viewport.getBoundingClientRect();
    const lines:{top:number;bottom:number;start:number}[]=[];
    for(const block of viewport.querySelectorAll<HTMLElement>('[data-offset]')){
      const rect=block.getBoundingClientRect();if(rect.bottom<bounds.top||rect.top>bounds.bottom)continue;
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
      let node:Node|null,offset=Number(block.dataset.offset);
      while((node=walker.nextNode())){
        const text=node.textContent??'';const range=document.createRange();
        for(let i=0;i<text.length;i++){
          range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
          if(r.width<=0||r.top<bounds.top||r.bottom>bounds.top+viewport.clientHeight)continue;
          const last=lines[lines.length-1];
          if(last&&Math.abs(last.top-r.top)<1)last.bottom=Math.max(last.bottom,r.bottom);
          else lines.push({top:r.top,bottom:r.bottom,start:offset+i});
        }
        offset+=text.length;
      }
    }
    return lines.map(line=>line.start);
  });
}
test('左侧导航开关、四个方向键与两行原文重叠',async()=>{
  const flipFile=path.join(folder,'翻页测试.txt');
  await writeFile(flipFile,Array.from({length:200},(_,i)=>`段落${i+1}：${'春风吹过窗边的树梢，细雨落在远处的河面。'.repeat(12)}`).join('\n\n'),'utf8');
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},flipFile);
  await page.keyboard.press(`${mod}+o`);await expect(page.locator('.loading-overlay')).toHaveCount(0);
  const navigation=page.getByRole('button',{name:'导航',exact:true});
  await expect(navigation).toHaveAttribute('aria-expanded','true');
  await navigation.click();await expect(page.locator('.navigation')).toHaveCount(0);
  await expect(navigation).toHaveAttribute('aria-expanded','false');
  await navigation.click();await expect(page.locator('.navigation')).toBeVisible();
  await page.getByRole('button',{name:'开始',exact:true}).click();
  const viewport=page.locator('.document-scroll');
  for(const [size,lineHeight,zoom] of [['12','1.8','100'],['18','2','130']]){
    await page.getByLabel('字号',{exact:true}).selectOption(size);
    await page.getByLabel('行距',{exact:true}).selectOption(lineHeight);
    await page.getByLabel('显示比例',{exact:true}).fill(zoom);
    await expect(page.locator('.loading-overlay')).toHaveCount(0);
    await viewport.focus();
    await viewport.evaluate(async element=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);element.scrollTop=2000;});
    await expect.poll(()=>viewport.evaluate(e=>e.scrollTop)).toBe(2000);
    for(const [next,previous] of [['ArrowRight','ArrowLeft'],['ArrowDown','ArrowUp']]){
      await expect.poll(async()=>(await visibleTextLines()).length).toBeGreaterThan(3);
      const before=await visibleTextLines();
      await page.keyboard.press(next);
      await expect.poll(async()=>(await visibleTextLines()).slice(0,2)).toEqual(before.slice(-2));
      const after=await visibleTextLines();
      await page.keyboard.press(previous);
      await expect.poll(async()=>(await visibleTextLines()).slice(-2)).toEqual(after.slice(0,2));
    }
  }
  await page.getByRole('button',{name:'查找',exact:true}).click();
  await page.getByLabel('搜索文档',{exact:true}).fill('春风');
  const before=await viewport.evaluate(e=>e.scrollTop);
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');
  expect(await viewport.evaluate(e=>e.scrollTop)).toBe(before);
});
test('TTF 导入、去重、重启恢复、移除与无效字体',async()=>{
  const source=process.platform==='darwin'?'/System/Library/Fonts/Supplemental/Arial.ttf':path.join(process.env.WINDIR??'C:\\Windows','Fonts','arial.ttf');
  const imported=path.join(folder,'我的字体.ttf');await copyFile(source,imported);
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},imported);
  await page.getByLabel('字体',{exact:true}).selectOption('__import__');
  const fontSelect=page.getByLabel('字体',{exact:true});
  await expect(fontSelect).toHaveValue(/^ReaderFont_/);
  const family=await fontSelect.inputValue();
  await expect(page.locator('.paper').first()).toHaveCSS('font-family',new RegExp(family));
  expect(await page.evaluate(f=>[...document.fonts].some(font=>font.family===f&&font.status==='loaded'),family)).toBe(true);
  await fontSelect.selectOption('__import__');
  await expect(fontSelect.locator('optgroup[label="自定义字体"] option')).toHaveCount(1);
  await rename(imported,path.join(folder,'移动后的字体.ttf'));
  await app.close();
  app=await electron.launch({args:['.'],env:{...process.env,READER_TEST_DATA:path.join(folder,'data')}});page=await app.firstWindow();
  await expect(page.getByLabel('字体',{exact:true})).toHaveValue(family);
  await expect(page.locator('.paper').first()).toHaveCSS('font-family',new RegExp(family));
  expect(await page.evaluate(f=>[...document.fonts].some(font=>font.family===f&&font.status==='loaded'),family)).toBe(true);
  await page.getByRole('button',{name:'文件',exact:true}).click();
  await page.getByRole('button',{name:'移除字体 我的字体',exact:true}).click();
  await expect(page.locator('.custom-font-item')).toHaveCount(0);
  await page.getByRole('button',{name:'返回文档',exact:true}).click();
  await expect(page.getByLabel('字体',{exact:true})).toHaveValue('宋体');
  expect((await stat(path.join(folder,'移动后的字体.ttf'))).size).toBeGreaterThan(0);
  const bad=path.join(folder,'损坏字体.ttf');await writeFile(bad,'not a valid ttf font');
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},bad);
  await page.getByLabel('字体',{exact:true}).selectOption('__import__');
  await expect(page.getByRole('alert')).toContainText('有效的 TrueType');
  await expect(page.getByLabel('字体',{exact:true})).toHaveValue('宋体');
  const saved=JSON.parse(await readFile(path.join(folder,'data','reader-state.json'),'utf8'));expect(saved.fonts).toHaveLength(0);
});
test('连续正文不补齐页尾，章节和卷标题在分块边界也紧接前文',async()=>{
  const continuous=path.join(folder,'连续排版.txt');
  await writeFile(continuous,Array.from({length:80},(_,i)=>`第${i+1}卷 山海\n第${i+1}章 雨后\n${'风从河面吹来。'.repeat(5)}\n${'人们沿着石阶走进旧街。'.repeat(3)}`).join('\n\n'),'utf8');
  await app.evaluate(({dialog},filePath)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});},continuous);
  await page.keyboard.press(`${mod}+o`);await expect(page.locator('.loading-overlay')).toHaveCount(0);
  await page.getByLabel('字号',{exact:true}).selectOption('12');
  await page.getByLabel('行距',{exact:true}).selectOption('1.8');
  await page.getByLabel('显示比例',{exact:true}).fill('100');
  await expect(page.locator('.loading-overlay')).toHaveCount(0);
  await expect.poll(()=>page.locator('.paper').count()).toBeGreaterThan(2);
  const measure=()=>page.locator('.document-scroll').evaluate(viewport=>{
    const papers=[...viewport.querySelectorAll<HTMLElement>('.paper')];
    const seamGaps=papers.slice(1).map((paper,index)=>paper.getBoundingClientRect().top-papers[index].getBoundingClientRect().bottom);
    const bottomGaps=papers.filter(paper=>!paper.classList.contains('paper-last')).map(paper=>{
      const blocks=paper.querySelectorAll<HTMLElement>('[data-offset]');
      return paper.getBoundingClientRect().bottom-blocks[blocks.length-1].getBoundingClientRect().bottom;
    });
    const blocks=[...viewport.querySelectorAll<HTMLElement>('[data-offset]')];
    const headingGaps=blocks.slice(1).flatMap((block,index)=>block.tagName==='H2'?[block.getBoundingClientRect().top-blocks[index].getBoundingClientRect().bottom]:[]);
    return {seamGaps,bottomGaps,headingGaps};
  });
  await expect.poll(async()=>Math.max(...(await measure()).seamGaps.map(Math.abs))).toBeLessThan(1.5);
  const result=await measure();
  expect(Math.max(...result.bottomGaps)).toBeLessThan(30);
  expect(Math.max(...result.headingGaps)).toBeLessThan(30);
  // 经由实际导航定位最后分块，避免直接改 scrollTop 与异步虚拟列表定位相互覆盖。
  await page.getByRole('button',{name:'页面',exact:true}).click();
  await page.locator('.page-thumbnails button').last().click();
  await expect(page.locator('.paper-last')).toBeVisible();
  const tail=await page.locator('.paper-last').evaluate(paper=>{
    const blocks=paper.querySelectorAll<HTMLElement>('[data-offset]');
    return paper.getBoundingClientRect().bottom-blocks[blocks.length-1].getBoundingClientRect().bottom;
  });
  expect(tail).toBeLessThan(55);
});
