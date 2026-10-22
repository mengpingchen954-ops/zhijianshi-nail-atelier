import {customer,evaluateService} from './service.js';
export const WALLET_KEY='finger-poetry-wallet-v1';
export function serviceReward(session){
 const c=customer(session.client),evaluation=evaluateService(session);if(session.phase!=='result'||!evaluation.complete)throw Error('完成服务并交付后才能领取金币。');
 const service=c.price,bonus=session.consultation?.length===4?5:0,tip=Math.round(service*.15)+bonus;
 return {service,tip,bonus,total:service+tip,client:session.client};
}
export function loadWallet(storage=localStorage){
 const raw=storage.getItem(WALLET_KEY);if(!raw)return {receipts:[],balance:0};
 const value=JSON.parse(raw);if(value?.version!==1||!Array.isArray(value.receipts))throw Error('金币记录无法读取，原记录已保留。');
 const ids=new Set();let balance=0;
 for(const r of value.receipts){if(!r||typeof r.id!=='string'||!r.id||r.id.length>120||ids.has(r.id)||!customer(r.client)||!Number.isSafeInteger(r.service)||r.service<0||!Number.isSafeInteger(r.tip)||r.tip<0||r.total!==r.service+r.tip||!Number.isSafeInteger(r.total)||r.total<=0)throw Error('金币记录无效，原记录已保留。');ids.add(r.id);balance+=r.total;if(!Number.isSafeInteger(balance))throw Error('金币总额无效。');}
 return {receipts:value.receipts,balance};
}
export function claimReward(session,storage=localStorage){
 const reward=serviceReward(session),wallet=loadWallet(storage);
 if(typeof session.id!=='string'||!session.id||session.id.length>120)throw Error('服务编号无效，无法领取金币。');
 const existing=wallet.receipts.find(r=>r.id===session.id);if(existing)return {...wallet,receipt:existing,added:false};
 const receipt={id:session.id,...reward};if(!Number.isSafeInteger(wallet.balance+receipt.total))throw Error('金币总额超出范围。');
 const receipts=[...wallet.receipts,receipt];storage.setItem(WALLET_KEY,JSON.stringify({version:1,receipts}));
 return {receipts,balance:wallet.balance+receipt.total,receipt,added:true};
}
