import test from 'node:test';
import assert from 'node:assert/strict';
import {createDesign,validateDesign,clone,requirements,copyNail,History,insideNail,constrainDeco,SHAPES,saveDraft,loadDraft,listWorks,saveWork,openWork,DRAFT_KEY,SHELF_KEY} from '../src/state.js';
const deco=(type='star')=>({id:crypto.randomUUID(),type,u:.5,v:.5,rotation:.3,scale:1});
const stroke=()=>({kind:'paint',color:'#b94160',size:.08,points:[[.2,.4],[.5,.4],[.8,.4]]});
test('all ten nails are independent; copy optionally mirrors without sharing arrays',()=>{
 const d=createDesign();d.nails[2].strokes.push(stroke());d.nails[2].decorations.push(deco());
 assert.equal(d.nails[3].strokes.length,0);
 const cp=copyNail(d.nails[2]);assert.deepEqual(cp.strokes,d.nails[2].strokes);assert.notEqual(cp.decorations[0].id,d.nails[2].decorations[0].id);
 cp.strokes[0].points[0][0]=.1;assert.equal(d.nails[2].strokes[0].points[0][0],.2);
 const mirror=copyNail(d.nails[2],true);assert.equal(mirror.strokes[0].points[0][0],.8);assert.equal(mirror.decorations[0].rotation,-.3);
});
test('serialized design retains strokes, gradient, material, decoration and progression',()=>{
 const d=createDesign();Object.assign(d.nails[2],{shape:'almond',length:1.1,finish:'catEye',gradient:{color:'#82bbd4',angle:90,range:.5}});
 d.nails[2].strokes.push(stroke());d.nails[2].decorations.push(deco('gem'));d.unlocked.push('quiet');
 assert.deepEqual(validateDesign(JSON.parse(JSON.stringify(d))),d);
 const cases=[x=>x.nails[2]=null,x=>x.nails[2].length=Infinity,x=>x.nails[2].gradient={},x=>x.nails[2].strokes[0].points[0][0]=NaN,x=>x.nails[2].decorations.push(clone(x.nails[2].decorations[0]))];
 for(const fn of cases){const bad=clone(d);fn(bad);assert.throws(()=>validateDesign(bad));}
});
test('decoration constraints stay inside each outline at all supported scales',()=>{
 for(const [shape] of SHAPES)for(const scale of [.55,1,1.4])for(const u of [0,.5,1])for(const v of [0,.5,1]){
  const n={shape},a=constrainDeco(n,{...deco(),u,v,scale});assert.ok(insideNail(n,a.u,a.v,.12*scale));
 }
});
test('shape edits and redo survive without destroying the drawing',()=>{
 const h=new History();let d=createDesign();d.nails[2].strokes.push(stroke());h.push(d);d.nails[2].shape='almond';
 d=h.undo(d);assert.equal(d.nails[2].shape,'round');assert.equal(d.nails[2].strokes.length,1);
 d=h.redo(d);assert.equal(d.nails[2].shape,'almond');h.push(d);d.nails[2].base='#82bbd4';assert.equal(h.future.length,0);
});
test('three commissions accept distinct designs and explain unmet conditions',()=>{
 let d=createDesign();d.commission='quiet';assert.equal(requirements(d).filter(r=>r.ok).length,2);d.nails[1].decorations.push(deco('flower'));assert.ok(requirements(d).every(r=>r.ok));
 d=createDesign();d.commission='gradient';d.nails.forEach(n=>n.shape='almond');d.nails.slice(0,3).forEach(n=>n.gradient={color:'#82bbd4',angle:0,range:.5});assert.ok(requirements(d).every(r=>r.ok));
 d=createDesign();d.commission='starlit';d.nails.slice(0,3).forEach(n=>n.base='#27334f');d.nails.slice(0,2).forEach(n=>n.finish='catEye');d.nails[0].decorations.push(deco(),deco());d.nails[1].decorations.push(deco());assert.ok(requirements(d).every(r=>r.ok));
 d.nails[1].decorations=[];assert.equal(requirements(d)[2].ok,false);assert.equal(d.nails[0].decorations.length,2);
});
function memoryStorage(){const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};}
test('draft saves full editable data and absent draft is distinguished from corrupt data',()=>{
 const storage=memoryStorage();assert.equal(loadDraft(storage),null);
 const d=createDesign();d.nails[3].strokes.push(stroke());d.nails[3].decorations.push(deco('gem'));saveDraft(d,storage);
 assert.deepEqual(loadDraft(storage),d);
 storage.setItem(DRAFT_KEY,'{broken');assert.throws(()=>loadDraft(storage),/损坏/);assert.equal(storage.getItem(DRAFT_KEY),'{broken');
});
test('collection update and save-as preserve unrelated works and original data',()=>{
 const storage=memoryStorage(),first=createDesign(),second=createDesign();first.name='晨光';second.name='星空';
 saveWork(first,false,storage);saveWork(second,false,storage);
 const revised=clone(first);revised.name='晨光修订';revised.nails[1].strokes.push(stroke());saveWork(revised,false,storage);
 assert.equal(listWorks(storage).length,2);assert.deepEqual(openWork(second.id,storage),second);assert.deepEqual(openWork(first.id,storage),revised);
 const copy=saveWork(revised,true,storage);assert.notEqual(copy.id,revised.id);assert.equal(listWorks(storage).length,3);
 copy.nails[1].strokes[0].points[0][0]=.9;assert.equal(openWork(first.id,storage).nails[1].strokes[0].points[0][0],.2);
});
test('storage write failures preserve previous draft and collection and report failure',()=>{
 const storage=memoryStorage(),d=createDesign();saveDraft(d,storage);saveWork(d,false,storage);
 const draft=storage.getItem(DRAFT_KEY),shelf=storage.getItem(SHELF_KEY);
 const blocked={getItem:storage.getItem,setItem:()=>{throw new DOMException('Full','QuotaExceededError');}};
 d.name='新作品';assert.throws(()=>saveDraft(d,blocked),/保存失败/);assert.throws(()=>saveWork(d,false,blocked),/保存失败/);
 assert.equal(storage.getItem(DRAFT_KEY),draft);assert.equal(storage.getItem(SHELF_KEY),shelf);
});
test('corrupt collection cannot be silently replaced by a new save',()=>{
 const storage=memoryStorage();storage.setItem(SHELF_KEY,'{"wrong":true}');
 assert.throws(()=>saveWork(createDesign(),false,storage),/停止写入/);assert.equal(storage.getItem(SHELF_KEY),'{"wrong":true}');
 storage.setItem(SHELF_KEY,JSON.stringify([createDesign(),null]));assert.throws(()=>listWorks(storage),/损坏/);
});
test('inaccessible storage and missing collection items are explicit errors',()=>{
 const storage={getItem:()=>{throw new DOMException('Blocked','SecurityError');}};
 assert.throws(()=>loadDraft(storage),/禁止读取/);assert.throws(()=>listWorks(storage),/禁止读取/);
 assert.throws(()=>openWork('missing',memoryStorage()),/找不到/);
});
test('thumbnail imports cannot inject HTML and presentation options are validated',()=>{
 const d=createDesign();d.thumbnail='data:image/jpeg;base64," onerror="alert(1)';assert.throws(()=>validateDesign(d),/缩略图/);
 delete d.thumbnail;d.presentation.pose=4;assert.throws(()=>validateDesign(d),/展示设置/);
 d.presentation.pose=1;d.thumbnail='data:image/jpeg;base64,YWJjZA==';assert.deepEqual(validateDesign(d),d);
});
test('mirrored copy adapts gradient and cat-eye while default copy keeps directions',()=>{
 const n=createDesign().nails[0];n.gradient={color:'#82bbd4',angle:90,range:.5};n.magnet={u:.25,angle:.6};
 assert.equal(copyNail(n).gradient.angle,90);assert.equal(copyNail(n,true).gradient.angle,270);assert.equal(copyNail(n,true).magnet.u,.75);assert.equal(copyNail(n,true).magnet.angle,-.6);
});
