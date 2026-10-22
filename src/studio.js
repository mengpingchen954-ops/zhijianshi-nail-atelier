import {customer,designRequirements,targetsFor,stepsFor} from './service.js';

export const SHOP=[
 {id:'sea-glass',name:'海玻璃透色胶',kind:'material',price:60,description:'三色清透配方，适合薄涂留白。',colors:['#8aaeb0','#b4c8ba','#cfb9cb'],finish:'gloss',polish:{opacity:.3,layers:2,chrome:.12}},
 {id:'moon-powder',name:'冷月磁光粉',kind:'material',price:90,description:'蓝银宽柔光，可叠加细法式或波点。',colors:['#52627c','#879bb0','#c3c6dd'],finish:'catEye',polish:{opacity:.7,layers:2,catWidth:.34,catSoftness:.95,catColor:'#d6edff',chrome:0}},
 {id:'peach-glaze',name:'蜜桃珠光釉',kind:'material',price:90,description:'蜜桃色与暖金反光，让深浅底色都有柔光。',colors:['#d49a8b','#edc7b5','#b87d83'],finish:'gloss',polish:{opacity:.46,layers:2,chrome:.42}},
 {id:'sage-mat',name:'鼠尾草工作垫',kind:'furniture',price:120,description:'把 3D 工作台的奶油垫换成柔和灰绿。'},
 {id:'rose-tray',name:'玫瑰铜托盘',kind:'furniture',price:140,description:'换上玫瑰铜托盘，搭配两种桌面摆位。'},
 {id:'display',name:'指尖作品陈列架',kind:'furniture',price:180,description:'在 3D 工作台陈列自己收藏的完整十指作品。'}
];
export const DEFAULT_STUDIO={mat:'default',tray:'default',layout:'right',display:null};
export const LESSONS=[
 {id:'lesson-1',name:'短甲纯色',badge:'稳稳铺色',hint:'先选短方圆甲与底色，学会涂布和整手照灯。'},
 {id:'lesson-2',name:'两指点缀',badge:'懂得留白',hint:'沿用短甲技巧，每只手安排一点星星，其余保持干净。'},
 {id:'lesson-3',name:'细法式甲片',badge:'贴合与细边',hint:'学习逐指选片、从甲根压合，再搭配巧克力细边。'},
 {id:'lesson-4',name:'猫眼磁吸',badge:'追光的人',hint:'保留短圆甲，移动磁铁和光带方向，满意后再固化。'},
 {id:'lesson-5',name:'复合搭配',badge:'独立主理人',hint:'把猫眼、细法式与少量金箔组合成完整十指。'}
];
export function lessonProgress(wallet){
 const passed=new Set(wallet.receipts.map(r=>r.client));let unlocked=1;
 while(unlocked<LESSONS.length&&passed.has(LESSONS[unlocked-1].id))unlocked++;
 return LESSONS.map((l,i)=>({...l,passed:passed.has(l.id),open:i<unlocked}));
}
export function owns(wallet,id){return wallet.purchases.some(p=>p.id===id);}
export function relationship(wallet,client){
 const c=typeof client==='string'?customer(client):client;
 const receipts=wallet.receipts.filter(r=>!customer(r.client).lesson&&customer(r.client).name===c.name),visits=receipts.length,last=receipts.at(-1);
 return {visits,level:visits>=3?'知心常客':visits>=2?'熟悉的朋友':visits?'再次相见':'初次见面',lastTitle:last?.title||customer(last?.client)?.title||null};
}
export function appointmentAccess(wallet,c){
 if(c.lesson)return lessonProgress(wallet).find(l=>l.id===c.id)?.open||false;
 if(c.returnOf)return relationship(wallet,c).visits>0;
 return true;
}
export function lessonTip(s){
 const c=customer(s.client);if(!c.lesson)return null;
 if(s.phase==='plan'){
  const missing=designRequirements(s).find(r=>!r.ok);
  if(!missing)return '十指检查通过。点击「确认十指」开始亲手服务。';
  return ({painted:'点下方一指 → 在右侧选底色。喜欢同色系时可用「十指同底色」。',shape:'先把当前指改成顾客要求的甲形，再逐指调整。',length:'长度滑杆保持在绿色区间，短甲更容易上手。',effect:c.lesson>=4?'表面选猫眼；需要细法式时，在「图案叠加」单独选择。':'图案选法式边，使用参考材料配方获得细边，再自行安排颜色。',features:'选中星星或金箔后，点当前甲面落位；两指点缀即可。',material:'使用参考材料配方，再调细法式边宽至 10% 以内。'})[missing.key]||missing.label;
 }
 const step=stepsFor(c,s.plan)[s.step];return ({inspect:'先点一次甲面记录甲况，再用下方辅助完成本手。',file:'选一指近景，在指尖前缘左右来回锉，停住不会完成。',dust:'在甲面来回扫动，把修锉浮尘扫干净。',fit:'点击「拿取适合本指的候选甲片」，按住甲片移到甲根后松手。',bond:'从甲根按住，慢慢推向指尖；从中间开始不能压合。',magnet:'在甲面移动磁铁，看光带改变；满意后点击「锁定本指布局」。',decor:'半透明图案是落位提示，点击它把装饰贴上去。',finish:'交付后收下收入，本课才会记入手册并解锁下一课。'})[step]||(step?.startsWith('cure')?'分别选择左手和右手入灯。提前取手不算固化，可缩短等待。':'选一指近景，按住并刷过甲面各区域。亲手完成一指后，可辅助本手其余指。');
}
export function serviceFeedback(s){
 const c=customer(s.client),checks=designRequirements(s),nails=targetsFor(s).map(i=>s.plan.nails[i]),ok=key=>checks.filter(r=>key.includes(r.key)).every(r=>r.ok);
 const changed=nails.filter((n,j)=>{const i=targetsFor(s)[j];return n.decorations.some(d=>!d.hidden)&&!c.feature.includes(i);}).length;
 return [
  {name:'色系与透感',ok:ok(['palette','painted','material']),text:ok(['palette','painted','material'])?'底色与配方符合她选的方向，十指保留了统一的色调。':'再核对底色、透度与材料配方。'},
  {name:'重点工艺',ok:ok(['effect','features']),text:ok(['effect','features'])?`完成了${c.finish==='catEye'?'猫眼磁吸':c.pattern==='french'?'细法式':c.pattern==='aura'?'中心光晕':'参考重点'}${changed?'，装饰换了指位，仍符合顾客需求':'，重点与留白彼此呼应'}。`:'查看顾客要求的图案、工艺与装饰数量。'},
  {name:'日常实用',ok:ok(['shape','length','comfort']),text:ok(['shape','length','comfort'])?`${c.limit}。甲形、长度与装饰满足这次的日常要求。`:'把甲形、长度和凸起装饰调整到顾客能接受的范围。'},
  {name:'服务完成度',ok:s.work.every((w,i)=>!targetsFor(s).includes(i)||stepsFor(c,s.plan).filter(k=>k!=='finish').every(k=>w.done.includes(k))),text:'按实际完成记录检查施工与三轮固化；款式评价依据设计数据。'}
 ];
}
