const BASE=import.meta.env.BASE_URL+'audio/';
const PREFS='nail-audio-v3';
export class SalonSound{
 constructor(){this.ctx=null;this.buffers={};this.variants={};this.channels={tools:.7,ui:.45,music:.16,room:0};this.muted=false;this.contactSource=null;this.lastTime=0;this.log=[];try{const saved=localStorage.getItem(PREFS),prefs=JSON.parse(saved||localStorage.getItem('nail-audio-v2')||'null');if(prefs){for(const key of Object.keys(this.channels))if(Number.isFinite(prefs[key])&&(key!=='room'||saved))this.channels[key]=Math.min(1,Math.max(0,prefs[key]));this.muted=!!prefs.muted;}}catch{}}
 async init(){
  if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:1;this.compressor=this.ctx.createDynamicsCompressor();this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.gains={};for(const [k,v]of Object.entries(this.channels)){const g=this.ctx.createGain();g.gain.value=v;g.connect(this.master);this.gains[k]=g;}
   this.loading=Promise.all([...['file','brush','wipe','paint','gel','drill','fan','room','music'],...['pick','cap','tip','sticker','jewel','snip','camera','done','error'].flatMap(k=>[0,1,2].map(i=>k+'-'+i))].map(async k=>{try{const r=await fetch(BASE+k+'.wav'+(k==='room'?'?v=3':''));if(!r.ok)throw Error(k);this.buffers[k]=await this.ctx.decodeAudioData(await r.arrayBuffer());}catch{this.failed=true;}}));
  }
  await this.ctx.resume();await this.loading;if(!this.ambience){this.ambience=this.loop('room','room',.75);this.music=this.loop('music','music',.6);}return !this.failed;
 }
 loop(name,channel='tools',volume=1){if(!this.ctx||!this.buffers[name])return null;const source=this.ctx.createBufferSource(),g=this.ctx.createGain();source.buffer=this.buffers[name];source.loop=true;g.gain.value=volume;source.connect(g);g.connect(this.gains[channel]);source.start();return {source,g};}
 one(name,channel='tools'){if(!this.ctx||this.ctx.state!=='running'||this.muted)return;const n=(this.variants[name]??-1)+1;this.variants[name]=n%3;const buffer=this.buffers[name+'-'+n%3];if(!buffer)return;const src=this.ctx.createBufferSource(),g=this.ctx.createGain();src.buffer=buffer;g.gain.value=.8;src.connect(g);g.connect(this.gains[channel]);src.onended=()=>{src.disconnect();g.disconnect();};src.start();this.log.push(name);if(this.log.length>80)this.log.shift();}
 contact(kind,speed=1){if(!this.ctx||this.muted)return;this.lastTime=performance.now();if(this.contactKind!==kind){this.stopContact();this.contactKind=kind;this.contactSource=this.loop(kind,'tools',0);}const c=this.contactSource;if(c){c.g.gain.setTargetAtTime(Math.min(.85,.25+speed*.25),this.ctx.currentTime,.035);c.source.playbackRate.setTargetAtTime(Math.min(1.15,.85+speed*.13),this.ctx.currentTime,.04);}}
 stopContact(){if(this.contactSource){const c=this.contactSource;c.g.gain.setTargetAtTime(0,this.ctx.currentTime,.025);try{c.source.stop(this.ctx.currentTime+.13);}catch{}c.source.onended=()=>{c.source.disconnect();c.g.disconnect();};}this.contactSource=null;this.contactKind=null;}
 tick(){if(this.contactSource&&performance.now()-this.lastTime>110)this.stopContact();}
 set(key,value){if(key==='muted'){this.muted=!!value;this.master?.gain.setTargetAtTime(this.muted?0:1,this.ctx.currentTime,.025);if(this.muted)this.stopContact();}else{this.channels[key]=value;this.gains?.[key]?.gain.setTargetAtTime(value,this.ctx.currentTime,.05);}try{localStorage.setItem(PREFS,JSON.stringify({...this.channels,muted:this.muted}));}catch{}}
 async pause(){this.stopContact();if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.ctx&&this.ctx.state!=='closed')await this.ctx.resume();}
}
