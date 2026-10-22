import * as T from 'three';
import {surface,curvedGeometry} from './scene.js';
export function addSalonObjects(scene){
 const mat=(color,metalness=0,roughness=.4)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const ivory=mat('#f3e8db'),rose=mat('#bd8b91',.15),gold=mat('#c3a171',.7,.25),dark=mat('#4d3d39'),steel=mat('#aeb2b5',.85,.3);
 const make=(group,g,m,x=0,y=0,z=0)=>{const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;group.add(a);return a;};
 const lamp=new T.Group();scene.scene.add(lamp);lamp.visible=false;
 const coverMat=new T.MeshPhysicalMaterial({color:'#f5ece5',roughness:.25,clearcoat:1,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide});
 let cavity=null,lampHand=null,lampPhase='off',motion=0,entryStart=.72;
 const strips=[];const glow=new T.PointLight('#9a7cff',0,5,1.5);let wash;
 function illuminate(on){glow.intensity=on?1.1:0;for(const strip of strips){strip.material.emissiveIntensity=on?.75:0;strip.material.color.set(on?'#8555cd':'#d6cee5');}if(wash)wash.visible=on;}
 function prepareLamp(hand){
  while(lamp.children.length){const child=lamp.children[0];lamp.remove(child);child.geometry?.dispose();if(strips.includes(child))child.material.dispose();}strips.length=0;
  const bounds=new T.Box3();scene.scene.updateMatrixWorld(true);
  for(let i=hand*5;i<hand*5+5;i++)for(const u of [.04,.5,.96])for(const v of [0,.5,1])bounds.expandByPoint(scene.rec[i].group.localToWorld(surface(scene.design.nails[i],i,u,v)));
  const offset=-.48-scene.hands[hand].position.z;bounds.min.z+=offset;bounds.max.z+=offset;
  const left=bounds.min.x-.24,right=bounds.max.x+.24,back=bounds.min.z-.22,front=.45,width=right-left,depth=front-back,height=.93;
  cavity={min:{x:left+.05,y:-.12,z:back+.05},max:{x:right-.05,y:height-.15,z:front}};
  lamp.position.set((left+right)/2,-.13,back);
  // Open ended, rounded roof; its translucent inspection cover keeps all five nails visible.
  const outline=new T.Shape();outline.moveTo(-width/2,0);outline.lineTo(-width/2,height-.23);outline.quadraticCurveTo(-width/2,height,-width/2+.23,height);outline.lineTo(width/2-.23,height);outline.quadraticCurveTo(width/2,height,width/2,height-.23);outline.lineTo(width/2,0);outline.lineTo(width/2-.08,0);outline.lineTo(width/2-.08,height-.23);outline.quadraticCurveTo(width/2-.08,height-.09,width/2-.23,height-.09);outline.lineTo(-width/2+.23,height-.09);outline.quadraticCurveTo(-width/2+.08,height-.09,-width/2+.08,height-.23);outline.lineTo(-width/2+.08,0);outline.closePath();
  make(lamp,new T.ExtrudeGeometry(outline,{depth,bevelEnabled:false}),coverMat);
  make(lamp,new T.BoxGeometry(width,.055,depth),rose,0,0,depth/2);
  for(const side of [-1,1])make(lamp,new T.BoxGeometry(.085,height-.2,depth),ivory,side*(width/2-.04),(height-.2)/2,depth/2);
  for(let j=0;j<5;j++){const strip=make(lamp,new T.BoxGeometry(.065,.02,depth*.65),new T.MeshStandardMaterial({color:'#d6cee5',emissive:'#8a52df',emissiveIntensity:0,toneMapped:false}),-width*.36+j*width*.18,height-.13,depth*.5);strips.push(strip);}
  wash=make(lamp,new T.PlaneGeometry(width-.15,depth-.1),new T.MeshBasicMaterial({color:'#a47ce8',transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,toneMapped:false}),0,.22,depth/2);wash.rotation.x=-Math.PI/2;wash.visible=false;wash.castShadow=false;
  make(lamp,new T.BoxGeometry(.5,.025,.23),dark,0,height+.02,depth*.8);
  glow.position.set(0,.48,depth*.6);lamp.add(glow);lamp.visible=true;scene.renderer.shadowMap.needsUpdate=true;
 }
 const tool=new T.Group();scene.scene.add(tool);tool.visible=false;
 const parts={};
 function group(name){const g=new T.Group();tool.add(g);g.visible=false;parts[name]=g;return g;}
 const abrasive=document.createElement('canvas');abrasive.width=abrasive.height=128;const ax=abrasive.getContext('2d');ax.fillStyle='#978992';ax.fillRect(0,0,128,128);for(let i=0;i<1800;i++){ax.fillStyle=i%2?'#d2c4ce':'#6e646c';ax.fillRect(i*37%128,i*61%127,1,1);}const grit=new T.CanvasTexture(abrasive);grit.wrapS=grit.wrapT=T.RepeatWrapping;grit.repeat.set(4,1);
 let g=group('file');const abrasiveMat=mat('#c9b8c1',0,.96);abrasiveMat.map=grit;const file=make(g,new T.BoxGeometry(.55,.025,.085),abrasiveMat,0,.017,-.026);make(g,new T.BoxGeometry(.16,.028,.085),ivory,.34,.017,-.026);
 g=group('wipe');const cotton=make(g,new T.BoxGeometry(.17,.045,.22),mat('#fff5eb',0,1),0,.03,0);cotton.rotation.y=.3;
 for(const name of ['polish','gel','brush']){g=group(name);const handle=make(g,new T.CylinderGeometry(.025,.035,.43,12),name==='brush'?rose:gold,.11,.14,.14);handle.rotation.x=.9;handle.rotation.z=-.4;const bristle=make(g,new T.BoxGeometry(name==='brush'?.16:.085,.025,name==='brush'?.13:.08),mat(name==='brush'?'#c3a47f':'#d2a1a4',0,.8),0,.015,0);}
 g=group('drill');const motor=make(g,new T.CylinderGeometry(.06,.065,.4,16),rose,.1,.1,.12);motor.rotation.x=.9;motor.rotation.z=-.4;make(g,new T.CylinderGeometry(.015,.015,.14,12),steel,0,.03,0).rotation.x=1;
 g=group('magnet');make(g,new T.BoxGeometry(.11,.07,.27),dark,.03,.13,.04);make(g,new T.BoxGeometry(.12,.035,.08),steel,.03,.09,-.09);
 g=group('tweezers');for(const sign of [-1,1]){const p=make(g,new T.BoxGeometry(.012,.016,.35),gold,sign*.025,.055,.08);p.rotation.y=sign*.1;}
 g=group('tip');const heldTip=make(g,new T.BufferGeometry(),new T.MeshPhysicalMaterial({color:'#fff5ec',transparent:true,opacity:.72,roughness:.12,clearcoat:1,side:T.DoubleSide}),0,.13,.06);let tipKey='';
 g=group('press');const glove=mat('#e1dce9',0,.64);make(g,new T.SphereGeometry(.068,24,16),glove,0,.044,0).scale.set(1,.65,1.15);const glovedFinger=make(g,new T.CapsuleGeometry(.062,.28,8,16),glove,.14,.16,.09);glovedFinger.rotation.z=-.82;glovedFinger.rotation.x=.5;
 g=group('inspect');make(g,new T.TorusGeometry(.11,.005,6,32),gold,0,.08,0).rotation.x=Math.PI/2;
 const particles=new T.Group();scene.scene.add(particles);const dots=[];const dotGeo=new T.SphereGeometry(.006,5,4);const dotMat=mat('#eee1cd',0,1);for(let i=0;i<40;i++){const dot=make(particles,dotGeo,dotMat);dot.visible=false;dots.push(dot);}
 const guide=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:'#74b9ce',dashSize:.022,gapSize:.012,transparent:true,opacity:.8,depthTest:false}));scene.scene.add(guide);guide.visible=false;
 let lastKind='',lastPosition=new T.Vector3(),contact=false,release=0,age=0,velocity=0,force=.5;
 const targetPosition=new T.Vector3();let targetQuaternion=new T.Quaternion();
 function guideFor(index,kind){guide.visible=kind==='file'||kind==='press';if(!guide.visible)return;const pts=[],n=scene.design.nails[index],rec=scene.rec[index];for(let j=0;j<=20;j++){const u=kind==='file'?.17+j/20*.66:.5,v=kind==='file'?.86:.08+j/20*.85;pts.push(rec.group.localToWorld(surface(n,index,u,v)).add(new T.Vector3(0,.014,0)));}guide.geometry.dispose();guide.geometry=new T.BufferGeometry().setFromPoints(pts);guide.computeLineDistances();}
 return {
  tool(hit,kind,speed=0,pressure=.5){if(!hit){contact=false;release=.18;guide.visible=false;return;}contact=true;release=0;velocity=speed;force=pressure;const rec=scene.rec[hit.index],n=scene.design.nails[hit.index],p=rec.group.localToWorld(surface(n,hit.index,hit.u,hit.v));targetPosition.copy(p);targetQuaternion=rec.group.getWorldQuaternion(new T.Quaternion());if(!tool.visible||lastKind!==kind){tool.position.copy(p);tool.quaternion.copy(targetQuaternion);}tool.visible=true;for(const[k,v]of Object.entries(parts))v.visible=k===kind;lastPosition.copy(p);lastKind=kind;
   if(kind==='tip'){const shape={...n,...n.tipPreview,build:0,shapeBlend:1},key=JSON.stringify([shape.shape,shape.length,shape.width,shape.curve]);if(key!==tipKey){heldTip.geometry.dispose();heldTip.geometry=curvedGeometry(shape,hit.index);tipKey=key;}}
   if(['polish','gel','brush'].includes(kind)){const bristle=parts[kind].children[1];if(kind!=='brush')bristle.material.color.set(n.surface?.activeStep==='color'?n.surface.target.base:'#cfb8ba');bristle.scale.x=1+force*.35;bristle.scale.y=1-force*.4;parts[kind].rotation.x=Math.max(-.16,Math.min(.16,speed*.02));}guideFor(hit.index,kind);
  },
  dust(){if(!['file','drill','brush'].includes(lastKind))return;for(let i=0;i<6;i++){const d=dots.find(a=>!a.visible);if(!d)break;d.visible=true;d.position.copy(lastPosition).add(new T.Vector3((Math.random()-.5)*.055,.02,(Math.random()-.5)*.06));d.userData.life=.4+Math.random()*.3;d.userData.velocity=new T.Vector3((Math.random()-.5)*.2,.15+Math.random()*.1,(Math.random()-.5)*.16);}},
  lamp(hand,on){if(!on)return this.restore();if(lampHand!==null&&lampHand!==hand)scene.hands[lampHand].position.z=.72;prepareLamp(hand);lampHand=hand;lampPhase='enter';entryStart=scene.hands[hand].position.z;motion=0;},
  lampState(l){if(!l)return;if(l.phase!==lampPhase){lampPhase=l.phase;motion=0;}},
  restore(){if(lampHand!==null){lampPhase='withdraw';motion=0;entryStart=scene.hands[lampHand].position.z;}illuminate(false);},
  get interaction(){const points=[];if(lampHand!==null){scene.scene.updateMatrixWorld(true);for(let i=lampHand*5;i<lampHand*5+5;i++)for(const u of [.04,.5,.96])for(const v of [0,.5,1]){const p=scene.rec[i].group.localToWorld(surface(scene.design.nails[i],i,u,v));points.push(p);}}return {contact,tool:lastKind,toolVisible:tool.visible,lampPhase,lampHand,light:glow.intensity,cavity,allFiveInside:points.length===45&&points.every(p=>p.x>cavity.min.x&&p.x<cavity.max.x&&p.z>cavity.min.z&&p.z<cavity.max.z&&p.y>cavity.min.y&&p.y<cavity.max.y)};},
  tick(dt){age+=dt;if(tool.visible){if(contact){tool.position.lerp(targetPosition,Math.min(1,dt*35));tool.quaternion.slerp(targetQuaternion,Math.min(1,dt*30));if(lastKind==='drill')parts.drill.rotation.z=Math.sin(age*190)*.04;else if(lastKind==='file')parts.file.position.y=Math.sin(age*60)*.002*Math.min(1,velocity);}else{release-=dt;tool.position.y+=dt*.65;if(release<=0)tool.visible=false;}}
   if(lampHand!==null){motion+=dt;let z=scene.hands[lampHand].position.z;
    if(lampPhase==='enter'){const t=Math.min(1,motion/.65),ease=t*t*(3-2*t);z=entryStart+(-.48-entryStart)*ease;}
    if(lampPhase==='cure'){z=-.48;illuminate(true);}
    if(lampPhase==='exit'||lampPhase==='withdraw'){illuminate(false);const t=Math.min(1,motion/.5),ease=t*t*(3-2*t);z=(lampPhase==='exit'?-.48:entryStart)+(.72-(lampPhase==='exit'?-.48:entryStart))*ease;if(t===1){scene.hands[lampHand].position.z=.72;lamp.visible=false;lampHand=null;lampPhase='off';}}
    if(lampHand!==null)scene.hands[lampHand].position.z=z;scene.renderer.shadowMap.needsUpdate=true;
   }
   for(const d of dots)if(d.visible){d.userData.life-=dt;d.userData.velocity.y-=dt*.8;d.position.addScaledVector(d.userData.velocity,dt);d.visible=d.userData.life>0&&d.position.y>-.12;}
  },
  side(index){scene.focus('detail',index);const t=scene.controls.target.clone();scene.camera.position.copy(t).add(new T.Vector3(1.2,.38,.38));scene.controls.update();}
 };
}
