import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('reference borders render, export, and six-cut frames select six different poses',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation').getByRole('button',{name:'Photobooth',exact:true}).click();
 await expect(page.getByRole('button',{name:'Cherry Blossom',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Borderless Duo',exact:true}).click();await expect(page.getByLabel('Layout',{exact:true})).toHaveValue('separate');
 await page.getByRole('button',{name:'Heart Sketch',exact:true}).click();
 await expect(page.getByRole('button',{name:'6 shots',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('button',{name:'4 shots',exact:true})).toBeDisabled();
 const files=Array.from({length:6},(_,i)=>i%2?'public/previews/cat2.png':'public/previews/cat.jpg');
 await page.locator('input[type=file][multiple]').setInputFiles(files);
 await expect(page.locator('.review-shot')).toHaveCount(6);
 await expect(page.locator('.strip-preview img')).toBeVisible();
 await expect(page.locator('.review-photos .section-label')).toContainText('6 / 6');
 await page.getByLabel('Paper',{exact:true}).selectOption('Pink Crumb');
 await expect(page.getByRole('button',{name:'Save your strip',exact:true})).toBeEnabled();
 await page.getByLabel('Paper',{exact:true}).selectOption('Sepia Six-cut');await expect(page.getByLabel('Filter',{exact:true})).toHaveValue('Sepia');await expect(page.locator('.review-photos .section-label')).toContainText('6 / 6');await page.getByLabel('Paper',{exact:true}).selectOption('Pink Crumb');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save your strip',exact:true}).click();const png=readFileSync((await (await download).path())!);expect(png.readUInt32BE(16)).toBe(1040);expect(png.readUInt32BE(20)).toBe(1584);
 const results=await page.evaluate(async()=>{
  const path='/src/features/booth/render.ts',presetsPath='/src/features/booth/presets.ts';
  const {renderStrip,boothDefaults,frameGeometry}=await import(path),{referenceFrames,presetGeometry}=await import(presetsPath);
  const colors=['#cc3322','#22aa44','#3355cc','#ccaa22','#aa33bb','#33bbcc'];
  const photos=colors.map(color=>{const c=document.createElement('canvas');c.width=600;c.height=700;c.getContext('2d')!.fillStyle=color;c.getContext('2d')!.fillRect(0,0,600,700);return c.toDataURL();});
  const results=[];
  const gallery=document.createElement('div');gallery.id='preset-proof';gallery.style.cssText='position:absolute;inset:0 auto auto 0;z-index:9999;background:#fff6e8;padding:25px;display:grid;grid-template-columns:repeat(5,200px);gap:25px';
  for(const frame of referenceFrames){const selected=Array.from({length:frame.poses??4},(_,i)=>i);const out=await renderStrip(photos,[],selected,{...boothDefaults,frame:frame.name,layout:['six','hearts','contact','crumb','sepia'].includes(frame.style)?'grid':frame.style==='duo'?'separate':'double',filter:'Original'},1800);const figure=document.createElement('figure');figure.style.margin='0';const img=document.createElement('img');img.src=out.toDataURL();img.style.cssText='width:200px;height:300px;object-fit:contain';figure.append(img);const caption=document.createElement('figcaption');caption.textContent=frame.name;figure.append(caption);gallery.append(figure);const cells=frameGeometry(frame).windows.map((w:{x:number;y:number;width:number;height:number})=>Array.from(out.getContext('2d')!.getImageData(w.x+w.width/2,w.y+w.height/2,1,1).data).slice(0,3).join(','));results.push({name:frame.name,width:out.width,height:out.height,cells});}
  document.body.append(gallery);return results;
 });
 expect(results).toHaveLength(20);for(const name of ['Pink Six-cut','Heart Sketch','Pink Crumb','Sepia Six-cut'])expect(results.find(r=>r.name===name)?.cells).toEqual(['204,51,34','34,170,68','51,85,204','204,170,34','170,51,187','51,187,204']);
 expect(results.find(r=>r.name==='Borderless Duo')).toMatchObject({width:750,height:1364});
 expect(results.find(r=>r.name==='Sepia Six-cut')).toMatchObject({width:1040,height:1734});
 expect(results.find(r=>r.name==='Borderless')).toMatchObject({width:1040,height:1736});
 expect(results.find(r=>r.name==='Pink Six-cut')).toMatchObject({width:736,height:1104});
 const tones=await page.evaluate(async()=>{const path='/src/features/booth/render.ts';const {renderPoseImage,boothDefaults}=await import(path);const c=document.createElement('canvas');c.width=100;c.height=100;const ctx=c.getContext('2d')!;ctx.fillStyle='rgb(100,100,100)';ctx.fillRect(0,0,100,100);const values=[];for(const intensity of [0,100]){const image=await renderPoseImage(c.toDataURL(),{...boothDefaults,frame:'Sepia Six-cut',filter:'Sepia',intensity},false,100);values.push(Array.from(image.getContext('2d')!.getImageData(25,25,1,1).data).slice(0,3));}return values;});expect(tones[0]).toEqual([100,100,100]);expect(tones[1][0]).toBeGreaterThan(tones[1][1]);expect(tones[1][1]).toBeGreaterThan(tones[1][2]);
 await page.setViewportSize({width:1180,height:850});
 await page.locator('#preset-proof').screenshot({path:'test-results/frame-presets.png'});
});

test('original artwork stays in front of photos and retains its source colors',async({page})=>{
 await page.goto('/');
 const comparisons=await page.evaluate(async()=>{
  const path='/src/features/booth/render.ts';const {frames,boothDefaults,renderStrip}=await import(path);
  const c=document.createElement('canvas');c.width=500;c.height=500;c.getContext('2d')!.fillStyle='#2772b8';c.getContext('2d')!.fillRect(0,0,500,500);const src=c.toDataURL();
  const results=[];
  for(const [name,x,y] of [['Star Buddies',65,205],['Honey Bears',65,200],['Pancake Bears',60,200],['Love Cats',60,218],['Cloud Friends 10th',50,194]] as const){
   const frame=frames.find((f:{name:string})=>f.name===name)!;const original=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=frame.original.src;});
   const art=document.createElement('canvas');art.width=original.width;art.height=original.height;art.getContext('2d')!.drawImage(original,0,0);
   const expected=Array.from(art.getContext('2d')!.getImageData(x,y,1,1).data);
   const output=await renderStrip([src,src,src,src],[],[0,1,2,3],{...boothDefaults,frame:name,layout:'strip',filter:'B&W'},5000);
   results.push({name,expected,actual:Array.from(output.getContext('2d')!.getImageData(x,y,1,1).data)});
  }
  return results;
 });
 for(const result of comparisons){expect(result.expected[3],`${result.name} foreground pixel`).toBe(255);expect(result.actual,result.name).toEqual(result.expected);}
});
