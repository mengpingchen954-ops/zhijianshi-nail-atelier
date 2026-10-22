import './style.css';
import {NailScene} from './scene.js';
import {icon} from './icons.js';
import {polishControls,bindPolish,patternControl,materialControls,bindMaterials} from './polish-ui.js';
import {loadWallet} from './rewards.js';
import {lookDesign} from './season.js';
import {COLORS,SHAPES,FINISHES,DECOS,FINGERS,COMMISSIONS,uid,clone,clamp,createDesign,insideNail,constrainDeco,copyNail,requirements,History,saveDraft,loadDraft,saveWork,listWorks,openWork,validateDesign} from './state.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const history=new History();
let design,active=2,tab='paint',tool='paint',color='#b94160',brush=.065,selected=null,decoType='flower',placing=true,showcase=false,view='both',action=null,saveTimer,renderPending=false,draftWritable=true,sound=false,audio;
let bootError='';
try{design=loadDraft();}catch(e){bootError=e.message;draftWritable=false;}
if(!design){
 design=lookDesign('liquid');
}
design.presentation??={background:0,pose:0};
const progress=new Set(design.unlocked);
try{for(const work of listWorks())for(const id of work.unlocked)progress.add(id);}catch{/* Collection errors are shown when opening or saving the collection. */}
function mergeProgress(){design.unlocked=[...new Set([...design.unlocked,...progress])];}
mergeProgress();

$('#app').innerHTML=`
 <header class="topbar"><div class="brand">${icon('flower').replace('<svg','<svg class="brand-mark"')}<div><strong>指间诗</strong><small>THE LITTLE NAIL ATELIER</small></div></div>
 <nav class="top-actions" aria-label="作品菜单"><a href="./" class="text-button">本月新款 / 工作室 ↗</a><span class="save-state" id="save-status" role="status">作品保存在此浏览器</span><span class="divider"></span><button id="new-work" title="新建作品">${icon('plus')}<span>新作品</span></button><button id="open-shelf" title="我的收藏">${icon('shelf')}<span>收藏室</span></button><button id="sound" class="icon-only" title="开启操作音效" aria-label="开启操作音效" aria-pressed="false">${icon('sound')}</button><button id="help" class="icon-only" title="操作帮助" aria-label="操作帮助">${icon('help')}</button></nav></header>
 <main class="workbench"><section class="atelier" aria-label="美甲工作台"><div class="stage"><div id="world"><div class="loading">正在整理你的美甲工作台…</div></div>
 <div class="scene-info"><div class="eyebrow" id="scene-kicker">A LITTLE TIME FOR YOURSELF</div><h2 id="focus-name">十指之间，皆是灵感</h2><p id="focus-sub">选一枚指甲，开始你的创作。</p></div>
 <nav class="viewbar" aria-label="观察范围"><button data-view="detail">单指</button><button data-view="hand">单手</button><button data-view="both" class="active">双手</button></nav>
 <nav class="tools" aria-label="美甲工具">${[['shape','甲形'],['paint','涂绘'],['gradient','渐变'],['deco','装饰'],['finish','质感'],['view','旋转']].map(([id,label])=>`<button class="tool ${id===tab?'active':''}" data-tab="${id}" aria-label="${label}" title="${label}">${icon(id)}<span>${label}</span></button>`).join('')}</nav>
 <div class="undo-bar"><button id="undo" title="撤销 Ctrl+Z" aria-label="撤销">${icon('undo')}</button><button id="redo" title="重做 Ctrl+Shift+Z" aria-label="重做">${icon('redo')}</button><button id="copy" title="复制到其他手指" aria-label="复制到其他手指">${icon('copy')}</button></div><p class="stage-hint" id="stage-hint">点击指甲进入近景 · 右键拖动旋转 · 滚轮缩放</p><span class="step-label">made by you, worn with love.</span></div>
 <nav class="fingers" id="finger-list" aria-label="十指选择"></nav></section>
 <aside class="side"><button class="brief-button" id="commissions"><span><small>YOUR LITTLE BRIEF</small><strong id="brief-title">自由创作</strong></span>${icon('arrow')}</button><div class="panel" id="panel"></div><div class="side-bottom"><button class="finish-button" id="finish-work"><span>完成 · 作品展示</span>${icon('arrow')}</button><small>慢慢来，每一笔都属于你。</small></div></aside></main>
 <div id="cursor" class="cursor"></div><div class="toast" id="toast" role="status" hidden></div><dialog id="dialog"></dialog><input id="import-file" type="file" accept="application/json,.json" hidden>`;

let scene;
try{scene=new NailScene($('#world'),()=>{if(!action)$('#cursor').style.display='none';});$('.loading').remove();}
catch(e){$('.loading').innerHTML=`<div>三维画布未能启动</div><p style="font:13px sans-serif;margin-top:15px">请启用浏览器硬件加速，使用支持 WebGL 2 的浏览器重试。</p>`;throw e;}
scene.sync(design);scene.background(design.presentation.background);scene.pose(design.presentation.pose);scene.focus('both');scene.setViewOnly(false);
scene.host.addEventListener('render-lost',()=>toast('三维画布暂时失去连接，草稿已保留。恢复后将自动重新打开。',12000));
const nail=()=>design.nails[active];
const fingerName=i=>`${i<5?'左手':'右手'} · ${FINGERS[i%5]}`;

