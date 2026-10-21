import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:1000}});
p.on('pageerror',e=>console.log('ERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
await p.goto('http://127.0.0.1:5184/?mode=free');await p.waitForTimeout(1500);
await p.screenshot({path:'artifacts/welcome.png'});await p.locator('#start').click();await p.screenshot({path:'artifacts/workbench-first.png'});await p.locator('[data-finger="2"]').click();await p.screenshot({path:'artifacts/detail-first.png'});console.log(await p.evaluate(()=>nailAtelier.stats()));await b.close();
