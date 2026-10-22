import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {designCustomer} from './design-customer.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:5185/';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1903,height:966}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('#open-book').click();await page.locator('[data-client="qiao"]').click();await page.locator('#accept-client').click();
 const blank=()=>page.evaluate(()=>nailSalon.session.plan.nails.every(n=>n.unpainted&&n.decorations.length===0&&!n.pattern&&!n.gradient));
 assert.ok(await blank());assert.equal(await page.locator('#reset-reference').count(),0);assert.ok(await page.locator('#mini-reference .reference-card').isVisible());
 await page.screenshot({path:'artifacts/v2-blank-plan.png'});await page.locator('#confirm-plan').click();assert.equal(await page.evaluate(()=>nailSalon.session.phase),'plan');
 await page.locator('#show-reference').click();assert.ok(await page.locator('.reference-dialog .reference-card').isVisible());await page.locator('.close-modal').click();assert.ok(await blank());
 await page.locator('[data-color]').first().click();assert.equal(await page.evaluate(()=>nailSalon.session.plan.nails.filter(n=>!n.unpainted).length),1);await page.locator('#undo').click();assert.ok(await blank());await page.locator('#redo').click();
 await page.locator('#clear-plan').click();assert.ok(await blank());await designCustomer(page,'qiao');
 assert.equal(await page.locator('.design-checklist li:not(.met)').count(),0);await page.screenshot({path:'artifacts/v2-player-designed-plan.png'});
 const plan=await page.evaluate(()=>nailSalon.session.plan);await page.reload({waitUntil:'networkidle'});await page.locator('#resume').click();assert.deepEqual(await page.evaluate(()=>nailSalon.session.plan),plan);
 await page.locator('#confirm-plan').click();assert.equal(await page.evaluate(()=>nailSalon.session.phase),'work');assert.equal(errors.length,0);
 console.log('PASS blank appointment, reference stays separate, no automatic design button, incomplete plan blocked, editing, undo/redo, clear, player design, refresh and service start',url);
}finally{await browser.close();}
