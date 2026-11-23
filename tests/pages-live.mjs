import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const site = 'https://liamjake102291-create.github.io/roadster-2-flight/';
const browser = await chromium.launch({
  args: ['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const desktop = await browser.newContext({ viewport:{width:1280,height:720}, deviceScaleFactor:1 });
  const page = await desktop.newPage();
  const responses = [];
  page.on('pageerror', error => { errors.push(error.message); console.log('DESKTOP ERROR:',error.stack); });
  page.on('console', m => { if (m.type()==='error') { errors.push(m.text()); console.log('CONSOLE ERROR:',m.text()); } });
  page.on('response', response => { const entry=[response.url().split('/').at(-1),response.status()]; responses.push(entry); console.log('Response',...entry); });
  page.on('requestfailed', request => console.log('Request failed:',request.url(),request.failure()));
  await page.goto(site, {waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('canvas').waitFor({timeout:45000});
  try {
    await page.waitForFunction(() => !document.querySelector('.scene-loading') && !document.querySelector('.scene-fallback'), undefined, {timeout:26000});
  } catch (error) {
    console.log('Rendered page:', (await page.locator('body').innerText()).slice(0,1200));
    throw error;
  }
  assert.ok(responses.some(([path,status])=>path==='roadster.glb.gz' && status===200));
  assert.ok(!responses.some(([path])=>path==='roadster.glb'));
  assert.equal(await page.locator('video').count(),0);
  await page.getByRole('button',{name:'暂停',exact:true}).waitFor({timeout:8000});
  await page.getByRole('button',{name:'起飞',exact:true}).click();
  await page.getByRole('button',{name:'播放',exact:true}).click();
  const measurement = await page.evaluate(() => new Promise((resolve,reject) => {
    const seen = [];
    const frames = [];
    const start = performance.now();
    let previous = start;
    function sample(now) {
      const value = document.querySelector('.chapter-status span')?.textContent?.trim().slice(0,2);
      if (value && seen.at(-1)!==value) seen.push(value);
      frames.push(now-previous);
      previous=now;
      if (Number(document.querySelector('input[type=range]').value)===1000) {
        frames.sort((a,b)=>a-b);
        resolve({seen,seconds:(now-start)/1000,p50Ms:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],frames:frames.length});
      } else if (now-start>125000) {
        reject(new Error('Flight timed out; observed stages: '+seen));
      } else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.deepEqual(measurement.seen,['04','05','06','07','08']);
  await page.getByRole('button',{name:'检视',exact:true}).click();
  await page.getByRole('button',{name:/Structural battery/}).click();
  assert.equal(await page.locator('.detail-panel h3').textContent(),'结构电池包');
  console.log('Public desktop timing (software WebGL):',JSON.stringify(measurement));
  await desktop.close();

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  mobile.on('pageerror', error => errors.push(error.message));
  mobile.on('console', m => { if (m.type()==='error') { errors.push(m.text()); console.log('CONSOLE ERROR:',m.text()); } });
  await mobile.goto(site,{waitUntil:'domcontentloaded',timeout:25000});
  await mobile.waitForFunction(() => !!document.querySelector('canvas') && !document.querySelector('.scene-loading') && !document.querySelector('.scene-fallback'), undefined, {timeout:35000});
  await mobile.getByRole('button',{name:'检视',exact:true}).click();
  await mobile.getByLabel('当前总成').selectOption('chassis');
  assert.equal(await mobile.locator('.detail-panel h3').textContent(),'碳纤维底盘');
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  assert.deepEqual(errors,[]);
  console.log('Public mobile and desktop WebGL and controls passed.');
} finally {
  await browser.close();
}
