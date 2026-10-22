import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSession,targetDesign,customer,beginWork,stepsFor,SESSION_KEY} from '../src/service.js';
const url=process.env.GAME_URL||'http://127.0.0.1:5185/',errors=[],checks=[];
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
let page=await browser.newPage({viewport:{width:1440,height:1000}});
const check=(label,ok)=>{assert.ok(ok,label);checks.push(label);console.log('PASS',label);};
async function stage(step,id='lin',mobile=false){
 const s=createSession(id);s.plan=targetDesign(customer(id));beginWork(s);s.step=stepsFor(customer(id)).indexOf(step);
 for(const w of s.work){w.done=stepsFor(customer(id)).slice(0,s.step);if(w.done.includes('file'))w.fileTravel=1;}
 await page.close();page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,s})=>{localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('nail-audio-v3',JSON.stringify({tools:.7,ui:.45,music:0,room:0,muted:false}));},{key:SESSION_KEY,s});
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('#resume').click();await page.waitForFunction(()=>Object.keys(nailSalon.sound.buffers).length===47);
 await page.locator('[data-finger="0"]').click();await page.waitForTimeout(100);
}
const point=(u,v)=>page.evaluate(({u,v})=>nailSalon.project(0,u,v),{u,v});
async function down(u,v){const p=await point(u,v);await page.mouse.move(p.x,p.y);await page.mouse.down();}
async function move(u,v,steps=8){const p=await point(u,v);await page.mouse.move(p.x,p.y,{steps});}
const work=()=>page.evaluate(()=>nailSalon.session.work[0]);
async function pixel(u,v){return page.evaluate(({u,v})=>Array.from(nailSalon.scene.rec[0].canvas.getContext('2d').getImageData(Math.round(u*511),Math.round((1-v)*511),1,1).data),{u,v});}
try{
 await stage('file');const initial=await page.evaluate(()=>nailSalon.scene.design.nails[0].length);
 await down(.5,.8);await page.waitForTimeout(200);check('stationary file has no progress',!(await work()).fileTravel);
 for(let i=0;i<4;i++)await move(i%2?.68:.32,.82);await page.waitForTimeout(60);
 const w=await work();check('file changes actual length gradually',w.fileTravel>0&&w.fileTravel<1&&await page.evaluate(initial=>nailSalon.scene.design.nails[0].length<initial,initial));
 check('filing is audible only during movement',await page.evaluate(()=>nailSalon.sound.contactKind==='file'));
 await page.screenshot({path:'artifacts/interaction-file.png'});await page.mouse.up();await page.waitForTimeout(220);
 check('file lifts away and contact sound stops',await page.evaluate(()=>!nailSalon.interaction.toolVisible&&nailSalon.sound.contactSource===null));

 await stage('color');const before=await pixel(.84,.28);await down(.5,.08);await move(.5,.4);await page.waitForTimeout(60);
 const center=await pixel(.5,.28),edge=await pixel(.84,.28);check('paint reveals a narrow swept stroke without painting adjacent areas',JSON.stringify(edge)===JSON.stringify(before)&&JSON.stringify(center)!==JSON.stringify(edge));
 await page.screenshot({path:'artifacts/interaction-paint.png'});await page.mouse.up();await down(.5,.75);await move(.5,.89);await page.mouse.up();await page.waitForTimeout(60);
 check('lifting and restarting the brush leaves the gap unpainted',JSON.stringify(await pixel(.5,.6))===JSON.stringify(edge));

 await stage('base');await down(.5,.1);await move(.5,.55);await page.waitForTimeout(60);
 check('clear coats have a local wet reflection mesh',await page.evaluate(()=>nailSalon.scene.rec[0].wet.visible&&nailSalon.scene.rec[0].wet.material.alphaMap.image.width===512));await page.mouse.up();

 await stage('fit','xia');await page.locator('#suggest-tip').click();const p=await point(.5,.1);await page.mouse.click(p.x,p.y);
 check('a click cannot instantly fit a tip',!(await work()).done.includes('fit'));
 await down(.5,.65);await move(.5,.1);await page.waitForTimeout(150);
 check('a full curved tip follows the pickup gesture',await page.evaluate(()=>nailSalon.interaction.tool==='tip'&&nailSalon.interaction.contact));
 await page.screenshot({path:'artifacts/interaction-tip-pickup.png'});await page.mouse.up();check('aligned release fits the tip', (await work()).done.includes('fit'));

 await stage('bond','xia');await down(.5,.65);await move(.5,.85);await page.mouse.up();check('pressing at the tip cannot bypass root alignment',!(await work()).bondFront);
 await down(.5,.06);await move(.5,.52,16);await page.waitForTimeout(70);
 check('root-to-tip press moves the bonding front gradually',(await work()).bondFront>.4&&(await work()).bondFront<.8);
 await page.screenshot({path:'artifacts/interaction-tip-press.png'});await move(.5,.94,16);await page.mouse.up();check('continued forward press completes bonding',(await work()).done.includes('bond'));

 for(const hand of [0,1]){
  await stage('cureBase','qiao');await page.locator(`[data-lamp="${hand}"]`).click();await page.waitForTimeout(230);
  check(`${hand?'right':'left'} entering hand does not light or count early`,await page.evaluate(()=>nailSalon.session.lamp.phase==='enter'&&nailSalon.session.lamp.remaining===4.5&&nailSalon.interaction.light===0&&nailSalon.sound.fan===undefined));
  await page.waitForFunction(()=>nailSalon.session.lamp?.phase==='cure');await page.waitForTimeout(100);
  check(`${hand?'right':'left'} lamp contains all five nail surfaces including thumb`,await page.evaluate(()=>nailSalon.interaction.allFiveInside));
  check('sensor starts local LEDs and fan together',await page.evaluate(()=>nailSalon.interaction.light>0&&!!nailSalon.sound.fan));
  await page.screenshot({path:`artifacts/interaction-lamp-${hand}.png`});
  await page.locator('#interrupt-lamp').click();await page.waitForTimeout(650);
  check('interruption turns the lamp off and returns the entire hand',await page.evaluate(hand=>!nailSalon.sound.fan&&nailSalon.interaction.light===0&&Math.abs(nailSalon.scene.hands[hand].position.z-.72)<.001&&nailSalon.session.work.slice(hand*5,hand*5+5).every(w=>!w.done.includes('cureBase')),hand));
 }
 await stage('cureTop','lin');await page.setViewportSize({width:390,height:844});await page.locator('[data-lamp="0"]').click();await page.waitForFunction(()=>nailSalon.session.lamp?.phase==='cure');await page.waitForTimeout(100);await page.screenshot({path:'artifacts/interaction-mobile-lamp.png'});
 check('mobile lamp still contains five nails and layout has no overflow',await page.evaluate(()=>nailSalon.interaction.allFiveInside&&document.documentElement.scrollWidth===innerWidth));
 await page.locator('#speed-lamp').click();await page.locator('#lamp-overlay').waitFor({state:'hidden'});
 check('completed curing returns the whole hand before unlocking the next step',await page.evaluate(()=>nailSalon.session.work.slice(0,5).every(w=>w.done.includes('cureTop'))&&Math.abs(nailSalon.scene.hands[0].position.z-.72)<.001));
 check('no browser errors',errors.length===0);fs.writeFileSync('artifacts/interactions-report.json',JSON.stringify({url,checks,errors},null,2));
}catch(error){await page.screenshot({path:'artifacts/interaction-failure.png'});console.error(await page.evaluate(()=>({state:JSON.parse(render_game_to_text()),interaction:nailSalon.interaction})));throw error;}finally{await browser.close();}
