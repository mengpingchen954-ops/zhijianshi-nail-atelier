import {consultCustomer} from './consult-customer.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createSession,targetDesign,customer,beginWork,stepsFor,SESSION_KEY} from '../src/service.js';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const playing=()=>page.waitForFunction(()=>{const s=nailSalon.sound;return s.musicElement&&!s.musicElement.paused&&s.musicElement.readyState>=3;});
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5185/',{waitUntil:'networkidle'});
 assert.ok(await page.locator('.music-dock').isVisible());assert.equal(await page.locator('#dock-track option').count(),6);assert.equal(await page.locator('#dock-status').innerText(),'点击播放');
 // The first song switch must also unlock audio without opening a modal.
 await page.locator('#dock-next').click();await playing();assert.equal(await page.locator('#dock-track').inputValue(),'1');assert.equal(await page.locator('#dock-toggle').getAttribute('aria-label'),'暂停伴奏');assert.ok(!(await page.locator('#salon-dialog').evaluate(el=>el.open)));
 await page.locator('#dock-prev').click();await playing();assert.equal(await page.locator('#dock-track').inputValue(),'0');
 await page.locator('#dock-prev').click();await playing();assert.equal(await page.locator('#dock-track').inputValue(),'5');
 await page.locator('#dock-track').selectOption('2');await playing();assert.ok(await page.evaluate(()=>nailSalon.sound.musicElement.currentSrc.endsWith('track-3.mp3')));
 await page.locator('#dock-toggle').click();assert.equal(await page.locator('#dock-toggle').getAttribute('aria-label'),'播放伴奏');assert.ok(await page.evaluate(()=>nailSalon.sound.musicElement.paused));
 await page.locator('#dock-next').click();assert.ok(await page.evaluate(()=>nailSalon.sound.musicElement.paused&&!nailSalon.sound.musicPlaying));
 await page.locator('#dock-volume').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#dock-volume-value').innerText(),'0%');await page.keyboard.press('End');assert.equal(await page.locator('#dock-volume-value').innerText(),'100%');
 await page.locator('#dock-volume').evaluate(el=>{el.value='.24';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#settings').click();assert.equal(await page.locator('#music-track').inputValue(),'3');assert.equal(await page.locator('[data-volume="music"]').inputValue(),'0.24');
 await page.locator('#music-track').selectOption('4');assert.equal(await page.locator('#dock-track').inputValue(),'4');await page.locator('.close-modal').click();
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#dock-track').inputValue(),'4');assert.equal(await page.locator('#dock-volume-value').innerText(),'24%');await page.locator('#dock-toggle').click();await playing();
 await page.locator('#open-book').click();await page.locator('[data-client="xia"]').click();await page.locator('#accept-client').click();await consultCustomer(page);
 const before=await page.evaluate(()=>JSON.stringify(nailSalon.session.plan));await page.locator('#dock-next').click();await playing();assert.equal(await page.evaluate(()=>JSON.stringify(nailSalon.session.plan)),before);
 await page.screenshot({path:'artifacts/music-dock-desktop.png'});
 for(const width of [1024,390,320]){
  await page.setViewportSize({width,height:width===320?640:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  for(const id of ['dock-track','dock-prev','dock-next','dock-toggle','dock-volume']){const box=await page.locator('#'+id).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<200);}
  const panel=await page.locator('#salon-panel').boundingBox();assert.ok(panel.y+panel.height<= (width===320?640:844)+1);
  await page.locator('#dock-next').click();await playing();assert.equal(await page.locator('#dock-track').inputValue(),String(await page.evaluate(()=>nailSalon.sound.track)));
  if(width===390)await page.screenshot({path:'artifacts/music-dock-mobile.png'});
 }
 const session=createSession('lin');session.plan=targetDesign(customer('lin'));beginWork(session);session.step=stepsFor(customer('lin')).indexOf('file');
 const workPage=await browser.newPage({viewport:{width:1440,height:1000}});workPage.on('pageerror',e=>errors.push(e.message));
 await workPage.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:SESSION_KEY,session});await workPage.goto(process.env.GAME_URL||'http://127.0.0.1:5185/',{waitUntil:'networkidle'});await workPage.locator('#resume').click();
 assert.equal(await workPage.evaluate(()=>nailSalon.session.phase),'work');assert.ok(await workPage.locator('.music-dock').isVisible());const work=await workPage.evaluate(()=>JSON.stringify(nailSalon.session.work));await workPage.locator('#dock-next').click();await workPage.waitForFunction(()=>nailSalon.sound.musicElement&&!nailSalon.sound.musicElement.paused&&nailSalon.sound.musicElement.readyState>=3);assert.equal(await workPage.evaluate(()=>JSON.stringify(nailSalon.session.work)),work);await workPage.screenshot({path:'artifacts/music-dock-work.png'});
 assert.deepEqual(errors,[]);console.log('PASS visible player, first-click audio, direct song selection, loop switching, pause, keyboard volume, synced settings, saved preferences, unchanged designs/work and desktop/mobile layouts');
}finally{await browser.close();}
