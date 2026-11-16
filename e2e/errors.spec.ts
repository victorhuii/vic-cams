import {test,expect} from '@playwright/test';
test('camera denial gives an actionable message and allows retry',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:()=>Promise.reject(new DOMException('Denied by user','NotAllowedError'))});});
 await page.goto('/');await page.getByRole('navigation').getByRole('button',{name:'Photobooth',exact:true}).click();await page.getByRole('button',{name:/Open the camera/}).click();await expect(page.getByRole('status')).toContainText('Camera permission was denied.');await expect(page.getByRole('button',{name:/Open the camera/})).toBeEnabled();
});
