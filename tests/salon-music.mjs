import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const url=process.env.GAME_URL||'http://127.0.0.1:5185/',checks=[],errors=[],requested=new Set();
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const name=r.url().match(/music\/(track-\d\.mp3)/)?.[1];if(name)requested.add(name);});
const check=(label,ok)=>{assert.ok(ok,label);checks.push(label);console.log('PASS',label);};
const player=()=>page.evaluate(()=>{const s=nailSalon.sound,a=s.musicElement;return {track:s.track,playing:s.musicPlaying,paused:a?.paused,time:a?.currentTime,duration:a?.duration,src:a?.currentSrc,volume:s.channels.music,gain:s.gains?.music.gain.value,muted:s.muted,error:s.musicError,status:s.musicStatus};});
const volume=async value=>page.locator('[data-volume="music"]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function playing(){await page.waitForFunction(()=>{const s=nailSalon.sound;return s.musicElement&&!s.musicElement.paused&&s.musicElement.readyState>=3&&s.musicElement.currentTime>0;});}
try{
 const response=await page.goto(url,{waitUntil:'networkidle'});check('public or local browser build loads',response.status()===200);
 check('music is not downloaded before the first player gesture',requested.size===0);
 await page.locator('#settings').click();await playing();
 check('six supplied songs are selectable',await page.locator('#music-track option').count()===6);
 check('startup downloads only the selected song',requested.size===1&&requested.has('track-1.mp3'));
 const durations=[];
 for(let i=0;i<6;i++){
  await page.locator('#music-track').selectOption(String(i));await playing();const p=await player();durations.push(p.duration);
  check(`song ${i+1} is playable with a valid duration`,p.track===i&&p.src.endsWith(`track-${i+1}.mp3`)&&p.duration>10&&Number.isFinite(p.duration));
 }
 await page.locator('#music-next').click();await playing();check('next wraps from the last song to the first',(await player()).track===0);
 await page.locator('#music-prev').click();await playing();check('previous wraps from first to last',(await player()).track===5);
 await volume(.4);await page.waitForTimeout(350);
 check('volume slider controls the independent music gain',(await player()).volume===.4&&Math.abs((await player()).gain-.4)<.001&&await page.locator('#music-volume-value').textContent()==='40%');
 const levels=await page.evaluate(async()=>{const s=nailSalon.sound,a=s.musicElement,an=s.ctx.createAnalyser();an.fftSize=2048;s.gains.music.connect(an);const samples=new Float32Array(2048),wait=ms=>new Promise(r=>setTimeout(r,ms)),measure=()=>{an.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);};a.currentTime=Math.min(10,a.duration/3);let audible=0;for(let i=0;i<100;i++){if(!a.seeking&&a.readyState>=3)audible=Math.max(audible,measure());if(audible>.0001)break;await wait(100);}s.musicPlaying=false;a.pause();await wait(500);const paused=measure();s.gains.music.disconnect(an);an.disconnect();return {audible,paused};});
 console.log('Music output',levels);
 check('supplied MP3 produces a real signal and pause removes it',levels.audible>.0001&&levels.paused<1e-7);
 // Restore through the same controls a player uses after the measurement paused playback.
 await page.locator('#music-toggle').click();await playing();await page.locator('#music-toggle').click();const pausedTime=(await player()).time;await page.waitForTimeout(350);
 check('pause stops time without changing the selected song',(await player()).paused&&Math.abs((await player()).time-pausedTime)<.03);
 await page.locator('#music-next').click();check('changing songs while paused keeps playback paused',(await player()).paused&&!(await player()).playing);
 await page.locator('#music-track').selectOption('2');await page.locator('#music-toggle').click();await playing();
 await volume(0);check('zero music volume pauses only the soundtrack',(await player()).paused&&await page.evaluate(()=>nailSalon.sound.channels.tools===.7&&!nailSalon.sound.muted));
 await volume(.3);await playing();
 await page.locator('#mute').check();check('total mute stops music',(await player()).paused&&(await player()).muted);await page.locator('#mute').uncheck();await playing();
 await page.evaluate(()=>nailSalon.sound.pause());const focusTime=(await player()).time;await page.waitForTimeout(250);check('focus pause stops background playback',Math.abs((await player()).time-focusTime)<.03);await page.evaluate(()=>nailSalon.sound.resume());await playing();
 await page.locator('#music-toggle').click();await page.reload({waitUntil:'networkidle'});await page.locator('#settings').click();await page.waitForFunction(()=>!!nailSalon.sound.musicElement);
 check('song, volume, and manual pause survive refresh',(await player()).track===2&&(await player()).volume===.3&&!(await player()).playing&&(await player()).paused);
 await page.locator('#music-toggle').click();await playing();
 await page.evaluate(()=>{const s=nailSalon.sound;s.musicElement.currentTime=s.musicElement.duration-.1;});await page.waitForFunction(()=>nailSalon.sound.track===3);await playing();check('finished song advances to the next song automatically',(await player()).track===3);
 await page.route('**/music/track-2.mp3',route=>route.abort());await page.locator('#music-track').selectOption('1');await page.waitForFunction(()=>!!nailSalon.sound.musicError);
 check('missing music shows a recoverable playback message',await page.locator('#music-status').textContent()!==''&&await page.locator('#music-toggle').textContent()==='重试播放');await page.unroute('**/music/track-2.mp3');await page.locator('#music-toggle').click();await playing();check('retry recovers the same selected song',!(await player()).error&&(await player()).track===1);
 await page.screenshot({path:'artifacts/music-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/music-mobile.png'});
 check('mobile controls fit within the viewport',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth)&&await page.locator('#music-next').isVisible());
 check('music controls produce no uncaught exceptions',errors.length===0);fs.writeFileSync('artifacts/music-report.json',JSON.stringify({url,checks,durations,levels,errors},null,2));
}finally{await browser.close();}
