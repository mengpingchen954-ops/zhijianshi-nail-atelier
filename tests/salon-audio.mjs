import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL||'http://127.0.0.1:5185/';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('#open-book').click();
 await page.waitForFunction(()=>Object.keys(nailSalon.sound.buffers).length===47);
 assert.equal(await page.evaluate(()=>nailSalon.sound.channels.room),0,'new players have no continuous room noise');
 const levels=await page.evaluate(async()=>{
  const sound=nailSalon.sound,analyser=sound.ctx.createAnalyser();analyser.fftSize=2048;sound.master.connect(analyser);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const rms=()=>{const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);};
  sound.set('music',0);await wait(600);const idle=rms();
  sound.contact('file');const contact=setInterval(()=>sound.contact('file'),40);await wait(250);const filing=rms();
  clearInterval(contact);sound.stopContact();await wait(300);const released=rms();
  sound.master.disconnect(analyser);analyser.disconnect();return {idle,filing,released};
 });
 assert.ok(levels.idle<1e-7,'idle mix is silent with music off');
 assert.ok(levels.filing>.001,'filing retains an audible contact signal');
 assert.ok(levels.released<1e-7,'contact noise stops after release');
 const room=await page.evaluate(()=>{
  const samples=nailSalon.sound.buffers.room.getChannelData(0);let energy=0,roughness=0,peak=0;
  for(let i=0;i<samples.length;i++){energy+=samples[i]**2;peak=Math.max(peak,Math.abs(samples[i]));if(i>1)roughness+=(samples[i]-2*samples[i-1]+samples[i-2])**2;}
  return {peak,roughness:roughness/energy,seam:Math.abs(samples[0]-samples.at(-1))};
 });
 assert.ok(room.peak<.003&&room.roughness<.001&&room.seam<.0001,'optional room tone is quiet, smooth and loops without a sharp edge');
 await page.evaluate(()=>{localStorage.removeItem('nail-audio-v3');localStorage.setItem('nail-audio-v2',JSON.stringify({tools:.35,ui:.25,music:.1,room:.2,muted:true}));});
 await page.reload({waitUntil:'networkidle'});
 assert.deepEqual(await page.evaluate(()=>({...nailSalon.sound.channels,muted:nailSalon.sound.muted})),{tools:.35,ui:.25,music:.1,room:0,muted:true},'existing players lose the old background noise while keeping other sound preferences');
 await page.locator('#settings').click();
 assert.equal(await page.locator('[data-volume="room"]').inputValue(),'0');
 await page.evaluate(()=>nailSalon.sound.set('room',.1));await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>nailSalon.sound.channels.room),.1,'explicit environment preference persists after the fix');
 console.log('PASS quiet defaults, legacy preferences, actual idle/contact/released audio, clean optional loop and saved settings',JSON.stringify({url,levels,room}));
}finally{await browser.close();}
