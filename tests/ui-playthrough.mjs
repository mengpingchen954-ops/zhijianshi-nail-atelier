import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
const gameUrl=new URL(process.env.GAME_URL||'http://127.0.0.1:5184');gameUrl.searchParams.set('mode','free');const url=gameUrl.href;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);console.log('PASS',name);};
const state=()=>page.evaluate(()=>nailAtelier.design);
const click=s=>page.locator(s).click();
const finger=i=>click(`[data-finger="${i}"]`);
const tool=t=>click(`[data-tab="${t}"]`);
const hit=(u,v,i)=>page.evaluate(({u,v,i})=>nailAtelier.project(i??nailAtelier.active,u,v),{u,v,i});
async function touch(u,v){const p=await hit(u,v);await page.mouse.click(p.x,p.y);}
async function stroke(points,steps=1){const first=await hit(...points[0]);await page.mouse.move(first.x,first.y);await page.mouse.down();for(const uv of points.slice(1)){const p=await hit(...uv);await page.mouse.move(p.x,p.y,{steps});}await page.mouse.up();await page.waitForTimeout(80);}
async function range(selector,value){await page.locator(selector).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);await page.waitForTimeout(60);}
async function copyTo(targets,mirror=false){await click('#copy');for(const i of targets)await page.locator(`[data-target="${i}"]`).check();if(mirror)await page.locator('#copy-mirror').check();await click('#apply-copy');}
async function commission(id){await click('#commissions');await click(`[data-commission="${id}"]`);}
async function fresh(){await click('#new-work');await click('#confirm-new');}
async function showcase(name){await click('#finish-work');await page.locator('#work-name').fill(name);await page.locator('#work-name').press('Tab');}
async function save(){await click('#save-work');await page.waitForTimeout(100);}
async function download(selector,file){const event=page.waitForEvent('download');await click(selector);const dl=await event;await dl.saveAs('artifacts/'+file);return dl;}
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.nailAtelier);
 await page.screenshot({path:'artifacts/ui-welcome.png'});await click('#start');
 check('game boots into a working Three.js salon with ten independent curved nails',(await state()).nails.length===10);
 await fresh();await finger(2);await tool('paint');await click('[data-color="#b94160"]');
 const untouched=(await state()).nails[3];
 await stroke([[.22,.3],[.78,.65]],1);
 let d=await state();check('fast mouse drag creates a continuous UV stroke',d.nails[2].strokes.length===1&&d.nails[2].strokes[0].points.length>30);
 check('only target finger changes',JSON.stringify(d.nails[3])===JSON.stringify(untouched)&&d.nails.filter(n=>n.strokes.length).length===1);
 const pixel=await page.evaluate(()=>{const c=nailAtelier.scene.rec[2].canvas;return [...c.getContext('2d').getImageData(256,Math.round((1-.475)*512),1,1).data];});
 check('actual rendered texture contains paint where the cursor crossed',pixel[0]===185&&pixel[1]===65&&pixel[2]===96);
 await click('#undo');check('undo removes the complete stroke',(await state()).nails[2].strokes.length===0);await click('#redo');check('redo restores it',(await state()).nails[2].strokes.length===1);
 await click('[data-brush="erase"]');await stroke([[.5,.47],[.5,.48]],1);
 const erased=await page.evaluate(()=>[...nailAtelier.scene.rec[2].canvas.getContext('2d').getImageData(256,Math.round((1-.475)*512),1,1).data]);
 check('local eraser exposes underlying polish',erased[0]!==185);
 await click('#undo');await click('[data-brush="paint"]');
 await stroke([[.4,.45],[.5,.5]],2);let before=JSON.stringify((await state()).nails[2]);
 const p=await hit(.5,.5);await page.mouse.move(p.x,p.y);await page.mouse.down({button:'right'});await page.mouse.move(p.x+65,p.y+25,{steps:10});await page.mouse.up({button:'right'});await page.waitForTimeout(200);
 check('right drag rotates the camera without adding paint',JSON.stringify((await state()).nails[2])===before);
 const mapped=await page.evaluate(()=>{const p=nailAtelier.project(2,.5,.48);return nailAtelier.pick(p.x,p.y);});check('UV paint stays attached after rotation',mapped?.index===2&&Math.abs(mapped.u-.5)<.015&&Math.abs(mapped.v-.48)<.015);
 await click('[data-view="detail"]');const skin=await hit(.5,-.35);await page.mouse.click(skin.x,skin.y);check('clicking outside nail does not paint skin',JSON.stringify((await state()).nails[2])===before&&await page.evaluate(()=>nailAtelier.active===2));
 await stroke([[.35,.35],[.48,.45]],2);await page.mouse.down();await page.locator('[data-tab="shape"]').dispatchEvent('click');await page.mouse.up();check('switching tools reliably ends the active stroke',await page.evaluate(()=>nailAtelier.action===null));
 const strokesBefore=(await state()).nails[2].strokes;await click('[data-shape="almond"]');await range('#length',1.1);
 check('shape and length edits retain UV drawings',(await state()).nails[2].shape==='almond'&&JSON.stringify((await state()).nails[2].strokes)===JSON.stringify(strokesBefore));
 await click('#undo');await click('#undo');check('shape and length can be restored',(await state()).nails[2].shape==='round'&&(await state()).nails[2].length===.7);
 await tool('gradient');await click('[data-color="#82bbd4"]');await click('#apply-gradient');await range('#gradient-angle',90);await range('#gradient-range',.4);
 d=await state();check('gradient exposes both direction and transition width',d.nails[2].gradient.color==='#82bbd4'&&d.nails[2].gradient.angle===90&&d.nails[2].gradient.range===.4);
 await tool('deco');await click('[data-deco="star"]');await touch(.5,.7);d=await state();check('sticker placement is on the active nail',d.nails[2].decorations.length===1&&d.nails[2].decorations[0].type==='star');
 const old=cloneDeco(d.nails[2].decorations[0]);await stroke([[.5,.7],[.6,.56]],10);
 d=await state();check('selected sticker moves on the curved surface',Math.abs(d.nails[2].decorations[0].v-old.v)>.05);
 await range('#deco-rotation',45);await range('#deco-scale',1.3);check('rotation and limited scale work',Math.abs((await state()).nails[2].decorations[0].rotation-Math.PI/4)<.001&&(await state()).nails[2].decorations[0].scale===1.3);
 await click('#duplicate-deco');check('decoration copy creates a separate ID',(await state()).nails[2].decorations.length===2);await click('#delete-deco');check('delete selected decoration works',(await state()).nails[2].decorations.length===1);await click('#undo');check('accidental deletion can be undone',(await state()).nails[2].decorations.length===2);
 await click('[data-deco="gem"]');await touch(.45,.24);check('gem is a 3D mesh above the curved nail',await page.evaluate(()=>{const r=nailAtelier.scene.rec[2],g=r.decos.children.at(-1);return g.children[0].geometry.type==='OctahedronGeometry'&&g.children[0].position.y>0;}));
 await copyTo([7],true);d=await state();check('full copy adapts target data without overwriting other fingers',d.nails[7].decorations.length===3&&d.nails[7].strokes.length===d.nails[2].strokes.length&&d.nails[1].decorations.length===0);
 check('optional mirrored copy flips stroke coordinates and gradient',Math.abs(d.nails[7].strokes[0].points[0][0]-(1-d.nails[2].strokes[0].points[0][0]))<.001&&d.nails[7].gradient.angle===270);
 const sourceInk=JSON.stringify(d.nails[2].strokes);await finger(7);await tool('paint');await stroke([[.5,.2],[.5,.4]],3);check('copied finger edits do not mutate the source',JSON.stringify((await state()).nails[2].strokes)===sourceInk);
 await finger(2);await tool('finish');await click('[data-finish="catEye"]');await page.waitForTimeout(100);const startMag=(await state()).nails[2].magnet.u;await stroke([[.25,.5],[.75,.6]],10);
 check('magnet drag moves the cat-eye band',Math.abs((await state()).nails[2].magnet.u-startMag)>.1&&await page.evaluate(()=>nailAtelier.scene.rec[2].mat.userData.shader?.uniforms.catU.value>.7));
 await page.screenshot({path:'artifacts/ui-cat-eye.png'});
 for(const finish of ['matte','glitter','metal','gloss']){await click(`[data-finish="${finish}"]`);await page.waitForTimeout(80);}
 check('all five finishes render without shader errors',errors.length===0);
 await page.waitForTimeout(650);const raw=JSON.stringify(await state());await page.reload({waitUntil:'networkidle'});check('actual refresh restores full editable draft',JSON.stringify(await state())===raw);
 await page.screenshot({path:'artifacts/ui-detail.png'});
 // Complete three substantially different designs through the same visible tools.
 await fresh();await commission('quiet');await finger(3);await tool('deco');await click('[data-deco="flower"]');await touch(.5,.45);await showcase('晨雾茶会 · 奶油小花');
 check('quiet brief explains all three completed requirements',await page.locator('.requirements li.ok').count()===3);
 await save();await download('#download-photo','look-quiet.png');await page.screenshot({path:'artifacts/look-quiet-ui.png'});
 const quiet=await state();check('saved collection includes full data and matching JPEG thumbnail',!!quiet.thumbnail&&quiet.nails[3].decorations.length===1&&quiet.unlocked.includes('quiet'));
 await click('#save-copy');check('save-as produces a new identity',(await state()).id!==quiet.id);
 check('save-as history cannot accidentally restore the original work identity',await page.locator('#undo').isDisabled());
 await fresh();await commission('gradient');await finger(2);await tool('shape');await click('[data-shape="almond"]');await copyTo([0,1,3,4,5,6,7,8,9]);await tool('paint');await click('[data-color="#82bbd4"]');await click('#fill-all');await tool('gradient');await click('[data-color="#a599cf"]');await click('#apply-gradient');await range('#gradient-range',.85);await copyTo([1,7]);await showcase('海盐汽水 · 蓝紫渐变');
 check('gradient brief is achievable and explains its conditions',await page.locator('.requirements li.ok').count()===3);await save();await download('#download-photo','look-gradient.png');
 await fresh();await commission('starlit');await finger(2);await tool('paint');await click('[data-color="#27334f"]');await click('#fill-all');await tool('finish');await click('[data-finish="catEye"]');await copyTo([1,7]);await tool('deco');await click('[data-deco="star"]');await touch(.4,.35);await click('[data-deco="star"]');await touch(.6,.7);await finger(7);await click('[data-deco="star"]');await touch(.5,.55);await showcase('星夜来信 · 流动的金光');
 check('starlit brief accepts distributed stars and cat-eye finish',await page.locator('.requirements li.ok').count()===3);
 check('commission progress survives creation of subsequent works',(await state()).unlocked.includes('quiet')&&(await state()).unlocked.includes('gradient'));
 await click('[data-background="2"]');await page.locator('#pose').selectOption('1');await save();await download('#download-photo','look-starlit.png');await page.screenshot({path:'artifacts/look-starlit-ui.png'});
 const star=await state();await download('#export-work','editable-design.json');check('export contains the actual editable design',JSON.stringify(JSON.parse(fs.readFileSync('artifacts/editable-design.json','utf8')))===JSON.stringify(star));
 await click('#open-shelf');check('collection shows named thumbnails',await page.locator('.work-card img').count()>=3&&await page.locator('.work-card').filter({hasText:'晨雾茶会'}).count()>=1);
 await page.screenshot({path:'artifacts/ui-collection.png'});await click(`[data-work="${quiet.id}"]`);d=await state();check('reopening restores exactly the saved nails',JSON.stringify(d.nails)===JSON.stringify(quiet.nails));
 await click('#back-edit');await finger(3);await tool('deco');await click('#move-deco');await touch(.5,.45);await click('#delete-deco');await showcase('晨雾 · 继续修改');check('unmet brief keeps work and explains the missing decoration',await page.locator('.requirements li:not(.ok)').count()===1&&(await state()).nails.length===10);
 await click('#open-shelf');await click(`[data-work="${star.id}"]`);await click('#open-shelf');
 check('switching works preserves uncollected modifications as an editable variant',await page.locator('.work-card').filter({hasText:'晨雾 · 继续修改'}).count()===1);
 await click('#import-work');await page.locator('#import-file').setInputFiles('artifacts/editable-design.json');await page.waitForTimeout(250);check('JSON import restores a complete saved work',JSON.stringify((await state()).nails)===JSON.stringify(star.nails));
 // Check persistence through an actual refresh, including collection.
 await page.waitForTimeout(650);await page.reload({waitUntil:'networkidle'});await click('#open-shelf');check('collection survives refresh',await page.locator('.work-card').count()>=3);await click('.dialog-close');
 await click('[data-view="hand"]');check('single-hand view hides the other hand',await page.evaluate(()=>nailAtelier.scene.hands.filter(h=>h.visible).length===1));
 await click('[data-view="both"]');await page.waitForTimeout(800);
 const stats=await page.evaluate(()=>nailAtelier.stats()),device=await page.evaluate(()=>{const gl=nailAtelier.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',webgl:gl.getParameter(gl.VERSION)};});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await click('[data-view="both"]');await page.screenshot({path:'artifacts/ui-mobile.png'});check('mobile layout has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 check('both-hand mobile overview keeps all ten nail centres in view',await page.evaluate(()=>{const r=document.querySelector('#world').getBoundingClientRect();return Array.from({length:10},(_,i)=>nailAtelier.project(i,.5,.5)).every(p=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom);}));
 await finger(2);await tool('paint');await click('[data-color="#ed927a"]');await stroke([[.45,.4],[.55,.6]],4);check('local drawing still works in mobile viewport',(await state()).nails[2].strokes.length>0);await page.screenshot({path:'artifacts/ui-mobile-detail.png'});
 await page.setViewportSize({width:1440,height:1000});await click('[data-view="both"]');await page.waitForTimeout(250);await page.screenshot({path:'artifacts/ui-final.png'});
 check('no browser console errors or uncaught exceptions',errors.length===0);
 const report={date:new Date().toISOString(),url,checks,errors,stats,device,host:{os:os.platform(),cpu:os.cpus()[0].model},limits:['Desktop Chrome and mobile viewport emulation only; no physical touch device or Safari test.','Performance measured on this GPU only.']};
 fs.writeFileSync(process.env.GAME_URL?'artifacts/public-test-report.json':'artifacts/ui-test-report.json',JSON.stringify(report,null,2));console.log('RESULT',checks.length,JSON.stringify(stats));
}catch(e){await page.screenshot({path:'artifacts/ui-failure.png'});console.error(e);console.error('BROWSER ERRORS',errors);process.exitCode=1;}finally{await browser.close();}
function cloneDeco(d){return structuredClone(d);}
