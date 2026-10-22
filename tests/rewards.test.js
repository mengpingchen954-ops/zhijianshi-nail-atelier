import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIENTS,createSession,targetDesign,customer,complete,stepsFor,targetsFor,validateSession,beginWork} from '../src/service.js';
import {consultationTopics} from '../src/consultation.js';
import {WALLET_KEY,serviceReward,claimReward,loadWallet} from '../src/rewards.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
function finished(id='lin'){const s=createSession(id);s.plan=targetDesign(customer(id));for(const k of stepsFor(customer(id)).filter(k=>k!=='finish'))for(const i of targetsFor(s))complete(s,i,k);s.phase='result';s.consultation=['style','care','comfort','budget'];return s;}
test('each customer has distinct consultation, and incomplete new consultation blocks work',()=>{
 for(const c of CLIENTS){const topics=consultationTopics(c);assert.deepEqual(topics.map(t=>t.id),['style','care','comfort','budget']);assert.ok(topics.every(t=>t.answer.length>20));}
 const s=createSession('lin');s.plan=targetDesign(customer('lin'));s.consultation=['care'];assert.throws(()=>beginWork(s),/顾客/);s.consultation=['style','care','comfort','budget'];assert.doesNotThrow(()=>beginWork(s));assert.deepEqual(validateSession(s).consultation,s.consultation);s.consultation=['care','care'];assert.throws(()=>validateSession(s));
});
test('only completed delivered services earn a stable tip; records prevent duplicate claims',()=>{
 const store=storage(),s=finished();const reward=serviceReward(s);assert.deepEqual(reward,{service:168,tip:30,bonus:5,total:198,client:'lin'});
 const first=claimReward(s,store);assert.equal(first.balance,198);assert.equal(first.added,true);const again=claimReward(structuredClone(s),store);assert.equal(again.added,false);assert.equal(again.balance,198);assert.equal(loadWallet(store).receipts.length,1);
 const other=finished('zhou');claimReward(other,store);assert.equal(loadWallet(store).balance,247);
 assert.throws(()=>claimReward(createSession('lin'),store));const incomplete=finished();incomplete.work[0].done=[];assert.throws(()=>claimReward(incomplete,store));
 const legacy=finished();delete legacy.consultation;assert.equal(serviceReward(legacy).tip,25);
});
test('invalid income and failed writes preserve the previous wallet and can be retried',()=>{
 const store=storage(),s=finished();claimReward(s,store);const raw=store.getItem(WALLET_KEY),other=finished('xia'),failing={getItem:store.getItem,setItem(){throw Error('quota');}};
 assert.throws(()=>claimReward(other,failing),/quota/);assert.equal(store.getItem(WALLET_KEY),raw);assert.ok(claimReward(other,store).added);
 store.setItem(WALLET_KEY,'broken');assert.throws(()=>claimReward(finished(),store));assert.equal(store.getItem(WALLET_KEY),'broken');
 store.setItem(WALLET_KEY,JSON.stringify({version:1,receipts:[{id:'bad',client:'lin',service:168,tip:30,total:-1}]}));assert.throws(()=>loadWallet(store));
});
