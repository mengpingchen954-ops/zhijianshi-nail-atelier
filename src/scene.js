import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {halfWidth,constrainDeco} from './state.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
const SIZE=512;
export function nailSize(n,index){return {w:(index%5===0?.39:index%5===4?.235:.285)*(n.width||1), l:.38+n.length*.34};}
export function surface(n,index,u,v){const s=nailSize(n,index),x=u-.5;return V(x*s.w,.025+.055*(n.curve||1)*(1-Math.pow(x/.5,2))-.018*v+.005*Math.sin(v*Math.PI)+(n.build||0)*.035*Math.sin(Math.PI*v)*Math.max(0,1-4*x*x),-v*s.l);}
function curvedGeometry(n,index){
 const p=[],uv=[],indices=[],cols=32,rows=48;
 for(let j=0;j<=rows;j++){const v=j/rows,blend=n.shapeBlend??1,w=halfWidth(n.shape,v)*blend+halfWidth('round',v)*(1-blend);for(let i=0;i<=cols;i++){const u=.5+(i/cols*2-1)*w,q=surface(n,index,u,v);p.push(q.x,q.y,q.z);uv.push(u,v);}}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function sideGeometry(top,thickness=.009){
 const pos=top.attributes.position,cols=32,rows=48,border=[];
 for(let i=0;i<=cols;i++)border.push(i);for(let j=1;j<=rows;j++)border.push(j*(cols+1)+cols);
 for(let i=cols-1;i>=0;i--)border.push(rows*(cols+1)+i);for(let j=rows-1;j>0;j--)border.push(j*(cols+1));
 const p=[],ids=[];border.forEach(i=>{p.push(pos.getX(i),pos.getY(i),pos.getZ(i),pos.getX(i),pos.getY(i)-thickness,pos.getZ(i));});
 for(let i=0;i<border.length;i++){const a=i*2,b=((i+1)%border.length)*2;ids.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
function drawStroke(ctx,s){
 ctx.globalCompositeOperation=s.kind==='erase'?'destination-out':'source-over';ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.size*SIZE;ctx.lineCap='round';ctx.lineJoin='round';
 const ps=s.points;ctx.beginPath();ps.forEach((p,i)=>{const x=p[0]*SIZE,y=(1-p[1])*SIZE;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
 if(ps.length===1){ctx.beginPath();ctx.arc(ps[0][0]*SIZE,(1-ps[0][1])*SIZE,s.size*SIZE/2,0,Math.PI*2);ctx.fill();}
}
function sticker(type){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.translate(64,64);
 if(type==='flower'){for(let i=0;i<5;i++){x.save();x.rotate(i*Math.PI*2/5);x.fillStyle='#fff9ed';x.beginPath();x.ellipse(0,-24,15,25,0,0,Math.PI*2);x.fill();x.restore();}x.fillStyle='#d4a65d';x.beginPath();x.arc(0,0,14,0,Math.PI*2);x.fill();}
 if(type==='heart'){x.fillStyle='#b85672';x.beginPath();x.moveTo(0,40);x.bezierCurveTo(-65,-1,-52,-58,0,-29);x.bezierCurveTo(52,-58,65,-1,0,40);x.fill();}
 if(type==='star'){x.fillStyle='#d7b46c';x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?21:47;i?x.lineTo(Math.cos(a)*r,Math.sin(a)*r):x.moveTo(Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fill();}
 if(type==='bow'){x.fillStyle='#e8b9c8';for(const side of [-1,1]){x.beginPath();x.moveTo(0,0);x.bezierCurveTo(side*65,-54,side*65,38,0,0);x.fill();x.strokeStyle='#ad6a85';x.lineWidth=2;x.stroke();x.beginPath();x.moveTo(side*5,4);x.lineTo(side*30,45);x.lineTo(side*8,32);x.closePath();x.fill();}x.fillStyle='#f5e4d0';x.beginPath();x.arc(0,0,8,0,Math.PI*2);x.fill();}
 if(type==='butterfly'){for(const side of [-1,1]){x.fillStyle='#c4a2d1';x.beginPath();x.ellipse(side*22,-17,24,30,side*.6,0,Math.PI*2);x.fill();x.fillStyle='#dfc3de';x.beginPath();x.ellipse(side*17,21,17,23,-side*.4,0,Math.PI*2);x.fill();}x.strokeStyle='#957052';x.lineWidth=4;x.beginPath();x.moveTo(0,-25);x.lineTo(0,30);x.stroke();}
 if(type==='foil'){x.fillStyle='#d8b15b';for(let i=0;i<9;i++){const a=i*2.4,px=Math.cos(a)*i*4,py=Math.sin(a)*i*4;x.beginPath();x.moveTo(px,py-7);x.lineTo(px+9,py+2);x.lineTo(px-4,py+10);x.lineTo(px-8,py);x.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export class NailScene{
 constructor(host,onCamera){
  this.host=host;this.scene=new T.Scene();this.scene.background=new T.Color('#e6d6c7');
  this.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.88;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;host.append(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','三维美甲画布：左键编辑，右键旋转，滚轮缩放');this.renderer.domElement.tabIndex=0;
  this.camera=new T.PerspectiveCamera(32,1,.05,80);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.mouseButtons={LEFT:null,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.ROTATE};this.controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_PAN};this.controls.enableDamping=true;this.controls.dampingFactor=.11;this.controls.minDistance=.55;this.controls.maxDistance=40;this.controls.maxPolarAngle=Math.PI*.48;this.controls.enablePan=false;
  this.scene.add(new T.HemisphereLight('#fff4e6','#a27765',1.3));
  const light=new T.DirectionalLight('#fff2dc',2.2);light.position.set(-3,7,3);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-5;light.shadow.camera.right=5;light.shadow.camera.top=5;light.shadow.camera.bottom=-5;light.shadow.bias=-.0003;this.scene.add(light);this.key=light;
  const soft=new T.DirectionalLight('#ffe0ea',.7);soft.position.set(4,3,-3);this.scene.add(soft);
  const pm=new T.PMREMGenerator(this.renderer);this.env=pm.fromScene(new RoomEnvironment(),.04);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.5;pm.dispose();
  this.skin=new T.MeshPhysicalMaterial({color:'#d6a48d',roughness:.68,clearcoat:0});
  const pores=document.createElement('canvas');pores.width=pores.height=256;const px=pores.getContext('2d'),img=px.createImageData(256,256);let seed=43;for(let i=0;i<img.data.length;i+=4){seed=seed*16807%2147483647;const a=125+seed%30;img.data.set([a,a,a,255],i);}px.putImageData(img,0,0);this.skin.bumpMap=new T.CanvasTexture(pores);this.skin.bumpMap.wrapS=this.skin.bumpMap.wrapT=T.RepeatWrapping;this.skin.bumpMap.repeat.set(5,5);this.skin.bumpScale=.0015;
  this.rec=[];this.hands=[];this.pickMeshes=[];this.stickers=Object.fromEntries(['flower','heart','star','bow','butterfly','foil'].map(k=>[k,sticker(k)]));this.makeRoom();this.makeHands();
  this.ray=new T.Raycaster();this.frames=[];this.last=0;this.active=2;this.mode='both';this.design=null;
  this.controls.addEventListener('change',()=>onCamera?.());
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();this.focus('both');
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.dispatchEvent(new CustomEvent('render-lost'));});this.renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  this.renderer.setAnimationLoop(t=>{if(this.last&&t-this.last<250){this.frames.push(t-this.last);if(this.frames.length>120)this.frames.shift();}this.last=t;this.controls.update();this.renderer.render(this.scene,this.camera);});
 }
 mesh(g,m,pos,scale,parent=this.scene){const a=new T.Mesh(g,m);if(pos)a.position.copy(pos);if(scale)a.scale.copy(scale);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
 makeRoom(){
  const wood=new T.MeshStandardMaterial({color:'#ceb096',roughness:.7});this.mesh(new T.BoxGeometry(17,.24,14),wood,V(0,-.36,0));
  const weave=document.createElement('canvas');weave.width=weave.height=128;const ctx=weave.getContext('2d');ctx.fillStyle='#aaa';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#bbb';ctx.lineWidth=1;for(let i=0;i<128;i+=4){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.stroke();}const bump=new T.CanvasTexture(weave);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(15,12);
  const pad=new T.MeshStandardMaterial({color:'#f2e5d8',roughness:.9,bumpMap:bump,bumpScale:.002});this.mesh(new T.BoxGeometry(7,.09,4.8),pad,V(0,-.2,-.3));this.roomMaterials={wood,pad};
  const tray=new T.MeshStandardMaterial({color:'#dcb9a3',roughness:.38,metalness:.15});this.mesh(new T.CylinderGeometry(.85,.85,.06,64),tray,V(3,.05,-1.6));
  for(let i=0;i<4;i++){const c=['#d998ad','#a599cf','#82bbd4','#c7a364'][i];const g=new T.MeshPhysicalMaterial({color:c,roughness:.22,clearcoat:1});this.mesh(new T.CylinderGeometry(.16,.18,.37,24),g,V(-2.8+i*.49,.04,-2.35));this.mesh(new T.CylinderGeometry(.1,.1,.32,24),new T.MeshStandardMaterial({color:'#594338',roughness:.3,metalness:.1}),V(-2.8+i*.49,.38,-2.35));}
  const gold=new T.MeshStandardMaterial({color:'#bd975b',metalness:.75,roughness:.27});
  for(let i=0;i<2;i++){const brush=this.mesh(new T.CylinderGeometry(.025,.034,1.65,18),gold,V(2.6+i*.22,.02,.1));brush.rotation.z=Math.PI/2;brush.rotation.y=.25;}
  this.mesh(new T.CylinderGeometry(.46,.42,.13,40),new T.MeshStandardMaterial({color:'#ead7c5',roughness:.25}),V(3.5,-.02,1.65));
  const vase=this.mesh(new T.SphereGeometry(.32,24,16),new T.MeshStandardMaterial({color:'#e6c2b3',roughness:.5}),V(-3.5,.15,1.3),V(1,1.5,1));
  for(let i=0;i<4;i++){const stem=this.mesh(new T.CylinderGeometry(.011,.015,.8,8),new T.MeshStandardMaterial({color:'#8b9a74'}),V(-3.5+(i-1.5)*.08,.86,1.3));stem.rotation.z=(i-1.5)*.15;for(let j=0;j<5;j++){const p=this.mesh(new T.SphereGeometry(.065,12,8),new T.MeshStandardMaterial({color:i%2?'#e5a8b5':'#f6e5dd'}),V(stem.position.x+Math.cos(j*1.26)*.08,1.27+Math.sin(j*1.26)*.05,1.3),V(1,1,.6));}}
 }
 fingerGeometry(length,radius){
  const pts=[],uv=[],idx=[],rings=42,sides=24;
  for(let j=0;j<=rings;j++){const t=j/rings,z=-t*length;
   const taper=1-.22*t,tip=Math.sqrt(Math.max(0,1-Math.pow(Math.max(0,(t-.79)/.21),2)));
   const r=radius*taper*(t>.79?tip:1)*(1+.035*Math.sin(t*7*Math.PI));
   for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;pts.push(Math.cos(a)*r,.016*Math.sin(t*Math.PI)+Math.sin(a)*r*.8,z);uv.push(i/sides,t);}
  }
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 palmGeometry(){
  // A single loft joins palm and wrist; finger roots overlap below the dorsal surface.
  const profile=[[-1.08,0,0],[-.82,.58,.15],[-.55,.74,.19],[0,.76,.22],[.55,.67,.205],[1,.51,.17],[1.45,.44,.155],[1.8,.44,.15]];
  const curve=new T.CatmullRomCurve3(profile.map(([z,w,h])=>V(w,h,z)),false,'centripetal');
  const p=[],uv=[],ids=[],rings=64,sides=40;
  for(let j=0;j<=rings;j++){
   const q=curve.getPoint(j/rings),z=q.z,w=Math.max(0,q.x),h=Math.max(0,q.y);
   for(let i=0;i<=sides;i++){const angle=i/sides*Math.PI*2,dy=Math.sin(angle);p.push(Math.cos(angle)*w,dy*h-.015,z);uv.push(i/sides,j/rings);}
  }
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;ids.push(a,a+1,b,a+1,b+1,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
 }
 makeHands(){
  const lengths=[1.13,1.61,1.79,1.66,1.29],xs=[-.8,-.51,-.17,.18,.49],r=[.24,.19,.195,.18,.154];
  for(let h=0;h<2;h++){
   const group=new T.Group();group.position.set(h?1.48:-1.48,.12,.72);group.rotation.y=h?-.11:.11;this.scene.add(group);this.hands.push(group);
   const skinMesh=this.handSurface(h,lengths,xs,r);group.add(skinMesh);
   const cuff=this.mesh(new T.LatheGeometry([new T.Vector2(.43,0),new T.Vector2(.48,.03),new T.Vector2(.49,.09),new T.Vector2(.49,.75)],48),new T.MeshStandardMaterial({color:'#c9b7ae',roughness:.95,bumpMap:this.roomMaterials.pad.bumpMap,bumpScale:.008,side:T.DoubleSide}),V(0,-.01,1.52),V(1,1,.43),group);cuff.rotation.x=Math.PI/2;
   for(let f=0;f<5;f++){
    const fg=new T.Group();const side=h?-1:1;fg.position.set(xs[f]*side*(f===0?.82:1),f===0?-.07:0,f===0?.27:-.53);fg.rotation.y=(f===0?.68:(f-2)*-.028)*side;group.add(fg);
    for(const t of [.32,.58]){const rr=r[f]*(1-.22*t);for(const offset of [0,.032]){const pts=[];for(let j=0;j<=12;j++){const x=(j/12-.5)*rr*1.3;pts.push(V(x,Math.sqrt(rr*rr-x*x)*.8+.016*Math.sin(t*Math.PI)+.001,-lengths[f]*t+offset+.013*(1-Math.pow(x/rr,2))));}const crease=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.0012,3,false),new T.MeshStandardMaterial({color:'#b88976',roughness:1,transparent:true,opacity:.26}));fg.add(crease);}}
    const nailGroup=new T.Group();nailGroup.position.set(0,r[f]*.63-(f===0?.034:.052),-lengths[f]+.43);nailGroup.rotation.x=-.035;fg.add(nailGroup);
    const mat=new T.MeshPhysicalMaterial({color:'#fff',roughness:.17,clearcoat:1,clearcoatRoughness:.1,side:T.DoubleSide});
    const top=new T.Mesh(new T.BufferGeometry(),mat);nailGroup.add(top);
    const rim=new T.Mesh(new T.BufferGeometry(),new T.MeshPhysicalMaterial({color:'#d998ad',roughness:.28,clearcoat:1,side:T.DoubleSide}));nailGroup.add(rim);
    const decos=new T.Group();nailGroup.add(decos);const index=h*5+f;top.userData.index=index;
    this.rec[index]={index,group:nailGroup,top,rim,decos,mat,key:null};this.pickMeshes.push(top);
   }
  }
 }
 handSurface(hand,lengths,xs,radii){
  // One smooth implicit surface joins wrist, palm, thenar pad and fingers without model seams.
  const resolution=88,mc=new MarchingCubes(resolution,this.skin,true,false,65000),sx=1.65,sy=.46,sz=2.5,cz=-.3,side=hand?-1:1;
  const ell=(x,y,z,a,b,c)=>(Math.sqrt(x*x/(a*a)+y*y/(b*b)+z*z/(c*c))-1)*Math.min(a,b,c);
  const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
  const fingers=lengths.map((l,f)=>{const angle=(f===0?.68:(f-2)*-.028)*side;return {l,r:radii[f],x:xs[f]*side*(f===0?.82:1),y:f===0?-.07:0,z:f===0?.27:-.53,c:Math.cos(angle),s:Math.sin(angle)};});
  for(let k=0;k<resolution;k++)for(let j=0;j<resolution;j++)for(let i=0;i<resolution;i++){
   const x=(i/resolution*2-1)*sx,y=(j/resolution*2-1)*sy,z=(k/resolution*2-1)*sz+cz;
   let d=ell(x,y+.015,z+.08,.735,.218,.98);
   const wristZ=Math.max(.58-z,0,z-2.05);d=smin(d,(Math.sqrt(x*x/(.435*.435)+(y+.02)*(y+.02)/(.15*.15)+wristZ*wristZ/(.44*.44))-1)*.15,.14);
   d=smin(d,ell(x+side*.48,y+.055,z-.12,.34,.18,.53),.10);
   for(const f of fingers){const dx=x-f.x,dz=z-f.z,lx=f.c*dx-f.s*dz,lz=f.s*dx+f.c*dz,t=Math.max(0,Math.min(1,-lz/f.l));const tip=Math.sqrt(Math.max(0,1-Math.pow(Math.max(0,(t-.79)/.21),2)));const r=f.r*(1-.22*t)*(t>.79?tip:1)*(1+.025*Math.sin(t*7*Math.PI));const fd=Math.hypot(lx,(y-f.y-.016*Math.sin(t*Math.PI))*1.25,Math.max(0,lz,-lz-f.l))-r;d=smin(d,fd,.075);}
   mc.field[k*resolution*resolution+j*resolution+i]=-d;
  }
  mc.isolation=0;mc.update();const count=mc.geometry.drawRange.count,g=new T.BufferGeometry();
  for(const name of ['position','normal','uv']){const a=mc.geometry.getAttribute(name);if(a)g.setAttribute(name,new T.BufferAttribute(a.array.slice(0,count*a.itemSize),a.itemSize));}
  g.scale(sx,sy,sz);g.translate(0,0,cz);mc.geometry.dispose();
  const mesh=new T.Mesh(g,this.skin);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
 }
 texture(n,canvas){
  const c=canvas||document.createElement('canvas');c.width=c.height=SIZE;const x=c.getContext('2d');
  x.fillStyle=n.base;x.fillRect(0,0,SIZE,SIZE);
  if(n.gradient){const a=n.gradient.angle*Math.PI/180,dx=Math.sin(a)*SIZE/2,dy=-Math.cos(a)*SIZE/2,g=x.createLinearGradient(SIZE/2-dx,SIZE/2-dy,SIZE/2+dx,SIZE/2+dy);g.addColorStop(0,n.base);g.addColorStop(Math.max(0,.5-n.gradient.range/2),n.base);g.addColorStop(Math.min(1,.5+n.gradient.range/2),n.gradient.color);g.addColorStop(1,n.gradient.color);x.fillStyle=g;x.fillRect(0,0,SIZE,SIZE);}
  if(n.pattern==='french'){x.fillStyle='#fff7e9';x.beginPath();x.moveTo(0,0);x.lineTo(SIZE,0);x.lineTo(SIZE,SIZE*.16);x.quadraticCurveTo(SIZE*.5,SIZE*.04,0,SIZE*.16);x.fill();}
  if(n.pattern==='marble'){for(let i=0;i<5;i++){x.strokeStyle=i%2?'#fff6e4aa':'#826b9c55';x.lineWidth=4+i*2;x.beginPath();x.moveTo(-40,i*140);x.bezierCurveTo(320,i*60,40,i*170,570,i*130+80);x.stroke();}}
  const ink=document.createElement('canvas');ink.width=ink.height=SIZE;const ctx=ink.getContext('2d');for(const s of n.strokes)drawStroke(ctx,s);x.drawImage(ink,0,0);
  if(n.finish==='glitter'){let seed=84;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<900;i++){x.fillStyle=i%2?'#f5daa4':'#fff9e4';x.globalAlpha=.35+rand()*.6;x.beginPath();x.arc(rand()*SIZE,rand()*SIZE,.5+rand()*1.6,0,Math.PI*2);x.fill();}x.globalAlpha=1;}
  if(n.surface){const s=n.surface,cell=(u,v)=>Math.min(4,Math.max(0,Math.round((v-.12)/.18)))*3+Math.min(2,Math.max(0,Math.round((u-.2)/.3)));
   if(s.old){x.fillStyle=s.oldColor;x.fillRect(0,0,SIZE,SIZE);for(let k=0;k<15;k++)if(s.remove.includes(k)||(k*7%15)/15>(s.oldAmount??1)){x.fillStyle='#e8b7ad';x.fillRect((k%3)*SIZE/3,SIZE-(Math.floor(k/3)+1)*SIZE/5,SIZE/3+1,SIZE/5+1);}}
   if(!s.color&&s.revealed.length){const t=this.texture(s.target);x.save();x.beginPath();for(const p of s.paths?.color||[]){x.moveTo(p[0]*SIZE+SIZE*.2,(1-p[1])*SIZE);x.arc(p[0]*SIZE,(1-p[1])*SIZE,SIZE*.2,0,Math.PI*2);}x.clip();x.drawImage(t,0,0);x.restore();}
   if(s.dirty||s.dust)for(let k=0;k<95;k++){const u=((k*67+23)%503)/503,v=((k*139+57)%499)/499,c=cell(u,v);if(s.dirty&&k<95*s.dirty&&!s.cleared.includes(c)){x.fillStyle=k%3?'#76634e80':'#5d504d99';x.beginPath();x.ellipse(u*SIZE,(1-v)*SIZE,3+k%6,2+k%4,k,0,Math.PI*2);x.fill();}if(s.dust&&!s.dusted.includes(c)){x.fillStyle='#fff3dfbb';x.fillRect(u*SIZE,(1-v)*SIZE,2+k%4,2+k%3);}}
   if(s.bonding)for(let k=0;k<5;k++){const u=.3+(k%2)*.35,v=.2+k*.13;if(!s.bond.includes(cell(u,v))){x.strokeStyle='#fff8';x.lineWidth=4;x.beginPath();x.ellipse(u*SIZE,(1-v)*SIZE,15,23,0,0,Math.PI*2);x.stroke();}}
  }
  return c;
 }
 catShader(mat,n){
  mat.onBeforeCompile=shader=>{
   shader.uniforms.catU={value:n.magnet.u};shader.uniforms.catAngle={value:n.magnet.angle};
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCatUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCatUV=uv;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vCatUV;uniform float catU;uniform float catAngle;').replace('#include <color_fragment>','#include <color_fragment>\nfloat stripe=exp(-pow((vCatUV.x-catU)*cos(catAngle)+(vCatUV.y-.5)*sin(catAngle),2.0)*380.0);float shimmer=.35+.65*pow(abs(dot(normalize(vNormal),normalize(vViewPosition))),2.0);diffuseColor.rgb+=vec3(.42,.35,.24)*stripe*shimmer;');
   mat.userData.shader=shader;
  };mat.customProgramCacheKey=()=> 'cat-eye-v1';mat.needsUpdate=true;
 }
 sync(design,force=false){
  this.design=design;let shadowsChanged=false;
  for(const rec of this.rec){const n=design.nails[rec.index],key=JSON.stringify(n);if(!force&&key===rec.key)continue;
   const shapeKey=JSON.stringify([n.shape,n.length,n.width,n.curve,n.build,n.shapeBlend]);if(shapeKey!==rec.shapeKey){const g=curvedGeometry(n,rec.index);rec.top.geometry.dispose();rec.top.geometry=g;rec.rim.geometry.dispose();rec.rim.geometry=sideGeometry(g);rec.shapeKey=shapeKey;shadowsChanged=true;}
   const textureKey=JSON.stringify([n.base,n.gradient,n.strokes,n.pattern,n.surface,n.finish==='glitter']);
   if(force||textureKey!==rec.textureKey){rec.canvas=this.texture(n,rec.canvas);if(!rec.tex){rec.tex=new T.CanvasTexture(rec.canvas);rec.tex.colorSpace=T.SRGBColorSpace;rec.tex.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());rec.mat.map=rec.tex;}else rec.tex.needsUpdate=true;rec.textureKey=textureKey;}
   const oldFinish=rec.finish;const matte=n.topcoat==='matte'||n.finish==='matte';rec.mat.roughness=matte?.88:n.finish==='metal'?.22:n.surface&&!n.surface.color?.52-.35*(n.surface.undercoat||0):.15;rec.mat.metalness=n.finish==='metal'?.88:.05;rec.mat.clearcoat=matte?0:1;
   if(oldFinish!==n.finish){rec.mat.userData.shader=null;if(n.finish==='catEye')this.catShader(rec.mat,n);else{rec.mat.onBeforeCompile=()=>{};rec.mat.customProgramCacheKey=()=> 'polish';rec.mat.needsUpdate=true;}}
   const shader=rec.mat.userData.shader;if(shader){shader.uniforms.catU.value=n.magnet.u;shader.uniforms.catAngle.value=n.magnet.angle;}
   if(n.tipPreview){const p={...n,...n.tipPreview,build:0,shapeBlend:1},pk=JSON.stringify(n.tipPreview);if(!rec.preview){rec.preview=new T.Mesh(new T.BufferGeometry(),new T.MeshPhysicalMaterial({color:'#fff7e8',transparent:true,opacity:.38,roughness:.2,clearcoat:1,side:T.DoubleSide,depthWrite:false}));rec.preview.position.y=.018;rec.group.add(rec.preview);}if(pk!==rec.previewKey){rec.preview.geometry.dispose();rec.preview.geometry=curvedGeometry(p,rec.index);rec.previewKey=pk;}rec.preview.visible=true;}else if(rec.preview)rec.preview.visible=false;
   rec.rim.material.color.set(n.base);const decoKey=JSON.stringify([n.decorations,n.surface?.ghost])+'-'+shapeKey;if(decoKey!==rec.decoKey){this.updateDecos(rec,n);rec.decoKey=decoKey;shadowsChanged=true;}rec.finish=n.finish;rec.key=key;
  }
  if(shadowsChanged)this.renderer.shadowMap.needsUpdate=true;
 }
 updateDecos(rec,n){
  for(const child of [...rec.decos.children]){child.traverse(o=>{o.geometry?.dispose();if(o.material&&!this.sharedMats?.includes(o.material))o.material.dispose();});rec.decos.remove(child);}
  for(const source of [...n.decorations.filter(d=>!d.hidden),...(n.surface?.ghost||[]).filter(d=>!d.hidden).map(d=>({...d,ghost:true}))]){const d=constrainDeco(n,{...source});const parent=new T.Group();const q=surface(n,rec.index,d.u,d.v),eps=.005,a=surface(n,rec.index,d.u+eps,d.v),b=surface(n,rec.index,d.u,d.v+eps),normal=a.sub(q).cross(b.sub(q)).normalize();parent.position.copy(q).addScaledVector(normal,.008);parent.quaternion.setFromUnitVectors(V(0,1,0),normal);parent.rotateY(-d.rotation);parent.userData.id=d.id;
   const width=nailSize(n,rec.index).w;
   if(['gem','pearl'].includes(d.type)){const radius=width*(d.type==='gem'?.095:.085)*d.scale;const m=new T.MeshPhysicalMaterial({color:d.type==='gem'?'#e5d2a9':'#fff1de',metalness:d.type==='gem'?.4:.05,roughness:d.type==='gem'?.06:.21,clearcoat:1,transmission:d.type==='gem'?.23:0,ior:2.1});const mesh=new T.Mesh(d.type==='gem'?new T.OctahedronGeometry(radius,0):new T.SphereGeometry(radius,20,14),m);mesh.position.y=radius*.65;parent.add(mesh);const setting=new T.Mesh(new T.TorusGeometry(radius*.85,.004,6,20),new T.MeshStandardMaterial({color:'#c7a364',metalness:.8,roughness:.25}));setting.rotation.x=Math.PI/2;setting.position.y=.004;parent.add(setting);}
   else{const pts=[],uv=[],ids=[],sz=width*.23*d.scale,size=nailSize(n,rec.index);parent.position.set(0,0,0);parent.quaternion.identity();for(let j=0;j<=8;j++)for(let i=0;i<=8;i++){const x=(i/8-.5)*sz,z=(j/8-.5)*sz,c=Math.cos(d.rotation),s=Math.sin(d.rotation),u=d.u+(x*c-z*s)/size.w,v=d.v-(x*s+z*c)/size.l;const q=surface(n,rec.index,u,v);pts.push(q.x,q.y+.003,q.z);uv.push(i/8,1-j/8);}for(let j=0;j<8;j++)for(let i=0;i<8;i++){const a=j*9+i;ids.push(a,a+1,a+9,a+1,a+10,a+9);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();parent.add(new T.Mesh(g,new T.MeshStandardMaterial({map:this.stickers[d.type],transparent:true,alphaTest:.08,roughness:.35,metalness:.12,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2})));}
   if(source.ghost)parent.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=.28;o.material.depthWrite=false;}});rec.decos.add(parent);
  }
 }
 select(index,id=null,show=false){
  this.active=index;
  if(this.selection){this.selection.geometry.dispose();this.selection.material.dispose();this.selection.parent?.remove(this.selection);this.selection=null;}
  if(show||!id)return;const d=this.design.nails[index].decorations.find(a=>a.id===id);if(!d)return;
  const radius=nailSize(this.design.nails[index],index).w*.16*d.scale;const ring=new T.Mesh(new T.TorusGeometry(radius,.0016,6,40),new T.MeshBasicMaterial({color:'#b85b79',depthTest:false}));ring.rotation.x=Math.PI/2;ring.position.copy(surface(this.design.nails[index],index,d.u,d.v)).add(V(0,.019,0));this.rec[index].group.add(ring);this.selection=ring;
 }
 focus(mode='both',index=this.active){
  this.mode=mode;this.active=index;this.scene.updateMatrixWorld(true);this.hands.forEach((h,i)=>h.visible=mode==='hand'?i===Math.floor(index/5):true);
  let target=V(0,.18,-.1),dist=10.5;
  if(mode==='detail'){target=this.rec[index].group.localToWorld(surface(this.design?.nails[index]||{length:.7},index,.5,.48));dist=1.9;}
  if(mode==='hand'){target=this.hands[Math.floor(index/5)].localToWorld(V(0,.15,-.25));dist=this.camera.aspect<.8?10:8.6;}
  if(mode==='both')dist=Math.max(dist,12/this.camera.aspect);
  this.controls.target.copy(target);this.camera.position.copy(target).add(V(.12,dist*.91,dist*.41));this.controls.update();this.camera.updateMatrixWorld(true);
 }
 setViewOnly(on){this.controls.mouseButtons.LEFT=on?T.MOUSE.ROTATE:null;this.controls.enableRotate=true;this.controls.touches.ONE=on?T.TOUCH.ROTATE:null;}
 pick(x,y){
  const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);
  const hits=this.ray.intersectObjects(this.pickMeshes.filter(m=>this.hands[Math.floor(m.userData.index/5)].visible));if(!hits.length)return null;const h=hits[0];return {index:h.object.userData.index,u:h.uv.x,v:h.uv.y};
 }
 project(index,u=.5,v=.5){this.scene.updateMatrixWorld(true);const p=this.rec[index].group.localToWorld(surface(this.design.nails[index],index,u,v)).project(this.camera),r=this.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
 background(id){const colors=['#e6d6c7','#e8d1da','#d4dce2'];this.scene.background.set(colors[id]);this.roomMaterials.wood.color.set(['#ceb096','#d3b5c1','#abbfcf'][id]);this.roomMaterials.pad.color.set(['#f2e5d8','#efdee4','#e3eaf1'][id]);this.key.color.set(id===1?'#ffdded':id===2?'#e3efff':'#fff2dc');}
 pose(id){this.hands.forEach((h,i)=>{h.rotation.y=(i?-.11:.11)+(id===1?(i?.2:-.2):0);h.rotation.z=id===2?(i?-.09:.09):0;});this.renderer.shadowMap.needsUpdate=true;if(this.mode==='detail')this.focus(this.mode);}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;const previous=this.camera.aspect;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);if(this.design&&Math.abs(Math.log(previous/this.camera.aspect))>.15)this.focus(this.mode,this.active);}
 photo(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 stats(){return {fps:this.frames.length?Math.round(1000/(this.frames.reduce((a,b)=>a+b,0)/this.frames.length)):0,calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,pixelRatio:this.renderer.getPixelRatio()};}
 dispose(){
  this.renderer.setAnimationLoop(null);this.resizeObserver.disconnect();this.controls.dispose();
  const geometries=new Set(),materials=new Set(),textures=new Set(Object.values(this.stickers));
  this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
  this.env.dispose();this.renderer.dispose();this.renderer.domElement.remove();
 }
}