function toast(text,time=3000){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,time);}
function chime(f=520){if(!sound)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);g.gain.setValueAtTime(.018,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}catch{sound=false;}}
function persist(){clearTimeout(saveTimer);if(!draftWritable)return;mergeProgress();try{saveDraft(design);$('#save-status').textContent='草稿已自动保存';$('#save-status').classList.remove('error');}catch(e){$('#save-status').textContent='保存失败 · 请导出备份';$('#save-status').classList.add('error');toast(e.message,8000);}}
function scheduleSave(){clearTimeout(saveTimer);$('#save-status').textContent=draftWritable?'正在保存…':'草稿损坏 · 自动保存已暂停';saveTimer=setTimeout(persist,400);}
function scheduleRender(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;scene.sync(design);scene.select(active,selected,showcase);});}
function changed({panel=false}={}){delete design.thumbnail;scene.sync(design);scene.select(active,selected,showcase);updateStatus();scheduleSave();if(panel)renderPanel();}
function mutate(fn,{panel=false}={}){endAction();history.push(design);fn();changed({panel});chime();}
function palette(){return `<div class="palette">${COLORS.map(([hex,name])=>`<button class="swatch ${color===hex?'active':''}" style="--c:${hex}" data-color="${hex}" title="${name}" aria-label="${name}" aria-pressed="${color===hex}"></button>`).join('')}</div><label class="color-custom">自定义颜色 <span id="color-code">${color.toUpperCase()}</span><input type="color" id="color" value="${color}" aria-label="自定义画笔颜色"></label>`;}
function range(id,label,value,min,max,step,output){return `<div class="section"><label class="section-title" for="${id}">${label}<output id="${id}-output">${output}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;}
function panelHead(title,english,intro){return `<div class="panel-head"><h2>${title}</h2><span>${english}</span></div><p class="panel-intro">${intro}</p>`;}
function updateStatus(){
 const n=nail();$('#focus-name').textContent=showcase?design.name:view==='detail'?fingerName(active):view==='hand'?(active<5?'左手 · 整体搭配':'右手 · 整体搭配'):'十指之间，皆是灵感';
 $('#scene-kicker').textContent=showcase?'YOUR LITTLE MASTERPIECE':'A LITTLE TIME FOR YOURSELF';
 $('#focus-sub').textContent=showcase?'你的灵感，值得被收藏。':`${SHAPES.find(s=>s[0]===n.shape)[1]} · ${FINISHES.find(s=>s[0]===n.finish)[1]} · 每一指都可独立创作`;
 const r=requirements(design),c=COMMISSIONS.find(c=>c.id===design.commission);$('#brief-title').textContent=c?`${c.name} · ${r.filter(x=>x.ok).length}/${r.length}`:'自由创作';
 $('#undo').disabled=!history.past.length;$('#redo').disabled=!history.future.length;
 $$('.finger-btn').forEach(b=>{const i=Number(b.dataset.finger),a=design.nails[i],m=b.querySelector('.mini-nail');b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',String(i===active));m.className=`mini-nail ${a.shape}`;m.style.background=a.gradient?`linear-gradient(${a.gradient.angle}deg,${a.base},${a.gradient.color})`:a.base;m.innerHTML=a.decorations.length?`<b>${a.decorations.some(d=>d.type==='flower')?'✿':a.decorations.some(d=>d.type==='star')?'✦':'•'}</b>`:'';});
 $$('.viewbar button').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
 $$('.tool').forEach(b=>{b.classList.toggle('active',!showcase&&b.dataset.tab===tab);b.setAttribute('aria-pressed',String(!showcase&&b.dataset.tab===tab));});
 $('#finish-work span').textContent=showcase?'返回 · 继续创作':'完成 · 作品展示';
 $('#stage-hint').textContent=showcase?'拖动旋转欣赏 · 滚轮缩放 · 拍下这一刻':tab==='view'?'拖动旋转 · 滚轮缩放 · 选涂绘工具继续创作':view!=='detail'?'点击指甲进入近景 · 右键拖动旋转 · 滚轮缩放':tab==='deco'?(placing?'在甲面点击放置装饰':'拖动选中装饰 · 在右侧旋转和缩放'):tool==='magnet'?'在甲面拖动磁铁，让光带跟随你':tab==='paint'?'在甲面按住拖动绘制 · 右键旋转 · Ctrl+Z 撤销':'所有调整只作用于当前手指 · Ctrl+Z 撤销';
}
function renderFingers(){
 $('#finger-list').innerHTML=[0,1].map(h=>`${h?'<span class="finger-divider"></span>':''}<div class="hand-select"><span class="hand-caption">${h?'右手':'左手'}</span>${FINGERS.map((f,i)=>`<button class="finger-btn" data-finger="${h*5+i}" aria-label="${h?'右手':'左手'}${f}"><i class="mini-nail"></i><span>${f}</span></button>`).join('')}</div>`).join('');
 $$('.finger-btn').forEach(b=>b.onclick=()=>selectFinger(Number(b.dataset.finger)));
}
function selectFinger(i){endAction();active=i;selected=null;if(showcase){view='detail';scene.focus(view,i);}else{view='detail';scene.focus(view,i);}renderPanel();scene.select(active);updateStatus();chime(610);}
function setTool(id){endAction();showcase=false;tab=id;selected=null;tool=id==='paint'?'paint':id==='finish'?'none':id;scene.select(active);scene.setViewOnly(id==='view');renderPanel();updateStatus();}

function renderPanel(){
 const n=nail(),p=$('#panel'),scroll=p.scrollTop;
 if(showcase){renderShowcase();return;}
 if(tab==='shape'){
  p.innerHTML=panelHead('修出喜欢的轮廓','Shape & length','从自然圆润到利落方形，为你的设计选一副合适的底稿。')+`<div class="section"><div class="section-title">预制甲形</div><div class="choices">${SHAPES.map(([id,label])=>`<button class="choice ${n.shape===id?'active':''}" data-shape="${id}"><i class="shape-example ${id}"></i>${label}</button>`).join('')}</div></div>`+range('length','指甲长度',n.length,.45,1.15,.01,`${Math.round((n.length-.45)/.7*100)}%`)+`<p class="note">此版使用预制甲形切换。笔迹保留在相同曲面坐标，超出新轮廓的部分暂时隐藏；切回或撤销即可恢复。装饰会向内适配。</p>`;
  $$('[data-shape]').forEach(b=>b.onclick=()=>mutate(()=>{n.shape=b.dataset.shape;n.decorations.forEach(d=>constrainDeco(n,d));},{panel:true}));
  bindRange('length',v=>{n.length=v;},v=>`${Math.round((v-.45)/.7*100)}%`);
 }else if(tab==='paint'){
  p.innerHTML=panelHead('把灵感涂成颜色','Colour & brush','一点奶油，一抹玫瑰。直接在甲面绘画，或用底色铺满整枚指甲。')+palette()+`<div class="segmented"><button data-brush="paint" class="${tool==='paint'?'active':''}">${icon('paint')}画笔</button><button data-brush="erase" class="${tool==='erase'?'active':''}">${icon('erase')}橡皮</button></div>`+range('brush','画笔大小',brush,.015,.22,.005,`${Math.round(brush*1000)}`)+`<button class="wide-button primary" id="fill-one">${icon('paint')}当前指甲填底色</button><button class="wide-button" id="fill-all">十指应用此底色</button><button class="text-button" id="clear-ink">清除当前手绘</button><p class="note">橡皮只擦除手绘，露出底色或渐变。底色位于手绘下方，可放心重新配色。</p>`;
  bindPalette();$$('[data-brush]').forEach(b=>b.onclick=()=>{endAction();tool=b.dataset.brush;renderPanel();updateStatus();});
  $('#brush').oninput=e=>{brush=Number(e.target.value);$('#brush-output').textContent=Math.round(brush*1000);};
  $('#fill-one').onclick=()=>mutate(()=>n.base=color);
  $('#fill-all').onclick=()=>mutate(()=>design.nails.forEach(a=>a.base=color));
  $('#clear-ink').onclick=()=>{if(n.strokes.length)mutate(()=>n.strokes=[]);};
 }else if(tab==='gradient'){
  p.innerHTML=panelHead('让两种心情相遇','A soft ombré','当前底色是第一种颜色；为另一端挑选颜色，再调整过渡方向与柔和程度。')+palette()+`<button class="wide-button primary" id="apply-gradient">${icon('gradient')}${n.gradient?'更新渐变颜色':'添加双色渐变'}</button>`+range('gradient-angle','过渡方向',n.gradient?.angle??0,0,360,1,`${n.gradient?.angle??0}°`)+range('gradient-range','过渡范围',n.gradient?.range??.65,.15,1,.01,`${Math.round((n.gradient?.range??.65)*100)}%`)+`<button class="text-button" id="remove-gradient">移除当前渐变</button><p class="note">渐变在底色之上、手绘之下。用复制工具可让多指拥有相同渐变，同时保留单指编辑。</p>`;
  bindPalette();$('#apply-gradient').onclick=()=>mutate(()=>{n.gradient={color,angle:Number($('#gradient-angle').value),range:Number($('#gradient-range').value)};},{panel:true});
  bindRange('gradient-angle',v=>{n.gradient??={color,angle:0,range:.65};n.gradient.angle=v;},v=>`${v}°`);
  bindRange('gradient-range',v=>{n.gradient??={color,angle:0,range:.65};n.gradient.range=v;},v=>`${Math.round(v*100)}%`);
  $('#remove-gradient').onclick=()=>{if(n.gradient)mutate(()=>n.gradient=null,{panel:true});};
 }else if(tab==='deco'){
  const d=n.decorations.find(a=>a.id===selected);
  p.innerHTML=panelHead('一点点，刚刚好','The finishing touch','让小花、星星与微光落在指尖。选装饰后，在甲面点击放置。')+`<div class="deco-grid">${DECOS.map(([id,label])=>`<button class="choice ${decoType===id&&placing?'active':''}" data-deco="${id}">${icon(id)}${label}</button>`).join('')}</div><div class="segmented"><button id="place-deco" class="${placing?'active':''}">放置新装饰</button><button id="move-deco" class="${!placing?'active':''}">选择 / 移动</button></div>`+(d?`<div class="section-title">已选择：${DECOS.find(a=>a[0]===d.type)[1]}</div>`+range('deco-rotation','旋转',Math.round(d.rotation*180/Math.PI),-180,180,1,`${Math.round(d.rotation*180/Math.PI)}°`)+range('deco-scale','大小',d.scale,.55,1.4,.01,`${Math.round(d.scale*100)}%`)+`<div class="nudge"><button data-nudge="left" aria-label="装饰向左">←</button><button data-nudge="up" aria-label="装饰向甲尖">↑</button><button data-nudge="down" aria-label="装饰向甲根">↓</button><button data-nudge="right" aria-label="装饰向右">→</button></div><div class="control-row"><button class="wide-button" id="duplicate-deco">${icon('copy')}复制</button><button class="wide-button" id="delete-deco">${icon('trash')}删除</button></div>`:`<p class="note">${placing?'每指最多 18 枚装饰。放置后可拖动微调。':'点击已有装饰选中，再拖动位置；旋转和缩放控件会在这里出现。'}<br>贴纸顺着曲面铺开；水钻和珍珠保留立体厚度。</p>`);
  $$('[data-deco]').forEach(b=>b.onclick=()=>{decoType=b.dataset.deco;placing=true;selected=null;scene.select(active);renderPanel();updateStatus();});
  $('#place-deco').onclick=()=>{placing=true;selected=null;scene.select(active);renderPanel();updateStatus();};$('#move-deco').onclick=()=>{placing=false;renderPanel();updateStatus();};
  if(d){
   bindRange('deco-rotation',v=>d.rotation=v*Math.PI/180,v=>`${v}°`);bindRange('deco-scale',v=>{d.scale=v;constrainDeco(n,d);},v=>`${Math.round(v*100)}%`);
   $('#delete-deco').onclick=()=>mutate(()=>{n.decorations=n.decorations.filter(a=>a.id!==selected);selected=null;},{panel:true});
   $('#duplicate-deco').onclick=()=>{if(n.decorations.length>=18){toast('这枚指甲的装饰已经满了');return;}mutate(()=>{const a=constrainDeco(n,{...d,id:uid(),u:d.u+.11,v:d.v+.04});n.decorations.push(a);selected=a.id;},{panel:true});};
   $$('[data-nudge]').forEach(b=>b.onclick=()=>mutate(()=>{const k=b.dataset.nudge;d.u+=k==='left'?-.025:k==='right'?.025:0;d.v+=k==='up'?.025:k==='down'?-.025:0;constrainDeco(n,d);}));
  }
 }else if(tab==='finish'){
  p.innerHTML=panelHead('把光留在指尖','Polish & light','柔雾、镜泽，或一束会流动的猫眼光。同样的颜色，也有不同性格。')+`<div class="choices finish-choices">${FINISHES.map(([id,label])=>`<button class="choice ${n.finish===id?'active':''}" data-finish="${id}"><i class="finish-swatch ${id}"></i>${label}</button>`).join('')}</div>`+(n.finish==='catEye'?`<button class="wide-button ${tool==='magnet'?'primary':''}" id="magnet-tool">${icon('magnet')}${tool==='magnet'?'磁铁已启用 · 在甲面拖动':'使用磁铁'}</button>`+range('magnet-u','亮带位置',n.magnet.u,0,1,.01,`${Math.round(n.magnet.u*100)}%`)+range('magnet-angle','亮带方向',Math.round(n.magnet.angle*180/Math.PI),-180,180,1,`${Math.round(n.magnet.angle*180/Math.PI)}°`):'')+patternControl(n,'free-pattern')+polishControls(n)+materialControls(studioWallet())+`<p class="note">质感作用于整枚甲面。猫眼采用受控光带，随磁铁位置与观察角度变化；不是粒子物理模拟。</p>`;
  $$('[data-finish]').forEach(b=>b.onclick=()=>mutate(()=>{n.finish=b.dataset.finish;n.topcoat=n.finish==='matte'?'matte':'gloss';if(n.polish)n.polish.chrome=n.finish==='metal'?1:0;tool=n.finish==='catEye'?'magnet':'none';},{panel:true}));
  $('#free-pattern').onchange=e=>mutate(()=>n.pattern=e.target.value||null,{panel:true});bindPolish(p,n,fn=>mutate(fn,{panel:true}));bindMaterials(p,n,studioWallet(),fn=>mutate(fn,{panel:true}));
  if(n.finish==='catEye'){$('#magnet-tool').onclick=()=>{tool=tool==='magnet'?'none':'magnet';renderPanel();updateStatus();};bindRange('magnet-u',v=>n.magnet.u=v,v=>`${Math.round(v*100)}%`);bindRange('magnet-angle',v=>n.magnet.angle=v*Math.PI/180,v=>`${v}°`);}
 }else{
  p.innerHTML=panelHead('换个角度看灵感','A closer look','左键拖动旋转，滚轮缩放。这里的操作只调整镜头，让你安心查看每个细节。')+`<button class="wide-button" id="reset-camera">重置当前镜头</button><div class="section"><div class="section-title">看得近一点</div><p class="note">点击下方任意手指，即可进入单指近景。选回「涂绘」或「装饰」继续创作。编辑时也可使用右键旋转。</p></div>`;
  $('#reset-camera').onclick=()=>scene.focus(view,active);
 }
 p.scrollTop=scroll;
}
function bindPalette(){
 $$('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;renderPanel();chime(650);});
 $('#color').oninput=e=>{color=e.target.value;$('#color-code').textContent=color.toUpperCase();$$('[data-color]').forEach(b=>b.classList.toggle('active',b.dataset.color===color));};
}
function bindRange(id,fn,format){
 const input=$('#'+id);let before=null;
 input.oninput=()=>{if(!before){endAction();before=clone(design);history.push(design);}fn(Number(input.value));$('#'+id+'-output').textContent=format(Number(input.value));scheduleRender();updateStatus();delete design.thumbnail;scheduleSave();};
 const done=()=>{before=null;};input.onchange=done;input.onblur=done;
}

function dialog(title,body){endAction();const d=$('#dialog');if(d.open)d.close();d.className='';d.innerHTML=`<div class="dialog-head"><h2>${title}</h2><button class="dialog-close" aria-label="关闭">${icon('close')}</button></div>${body}`;d.querySelector('.dialog-close').onclick=()=>d.close();d.showModal();scene.controls.enabled=false;}
$('#dialog').addEventListener('close',()=>{scene.controls.enabled=true;});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function openCommissions(){
 dialog('给灵感一个小小方向',`<p class="dialog-sub">三份原创练习委托，以明确的制作条件给出反馈。风格偏好是灵感提示，不作主观打分。切换委托会保留当前作品。</p><div class="commission-grid">${COMMISSIONS.map((c,k)=>`<button class="commission-card ${design.commission===c.id?'active':''}" data-commission="${c.id}"><div class="reference-mini">${Array.from({length:5},(_,i)=>`<i class="mini-nail ${k===1?'almond':'round'}" style="background:${k===0?'#d8a6b3':k===1?'linear-gradient(#82bbd4,#f1ddc8)':i%2?'linear-gradient(130deg,#27334f,#bbab83,#27334f)':'#27334f'}">${k===2||k===0&&i===3?`<b>${k===2?'✦':'✿'}</b>`:''}</i>`).join('')}</div><h3>${c.name}</h3><p>${c.text}</p><small>${design.unlocked.includes(c.id)?'✓ 已完成 · 可再次挑战':'接受这份灵感 →'}</small></button>`).join('')}</div><button class="wide-button" id="free-mode">自由创作 · 无条件限制</button><p class="note" style="margin-top:20px">示意图由本项目原创绘制，用于表达主题；反馈依据颜色、甲形、渐变和装饰数据，不进行图片识别。</p>`);
 $$('[data-commission]').forEach(b=>b.onclick=()=>{mutate(()=>design.commission=b.dataset.commission);$('#dialog').close();if(showcase)renderPanel();toast('已接下委托，可点击右上方名称查看要求');});
 $('#free-mode').onclick=()=>{mutate(()=>design.commission='free');$('#dialog').close();if(showcase)renderPanel();};
}
function showCopy(){
 dialog('让十指彼此呼应',`<p class="dialog-sub">将${fingerName(active)}复制到你选择的手指。完整设计会替换目标甲形、手绘与装饰；所有操作可撤销。</p><label class="checkbox-line"><input type="checkbox" id="copy-all">选中其余九指</label><div class="copy-targets">${design.nails.map((n,i)=>`<label style="${i===active?'opacity:.35':''}"><i class="mini-nail ${n.shape}" style="--nail:${n.base}"></i><span>${i<5?'左':'右'}${FINGERS[i%5]}</span><input type="checkbox" data-target="${i}" aria-label="复制到${fingerName(i)}" ${i===active?'disabled':''}></label>`).join('')}</div><label class="checkbox-line"><input type="checkbox" id="copy-full" checked>复制完整设计（包含甲形、手绘与装饰）</label><label class="checkbox-line"><input type="checkbox" id="copy-mirror">镜像图案（默认关闭；手绘内容也会翻转）</label><button class="wide-button primary" id="apply-copy">应用到所选手指</button>`);
 $('#copy-all').onchange=e=>$$('[data-target]:not(:disabled)').forEach(b=>b.checked=e.target.checked);
 $('#apply-copy').onclick=()=>{const targets=$$('[data-target]:checked').map(b=>Number(b.dataset.target)),full=$('#copy-full').checked,mirror=$('#copy-mirror').checked;if(!targets.length){toast('先选择要复制到的手指');return;}mutate(()=>{for(const i of targets){if(full)design.nails[i]=copyNail(nail(),mirror);else{const n=design.nails[i],a=nail();n.base=a.base;n.gradient=clone(a.gradient);n.finish=a.finish;n.magnet=clone(a.magnet);}}});$('#dialog').close();toast(`已复制到 ${targets.length} 枚指甲，可撤销`);};
}
function renderRequirements(){const r=requirements(design);return `<ul class="requirements">${r.map(a=>`<li class="${a.ok?'ok':''}">${icon(a.ok?'check':'shape')}<span>${a.ok?'已满足':'可修改'}：${a.label}</span></li>`).join('')}</ul>`;}
function enterShowcase(){endAction();showcase=!showcase;selected=null;scene.select(active);scene.setViewOnly(showcase||tab==='view');if(showcase){view='both';scene.focus(view,active);}renderPanel();updateStatus();}
function renderShowcase(){
 const c=COMMISSIONS.find(c=>c.id===design.commission),r=requirements(design),all=r.length&&r.every(a=>a.ok);
 $('#panel').innerHTML=`<button class="back-edit" id="back-edit">← 继续我的创作</button>`+panelHead('你的指间作品','Made with love','转动镜头，看看光是怎样落下的。给这套美甲一个名字，收藏今天的灵感。')+`<label class="section-title" for="work-name">作品名称</label><input id="work-name" type="text" maxlength="60" value="${escape(design.name)}" placeholder="为这套作品命名"><div class="section"><div class="section-title">拍摄氛围</div><div class="presentation-options">${['#e6d6c7','#e8d1da','#d4dce2'].map((v,i)=>`<button data-background="${i}" style="--bg:${v}" class="${design.presentation.background===i?'active':''}" title="${['奶油暖光','玫瑰柔光','晴空冷光'][i]}" aria-label="${['奶油暖光','玫瑰柔光','晴空冷光'][i]}"></button>`).join('')}</div></div><label class="section-title" for="pose">手部姿势</label><select id="pose"><option value="0">自然舒展</option><option value="1">指尖相拥</option><option value="2">轻轻倾斜</option></select>`+(c?`<div class="section"><div class="section-title">委托：${c.name}</div>${renderRequirements()}<p class="note">风格偏好：${c.preference}</p><div class="feedback">${all?'这套作品满足了全部明确要求。你的搭配有自己的表达，已记入委托进度。':'作品已经保留。上方标出了还可调整的条件，你可以继续修改，也可以先收藏当前版本。'}</div></div>`:'<p class="note" style="margin-top:20px">自由创作没有评分。让它成为你喜欢的样子，就是这套作品最好的回应。</p>')+`<button class="wide-button primary" id="download-photo">${icon('camera')}拍照下载 PNG</button><button class="wide-button" id="save-work">${icon('save')}收藏 / 更新此作品</button><button class="wide-button" id="save-copy">${icon('copy')}另存一份副本</button><button class="text-button" id="export-work">导出可编辑作品备份</button>`;
 $('#pose').value=design.presentation.pose;
 if(all&&!design.unlocked.includes(design.commission)){design.unlocked.push(design.commission);progress.add(design.commission);scheduleSave();}
 $('#back-edit').onclick=()=>enterShowcase();$('#work-name').onchange=e=>mutate(()=>{design.name=e.target.value.trim()||'未命名的指间诗';e.target.value=design.name;});
 $$('[data-background]').forEach(b=>b.onclick=()=>mutate(()=>{design.presentation.background=Number(b.dataset.background);scene.background(design.presentation.background);},{panel:true}));
 $('#pose').onchange=e=>mutate(()=>{design.presentation.pose=Number(e.target.value);scene.pose(design.presentation.pose);});
 $('#download-photo').onclick=()=>{endAction();download(scene.photo(),`${design.name}.png`);toast('照片已生成，请查看浏览器下载');chime(780);};
 $('#save-work').onclick=()=>storeWork(false);$('#save-copy').onclick=()=>storeWork(true);$('#export-work').onclick=exportWork;
}
function snapshot(){
 const camera=scene.camera.position.clone(),target=scene.controls.target.clone(),oldView=scene.mode,oldActive=active;
 scene.select(active);scene.focus('both',active);scene.photo();
 const c=document.createElement('canvas');c.width=420;c.height=270;
 c.getContext('2d').drawImage(scene.renderer.domElement,0,0,c.width,c.height);
 const result=c.toDataURL('image/jpeg',.8);
 scene.focus(oldView,oldActive);scene.camera.position.copy(camera);scene.controls.target.copy(target);scene.controls.update();scene.select(active,selected,showcase);return result;
}
function storeWork(asCopy){endAction();try{const value=clone(design);value.thumbnail=snapshot();design=saveWork(value,asCopy);if(asCopy)history.clear();persist();updateStatus();toast(asCopy?'已另存为独立副本，原作品保留':'已收藏完整设计，可以重新打开继续编辑');chime(800);}catch(e){toast(e.message,8500);}}
function openShelf(){
 let works;try{works=listWorks();}catch(e){toast(e.message,8000);return;}
 dialog('收藏每一次灵感',`<p class="dialog-sub">收藏包含十指完整编辑数据。打开后可继续创作，另存副本会保留原作品。</p>`+(works.length?`<div class="gallery">${works.map(d=>`<button class="work-card" data-work="${escape(d.id)}">${typeof d.thumbnail==='string'&&d.thumbnail.startsWith('data:image/jpeg;base64,')?`<img src="${d.thumbnail}" alt="${escape(d.name)}的十指缩略图">`:'<div class="reference-mini">'+d.nails.slice(0,5).map(n=>`<i class="mini-nail ${n.shape}" style="--nail:${n.base}"></i>`).join('')+'</div>'}<strong>${escape(d.name)}</strong><small>${d.nails.reduce((s,n)=>s+n.strokes.length,0)} 笔手绘 · ${d.nails.reduce((s,n)=>s+n.decorations.length,0)} 枚装饰 · 继续编辑 →</small></button>`).join('')}</div>`:'<p class="feedback">你的收藏室还是空的。在「作品展示」中收藏第一套美甲吧。</p>')+`<button class="wide-button" id="import-work">从 JSON 备份导入作品</button><button class="text-button" id="shelf-export">导出当前草稿备份</button>`);
 $$('[data-work]').forEach(b=>b.onclick=()=>{try{
  endAction();persist();const previous=listWorks().find(d=>d.id===design.id);
  const content=d=>JSON.stringify([d.name,d.nails,d.presentation,d.commission]);
  if(!previous||content(previous)!==content(design)){const draft=clone(design);draft.thumbnail=snapshot();saveWork(draft,!!previous);}
  design=openWork(b.dataset.work);mergeProgress();design.presentation??={background:0,pose:0};history.clear();selected=null;scene.sync(design,true);scene.background(design.presentation.background);scene.pose(design.presentation.pose);scene.focus(view,active);renderPanel();updateStatus();scheduleSave();$('#dialog').close();toast('完整作品已打开；切换前的未收藏修改已保留');
 }catch(e){toast(e.message,8000);}});
 $('#import-work').onclick=()=>$('#import-file').click();$('#shelf-export').onclick=exportWork;
}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
function exportWork(){const blob=new Blob([JSON.stringify(design,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);download(url,`${design.name}.json`);setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('#import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>8_000_000)throw Error('备份超过 8 MB，无法导入');const next=validateDesign(JSON.parse(await file.text()));mutate(()=>{design=next;design.presentation??={background:0,pose:0};selected=null;scene.background(design.presentation.background);scene.pose(design.presentation.pose);},{panel:true});$('#dialog').close();toast('已导入完整可编辑作品');}catch(err){toast('导入失败：'+err.message,7000);}finally{e.target.value='';}};

function help(){dialog('在这里，慢慢创作',`<div class="help-lines"><p><strong>① 选一指</strong>：点击下方手指进入近景。右上角切换单指、单手与双手。</p><p><strong>② 设计甲面</strong>：切换甲形，选择颜色后直接按住甲面绘画。整甲填色与十指底色可减少重复操作。</p><p><strong>③ 加一点细节</strong>：渐变、五种质感与五种装饰都能自由组合。装饰放下后，可拖动、旋转、缩放、复制或删除。</p><p><strong>④ 换个角度</strong>：编辑时用右键拖动旋转。触屏请先选「旋转」工具，再单指拖动；双指缩放。</p><p><strong>⑤ 收藏灵感</strong>：「完成」后可拍照、命名和收藏。收藏保留手绘与装饰数据，JSON 备份可迁移浏览器。</p><p><kbd>Ctrl</kbd> + <kbd>Z</kbd> 撤销 · <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> 重做 · <kbd>Delete</kbd> 删除选中装饰。切换工具、失焦与松开指针都会结束操作。</p><p class="note">本项目为原创 3D 美甲创作原型，参考 <a href="https://store.steampowered.com/app/5380700/" target="_blank" rel="noreferrer">My Nail Salon</a> 的制作工具。人物、图案、界面与音效均为原创程序化资源。存档只保存在当前浏览器，清除网站数据会删除本地作品；建议定期导出备份。</p></div>`);}
function welcome(){const d=$('#dialog');d.className='welcome';d.innerHTML=`${icon('flower').replace('<svg','<svg class="brand-mark"')}<div class="eyebrow">A TINY ATELIER, ENDLESS POSSIBILITIES</div><h1>指间诗</h1><div class="english">a little colour, a little you.</div><p>挑一抹喜欢的颜色，留一朵小小的花。<br>在温暖的工作台前，把灵感慢慢画在指尖。<br>十枚指甲，一件只属于你的作品。</p><button class="primary" id="start">走进工作台 ${icon('arrow')}</button><div class="footnote">真实 3D 曲面 · 自由手绘 · 灵感委托 · 可编辑收藏</div>`;d.showModal();scene.controls.enabled=false;$('#start').onclick=()=>{d.close();toast('先点下方一枚手指，进入精细编辑');if(bootError)toast(bootError,10000);};}
$('#new-work').onclick=()=>{endAction();persist();dialog('新的一套，从哪里开始？',`<p class="dialog-sub">当前草稿会先收藏完整副本，再开启十指空白设计。你也可以继续当前作品。</p><button class="wide-button primary" id="confirm-new">收藏当前草稿，开始新作品</button>`);$('#confirm-new').onclick=()=>{try{const previous=clone(design);previous.thumbnail=snapshot();saveWork(previous);design=createDesign();mergeProgress();design.presentation={background:0,pose:0};draftWritable=true;history.clear();selected=null;showcase=false;tab='shape';tool='shape';scene.setViewOnly(false);scene.background(0);scene.pose(0);scene.sync(design);view='both';scene.focus(view,active);renderPanel();updateStatus();persist();$('#dialog').close();toast('已为你准备新的十指底稿');}catch(e){toast(e.message,8000);}};};
$('#open-shelf').onclick=openShelf;$('#commissions').onclick=openCommissions;$('#copy').onclick=showCopy;$('#help').onclick=help;$('#finish-work').onclick=enterShowcase;
$('#sound').onclick=()=>{sound=!sound;$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').title=sound?'关闭操作音效':'开启操作音效';$('#sound').setAttribute('aria-label',$('#sound').title);$('#sound').style.opacity=sound?'1':'.5';chime(710);};$('#sound').style.opacity='.5';
$$('[data-tab]').forEach(b=>b.onclick=()=>setTool(b.dataset.tab));
$$('[data-view]').forEach(b=>b.onclick=()=>{endAction();view=b.dataset.view;scene.focus(view,active);updateStatus();});
function restoreHistory(kind){endAction();design=kind==='undo'?history.undo(design):history.redo(design);selected=null;design.presentation??={background:0,pose:0};scene.background(design.presentation.background);scene.pose(design.presentation.pose);changed({panel:true});}
$('#undo').onclick=()=>restoreHistory('undo');$('#redo').onclick=()=>restoreHistory('redo');
window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$('#dialog').open)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreHistory(e.shiftKey?'redo':'undo');}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();restoreHistory('redo');}else if((e.key==='Delete'||e.key==='Backspace')&&selected&&tab==='deco'&&!showcase){e.preventDefault();mutate(()=>{nail().decorations=nail().decorations.filter(d=>d.id!==selected);selected=null;},{panel:true});}});

const canvas=scene.renderer.domElement;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function addPaint(hit){
 if(!action||!hit||hit.index!==action.index||!insideNail(nail(),hit.u,hit.v)){if(action)action.stroke=null;return;}
 if(!action.stroke||action.stroke.points.length>=6000){if(nail().strokes.length>=200){toast('当前指甲已有 200 笔，可先清除部分手绘或另存作品');return;}action.stroke={kind:tool,color,size:brush,points:[]};nail().strokes.push(action.stroke);}
 const last=action.stroke.points.at(-1);if(!last||Math.hypot(last[0]-hit.u,last[1]-hit.v)>.001)action.stroke.points.push([hit.u,hit.v]);
}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||showcase||tab==='view'||$('#dialog').open)return;
 const hit=scene.pick(e.clientX,e.clientY);if(!hit)return;
 if(view!=='detail'||hit.index!==active){selectFinger(hit.index);return;}
 if(!['paint','deco'].includes(tab)&&tool!=='magnet')return;
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 if(tab==='paint'){
  if(nail().strokes.length>=200){toast('当前指甲已有 200 笔，可清除手绘或另存作品');return;}
  history.push(design);action={kind:'paint',index:active,pointer:e.pointerId,x:e.clientX,y:e.clientY,stroke:null};addPaint(hit);
 }else if(tab==='deco'){
  if(placing){if(nail().decorations.length>=18){toast('这枚指甲最多放置 18 枚装饰');return;}history.push(design);const d=constrainDeco(nail(),{id:uid(),type:decoType,u:hit.u,v:hit.v,rotation:0,scale:1});nail().decorations.push(d);selected=d.id;placing=false;action={kind:'deco',index:active,pointer:e.pointerId,id:selected,offsetU:0,offsetV:0};renderPanel();chime(750);}
  else{const nearest=nail().decorations.map(d=>({d,dist:Math.hypot((d.u-hit.u)*.5,d.v-hit.v)})).sort((a,b)=>a.dist-b.dist)[0];if(!nearest||nearest.dist>.13){selected=null;scene.select(active);renderPanel();return;}selected=nearest.d.id;history.push(design);action={kind:'deco',index:active,pointer:e.pointerId,id:selected,offsetU:nearest.d.u-hit.u,offsetV:nearest.d.v-hit.v};renderPanel();}
 }else if(tool==='magnet'){history.push(design);action={kind:'magnet',index:active,pointer:e.pointerId};nail().magnet.u=hit.u;}
 delete design.thumbnail;scheduleRender();updateStatus();
});
canvas.addEventListener('pointermove',e=>{
 const hit=scene.pick(e.clientX,e.clientY),cursor=$('#cursor');
 if(tab==='paint'&&!showcase&&view==='detail'&&hit?.index===active){const p=scene.project(active,clamp(hit.u+brush/2,0,1),hit.v);const size=clamp(Math.hypot(p.x-e.clientX,p.y-e.clientY)*2,5,150);cursor.style.display='block';cursor.style.width=cursor.style.height=size+'px';cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';}else cursor.style.display='none';
 if(!action||e.pointerId!==action.pointer)return;
 if(action.kind==='paint'){
  const dist=Math.hypot(e.clientX-action.x,e.clientY-action.y),steps=Math.min(200,Math.max(1,Math.ceil(dist/3)));
  for(let i=1;i<=steps;i++)addPaint(scene.pick(action.x+(e.clientX-action.x)*i/steps,action.y+(e.clientY-action.y)*i/steps));action.x=e.clientX;action.y=e.clientY;
 }else if(hit?.index===active&&action.kind==='deco'){const d=nail().decorations.find(a=>a.id===action.id);if(d){d.u=hit.u+action.offsetU;d.v=hit.v+action.offsetV;constrainDeco(nail(),d);}}
 else if(hit?.index===active&&action.kind==='magnet'){
  nail().magnet.u=hit.u;nail().magnet.angle=Math.atan2(hit.v-.5,hit.u-.5)*.6;
  if($('#magnet-u')){$('#magnet-u').value=hit.u;$('#magnet-u-output').textContent=`${Math.round(hit.u*100)}%`;$('#magnet-angle').value=Math.round(nail().magnet.angle*180/Math.PI);$('#magnet-angle-output').textContent=$('#magnet-angle').value+'°';}
 }
 scheduleRender();
});
function endAction(){if(!action)return;const previous=action;action=null;if(canvas.hasPointerCapture(previous.pointer))canvas.releasePointerCapture(previous.pointer);delete design.thumbnail;scene.sync(design);scene.select(active,selected,showcase);updateStatus();scheduleSave();}
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,endAction);
canvas.addEventListener('pointerleave',()=>$('#cursor').style.display='none');
window.addEventListener('pointerup',endAction);window.addEventListener('blur',()=>{endAction();persist();$('#cursor').style.display='none';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){endAction();persist();}});window.addEventListener('pagehide',persist);

renderFingers();renderPanel();updateStatus();
if(!loadSeen())welcome();else if(bootError)toast(bootError,10000);
function loadSeen(){try{const seen=sessionStorage.getItem('nail-atelier-visited');sessionStorage.setItem('nail-atelier-visited','1');return seen;}catch{return false;}}
// Read-only diagnostics used by browser tests; all creation actions are exercised through the UI.
window.nailAtelier={get design(){return clone(design);},get active(){return active;},get action(){return action?.kind??null;},get view(){return view;},project:(i,u,v)=>scene.project(i,u,v),pick:(x,y)=>scene.pick(x,y),stats:()=>scene.stats(),get renderer(){return scene.renderer;},get scene(){return scene;}};

function studioWallet(){try{return loadWallet();}catch{toast('工作室材料记录读取失败，原记录已保留。');return {purchases:[]};}}
