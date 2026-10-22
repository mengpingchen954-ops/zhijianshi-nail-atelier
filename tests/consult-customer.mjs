export async function consultCustomer(page){
 if(await page.locator('.consultation-dialog').isVisible()){
  for(const id of ['style','care','comfort','budget']){const button=page.locator(`[data-topic="${id}"]`);if(await button.isEnabled())await button.click();}
  await page.locator('#finish-talk').click();
 }
}
