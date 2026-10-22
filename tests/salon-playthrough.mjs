import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designCustomer} from './design-customer.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:5184/',clients=(process.env.CLIENTS||'lin,qiao,wen,zhou,xia,su,tang,lu').split(','),errors=[],checks=[];
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));
async function point(i,u=.5,v=.5){return page.evaluate(({i,u,v})=>nailSalon.project(i,u,v),{i,u,v});}
async function clickNail(i,u=.5,v=.5){const p=await point(i,u,v);await page.mouse.click(p.x,p.y);}
async function brushNail(i,step){
 const coords=step==='file'?Array.from({length:18},(_,k)=>[k%2?.7:.3,.8]):Array.from({length:15},(_,k)=>[.2+((Math.floor(k/3)%2?2-k%3:k%3))*.3,.12+Math.floor(k/3)*.18]);
 let p=await point(i,...coords[0]);await page.mouse.move(p.x,p.y);await page.mouse.down();for(const uv of coords){p=await point(i,...uv);await page.mouse.move(p.x,p.y,{steps:2});}await page.mouse.up();
}
try{
 const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.locator('#open-book').click();
 for(const id of clients){
  if(!(await page.locator('[data-client="'+id+'"]').isVisible()))await page.locator('#home').click();
  await page.locator('[data-client="'+id+'"]').click();await page.locator('#accept-client').click();await designCustomer(page,id);await page.locator('#confirm-plan').click();
  let guard=0;
  while((await state()).mode==='work'&&guard++<30){
   const s=await state(),step=s.step;console.log(id,step);
   if(step==='finish'){await page.locator('#deliver').click();break;}
   if(step.startsWith('cure')){
    for(const hand of [...new Set(s.targets.map(i=>Math.floor(i/5)))]){await page.locator('[data-lamp="'+hand+'"]').click();if(id==='lin'&&step==='cureBase'&&hand===0){await page.locator('#interrupt-lamp').click();assert.equal((await state()).progress[0].done.includes(step),false);await page.locator('[data-lamp="0"]').click();checks.push('interrupted curing is not marked complete');}
     if(id==='qiao'&&step==='cureBase'&&hand===0)await page.screenshot({path:'artifacts/v2-lamp.png'});
     await page.locator('#speed-lamp').click();await page.locator('#lamp-overlay').waitFor({state:'hidden'});
    }
   }else{
    for(const hand of [...new Set(s.targets.map(i=>Math.floor(i/5)))]){
     const fresh=await state(),candidates=fresh.targets.filter(i=>Math.floor(i/5)===hand&&!fresh.progress[i].done.includes(step));if(!candidates.length)continue;
     const i=candidates[0];await page.locator('[data-finger="'+i+'"]').click();
     if(step==='fit'){await page.locator('#suggest-tip').click();await clickNail(i);}
     else if(step==='inspect'){await clickNail(i);}
     else if(step==='magnet'){await clickNail(i,.46,.5);await page.locator('#confirm-magnet').click();}
     else if(step==='decor'){const ds=await page.evaluate(i=>nailSalon.session.plan.nails[i].decorations,i);for(const d of ds.filter(a=>!a.hidden))await clickNail(i,d.u,d.v);}
     else await brushNail(i,step);
     let current=await state();if(!current.progress[i].done.includes(step)){
      console.log('RETRY',id,step,i,current.progress[i]);await brushNail(i,step);current=await state();
     }
     assert.ok(current.progress[i].done.includes(step),id+' '+step+' manual action completed on '+i);
     if(id==='lin'&&step==='clean'&&hand===0){assert.equal(await page.evaluate(()=>nailSalon.sound.contactSource),null);checks.push('contact audio stops on release');await page.reload({waitUntil:'networkidle'});await page.locator('#resume').click();assert.ok((await state()).progress[i].done.includes(step));checks.push('service resumes with per-finger progress');}
     if(id==='lin'&&step==='build'&&hand===0){await page.locator('#check-side').click();await page.screenshot({path:'artifacts/v2-build-side.png'});}
     if(id==='wen'&&step==='magnet'&&hand===0)await page.screenshot({path:'artifacts/v2-cat-eye.png'});
     await page.locator('#assist-hand').click();
    }
   }
   await page.locator('#next-stage').click();
  }
  assert.equal((await state()).mode,'result',id+' delivered');await page.locator('#save-result').click();checks.push(id+' full order completed and collected');await page.screenshot({path:'artifacts/v2-result-'+id+'.png'});
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#photo-result').click()]);assert.ok(download.suggestedFilename().endsWith('.png'));checks.push(id+' photo export');
 }
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('artifacts/salon-test-report.json',JSON.stringify({url,checks,errors,date:new Date().toISOString()},null,2));console.log('PASS',checks.length,checks);
}catch(e){await page.screenshot({path:'artifacts/v2-failure.png'});console.error(await state());throw e;}finally{await browser.close();}
