import * as T from 'three';
import {surface} from './scene.js';
export function addSalonObjects(scene){
 const mat=(color,metalness=0,roughness=.4)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const ivory=mat('#f3e8db'),rose=mat('#bd8b91',.15),gold=mat('#c3a171',.7,.25),dark=mat('#4d3d39'),steel=mat('#aeb2b5',.85,.3);
 const make=(group,g,m,x=0,y=0,z=0)=>{const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;group.add(a);return a;};
 const lamp=new T.Group();scene.scene.add(lamp);lamp.visible=false;
 const outline=new T.Shape();outline.absarc(0,0,.93,0,Math.PI,false);outline.lineTo(-.72,0);outline.absarc(0,0,.72,Math.PI,0,true);outline.closePath();
 make(lamp,new T.ExtrudeGeometry(outline,{depth:1.25,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.04,bevelThickness:.03}),ivory,0,0,-.5);
 make(lamp,new T.BoxGeometry(1.9,.06,1.35),rose,0,0,.1);
 const strip=make(lamp,new T.BoxGeometry(1.3,.025,.7),new T.MeshStandardMaterial({color:'#b4a0e8',emissive:'#b29aef',emissiveIntensity:0}),0,.65,.1);
 make(lamp,new T.BoxGeometry(.4,.025,.15),dark,0,.97,.1);
 const glow=new T.PointLight('#b5a2ff',0,4,2);glow.position.set(0,.48,.05);lamp.add(glow);
 const tool=new T.Group();scene.scene.add(tool);tool.visible=false;
 const parts={};
 function group(name){const g=new T.Group();tool.add(g);g.visible=false;parts[name]=g;return g;}
 let g=group('file');const file=make(g,new T.BoxGeometry(.12,.025,.48),mat('#bdabb4',.1,.92),.12,.04,.09);file.rotation.y=-.5;make(g,new T.BoxGeometry(.08,.027,.16),ivory,.21,.04,.23);
 g=group('wipe');const cotton=make(g,new T.BoxGeometry(.17,.045,.22),mat('#fff5eb',0,1),0,.03,0);cotton.rotation.y=.3;
 for(const name of ['polish','gel','brush']){g=group(name);const handle=make(g,new T.CylinderGeometry(.025,.035,.43,12),name==='brush'?rose:gold,.11,.14,.14);handle.rotation.x=.9;handle.rotation.z=-.4;const bristle=make(g,new T.BoxGeometry(name==='brush'?.16:.085,.025,name==='brush'?.13:.08),mat(name==='brush'?'#c3a47f':'#d2a1a4',0,.8),0,.015,0);}
 g=group('drill');const motor=make(g,new T.CylinderGeometry(.06,.065,.4,16),rose,.1,.1,.12);motor.rotation.x=.9;motor.rotation.z=-.4;make(g,new T.CylinderGeometry(.015,.015,.14,12),steel,0,.03,0).rotation.x=1;
 g=group('magnet');make(g,new T.BoxGeometry(.11,.07,.27),dark,.03,.13,.04);make(g,new T.BoxGeometry(.12,.035,.08),steel,.03,.09,-.09);
 g=group('tweezers');for(const sign of [-1,1]){const p=make(g,new T.BoxGeometry(.012,.016,.35),gold,sign*.025,.055,.08);p.rotation.y=sign*.1;}
 g=group('tip');make(g,new T.SphereGeometry(.075,20,12),new T.MeshPhysicalMaterial({color:'#fff0e1',transparent:true,opacity:.65,roughness:.2}),0,.06,0).scale.set(1,.25,1.6);
 g=group('press');make(g,new T.SphereGeometry(.08,18,12),rose,0,.075,0).scale.set(1,.6,1.3);
 g=group('inspect');make(g,new T.TorusGeometry(.11,.005,6,32),gold,0,.08,0).rotation.x=Math.PI/2;
 const particles=new T.Group();scene.scene.add(particles);const dots=[];const dotGeo=new T.SphereGeometry(.008,5,4);const dotMat=mat('#eee1cd',0,1);for(let i=0;i<16;i++){const dot=make(particles,dotGeo,dotMat);dot.visible=false;dots.push(dot);}
 let lastKind='',lastPosition=new T.Vector3();const handTargets=[.72,.72];
 return {
  tool(hit,kind){if(!hit){tool.visible=false;return;}tool.visible=true;for(const[k,v]of Object.entries(parts))v.visible=k===kind;const rec=scene.rec[hit.index],p=rec.group.localToWorld(surface(scene.design.nails[hit.index],hit.index,hit.u,hit.v));tool.position.copy(p);tool.quaternion.copy(rec.group.getWorldQuaternion(new T.Quaternion()));lastPosition.copy(p);lastKind=kind;},
  dust(){if(!['file','drill','brush'].includes(lastKind))return;for(let i=0;i<dots.length;i++){const d=dots[i];d.visible=true;d.position.copy(lastPosition).add(new T.Vector3(Math.sin(i*23)*.09,.02+Math.random()*.03,Math.cos(i*17)*.08));d.userData.life=.25+Math.random()*.25;}},
  lamp(hand,on){lamp.visible=on;if(!on){glow.intensity=0;return;}lamp.position.set(hand?1.48:-1.48,-.12,-1.3);strip.material.emissiveIntensity=2;glow.intensity=1.4;handTargets[hand]=.4;scene.renderer.shadowMap.needsUpdate=true;},
  restore(){handTargets.fill(.72);lamp.visible=false;glow.intensity=0;scene.renderer.shadowMap.needsUpdate=true;},
  tick(dt){for(let i=0;i<2;i++)if(Math.abs(scene.hands[i].position.z-handTargets[i])>.001){scene.hands[i].position.z+=(handTargets[i]-scene.hands[i].position.z)*Math.min(1,dt*9);scene.renderer.shadowMap.needsUpdate=true;}for(const d of dots)if(d.visible){d.userData.life-=dt;d.position.y+=dt*.12;d.visible=d.userData.life>0;}},
  side(index){scene.focus('detail',index);const t=scene.controls.target.clone();scene.camera.position.copy(t).add(new T.Vector3(1.2,.38,.38));scene.controls.update();}
 };
}
