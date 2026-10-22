import {customer} from '../src/service.js';
export async function designCustomer(page,id){
 const c=customer(id),indices=id==='zhou'?[6]:Array.from({length:10},(_,i)=>i);
 for(const i of indices){
  await page.locator(`[data-finger="${i}"]`).click();
  await page.locator(`[data-color="${c.palette[i%5===3?1:0]}"]`).click();
  await page.locator('#plan-shape').selectOption(c.shape);
  await page.locator('#plan-length').fill(String(c.length));await page.locator('#plan-length').dispatchEvent('change');
  await page.locator('#plan-effect').selectOption(c.pattern||c.finish);
  if(c.deco&&c.feature.includes(i)){
   await page.locator(`[data-sticker="${id==='lu'&&i>4?'butterfly':c.deco}"]`).click();
   const box=await page.locator(`[data-plan="${i}"]`).boundingBox();await page.mouse.click(box.x+box.width*.52,box.y+box.height*.46);
  }
 }
}
