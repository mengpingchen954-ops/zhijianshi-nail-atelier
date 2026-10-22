import {consultCustomer} from './consult-customer.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5185/',{waitUntil:'networkidle'});await page.locator('#open-book').click();await page.locator('[data-client="su"]').click();await page.locator('#accept-client').click();await consultCustomer(page);
 const shape=page.locator('.design-checklist li').filter({hasText:'十指改为方圆形'}),length=page.locator('.design-checklist li').filter({hasText:'长度适合顾客'});
 assert.ok((await shape.innerText()).includes('0/10'));assert.ok((await length.innerText()).includes('10/10'));
 await shape.locator('[data-fix-finger="0"]').click();assert.equal(await page.evaluate(()=>nailSalon.active),0);await page.locator('#plan-shape').selectOption('square');assert.ok((await shape.innerText()).includes('1/10'));
 await page.locator('[data-length="0.9"]').click();assert.equal(await page.locator('#length-value').innerText(),'长甲');assert.ok((await page.locator('#length-advice').innerText()).includes('往左调短'));assert.ok((await length.innerText()).includes('9/10'));assert.equal(await length.locator('[data-fix-finger]').count(),1);
 await page.locator('[data-finger="2"]').click();await length.locator('[data-fix-finger="0"]').click();assert.equal(await page.evaluate(()=>nailSalon.active),0);
 await page.locator('#plan-length').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#length-value').innerText(),'短甲');assert.ok((await page.locator('#length-advice').innerText()).includes('长度合适'));assert.ok((await length.innerText()).includes('10/10'));
 await page.locator('[data-length="0.7"]').click();assert.equal(await page.locator('#length-value').innerText(),'中长甲');await page.locator('[data-length="0.5"]').click();assert.equal(await page.locator('#length-value').innerText(),'短甲');
 assert.ok(!(await page.locator('.nail-length-control').innerText()).match(/0\.\d/));assert.ok(!(await page.locator('.design-checklist').innerText()).includes('≤'));assert.ok((await page.locator('#plan-length').getAttribute('aria-valuetext')).includes('符合顾客要求'));
 await page.locator('#plan-length').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/length-desktop.png'});await page.setViewportSize({width:390,height:844});await page.locator('#plan-length').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),true);await page.screenshot({path:'artifacts/length-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS plain length names, separate shape/length counts, exact finger shortcuts, keyboard adjustment, presets, accessible status, desktop/mobile and no errors');
}finally{await browser.close();}
