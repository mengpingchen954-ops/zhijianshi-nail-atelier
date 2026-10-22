import {createDesign,clone,uid,insideNail,validateDesign,clamp} from './state.js';

export const CLIENTS=[
 {id:'lin',name:'林悦',role:'花店店主',initial:'悦',skin:'#dbad96',color:'#d99aa7',palette:['#e9b6bd','#f7e9d7','#a6b5a0'],title:'玫瑰奶冻',quote:'想把花店的一点温柔，留在指尖。短一点，方便包花。',route:'natural',old:null,dirty:true,width:1.12,curve:.92,shape:'round',length:.49,finish:'gloss',pattern:null,deco:'flower',feature:[3,8],price:168,limit:'短圆甲 · 本甲建构 · 两指小花 · 不要大钻'},
 {id:'su',name:'苏禾',role:'钢琴老师',initial:'禾',skin:'#e6bca7',color:'#bd9aa6',palette:['#dfb4b6','#f5e9dc','#d6b46d'],title:'指尖的休止符',quote:'细细的法式就好。要弹琴，请保持短甲，也不要凸起的装饰。',route:'natural',old:null,dirty:true,width:.94,curve:1.18,shape:'square',length:.45,finish:'gloss',pattern:'french',deco:null,feature:[],price:188,limit:'短方圆 · 裸粉细法式 · 无凸起装饰'},
 {id:'xia',name:'夏宁',role:'旅行摄影师',initial:'宁',skin:'#c28b70',color:'#85b6ca',palette:['#89bfd1','#f3e6d6','#c5b69b'],title:'海盐明信片',quote:'下周出发去海边，想做一套蓝色渐变，短杏仁甲片就很喜欢。',route:'tips',old:null,dirty:false,width:1.02,curve:1.22,shape:'almond',length:.7,finish:'gloss',pattern:'gradient',deco:'pearl',feature:[2,7],price:228,limit:'短杏仁甲片 · 蓝白渐变 · 两指小珍珠'},
 {id:'wen',name:'温岚',role:'书店常客',initial:'岚',skin:'#d4a58a',color:'#819b85',palette:['#4e7565','#b5be9d','#d8bc7b'],title:'森林里的来信',quote:'旧红色想换掉了。这次做绿色斜猫眼，像树叶间透下来的光。',route:'natural',old:'gel',dirty:false,width:.99,curve:1.05,shape:'round',length:.56,finish:'catEye',pattern:null,deco:'star',feature:[3,8],price:238,limit:'卸旧色胶 · 本甲建构 · 绿色斜猫眼 · 两指星星'},
 {id:'qiao',name:'乔安',role:'活动策划师',initial:'安',skin:'#e3b7a2',color:'#b1a2c8',palette:['#b4a1c7','#f6eadb','#cfb078'],title:'月光邀请函',quote:'旧甲片有两指翘了。请卸掉重做，想要杏仁形和一点珍珠月光。',route:'tips',old:'tips',dirty:true,width:.92,curve:1.12,shape:'almond',length:.86,finish:'gloss',pattern:'marble',deco:'pearl',feature:[1,3,6,8],price:288,limit:'卸旧甲片 · 杏仁形重贴 · 紫色晕纹 · 珍珠'},
 {id:'tang',name:'唐梨',role:'陶艺师',initial:'梨',skin:'#bd8f76',color:'#c99571',palette:['#bd805f','#ead6bc','#8c9b7f'],title:'秋日陶片',quote:'刚忙完陶艺课，指尖有点灰。想做干净的暖色，留一点小小的金色。',route:'natural',old:null,dirty:true,width:1.16,curve:.85,shape:'square',length:.48,finish:'matte',pattern:null,deco:'foil',feature:[3,8],price:188,limit:'清洁 · 短方圆本甲 · 陶土色哑光 · 少量金箔'},
 {id:'lu',name:'陆晴',role:'视觉设计师',initial:'晴',skin:'#d8a493',color:'#c0899f',palette:['#b6758d','#efd8dd','#8c7c9f'],title:'不对称的心动',quote:'左右手不要一模一样。左手蝴蝶结，右手留给小蝴蝶，像两页手帐。',route:'tips',old:null,dirty:false,width:1.04,curve:1.1,shape:'oval',length:.71,finish:'gloss',pattern:'gradient',deco:'bow',feature:[1,3,7,9],price:258,limit:'椭圆甲片 · 左右不对称 · 蝴蝶结与蝴蝶'},
 {id:'zhou',name:'周星',role:'插画师 · 回访',initial:'星',skin:'#d2a080',color:'#7489b2',palette:['#34486a','#9ba8c5','#d5bc7d'],title:'补回一颗星',quote:'上次做的很喜欢，只是右手食指掉了一片。其他九指请帮我保留。',route:'repair',old:null,dirty:false,width:.96,curve:1.08,shape:'round',length:.58,finish:'catEye',pattern:null,deco:'star',feature:[1,6],price:38,limit:'仅维修右食指 · 匹配旧款 · 保留其余九指'}
];
export const STAGES={
 inspect:{name:'检查甲况',short:'检查',tool:'inspect',hint:'逐指检查甲床、旧材料与污垢，点击甲面记录。',sound:'pick'},
 remove:{name:'卸除旧材料',short:'卸旧',tool:'drill',hint:'在旧材料上来回移动；完成后露出本甲。',sound:'drill'},
 clean:{name:'清洁指尖',short:'清洁',tool:'wipe',hint:'用清洁棉擦过甲面，把可见污垢和残留处理干净。',sound:'wipe'},
 file:{name:'修整甲形',short:'修形',tool:'file',hint:'沿指尖前缘来回锉动，修到蓝图轮廓。仅处理可修的自由缘。',sound:'file'},
 dust:{name:'扫净浮尘',short:'除尘',tool:'brush',hint:'轻刷甲面，扫掉刚刚修锉产生的粉尘。',sound:'brush'},
 base:{name:'涂配套底层',short:'底层',tool:'polish',hint:'刷过甲面各个区域，完成本次服务的底层。',sound:'paint'},
 build:{name:'本甲建构',short:'建构',tool:'gel',hint:'铺开建构胶，覆盖甲面；侧面查看顶点与厚薄，再送入灯中。',sound:'gel'},
 fit:{name:'逐指选片',short:'试片',tool:'tip',hint:'选择宽度与曲率合适的甲片，再点击甲面试贴确认。',sound:'tip'},
 bond:{name:'甲片贴合',short:'贴合',tool:'press',hint:'由指根向指尖平稳压合，覆盖甲面以排除贴合气泡。',sound:'gel'},
 cureBase:{name:'基础层固化',short:'照灯',tool:'lamp',hint:'基础层已就绪。整手进入固化灯，五指一起完成本轮固化。',sound:null,cure:true},
 color:{name:'按蓝图上色',short:'做款',tool:'polish',hint:'沿甲面涂布，蓝图中的颜色、法式或纹理会随刷动显现。',sound:'paint'},
 magnet:{name:'猫眼磁吸',short:'磁吸',tool:'magnet',hint:'移动磁铁调整亮带，方向滑杆控制斜度；满意后确认当前指。',sound:null},
 decor:{name:'贴纸与饰品',short:'装饰',tool:'tweezers',hint:'按照半透明蓝图的位置，点击放下贴纸或立体饰品。',sound:'sticker'},
 cureColor:{name:'款式层固化',short:'照灯',tool:'lamp',hint:'整手进入固化灯，五指一起锁定本轮款式与猫眼布局。',sound:null,cure:true},
 top:{name:'涂封层',short:'封层',tool:'polish',hint:'刷满甲面完成封层；哑光与亮泽会保留各自质感。',sound:'paint'},
 cureTop:{name:'封层固化',short:'照灯',tool:'lamp',hint:'整手进入固化灯，五指一起完成最后一轮固化。',sound:null,cure:true},
 finish:{name:'交付作品',short:'交付',tool:'camera',hint:'检查十指，拍照、收藏，并听听顾客的反馈。',sound:'camera'}
};
export const SESSION_KEY='finger-poetry-service-v2',ALBUM_KEY='finger-poetry-album-v2';
export const customer=id=>CLIENTS.find(c=>c.id===id);
export function targetDesign(c){
 const d=createDesign();d.name=c.title;d.nails.forEach((n,i)=>{Object.assign(n,{shape:c.shape,length:c.length,base:c.palette[i%5===3?1:0],finish:c.finish,topcoat:c.finish==='matte'?'matte':'gloss',pattern:c.pattern==='gradient'?null:c.pattern,width:c.width*(1+((i*7)%5-2)*.025),curve:c.curve,build:.7});
 if(c.pattern==='gradient')n.gradient={color:c.palette[1],angle:15,range:.85};
 if(c.feature.includes(i)&&c.deco)n.decorations.push({id:uid(),type:c.id==='lu'&&i>4?'butterfly':c.deco,u:.5,v:.54,rotation:i>4?-.18:.18,scale:1.1});
 });return d;
}
export function blankPlan(c){
 const d=c.route==='repair'?targetDesign(c):createDesign();d.name=c.title;
 d.nails.forEach((n,i)=>{if(c.route==='repair'&&i!==6)return;Object.assign(n,{shape:'round',length:.45,base:'#f4efe8',finish:'gloss',topcoat:'gloss',gradient:null,pattern:null,decorations:[],strokes:[],width:c.width*(1+((i*7)%5-2)*.025),curve:c.curve,build:0,unpainted:true});});return d;
}
export function stepsFor(c){
 const steps=['inspect'];if(c.old)steps.push('remove');if(c.dirty||c.old)steps.push('clean');steps.push('file','dust','base');steps.push(...(c.route==='natural'?['build']:['fit','bond']));steps.push('cureBase','color');if(c.finish==='catEye')steps.push('magnet');if(c.deco)steps.push('decor');steps.push('cureColor','top','cureTop','finish');return steps;
}
export const targetsFor=s=>s.client==='zhou'?[6]:Array.from({length:10},(_,i)=>i);
export function createSession(id){
 const c=customer(id);if(!c)throw Error('顾客不存在');
 return {version:2,planningVersion:1,id:uid(),client:id,phase:'plan',step:0,plan:blankPlan(c),work:Array.from({length:10},(_,i)=>({done:[],coverage:{},fitWidth:0,fitCurve:0,magnet:{u:.5,angle:-.55},dirty:c.dirty?(i%3===0?.9:.45):0,old:c.old?(i%4===0?.65:1):0,initialLength:c.route==='natural'?c.length+.12+(i%4)*.025:.48+(i%4)*.025,build:0})),lamp:null,createdAt:Date.now(),delivered:false};
}
export const stepId=s=>stepsFor(customer(s.client))[s.step];
export const validCells=n=>Array.from({length:15},(_,i)=>({i,u:.2+(i%3)*.3,v:.12+Math.floor(i/3)*.18})).filter(p=>insideNail(n,p.u,p.v,.02));
export function progress(s,index,step=stepId(s)){
 const w=s.work[index];if(w.done.includes(step))return 1;
 const cells=validCells(s.plan.nails[index]),covered=w.coverage[step]||[];return Math.min(1,covered.length/Math.max(1,cells.length*.88));
}
export function complete(s,index,step=stepId(s)){const w=s.work[index];if(!w.done.includes(step))w.done.push(step);}
export function stageDone(s){return targetsFor(s).every(i=>s.work[i].done.includes(stepId(s)));}
export function workAt(s,index,u,v,distance=.1){
 const step=stepId(s),w=s.work[index],n=s.plan.nails[index];if(s.phase!=='work'||!targetsFor(s).includes(index)||w.done.includes(step)||STAGES[step].cure||step==='finish')return false;
 if(step==='inspect'){complete(s,index);return true;}
 if(step==='fit'){const expectedW=(index%5===0?3:index%5===4?0:1)+(customer(s.client).width>1.1?1:0),expectedC=customer(s.client).curve>1.1?1:0;if(w.fitWidth!==expectedW||w.fitCurve!==expectedC)return false;complete(s,index);return true;}
 if(step==='magnet'){w.magnet.u=clamp(u,.12,.88);return true;}
 if(step==='decor')return false;
 if(!insideNail(n,u,v)||distance<.005||step==='file'&&v<.62)return false;
 const paths=(w.paths??={})[step]??=((w.paths)[step]=[]);const last=paths.at(-1);if(paths.length<500&&(!last||Math.hypot(last[0]-u,last[1]-v)>.035))paths.push([u,v]);
 const arr=w.coverage[step]??=[];
 if(step==='file'){w.fileTravel=Math.min(1,(w.fileTravel||0)+Math.min(distance,.2)*1.3);if(w.fileTravel>=1)complete(s,index);return true;}
 for(const p of validCells(n))if(Math.hypot(p.u-u,p.v-v)<.32&&!arr.includes(p.i))arr.push(p.i);
 if(step==='build')w.build=progress(s,index,step)*.7;
 if(progress(s,index,step)>=1)complete(s,index);return true;
}
export function placeDecoration(s,index,u,v){
 if(stepId(s)!=='decor'||!targetsFor(s).includes(index))return false;const w=s.work[index],ns=s.plan.nails[index].decorations;
 if(!ns.length){complete(s,index);return true;}
 const placed=w.coverage.decor??=[];const target=ns.findIndex((d,i)=>!d.hidden&&!placed.includes(i)&&Math.hypot(d.u-u,d.v-v)<.24);
 if(target<0)return false;placed.push(target);if(placed.length===ns.filter(d=>!d.hidden).length)complete(s,index);return true;
}
export function nextStep(s){if(!stageDone(s))throw Error('请先完成本阶段所有待处理手指');if(stepId(s)==='finish')return; s.step++;const id=stepId(s);if(id==='decor')for(const i of targetsFor(s))if(!s.plan.nails[i].decorations.some(d=>!d.hidden))complete(s,i,id);}
export function beginWork(s){validateDesign(s.plan);const missing=designRequirements(s).filter(r=>!r.ok);if(missing.length)throw Error(missing.slice(0,2).map(r=>r.label).join('；'));s.phase='work';s.step=0;}
export function beginLamp(s,hand){
 const step=stepId(s);if(!STAGES[step].cure||s.lamp)throw Error('当前不能照灯');
 const indices=targetsFor(s).filter(i=>Math.floor(i/5)===hand&&!s.work[i].done.includes(step));if(!indices.length)throw Error('这只手已完成本轮固化');s.lamp={hand,remaining:4.5,indices};
}
export function advanceLamp(s,seconds){if(!s.lamp)return false;s.lamp.remaining=Math.max(0,s.lamp.remaining-clamp(seconds,0,10));if(s.lamp.remaining>0)return false;for(const i of s.lamp.indices)complete(s,i);s.lamp=null;return true;}
export function viewDesign(s){
 const c=customer(s.client),d=clone(s.plan),activeTargets=targetsFor(s),id=stepId(s);
 d.nails.forEach((n,i)=>{const w=s.work[i];if(!activeTargets.includes(i))return;const ready=key=>w.done.includes(key),color=ready('color'),pre=ready('remove')||!c.old;
 n.width=c.width*(1+((i*7)%5-2)*.025);n.curve=c.curve;n.build=ready('build')?.7:w.build;
 const fileFraction=ready('file')?1:w.fileTravel||0,goalLength=c.route==='natural'?s.plan.nails[i].length:.45;n.length=w.initialLength+(goalLength-w.initialLength)*fileFraction+(c.old==='tips'&&!ready('remove')?.35:0);n.shapeBlend=fileFraction;
 if(ready('bond'))n.length=s.plan.nails[i].length;
 if(ready('bond'))n.shapeBlend=1;
 n.decorations=ready('decor')?n.decorations:n.decorations.filter((_,k)=>(w.coverage.decor||[]).includes(k));
 n.magnet=clone(w.magnet);n.surface={undercoat:progress(s,i,'base'),paths:w.paths||{},old:pre?null:c.old,oldAmount:w.old,oldColor:c.old==='gel'?'#a9445c':'#cf91a8',remove:w.coverage.remove||[],dirty:ready('clean')?0:w.dirty,dust:ready('file')&&!ready('dust')?1:0,cleared:w.coverage.clean||[],dusted:w.coverage.dust||[],revealed:w.coverage.color||[],target:clone(s.plan.nails[i]),color,ghost:id==='decor'?s.plan.nails[i].decorations.filter((_,k)=>!(w.coverage.decor||[]).includes(k)):[],bonding:id==='bond'&&!ready('bond'),bond:w.coverage.bond||[]};
 if(!color){n.base='#e8b7ad';n.gradient=null;n.pattern=null;n.strokes=[];n.finish=ready('color')?c.finish:'gloss';}
 if(color)n.finish=s.plan.nails[i].finish;
  n.topcoat=ready('top')?s.plan.nails[i].topcoat:'gloss';
  if(id==='fit'||id==='bond'&&!ready('bond')){const expected=(i%5===0?3:i%5===4?0:1)+(c.width>1.1?1:0),sizes=[.74,.88,1,1.14,1.28];n.tipPreview={width:n.width*sizes[w.fitWidth]/sizes[expected],curve:w.fitCurve?1.2:.92,length:s.plan.nails[i].length,shape:s.plan.nails[i].shape};}
 });return d;
}
export function designRequirements(s){
 const c=customer(s.client),indices=targetsFor(s),nails=indices.map(i=>s.plan.nails[i]),has=(n,type)=>n.decorations.some(d=>!d.hidden&&d.type===type),count=type=>nails.filter(n=>has(n,type)).length;
 const painted=nails.every(n=>!n.unpainted),shape=nails.every(n=>n.shape===c.shape&&n.length<=c.length+.08);
 const patternOK=!c.pattern||(c.pattern==='french'?nails.every(n=>n.pattern==='french'):[...new Set(indices.map(i=>Math.floor(i/5)))].every(hand=>indices.some(i=>Math.floor(i/5)===hand&&(c.pattern==='gradient'?!!s.plan.nails[i].gradient:s.plan.nails[i].pattern===c.pattern))));
 const effect=nails.every(n=>n.finish===c.finish)&&patternOK;
 const palette=nails.every(n=>!n.unpainted&&c.palette.some(hex=>{const a=n.base.slice(1).match(/../g).map(v=>parseInt(v,16)),b=hex.slice(1).match(/../g).map(v=>parseInt(v,16));return Math.hypot(...a.map((v,i)=>v-b[i]))<55;}));
 const features=!c.deco||(c.id==='lu'?indices.filter(i=>i<5&&has(s.plan.nails[i],'bow')).length>=2&&indices.filter(i=>i>4&&has(s.plan.nails[i],'butterfly')).length>=2:count(c.deco)>=(c.route==='repair'?1:c.feature.length));
 const labels={flower:'小花',star:'星星',pearl:'珍珠',foil:'金箔',bow:'蝴蝶结'},effects={catEye:'猫眼',matte:'哑光',gloss:'亮泽',french:'法式',gradient:'渐变',marble:'晕纹'};
 const checks=[{key:'painted',label:`先为${indices.length===1?'维修指':'十指'}选择底色（${nails.filter(n=>!n.unpainted).length}/${nails.length}）`,ok:painted},{key:'shape',label:`${{round:'圆形',square:'方圆形',almond:'杏仁形',oval:'椭圆形'}[c.shape]}甲 · 长度 ≤ ${(c.length+.08).toFixed(2)}`,ok:shape},{key:'effect',label:`${effects[c.pattern||c.finish]}${['gradient','marble'].includes(c.pattern)?'：每只手至少一指，其余可自由搭配':''}`,ok:effect},{key:'palette',label:'使用顾客期望的色系',ok:palette}];
 if(c.deco)checks.push({key:'features',label:c.id==='lu'?'左手至少两指蝴蝶结，右手至少两指蝴蝶':`至少${c.route==='repair'?1:c.feature.length}指${labels[c.deco]} · 位置由你安排`,ok:features});
 if(c.id==='lin'||c.id==='su')checks.push({key:'comfort',label:c.id==='su'?'不使用凸起的水钻或珍珠':'不使用水钻',ok:nails.every(n=>!has(n,'gem')&&(c.id!=='su'||!has(n,'pearl')))});
 return checks;
}
export function evaluateService(s){
 const ids=stepsFor(customer(s.client)).filter(k=>k!=='finish'),indices=targetsFor(s),total=ids.length*indices.length,done=indices.reduce((sum,i)=>sum+ids.filter(k=>s.work[i].done.includes(k)).length,0),missing=[];
 for(const i of indices)for(const id of ids)if(!s.work[i].done.includes(id))missing.push({index:i,step:id,label:STAGES[id].name});
 const checks=designRequirements(s),style=checks.filter(r=>['painted','shape','effect'].includes(r.key)).every(r=>r.ok),features=checks.filter(r=>['features','comfort'].includes(r.key)).every(r=>r.ok),palette=checks.find(r=>r.key==='palette').ok;
 const score=Math.round(70*done/total+(style?10:0)+(features?10:0)+(palette?10:0));return {score,missing,style,features,palette,complete:done===total&&style&&features&&palette};
}
export function validateSession(value){
 const s=clone(value);if(!s||s.version!==2||!customer(s.client)||!['plan','work','result'].includes(s.phase)||!Number.isInteger(s.step)||s.step<0||s.step>=stepsFor(customer(s.client)).length||!Array.isArray(s.work)||s.work.length!==10)throw Error('服务存档格式无效');
 s.plan=validateDesign(s.plan);for(const w of s.work){if(!w||!Array.isArray(w.done)||w.done.length>20||!w.done.every(k=>Object.hasOwn(STAGES,k))||!w.coverage||typeof w.coverage!=='object'||!Number.isFinite(w.initialLength)||w.initialLength<.45||w.initialLength>1.3||!Number.isFinite(w.build)||w.build<0||w.build>1||!w.magnet||!Number.isFinite(w.magnet.u)||w.magnet.u<0||w.magnet.u>1||!Number.isFinite(w.magnet.angle)||Math.abs(w.magnet.angle)>Math.PI||![0,1,2,3,4].includes(w.fitWidth)||![0,1].includes(w.fitCurve)||!Number.isFinite(w.dirty)||w.dirty<0||w.dirty>1||!Number.isFinite(w.old)||w.old<0||w.old>1)throw Error('手指施工记录无效');for(const arr of Object.values(w.coverage))if(!Array.isArray(arr)||arr.length>30||!arr.every(v=>Number.isInteger(v)&&v>=0&&v<30))throw Error('施工覆盖记录无效');}
 for(const w of s.work){if(w.fileTravel!==undefined&&(!Number.isFinite(w.fileTravel)||w.fileTravel<0||w.fileTravel>1))throw Error('修形进度无效');for(const path of Object.values(w.paths||{}))if(!Array.isArray(path)||path.length>500||path.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('工具轨迹记录无效');}
 if(s.lamp&&(!Number.isFinite(s.lamp.remaining)||![0,1].includes(s.lamp.hand)||!Array.isArray(s.lamp.indices)||s.lamp.indices.some(i=>!Number.isInteger(i)||i<0||i>9)))throw Error('固化记录无效');return s;
}
export function loadSession(storage=localStorage){const raw=storage.getItem(SESSION_KEY);if(!raw)return null;const s=validateSession(JSON.parse(raw));if(s.phase==='plan'&&!s.planningVersion){const visual=n=>JSON.stringify([n.shape,n.length,n.base,n.finish,n.pattern,n.gradient,n.decorations.map(d=>[d.type,d.u,d.v,d.rotation,d.scale,!!d.hidden,!!d.locked]),n.strokes]);const reference=targetDesign(customer(s.client));if(s.plan.nails.every((n,i)=>visual(n)===visual(reference.nails[i])))s.plan=blankPlan(customer(s.client));s.planningVersion=1;}return s;}
export function saveSession(s,storage=localStorage){const value=validateSession(s);storage.setItem(SESSION_KEY,JSON.stringify(value));}
export const fingerLabel=i=>`${i<5?'左':'右'}${['拇指','食指','中指','无名指','小指'][i%5]}`;
