import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOKS,lookDesign,polishValues} from '../src/season.js';
import {validateDesign,copyNail,History} from '../src/state.js';
import {createSession,customer,targetDesign,designRequirements,validateSession,stepsFor,nextStep,complete,targetsFor,stepId,evaluateService,viewDesign} from '../src/service.js';

test('six seasonal looks survive validation, copying and history; each reference meets its brief',()=>{
 assert.equal(LOOKS.length,6);
 for(const l of LOOKS){
  const d=lookDesign(l.id);assert.deepEqual(validateDesign(JSON.parse(JSON.stringify(d))),d);
  const copied=copyNail(d.nails[0]);copied.polish.opacity=.15;assert.notEqual(copied.polish.opacity,d.nails[0].polish.opacity);
  const h=new History();h.push(d);const edited=structuredClone(d);edited.nails[0].polish.chrome=.8;assert.deepEqual(h.undo(edited),d);
  const s=createSession('trend-'+l.id);s.plan=targetDesign(customer(s.client));assert.ok(designRequirements(s).every(c=>c.ok),l.id);assert.deepEqual(validateSession(s),s);
 }
});
test('seasonal material checks reject opaque, hard-edged, thick or incomplete substitutes',()=>{
 const wrong={liquid:n=>n.polish.opacity=1,velvet:n=>n.polish.catSoftness=.1,syrup:n=>n.polish.layers=1,micro:n=>n.polish.tipWidth=.2,chrome:n=>n.polish.chrome=0,aura:n=>n.polish.auraSize=1};
 for(const l of LOOKS){const s=createSession('trend-'+l.id);s.plan=targetDesign(customer(s.client));s.plan.nails.forEach(wrong[l.id]);assert.equal(designRequirements(s).find(c=>c.key==='material').ok,false,l.id);}
 const d=lookDesign('liquid');for(const [key,value] of [['opacity',0],['layers',4],['catWidth',2],['tipColor','<script>'],['dots','yes'],['extra',1]]){const bad=structuredClone(d);bad.nails[0].polish[key]=value;assert.throws(()=>validateDesign(bad));}
});
test('layered cat-eye and French designs retain their material and optional steps',()=>{
 const s=createSession('trend-liquid');s.plan=targetDesign(customer(s.client));s.plan.nails[0].pattern='french';s.plan.nails[0].polish.dots=true;
 assert.ok(designRequirements(s).every(c=>c.ok));assert.equal(validateSession(s).plan.nails[0].pattern,'french');
 const mixed=createSession('qiao');mixed.plan=targetDesign(customer('qiao'));mixed.plan.nails[0].finish='catEye';
 assert.ok(stepsFor(customer('qiao'),mixed.plan).includes('magnet'));mixed.phase='work';mixed.step=stepsFor(customer('qiao'),mixed.plan).indexOf('magnet')-1;
 for(const i of targetsFor(mixed))complete(mixed,i,stepId(mixed));nextStep(mixed);
 assert.ok(!mixed.work[0].done.includes('magnet'));assert.ok(mixed.work.slice(1).every(w=>w.done.includes('magnet')));assert.ok(evaluateService(mixed).missing.some(m=>m.step==='magnet'&&m.index===0));
 assert.equal(polishValues({finish:'metal'}).chrome,1);
});
test('final cured polish no longer contains temporary application trails',()=>{
 const s=createSession('trend-chrome');s.plan=targetDesign(customer(s.client));s.phase='result';s.step=stepsFor(customer(s.client),s.plan).length-1;
 for(const i of targetsFor(s))for(const step of stepsFor(customer(s.client),s.plan))complete(s,i,step);
 assert.ok(viewDesign(s).nails.every(n=>!n.surface&&n.polish.chrome===1));assert.equal(evaluateService(s).complete,true);
});
