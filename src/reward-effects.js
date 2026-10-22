export function rewardFeedback(receipt,balance,sound,wallet){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,layer=document.createElement('div');layer.className='reward-effects';layer.setAttribute('aria-hidden','true');
 layer.innerHTML=`<div class="reward-burst"><span>谢谢你的用心</span><h2>顾客打赏</h2><strong>+${receipt.tip}<small>金币</small></strong><p>服务收入 ${receipt.service} · 本次入账 ${receipt.total}</p></div>`;document.body.append(layer);
 const animations=[],destination=wallet.getBoundingClientRect(),x=innerWidth/2,y=innerHeight*.43,tx=destination.x+destination.width/2,ty=destination.y+destination.height/2;
 sound.one('reward','ui');
 if(!reduced){
  animations.push(layer.firstElementChild.animate([{opacity:0,transform:'scale(.65) translateY(25px)',easing:'cubic-bezier(.2,.8,.2,1)'},{opacity:1,transform:'scale(1.1) translateY(0)',offset:.15},{opacity:1,transform:'scale(1)',offset:.3},{opacity:1,transform:'scale(1)',offset:.82},{opacity:0,transform:'scale(.95) translateY(-20px)'}],{duration:2400,easing:'linear',fill:'both'}));
  for(let i=0;i<24;i++){
   const coin=document.createElement('i');coin.className='reward-coin';coin.textContent='✦';coin.style.left=x+'px';coin.style.top=y+'px';layer.append(coin);
   const angle=i*Math.PI*2/24,spread=65+(i%4)*22,dx=Math.cos(angle)*spread,dy=Math.sin(angle)*spread;
   const animation=coin.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${i*37}deg) scale(1.1)`,opacity:1,offset:.3},{transform:`translate(calc(-50% + ${dx*.8}px),calc(-50% + ${dy+45}px)) rotate(${i*73}deg)`,opacity:1,offset:.55},{transform:`translate(calc(-50% + ${tx-x}px),calc(-50% + ${ty-y}px)) rotate(${i*121}deg) scale(.35)`,opacity:0}],{duration:1050+i*28,delay:i*16,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});animations.push(animation);
   animation.finished.then(()=>{if(i%4===0){sound.one('coin','ui');const bump=wallet.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:220});animations.push(bump);}}).catch(()=>{});
  }
 }
 let frame,start;const output=wallet.querySelector('output'),old=balance-receipt.total;
 const cleanup=()=>{cancelAnimationFrame(frame);for(const a of animations)a.cancel();layer.remove();output.textContent=balance.toLocaleString('zh-CN');};
 function tick(t){start??=t;const elapsed=t-start,f=Math.min(1,elapsed/1800);output.textContent=Math.round(old+receipt.total*(1-(1-f)**3)).toLocaleString('zh-CN');if(elapsed<(reduced?1700:2500))frame=requestAnimationFrame(tick);else cleanup();}
 if(reduced)output.textContent=balance.toLocaleString('zh-CN');
 frame=requestAnimationFrame(reduced?function finish(t){start??=t;if(t-start<1700)frame=requestAnimationFrame(finish);else cleanup();}:tick);
 return cleanup;
}
