import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
const url=process.env.GAME_URL||'http://127.0.0.1:5184';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);console.log('PASS',name);};
try{
 await page.goto(url+'/tests/scene.html',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const m=await import('/src/scene.js'),state=await import('/src/state.js');
  const design=state.createDesign(),scene=new m.NailScene(document.querySelector('#fixture'));
  scene.sync(design);scene.focus('both');window.fixture={scene,design,state,surface:m.surface};
 });
 await page.waitForTimeout(1800);
 check('ten curved meshes have upward surface normals',await page.evaluate(()=>fixture.scene.rec.every(r=>r.top.geometry.attributes.normal.getY(500)>0)));
 await page.screenshot({path:'artifacts/module-both-hands.png'});
 const hits=await page.evaluate(()=>{
  const out=[];for(let i=0;i<10;i++){
   fixture.scene.focus('detail',i);
   const p=fixture.scene.project(i,.45,.45),hit=fixture.scene.pick(p.x,p.y);
   out.push({i,hit});
  }return out;
 });
 check('projection and raycast agree on all ten nail surfaces',hits.every(({i,hit})=>hit?.index===i&&Math.abs(hit.u-.45)<.02&&Math.abs(hit.v-.45)<.02));
 await page.evaluate(()=>{
  fixture.scene.focus('detail',2);
  const n=fixture.design.nails[2];n.strokes.push({kind:'paint',color:'#b94160',size:.08,points:[[.25,.5],[.5,.5],[.75,.5]]});
  n.decorations.push({id:'gem-test',type:'gem',u:.5,v:.25,rotation:0,scale:1},{id:'star-test',type:'star',u:.5,v:.7,rotation:.2,scale:1});
  fixture.scene.sync(fixture.design);
 });
 check('stroke appears at its UV coordinates',await page.evaluate(()=>{
  const px=fixture.scene.rec[2].canvas.getContext('2d').getImageData(256,256,1,1).data;return px[0]===185&&px[1]===65&&px[2]===96;
 }));
 check('gem is above the sheet and decoration normal points upward',await page.evaluate(()=>{
  const rec=fixture.scene.rec[2],d=rec.decos.children[0],y=fixture.surface(fixture.design.nails[2],2,.5,.25).y;
  return d.position.y>y&&d.children[0].getWorldPosition(d.position.clone()).y>rec.group.localToWorld(fixture.surface(fixture.design.nails[2],2,.5,.25)).y;
 }));
 await page.screenshot({path:'artifacts/module-detail.png'});
 const unchanged=await page.evaluate(()=>{
  const before=JSON.stringify(fixture.design);fixture.scene.camera.position.x+=.6;fixture.scene.controls.update();
  const p=fixture.scene.project(2,.5,.5),h=fixture.scene.pick(p.x,p.y);
  return JSON.stringify(fixture.design)===before&&h?.index===2&&Math.abs(h.u-.5)<.02;
 });
 check('camera rotation preserves design data and UV hit',unchanged);
 await page.evaluate(()=>{
  fixture.design.nails[2].shape='almond';fixture.design.nails[2].length=1.1;fixture.scene.sync(fixture.design);
 });
 check('shape and length change retains drawings',await page.evaluate(()=>fixture.design.nails[2].strokes.length===1));
 await page.evaluate(()=>{
  fixture.design.nails[2].finish='catEye';fixture.design.nails[2].magnet={u:.3,angle:.5};fixture.scene.sync(fixture.design);fixture.scene.photo();
 });
 await page.waitForTimeout(400);
 check('cat-eye shader compiles and accepts magnet movement',await page.evaluate(()=>{
  const n=fixture.design.nails[2],rec=fixture.scene.rec[2],version=rec.tex.version;n.magnet.u=.7;fixture.scene.sync(fixture.design);
  const shader=rec.mat.userData.shader;return shader?.uniforms.catU.value===.7&&shader?.uniforms.catAngle.value===.5&&rec.tex.version===version;
 }));
 await page.screenshot({path:'artifacts/module-cat-eye.png'});
 for(const finish of ['matte','glitter','metal','gloss']){
  await page.evaluate(f=>{fixture.design.nails[2].finish=f;fixture.scene.sync(fixture.design);fixture.scene.photo();},finish);
 }
 check('all five material variants compile',errors.length===0);
 const stable=await page.evaluate(()=>{
  const before=JSON.stringify(fixture.design),n=fixture.design.nails[2],rec=fixture.scene.rec[2],deco=rec.decos.children[0];
  n.base='#82bbd4';fixture.scene.sync(fixture.design);const reused=rec.decos.children[0]===deco;
  n.base='#d998ad';fixture.scene.sync(fixture.design);return reused&&JSON.stringify(fixture.design)===before;
 });
 check('color changes reuse decorations and render sync does not mutate design',stable);
 const restore=await page.evaluate(()=>{
  const d=fixture.design,raw=JSON.stringify(d);fixture.state.saveDraft(d);
  const restored=fixture.state.loadDraft();
  return JSON.stringify(restored)===raw;
 });
 check('serialized editable data survives local storage round trip',restore);
 check('collection save-as creates an independent work',await page.evaluate(()=>{
  const {state,design}=fixture;state.saveWork(design);const copy=state.saveWork(design,true);
  return copy.id!==design.id&&state.listWorks().length===2&&JSON.stringify(state.openWork(design.id))===JSON.stringify(design);
 }));
 await page.reload({waitUntil:'networkidle'});
 check('draft and collection survive actual browser refresh',await page.evaluate(async()=>{
  const state=await import('/src/state.js'),m=await import('/src/scene.js'),design=state.loadDraft();
  const scene=new m.NailScene(document.querySelector('#fixture'));scene.sync(design);scene.focus('both');window.fixture={scene,design,state,surface:m.surface};
  return design.nails[2].strokes.length===1&&design.nails[2].decorations.length===2&&state.listWorks().length===2;
 }));
 await page.evaluate(()=>{fixture.scene.focus('hand',2);fixture.scene.pose(1);});
 await page.screenshot({path:'artifacts/module-hand-pose.png'});
 check('single-hand focus shows only the selected hand',await page.evaluate(()=>fixture.scene.hands[0].visible&&!fixture.scene.hands[1].visible));
 check('single-hand camera keeps every nail inside the viewport',await page.evaluate(()=>[0,1,2,3,4].every(i=>[0,1].every(v=>{
  const p=fixture.scene.project(i,.5,v);return p.x>0&&p.x<innerWidth&&p.y>0&&p.y<innerHeight;
 }))));
 await page.evaluate(()=>fixture.scene.pose(0));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.evaluate(()=>fixture.scene.focus('both'));
 await page.screenshot({path:'artifacts/module-mobile.png'});
 check('scene resizes to mobile viewport without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&document.querySelector('canvas').width===390));
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>fixture.scene.focus('both'));await page.waitForTimeout(1500);
 const stats=await page.evaluate(()=>fixture.scene.stats()),device=await page.evaluate(()=>{
  const gl=fixture.scene.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',webgl:gl.getParameter(gl.VERSION)};
 });
 check('no browser or shader errors',errors.length===0);
 check('scene cleanup removes canvas and animation resources',await page.evaluate(()=>{fixture.scene.dispose();return !document.querySelector('canvas');}));
 fs.writeFileSync('artifacts/module-test-report.json',JSON.stringify({date:new Date().toISOString(),scope:'Existing scene/state module tests only; no playable game UI',checks,errors,stats,device,host:{platform:os.platform(),cpu:os.cpus()[0].model}},null,2));
 console.log('RESULT',checks.length,'checks',JSON.stringify(stats));
}catch(e){await page.screenshot({path:'artifacts/module-failure.png'});console.error(e);console.error('ERRORS',errors);process.exitCode=1;}
finally{await browser.close();}
