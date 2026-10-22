import {createDesign,uid,clone} from './state.js';

// A dated editorial selection, not an automatically measured popularity chart.
export const SEASON={id:'2026-10',title:'十月 · 指尖追光',date:'2026-10-22',sources:[
 {name:'COSMO · 液态猫眼 · 10/16',url:'https://www.cosmopolitan.com/tw/beauty/make-up/g73770254/2026-liquid-cat-eye-nail/'},
 {name:'Allure · 秋季新趋势 · 09/23',url:'https://www.allure.com/story/fall-nail-art-trends-2026'},
 {name:'Byrdie · 秋季材质与色彩 · 09/04',url:'https://www.byrdie.com/fall-nail-trends-2026-12064276'}
]};
export const LOOKS=[
 {id:'liquid',name:'玫瑰水光',tag:'透裸液态猫眼',color:'#b27f8b',palette:['#bc8394','#e6b3ad','#d6b48a'],shape:'round',length:.54,finish:'catEye',pattern:null,polish:{opacity:.48,layers:2,catWidth:.2,catSoftness:.82,catColor:'#ffe5d6',chrome:0,tipColor:'#fff5e8',tipWidth:.08,auraColor:'#dc919c',auraSize:.5,dots:false},accent:null,
  brief:'裸粉底色透出甲床，细光像浮在水里。十指留白，光带可以有不同方向。',request:'透感底胶 · 柔细猫眼 · 十指短圆甲',technique:'薄涂叠层 → 移动磁铁 → 亮泽封层',review:'透透的玫瑰色很适合我，转一下手就有水光，包花时也不会勾到。'},
 {id:'velvet',name:'森林丝绒',tag:'宝石色柔光猫眼',color:'#557b6b',palette:['#284e46','#6d8f72','#b4aa7e'],shape:'round',length:.57,finish:'catEye',pattern:null,polish:{opacity:.92,layers:2,catWidth:.44,catSoftness:1,catColor:'#cedca0',chrome:0,tipColor:'#ded7b5',tipWidth:.07,auraColor:'#9fb29b',auraSize:.5,dots:false},accent:'star',
  brief:'深绿底色配整片柔细磁光，细星只点两指。转手看丝绒般的明暗，不用粗闪。',request:'森林绿色系 · 宽柔光猫眼 · 至少两指星星',technique:'宝石色底 → 宽光磁吸 → 两指点缀',review:'绿色的光好像丝绒，翻书时会慢慢亮起来。星星只有两点，刚刚好。'},
 {id:'syrup',name:'琥珀茶糖',tag:'半透糖浆叠色',color:'#ab7848',palette:['#995027','#bb7843','#d4a06c'],shape:'square',length:.5,finish:'gloss',pattern:null,polish:{opacity:.38,layers:3,catWidth:.2,catSoftness:.8,catColor:'#ffe2ae',chrome:0,tipColor:'#f2d1ac',tipWidth:.07,auraColor:'#d8a35b',auraSize:.5,dots:false},accent:'foil',
  brief:'焦糖到琥珀的同色系十指，透明底上薄涂三层。金箔只留两指，仍是平整的日常款。',request:'琥珀棕色系 · 半透叠色 · 至少两指金箔',technique:'调透度 → 薄涂三层 → 平贴金箔',review:'像茶里的琥珀糖！透感和金箔都很克制，短短的方圆甲做陶艺也方便。'},
 {id:'micro',name:'可可细边',tag:'秋冬彩色细法式',color:'#876350',palette:['#c39b8d','#d3b4a1','#795042'],shape:'square',length:.49,finish:'gloss',pattern:'french',polish:{opacity:.5,layers:2,catWidth:.2,catSoftness:.8,catColor:'#fff0dc',chrome:0,tipColor:'#623e32',tipWidth:.065,auraColor:'#c79d8a',auraSize:.5,dots:false},accent:null,
  brief:'透裸底配巧克力细边，比厚白边更轻。整套保持短方圆，无凸起装饰。',request:'透裸底 · 巧克力细法式 · 无凸起装饰',technique:'透裸打底 → 调细法式弧线 → 封层',review:'巧克力细边很干净，透底有层次。短甲没有凸起装饰，弹琴很舒服。'},
 {id:'chrome',name:'午夜银点',tag:'深色镜面 × 微波点',color:'#59677c',palette:['#26354f','#51556b','#8c929e'],shape:'almond',length:.75,finish:'metal',pattern:null,polish:{opacity:1,layers:2,catWidth:.2,catSoftness:.8,catColor:'#eee6ff',chrome:1,tipColor:'#d9e3eb',tipWidth:.07,auraColor:'#8196be',auraSize:.5,dots:true},accent:null,
  brief:'深蓝与枪灰镜面交替，微波点集中在重点指。金属反光与小圆点搭配，冷感里留一点俏皮。',request:'深蓝灰镜面 · 每手至少一指微波点',technique:'深色打底 → 揉亮镜面 → 点绘波点',review:'深蓝镜面和小银点真的很搭！转动时反光很清楚，拍细节照片很好看。'},
 {id:'aura',name:'暮紫星雾',tag:'深色光晕 × 透明凝胶',color:'#826985',palette:['#49374f','#755b81','#b381a0'],shape:'almond',length:.83,finish:'gloss',pattern:'aura',polish:{opacity:.9,layers:2,catWidth:.3,catSoftness:.9,catColor:'#e1c9ec',chrome:.18,tipColor:'#f1d5ef',tipWidth:.06,auraColor:'#d197b1',auraSize:.64,dots:false},accent:'droplet',
  brief:'深紫中心拍出柔焦光晕，透明凝胶水珠只点两指。同色系明暗变化，让十指彼此呼应。',request:'深紫色系 · 每手至少一指光晕 · 至少两指透明凝胶',technique:'深色铺底 → 中心拍染 → 透明胶点塑',review:'紫色光晕边缘很柔，透明水珠转过来才看见，正是我想要的细节。'}
];
export const lookById=id=>LOOKS.find(l=>l.id===id);
export function lookDesign(id){
 const look=lookById(id);if(!look)throw Error('找不到这套款式');
 const d=createDesign();d.name=look.name;d.season=SEASON.id;d.look=id;
 d.nails.forEach((n,i)=>{
  const accent=[3,8].includes(i),secondary=[1,6].includes(i);
  Object.assign(n,{shape:look.shape,length:look.length,base:look.palette[secondary?1:0],finish:look.finish,pattern:look.pattern,topcoat:'gloss',polish:clone(look.polish)});
  n.polish.dots=look.id==='chrome'&&[1,3,6,8].includes(i);
  n.magnet={u:.4+(i%5)*.04,angle:i<5?-.5:.4};
  if(look.id==='aura'&&![1,3,6,8].includes(i))n.pattern=null;
  if(look.accent&&accent)n.decorations.push({id:uid(),type:look.accent,u:.52,v:.5,rotation:0,scale:look.accent==='droplet'?1.3:.75});
 });return d;
}
export function polishValues(n){return {opacity:1,layers:1,catWidth:.12,catSoftness:.35,catColor:'#f7dfa3',chrome:n.finish==='metal'?1:0,tipColor:'#fff7e9',tipWidth:.16,auraColor:'#d197b1',auraSize:.6,dots:false,...n.polish};}
