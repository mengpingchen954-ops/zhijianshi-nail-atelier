import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {consultCustomer} from './consult-customer.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:5185/';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('#welcome-styles').click();assert.equal(await page.locator('.trend-card').count(),6);assert.equal(await page.locator('.trend-card svg').count(),60);await page.screenshot({path:'artifacts/season-stylebook.png'});
 for(const id of ['liquid','velvet','syrup','micro','chrome','aura']){
  await page.locator(`[data-try-look="${id}"]`).click();assert.equal(await page.evaluate(()=>JSON.parse(render_game_to_text()).look),id);
  await page.locator('[data-trend-finger="2"]').click();await page.waitForTimeout(900);await page.screenshot({path:`artifacts/season-${id}-3d.png`});
  if(id==='liquid'||id==='velvet'){const optical=await page.evaluate(()=>nailSalon.scene.rec[2].mat.userData.shader.uniforms);assert.ok(optical.catSoft.value>.6);}
  await page.locator('#preview-book').click();
 }
 await page.locator('[data-look-detail="micro"]').click();assert.equal(await page.locator('[data-reference-finger]').count(),10);await page.locator('[data-reference-finger="7"]').click();assert.ok((await page.locator('#reference-finger-info').innerText()).includes('细法式'));await page.locator('#reference-return').click();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'artifacts/season-stylebook-mobile.png'});await page.locator('.close-modal').click();await page.setViewportSize({width:1440,height:1000});await page.locator('#home').click();await page.locator('[data-client="trend-liquid"]').click();await page.locator('#accept-client').click();await consultCustomer(page);
 await page.locator('#plan-effect').selectOption('catEye');await page.locator('#plan-pattern').selectOption('french');await page.locator('#reference-recipe').click();await page.locator('[data-polish="dots"]').check();const design=await page.evaluate(()=>nailSalon.session.plan);
 assert.equal(design.nails[2].finish,'catEye');assert.equal(design.nails[2].pattern,'french');assert.equal(design.nails[2].polish.dots,true);
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>nailSalon.session.plan.nails[2].polish.dots),false);await page.locator('#redo').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session.plan),design);
 await page.locator('#copy-materials').click();const copied=await page.evaluate(()=>nailSalon.session.plan);assert.ok(copied.nails.every(n=>n.finish==='catEye'&&n.polish.dots));assert.deepEqual(copied.nails.map(n=>[n.base,n.pattern,n.decorations,n.unpainted]),design.nails.map(n=>[n.base,n.pattern,n.decorations,n.unpainted]));await page.locator('#undo').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session.plan),design);
 await page.locator('#stylebook').click();await page.locator('[data-try-look="chrome"]').click();await page.locator('#preview-next').click();await page.locator('#preview-return').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session.plan),design);await page.reload({waitUntil:'networkidle'});await page.locator('#resume').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session.plan),design);await page.screenshot({path:'artifacts/season-layered-plan.png'});
 await page.goto(url+'?mode=free',{waitUntil:'networkidle'});await page.locator('#start').click();await page.locator('[data-tab="finish"]').click();await page.locator('[data-finish="catEye"]').click();await page.locator('#free-pattern').selectOption('aura');await page.locator('[data-polish="opacity"]').fill('0.45');await page.locator('[data-polish="opacity"]').dispatchEvent('change');await page.locator('[data-polish="dots"]').check();await page.waitForTimeout(500);await page.reload({waitUntil:'networkidle'});await page.locator('[data-tab="finish"]').click();assert.equal(await page.locator('#free-pattern').inputValue(),'aura');assert.equal(await page.locator('[data-polish="opacity"]').inputValue(),'0.45');assert.equal(await page.locator('[data-polish="dots"]').isChecked(),true);
 assert.deepEqual(errors,[]);console.log('PASS six ten-finger looks, 3D shader materials, reference detail, mobile, layered controls, undo/redo, preview preservation, persistence and free creator; no browser errors');
}catch(e){await page.screenshot({path:'artifacts/season-failure.png'});throw e;}finally{await browser.close();}

