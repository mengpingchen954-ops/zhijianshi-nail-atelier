import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,customer,targetDesign,stepsFor,targetsFor,complete,designRequirements,validateSession} from '../src/service.js';
import {WALLET_KEY,claimReward,loadWallet,purchaseItem,arrangeStudio,walletBackup,importWallet,serviceReward} from '../src/rewards.js';
import {SHOP,lessonProgress,relationship,appointmentAccess,serviceFeedback} from '../src/studio.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
function finished(id){const s=createSession(id);s.plan=targetDesign(customer(id));s.consultation=['style','care','comfort','budget'];for(const step of stepsFor(customer(id),s.plan).filter(k=>k!=='finish'))for(const i of targetsFor(s))complete(s,i,step);s.phase='result';return s;}
test('legacy income migrates without loss; purchases are atomic and survive later claims',()=>{
 const store=storage(),s=finished('lin');store.setItem(WALLET_KEY,JSON.stringify({version:1,receipts:[{id:s.id,...serviceReward(s)}]}));assert.equal(loadWallet(store).balance,198);
 assert.equal(purchaseItem('sea-glass',store).balance,138);assert.equal(purchaseItem('sea-glass',store).added,false);assert.equal(purchaseItem('sea-glass',store).balance,138);
 const second=finished('xia');claimReward(second,store);const w=loadWallet(store);assert.equal(w.income,465);assert.equal(w.spent,60);assert.equal(w.balance,405);assert.deepEqual(w.purchases,[{id:'sea-glass',price:60}]);
 const raw=store.getItem(WALLET_KEY),failing={getItem:store.getItem,setItem(){throw Error('quota');}};assert.throws(()=>purchaseItem('sage-mat',failing),/quota/);assert.equal(store.getItem(WALLET_KEY),raw);
 assert.throws(()=>purchaseItem('display',storage()),/不足/);assert.throws(()=>purchaseItem('unknown',store));assert.equal(claimReward(second,store).balance,405);
});
test('course progression requires sequential completed paid lessons and every authored lesson is achievable',()=>{
 const store=storage();assert.deepEqual(lessonProgress(loadWallet(store)).map(l=>l.open),[true,false,false,false,false]);assert.equal(appointmentAccess(loadWallet(store),customer('lesson-2')),false);
 for(let i=1;i<=5;i++){const s=finished('lesson-'+i);assert.ok(designRequirements(s).every(c=>c.ok),s.client);assert.deepEqual(validateSession(s),s);claimReward(s,store);assert.ok(lessonProgress(loadWallet(store))[i-1].passed);if(i<5)assert.ok(appointmentAccess(loadWallet(store),customer('lesson-'+(i+1))));}
 const previous=loadWallet(store).balance;claimReward(finished('lesson-1'),store);assert.ok(loadWallet(store).balance>previous);assert.equal(lessonProgress(loadWallet(store)).filter(l=>l.passed).length,5);
});
test('family memory counts seasonal and classic visits once and return bonuses are explicit',()=>{
 const store=storage();assert.equal(appointmentAccess(loadWallet(store),customer('return-lin')),false);const first=finished('lin');claimReward(first,store);claimReward(first,store);
 assert.deepEqual(relationship(loadWallet(store),'return-lin'),{visits:1,level:'再次相见',lastTitle:'玫瑰奶冻'});assert.ok(appointmentAccess(loadWallet(store),customer('return-lin')));
 const returning=finished('return-lin');returning.returnVisit=1;assert.equal(serviceReward(returning).loyalty,5);claimReward(returning,store);assert.equal(relationship(loadWallet(store),'lin').visits,2);assert.equal(relationship(loadWallet(store),'lin').lastTitle,'玫瑰水光');assert.equal(claimReward(returning,store).added,false);
 returning.returnVisit=-1;assert.throws(()=>validateSession(returning));
});
test('owned furnishing choices and backup restore validate before changing stored state',()=>{
 const store=storage();claimReward(finished('qiao'),store);claimReward(finished('xia'),store);assert.throws(()=>arrangeStudio({mat:'sage-mat'},store));purchaseItem('sage-mat',store);purchaseItem('rose-tray',store);purchaseItem('display',store);arrangeStudio({mat:'sage-mat',tray:'rose-tray',display:'work-1',layout:'left'},store);
 const data=walletBackup(store),other=storage();importWallet(data,other);assert.deepEqual(loadWallet(other),loadWallet(store));const raw=other.getItem(WALLET_KEY);
 for(const mutate of [d=>d.purchases.push(d.purchases[0]),d=>d.purchases[0].price=1,d=>d.purchases=null,d=>d.studio.layout='script',d=>d.studio.extra=true,d=>d.receipts[0].total=0,d=>d.receipts[0].title='<'.repeat(61),d=>d.receipts[0].loyalty='<img>']){const bad=structuredClone(data);mutate(bad);assert.throws(()=>importWallet(bad,other));assert.equal(other.getItem(WALLET_KEY),raw);}
});
test('delivery gives separate data-based feedback and recognizes original accent locations',()=>{
 const s=finished('lin');s.plan.nails[0].decorations=s.plan.nails[3].decorations;s.plan.nails[3].decorations=[];const report=serviceFeedback(s);assert.equal(report.length,4);assert.ok(report.every(r=>r.ok));assert.ok(report[1].text.includes('换了指位'));s.plan.nails[0].length=1;assert.equal(serviceFeedback(s)[2].ok,false);
 assert.equal(SHOP.filter(i=>i.kind==='material').length,3);
});
