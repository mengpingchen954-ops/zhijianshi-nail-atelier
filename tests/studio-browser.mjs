import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createSession,customer,targetDesign,stepsFor,targetsFor,complete,SESSION_KEY,ALBUM_KEY} from '../src/service.js';
import {WALLET_KEY,serviceReward,validateWallet} from '../src/rewards.js';
import {SHOP} from '../src/studio.js';
import {consultCustomer} from './consult-customer.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:5186/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const close=()=>page.locator('.close-modal').click();
function finished(id){const s=createSession(id);s.plan=targetDesign(customer(id));s.consultation=['style','care','comfort','budget'];for(const k of stepsFor(customer(id),s.plan).filter(k=>k!=='finish'))for(const i of targetsFor(s))complete(s,i,k);s.phase='result';return s;}
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('#welcome-learn').click();
 assert.equal(await page.locator('[data-lesson]:enabled').count(),1);await page.screenshot({path:'artifacts/studio-learning.png'});await close();
 await page.locator('#studio').click();assert.equal(await page.locator('[data-buy]:enabled').count(),0);await close();
 const sessions=['lin','wen','qiao','xia','tang'].map(finished),receipts=sessions.map(s=>({id:s.id,...serviceReward(s),title:customer(s.client).title,at:Date.now()}));
 await page.evaluate(({key,album,receipts,work})=>{localStorage.setItem(key,JSON.stringify({version:1,receipts}));localStorage.setItem(album,JSON.stringify([work]));},{key:WALLET_KEY,album:ALBUM_KEY,receipts,work:{id:'display-work',name:'我的玫瑰奶冻',design:sessions[0].plan}});
 await page.reload({waitUntil:'networkidle'});await page.locator('#studio').click();
 for(const item of SHOP){await page.locator(`[data-buy="${item.id}"]`).click();assert.equal(await page.locator(`[data-buy="${item.id}"]`).isDisabled(),true);}
 const wallet=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WALLET_KEY);assert.equal(validateWallet(wallet).spent,680);assert.equal(wallet.purchases.length,6);
 await page.locator('#studio-mat').selectOption('sage-mat');await page.locator('#studio-tray').selectOption('rose-tray');await page.locator('#studio-layout').selectOption('left');await page.locator('#studio-display').selectOption('display-work');
 await page.screenshot({path:'artifacts/studio-shop.png'});await page.locator('#view-studio').click();await page.waitForTimeout(900);
 assert.deepEqual(await page.evaluate(()=>({visible:nailSalon.scene.displayStand.visible,x:nailSalon.scene.tray.position.x,pad:nailSalon.scene.roomMaterials.pad.color.getHexString(),tray:nailSalon.scene.roomMaterials.tray.color.getHexString(),hasArt:nailSalon.scene.displayKey.includes('nails')})),{visible:true,x:-3,pad:'b9c8ba',tray:'b7757e',hasArt:true});
 await page.screenshot({path:'artifacts/studio-room.png'});await page.locator('#studio-return').click();
 await page.reload({waitUntil:'networkidle'});await page.locator('#studio').click();assert.equal(await page.locator('#studio-layout').inputValue(),'left');assert.equal(await page.locator('#studio-display').inputValue(),'display-work');
 await page.locator('.studio-backup summary').click();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-studio').click()]);assert.ok(download.suggestedFilename().endsWith('.json'));
 const before=await page.evaluate(key=>localStorage.getItem(key),WALLET_KEY);await page.locator('#studio-import').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"receipts":[]}')});await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).receipts.length===0,WALLET_KEY);
 // A valid empty backup replaces the wallet; restore the exported record to test roundtrip.
 await page.locator('#studio-import').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(before)});await page.waitForFunction(({key,before})=>localStorage.getItem(key)===before,{key:WALLET_KEY,before});
 const restored=await page.evaluate(key=>localStorage.getItem(key),WALLET_KEY);assert.equal(restored,before);
 await page.locator('#studio-import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"receipts":[{"id":"bad"}]}')});await page.waitForFunction(()=>document.querySelector('#salon-toast').textContent.includes('恢复失败'));assert.equal(await page.evaluate(key=>localStorage.getItem(key),WALLET_KEY),before);await close();
 await page.locator('#open-book').click();assert.equal(await page.locator('[data-client^="lesson-"]').count(),0);await page.locator('[data-return-client="return-lin"]').click();assert.ok((await page.locator('.return-memory').innerText()).includes('玫瑰奶冻'));
 await page.locator('#accept-client').click();await consultCustomer(page);assert.equal(await page.evaluate(()=>nailSalon.session.returnVisit),1);assert.ok(await page.evaluate(()=>nailSalon.session.plan.nails.every(n=>n.unpainted)));
 await page.locator('[data-material="moon-powder"]').click();assert.equal(await page.evaluate(()=>nailSalon.session.plan.nails[2].finish),'catEye');await page.locator('#undo').click();assert.equal(await page.evaluate(()=>nailSalon.session.plan.nails[2].finish),'gloss');
 const plan=await page.evaluate(()=>nailSalon.session);await page.locator('#studio').click();await page.locator('#view-studio').click();assert.equal(await page.evaluate(()=>JSON.parse(render_game_to_text()).mode),'preview');await page.locator('#studio-return').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session),plan);
 for(const width of [320,390,1024]){await page.setViewportSize({width,height:844});await page.locator('#learning').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.screenshot({path:`artifacts/studio-learning-${width}.png`});await close();await page.locator('#studio').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.screenshot({path:`artifacts/studio-shop-${width}.png`});await close();}
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(url+'?mode=free',{waitUntil:'networkidle'});const returning=finished('return-lin');returning.returnVisit=1;await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SESSION_KEY,s:returning});await page.goto(url,{waitUntil:'networkidle'});await page.locator('#resume').click();assert.equal(await page.locator('.delivery-feedback section').count(),4);await page.locator('#open-checkout').click();assert.ok((await page.locator('#salon-dialog').innerText()).includes('5'));await page.locator('#claim-reward').click();await page.waitForTimeout(2600);
 const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),WALLET_KEY);assert.equal(after.receipts.at(-1).loyalty,5);assert.equal(after.purchases.length,6);await page.screenshot({path:'artifacts/studio-feedback.png'});
 await page.goto(url+'?mode=free',{waitUntil:'networkidle'});if(await page.locator('#start').isVisible())await page.locator('#start').click();await page.locator('[data-tab="finish"]').click();assert.equal(await page.locator('[data-material]').count(),3);await page.locator('[data-material="moon-powder"]').click();assert.equal(await page.locator('[data-polish="catSoftness"]').inputValue(),'0.95');
 assert.deepEqual(errors,[]);console.log('PASS learning gates, legacy migration, six purchases, actual 3D furnishing/display, persistence, backup restore, regular memory/bonus, material use/undo, preview preservation, 320/390/1024 layouts and free creator; no browser errors');
}catch(e){await page.screenshot({path:'artifacts/studio-failure.png'});throw e;}finally{await browser.close();}
