import {customer,evaluateService} from './service.js';
import {SHOP,DEFAULT_STUDIO,owns} from './studio.js';
export const WALLET_KEY='finger-poetry-wallet-v1';
export function serviceReward(session){
 const c=customer(session.client),evaluation=evaluateService(session);if(session.phase!=='result'||!evaluation.complete)throw Error('完成服务并交付后才能领取金币。');
 const service=c.price,bonus=session.consultation?.length===4?5:0,loyalty=c.returnOf?Math.min(3,session.returnVisit||0)*5:0,tip=Math.round(service*.15)+bonus+loyalty;
 return {service,tip,bonus,total:service+tip,client:session.client,...(loyalty?{loyalty}:{})};
}
export function loadWallet(storage=localStorage){
 const raw=storage.getItem(WALLET_KEY);if(!raw)return {receipts:[],purchases:[],studio:{...DEFAULT_STUDIO},balance:0,income:0,spent:0};
 return validateWallet(JSON.parse(raw));
}
export function validateWallet(value){
 if(value?.version!==1||!Array.isArray(value.receipts))throw Error('金币记录无法读取，原记录已保留。');
 const ids=new Set();let balance=0;
 for(const r of value.receipts){if(!r||typeof r.id!=='string'||!r.id||r.id.length>120||ids.has(r.id)||!customer(r.client)||!Number.isSafeInteger(r.service)||r.service<0||!Number.isSafeInteger(r.tip)||r.tip<0||r.total!==r.service+r.tip||!Number.isSafeInteger(r.total)||r.total<=0)throw Error('金币记录无效，原记录已保留。');ids.add(r.id);balance+=r.total;if(!Number.isSafeInteger(balance))throw Error('金币总额无效。');}
 for(const r of value.receipts){if(r.title!==undefined&&(typeof r.title!=='string'||r.title.length>60)||r.at!==undefined&&(!Number.isSafeInteger(r.at)||r.at<0)||r.loyalty!==undefined&&![0,5,10,15].includes(r.loyalty))throw Error('回访记录无效');}
 if(value.studio!==undefined&&(!value.studio||typeof value.studio!=='object'||Array.isArray(value.studio)||Object.keys(value.studio).some(k=>!Object.hasOwn(DEFAULT_STUDIO,k))))throw Error('工作室布置无效');
 const purchases=value.purchases===undefined?[]:value.purchases,studio={...DEFAULT_STUDIO,...value.studio};if(!Array.isArray(purchases)||purchases.length>SHOP.length)throw Error('购买记录无效');
 const bought=new Set();let spent=0;for(const p of purchases){const item=SHOP.find(i=>i.id===p?.id);if(!item||p.price!==item.price||bought.has(p.id))throw Error('购买记录无效');bought.add(p.id);spent+=p.price;}
 if(spent>balance)throw Error('金币不足，购买记录无效');
 if(!['default','sage-mat'].includes(studio.mat)||studio.mat!=='default'&&!bought.has(studio.mat)||!['default','rose-tray'].includes(studio.tray)||studio.tray!=='default'&&!bought.has(studio.tray)||!['left','right'].includes(studio.layout)||studio.display!==null&&(typeof studio.display!=='string'||studio.display.length>120||!bought.has('display')))throw Error('工作室布置无效');
 return {receipts:value.receipts,purchases,studio,income:balance,spent,balance:balance-spent};
}
function writeWallet(wallet,storage){const value={version:1,receipts:wallet.receipts,purchases:wallet.purchases,studio:wallet.studio};validateWallet(value);storage.setItem(WALLET_KEY,JSON.stringify(value));return loadWallet(storage);}
export function purchaseItem(id,storage=localStorage){
 const wallet=loadWallet(storage),item=SHOP.find(i=>i.id===id);if(!item)throw Error('找不到这件材料或布置');if(owns(wallet,id))return {...wallet,added:false};if(wallet.balance<item.price)throw Error('金币不足，完成服务并领取收入后再来。');
 wallet.purchases.push({id,price:item.price});return {...writeWallet(wallet,storage),added:true};
}
export function arrangeStudio(changes,storage=localStorage){const wallet=loadWallet(storage);wallet.studio={...wallet.studio,...changes};return writeWallet(wallet,storage);}
export function importWallet(value,storage=localStorage){const wallet=validateWallet(value);return writeWallet(wallet,storage);}
export function walletBackup(storage=localStorage){const wallet=loadWallet(storage);return {version:1,receipts:wallet.receipts,purchases:wallet.purchases,studio:wallet.studio};}
export function claimReward(session,storage=localStorage){
 const reward=serviceReward(session),wallet=loadWallet(storage);
 if(typeof session.id!=='string'||!session.id||session.id.length>120)throw Error('服务编号无效，无法领取金币。');
 const existing=wallet.receipts.find(r=>r.id===session.id);if(existing)return {...wallet,receipt:existing,added:false};
 const receipt={id:session.id,...reward,title:customer(session.client).title,at:Date.now()};if(!Number.isSafeInteger(wallet.income+receipt.total))throw Error('金币总额超出范围。');
 wallet.receipts.push(receipt);return {...writeWallet(wallet,storage),receipt,added:true};
}
