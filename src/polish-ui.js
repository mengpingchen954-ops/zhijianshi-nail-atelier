import {polishValues} from './season.js';

export function polishControls(n){
 const p=polishValues(n);
 const range=(key,label,min,max,step=.01)=>`<label>${label}<output>${Math.round(p[key]*100)}%</output><input data-polish="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${p[key]}" aria-label="${label}"></label>`;
 const color=(key,label)=>`<label class="polish-color">${label}<input data-polish="${key}" type="color" value="${p[key]}" aria-label="${label}"></label>`;
 return `<fieldset class="polish-controls"><legend>材质配方 · 当前指</legend>${range('opacity','每层色胶浓度',.15,1)}<label>薄涂叠层<select data-polish="layers" aria-label="薄涂叠层">${[1,2,3].map(v=>`<option value="${v}" ${p.layers===v?'selected':''}>${v} 层</option>`).join('')}</select></label>${n.finish==='catEye'?range('catWidth','猫眼光宽',.06,.6)+range('catSoftness','猫眼柔度',0,1)+color('catColor','磁光颜色'):''}${range('chrome','镜面强度',0,1)}${n.pattern==='french'?range('tipWidth','法式边宽',.025,.25,.005):''}${n.pattern==='french'||p.dots?color('tipColor',p.dots?'边线 / 波点颜色':'法式边色'):''}${n.pattern==='aura'?color('auraColor','光晕颜色')+range('auraSize','光晕范围',.2,1):''}<label class="polish-check"><input data-polish="dots" type="checkbox" ${p.dots?'checked':''}>叠加微波点</label><small>浓度与叠层共同决定透感；叠层在本次上色中模拟。</small></fieldset>`;
}
export function bindPolish(root,n,mutate){
 root.querySelectorAll('[data-polish]').forEach(input=>{
  input.oninput=()=>{const output=input.parentElement.querySelector('output');if(output)output.textContent=Math.round(Number(input.value)*100)+'%';};
  input.onchange=()=>mutate(()=>{n.polish={...polishValues(n),[input.dataset.polish]:input.type==='checkbox'?input.checked:input.type==='color'?input.value:Number(input.value)};});
 });
}
export function patternControl(n,id){return `<label class="pattern-control">图案叠加<select id="${id}" aria-label="图案叠加">${[['','留白'],['french','法式边'],['marble','晕纹'],['aura','中心光晕']].map(([v,t])=>`<option value="${v}" ${(n.pattern||'')===v?'selected':''}>${t}</option>`).join('')}</select></label>`;}
