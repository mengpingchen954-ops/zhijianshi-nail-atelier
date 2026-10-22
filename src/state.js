export const COLORS=[['#d998ad','玫瑰奶冻'],['#f1ddc8','珍珠奶油'],['#ed927a','蜜桃珊瑚'],['#a599cf','薰衣草'],['#92ac9c','鼠尾草'],['#27334f','星夜蓝'],['#b94160','樱桃红'],['#82bbd4','晴空蓝'],['#fffaf2','象牙白'],['#c7a364','香槟金']];
export const SHAPES=[['round','圆形'],['square','方圆形'],['almond','杏仁形'],['oval','椭圆形'],['coffin','芭蕾形']];
export const FINISHES=[['gloss','亮泽'],['matte','哑光'],['catEye','猫眼'],['glitter','亮片'],['metal','金属']];
export const DECOS=[['flower','小雏菊'],['heart','爱心'],['star','星星'],['gem','水钻'],['pearl','珍珠'],['bow','蝴蝶结'],['butterfly','蝴蝶'],['foil','金箔'],['droplet','透明凝胶']];
export const FINGERS=['拇指','食指','中指','无名指','小指'];
export const COMMISSIONS=[
 {id:'quiet',name:'晨雾茶会',text:'我想要低调温柔的一套圆甲，留一点点点缀就好。',preference:'温柔、留白；图案由你决定。'},
 {id:'gradient',name:'海盐汽水',text:'把两种颜色融在一起，像夏日汽水一样。十指请用杏仁甲。',preference:'轻快、明亮；任意两种颜色都可以。'},
 {id:'starlit',name:'星夜来信',text:'想要深蓝夜空与猫眼光，一些星星在不同手指间呼应。',preference:'神秘、有呼应；星星位置自由。'}
];
export const uid=()=>crypto.randomUUID();
export const clone=v=>structuredClone(v);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const freshNail=()=>({shape:'round',length:.7,base:'#d998ad',finish:'gloss',gradient:null,magnet:{u:.5,angle:-.5},strokes:[],decorations:[]});
export function createDesign(){return {version:1,id:uid(),name:'第一封指间诗',commission:'free',nails:Array.from({length:10},freshNail),presentation:{background:0,pose:0},unlocked:[],createdAt:Date.now()};}
// UV coordinates describe the whole curved sheet; its outline clips both pigment and decorations.
export function halfWidth(shape,v){
 const q=clamp(v,0,1);
 if(shape==='almond')return .49*Math.pow(Math.sin(Math.PI*(.15+q*.85)),.54)+.014;
 if(shape==='oval')return .49*Math.pow(Math.sin(Math.PI*(.12+q*.86)),.4)+.014;
 if(shape==='coffin')return .49*(1-.36*q)*Math.sqrt(Math.min(1,(q+.04)/.1,(1.04-q)/.08));
 if(shape==='square')return .495*Math.sqrt(Math.min(1,(q+.04)/.1,(1.04-q)/.1));
 return q<.63?.49*Math.pow(Math.sin(Math.PI*(.15+q*.55)),.22):.49*Math.sqrt(Math.max(.0008,1-Math.pow((q-.63)/.37,2)));
}
export function insideNail(n,u,v,margin=0){return Number.isFinite(u)&&Number.isFinite(v)&&v>=margin&&v<=1-margin&&Math.abs(u-.5)+margin<halfWidth(n.shape,v);}
export function constrainDeco(n,d){
 const margin=.12*d.scale+.006;d.v=clamp(d.v,margin,1-margin);
 const w=Math.min(halfWidth(n.shape,d.v-margin),halfWidth(n.shape,d.v),halfWidth(n.shape,d.v+margin))-margin;
 d.u=clamp(d.u,.5-w,.5+w);return d;
}
export function validateDesign(x){
 if(!x||x.version!==1||typeof x.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(x.id)||!Array.isArray(x.nails)||x.nails.length!==10)throw Error('作品格式不支持');
 const d=clone(x),hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v),num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 if(typeof d.name!=='string'||d.name.length>60||!['free',...COMMISSIONS.map(c=>c.id)].includes(d.commission))throw Error('作品名称或委托无效');
 d.presentation??={background:0,pose:0};
 if(![0,1,2].includes(d.presentation.background)||![0,1,2].includes(d.presentation.pose))throw Error('展示设置无效');
 if(d.thumbnail!==undefined&&(typeof d.thumbnail!=='string'||d.thumbnail.length>350000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d.thumbnail)))throw Error('收藏缩略图格式无效');
 d.unlocked=Array.isArray(d.unlocked)?d.unlocked.filter(v=>COMMISSIONS.some(c=>c.id===v)):[];
 const ids=new Set();
 for(const n of d.nails){
  if(!n||!SHAPES.some(s=>s[0]===n.shape)||!num(n.length,.45,1.15)||!hex(n.base)||!FINISHES.some(f=>f[0]===n.finish))throw Error('无效甲面数据');
  n.base=n.base.toLowerCase();
  if(n.unpainted!==undefined&&typeof n.unpainted!=='boolean')throw Error('底色选择记录无效');
  for(const key of ['width','curve','build'])if(n[key]!==undefined&&!num(n[key],key==='build'?0:.5,key==='build'?1:1.6))throw Error('甲床参数无效');
  if(n.pattern!==undefined&&n.pattern!==null&&!['french','marble','aura'].includes(n.pattern))throw Error('图案工艺无效');
  if(n.polish!==undefined){
   const p=n.polish;if(!p||typeof p!=='object'||Array.isArray(p))throw Error('材质参数无效');
   for(const [key,a,b] of [['opacity',.15,1],['catWidth',.06,.6],['catSoftness',0,1],['chrome',0,1],['tipWidth',.025,.25],['auraSize',.2,1]])if(p[key]!==undefined&&!num(p[key],a,b))throw Error('材质参数无效');
   if(p.layers!==undefined&&![1,2,3].includes(p.layers)||p.dots!==undefined&&typeof p.dots!=='boolean')throw Error('叠层参数无效');
   for(const key of ['catColor','tipColor','auraColor'])if(p[key]!==undefined&&!hex(p[key]))throw Error('材质颜色无效');
   if(Object.keys(p).some(k=>!['opacity','layers','catWidth','catSoftness','chrome','tipWidth','auraSize','dots','catColor','tipColor','auraColor'].includes(k)))throw Error('未知材质参数');
  }
  if(n.topcoat!==undefined&&!['gloss','matte'].includes(n.topcoat))throw Error('封层无效');
  delete n.surface;delete n.shapeBlend;delete n.tipPreview;
  if(!n.magnet||!num(n.magnet.u,0,1)||!num(n.magnet.angle,-Math.PI,Math.PI))throw Error('无效磁吸参数');
  if(n.gradient!==null&&(!n.gradient||!hex(n.gradient.color)||!num(n.gradient.angle,0,360)||!num(n.gradient.range,.15,1)))throw Error('无效渐变参数');
  if(n.gradient)n.gradient.color=n.gradient.color.toLowerCase();
  if(!Array.isArray(n.strokes)||n.strokes.length>200||!Array.isArray(n.decorations)||n.decorations.length>18)throw Error('绘制或装饰数量超过上限');
  for(const s of n.strokes){if(!s||!hex(s.color)||!num(s.size,.01,.3)||!['paint','erase'].includes(s.kind)||!Array.isArray(s.points)||!s.points.length||s.points.length>6000)throw Error('无效笔迹');s.color=s.color.toLowerCase();for(const p of s.points)if(!Array.isArray(p)||p.length!==2||!num(p[0],0,1)||!num(p[1],0,1))throw Error('无效笔迹坐标');}
  for(const a of n.decorations){if(!a||typeof a.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(a.id)||ids.has(a.id)||!DECOS.some(v=>v[0]===a.type)||!num(a.u,0,1)||!num(a.v,0,1)||!num(a.rotation,-Math.PI,Math.PI)||!num(a.scale,.55,1.4))throw Error('无效装饰');ids.add(a.id);constrainDeco(n,a);}
 }
 return d;
}
export function requirements(d){
 const ns=d.nails;
 if(d.commission==='quiet'){const low=c=>{const a=c.slice(1).match(/../g).map(v=>parseInt(v,16));return Math.max(...a)-Math.min(...a)<100&&Math.min(...a)>115;};return [
  {label:'十指使用柔和低饱和底色',ok:ns.every(n=>low(n.base))},
  {label:'十指圆形甲',ok:ns.every(n=>n.shape==='round')},
  {label:'整套 1–3 枚装饰',ok:ns.reduce((s,n)=>s+n.decorations.length,0)>=1&&ns.reduce((s,n)=>s+n.decorations.length,0)<=3}];}
 if(d.commission==='gradient')return [
  {label:'十指杏仁形甲',ok:ns.every(n=>n.shape==='almond')},
  {label:'至少一指有两种不同颜色的渐变',ok:ns.some(n=>n.gradient&&n.gradient.color!==n.base)},
  {label:'渐变在至少三指之间呼应',ok:ns.filter(n=>n.gradient&&n.gradient.color!==n.base).length>=3}];
 if(d.commission==='starlit')return [
  {label:'至少三指星夜蓝底色',ok:ns.filter(n=>n.base==='#27334f').length>=3},
  {label:'至少两指猫眼',ok:ns.filter(n=>n.finish==='catEye').length>=2},
  {label:'三枚星星分布于至少两指',ok:ns.reduce((s,n)=>s+n.decorations.filter(a=>a.type==='star').length,0)>=3&&ns.filter(n=>n.decorations.some(a=>a.type==='star')).length>=2}];
 return [];
}
export function copyNail(n,mirror=false){const a=clone(n);for(const d of a.decorations){d.id=uid();if(mirror){d.u=1-d.u;d.rotation=-d.rotation;}}if(mirror){for(const s of a.strokes)for(const p of s.points)p[0]=1-p[0];if(a.gradient)a.gradient.angle=(360-a.gradient.angle)%360;a.magnet.u=1-a.magnet.u;a.magnet.angle=-a.magnet.angle;}return a;}
export const DRAFT_KEY='finger-poetry-draft-v1',SHELF_KEY='finger-poetry-shelf-v1';
export function saveDraft(design,storage=localStorage){
 const value=validateDesign(design);
 try{storage.setItem(DRAFT_KEY,JSON.stringify(value));}catch{throw Error('草稿保存失败：请导出作品备份后检查浏览器存储空间。');}
 return value;
}
export function loadDraft(storage=localStorage){
 let raw;try{raw=storage.getItem(DRAFT_KEY);}catch{throw Error('浏览器禁止读取本地草稿。');}
 if(raw===null)return null;
 try{return validateDesign(JSON.parse(raw));}catch{throw Error('草稿已损坏，原始数据仍保留；请从收藏或备份恢复。');}
}
export function listWorks(storage=localStorage){
 let raw;try{raw=storage.getItem(SHELF_KEY);}catch{throw Error('浏览器禁止读取收藏。');}
 if(raw===null)return [];
 try{
  const list=JSON.parse(raw);if(!Array.isArray(list))throw Error();
  const works=list.map(validateDesign),ids=new Set(works.map(d=>d.id));if(ids.size!==works.length)throw Error();
  return works;
 }catch{throw Error('收藏数据已损坏，已停止写入以保留原始数据。');}
}
export function saveWork(design,asCopy=false,storage=localStorage){
 const value=validateDesign(design);if(asCopy){value.id=uid();value.createdAt=Date.now();}
 const works=listWorks(storage).filter(d=>d.id!==value.id);works.unshift(value);
 try{storage.setItem(SHELF_KEY,JSON.stringify(works));}catch{throw Error('收藏保存失败：现有收藏仍保留，请导出作品备份。');}
 return value;
}
export function openWork(id,storage=localStorage){
 const design=listWorks(storage).find(d=>d.id===id);if(!design)throw Error('找不到这件收藏作品。');return design;
}
export class History{
 constructor(){this.past=[];this.future=[];}
 push(d){this.past.push(clone(d));if(this.past.length>32)this.past.shift();this.future=[];}
 undo(d){if(!this.past.length)return d;this.future.push(clone(d));return this.past.pop();}
 redo(d){if(!this.future.length)return d;this.past.push(clone(d));return this.future.pop();}
 clear(){this.past=[];this.future=[];}
}
