import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const url='https://liamjake102291-create.github.io/roadster-2-flight/';
const expected=process.env.EXPECTED_ASSET;
const deadline=Date.now()+115000;
while (!(await (await fetch(url+'?verify='+Date.now())).text()).includes(expected)) {
  if (Date.now()>deadline) throw Error('Pages has not published the new build');
  await new Promise(resolve=>setTimeout(resolve,2500));
}

const browser=await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:960,height:540},reducedMotion:'reduce'});
  const errors=[], requests=[];
  page.on('pageerror',error=>{errors.push(error.message);console.log(error.stack);});
  page.on('response',response=>requests.push([response.url(),response.status()]));
  let release;
  const held=new Promise(resolve=>{release=resolve;});
  await page.route('**/models/roadster-performance.glb.gz', async route=>{await held; await route.continue();});
  const started=Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  const poster=page.locator('#flight-opening-placeholder img');
  await poster.waitFor();
  await page.waitForFunction(()=>document.querySelector('#flight-opening-placeholder img')?.naturalWidth>0);
  console.log('Visible first frame with model transfer blocked:',Date.now()-started,'ms');
  release();
  await page.locator('#flight-opening-placeholder').waitFor({state:'detached',timeout:45000});
  console.log('Interactive scene ready:',Date.now()-started,'ms');
  assert.ok(requests.some(([address,status])=>address.endsWith('roadster-performance.glb.gz')&&status===200));
  assert.ok(!requests.some(([address])=>/models\/roadster\.glb(\.gz)?$/.test(address)));
  assert.ok(requests.some(([address,status])=>address.endsWith(expected+'.gz')&&status===200));
  await page.getByRole('button',{name:'飞跃',exact:true}).click();
  await page.getByRole('heading',{name:/360° 横滚/}).waitFor();
  await page.screenshot({path:'lineup.png',timeout:20000});
  await page.getByRole('button',{name:'播放',exact:true}).click();
  const stages=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const seen=[];
    const started=performance.now();
    function tick(now) {
      const id=document.querySelector('.chapter-status span')?.textContent?.slice(0,2);
      if(id&&seen.at(-1)!==id)seen.push(id);
      if(Number(document.querySelector('input[type=range]').value)===1000) return resolve(seen);
      if(now-started>240000)return reject(Error('Timed out at '+seen));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }));
  assert.deepEqual(stages,['02','03','04','05','06','07','08']);
  await page.getByRole('button',{name:'爬坡',exact:true}).click();
  await page.getByRole('heading',{name:'坡顶停驻'}).waitFor();
  await page.screenshot({path:'ramp.png',timeout:20000});
  await page.getByRole('button',{name:'检视',exact:true}).click();
  assert.equal(await page.locator('.assembly-options button').count(),27);
  await page.getByRole('button',{name:/Structural battery/}).click();
  assert.equal(await page.locator('.detail-panel h3').textContent(),'结构电池包');
  assert.deepEqual(errors,[]);
  console.log('Complete play order:',stages.join(' > '),'and 27 selectable assemblies.');
} finally { await browser.close(); }
