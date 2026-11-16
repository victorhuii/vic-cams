export type Adjustments = { exposure:number; contrast:number; saturation:number; warmth:number; grain:number; fade:number; vignette:number };
export type Film = {id:string; name:string; note:string; color:string; warmth:number; contrast:number; saturation:number; fade:number; grain:number; tint:number; bloom:number; mono?:boolean};
export const films:Film[] = [
{id:'portra',name:'Portra 400',note:'Warm skin · soft highlights',color:'#d2b99b',warmth:9,contrast:-8,saturation:-8,fade:6,grain:8,tint:2,bloom:0},
{id:'gold',name:'Gold 200',note:'Sun-drenched · nostalgic',color:'#dbb953',warmth:20,contrast:8,saturation:15,fade:4,grain:12,tint:0,bloom:0},
{id:'fuji',name:'Fuji 400H',note:'Airy pastels · muted greens',color:'#a8bba5',warmth:-3,contrast:-16,saturation:-18,fade:9,grain:7,tint:5,bloom:0},
{id:'disposable',name:"Disposable ’98",note:'Flash feel · imperfect color',color:'#dc9a71',warmth:7,contrast:18,saturation:8,fade:10,grain:26,tint:5,bloom:0},
{id:'cine',name:'Cine 800T',note:'Cool nights · glowing lights',color:'#7d9da6',warmth:-16,contrast:12,saturation:-7,fade:3,grain:17,tint:4,bloom:9},
{id:'chrome',name:'Classic Chrome',note:'Quiet color · deep shadows',color:'#8d958c',warmth:2,contrast:20,saturation:-28,fade:3,grain:8,tint:-2,bloom:0},
{id:'dreamy',name:'Dreamy Film',note:'Creamy whites · pink warmth',color:'#ddbac3',warmth:7,contrast:-15,saturation:-10,fade:10,grain:5,tint:6,bloom:12},
{id:'hp5',name:'Ilford HP5',note:'Organic monochrome · texture',color:'#73736e',warmth:0,contrast:22,saturation:-100,fade:5,grain:24,tint:0,bloom:0}
];
export const defaults:Adjustments={exposure:0,contrast:0,saturation:0,warmth:0,grain:0,fade:0,vignette:0};
export type Edit = {film:string; intensity:number; adjustments:Adjustments; frame:string; ratio:string; zoom:number; x:number; y:number; rotation:number; thickness:number; paper:string; caption:string; date:boolean};
export const defaultEdit:Edit={film:'portra',intensity:80,adjustments:{...defaults},frame:'Polaroid',ratio:'4:5',zoom:1,x:0,y:0,rotation:0,thickness:1,paper:'#fffdf7',caption:'',date:true};
const clamp=(n:number)=>Math.max(0,Math.min(255,n));
export function noise(i:number){let n=(i+1)*374761393;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295-.5;}
export function gradePixels(data:Uint8ClampedArray,w:number,h:number,film:Film|undefined,intensity:number,a:Adjustments){
 const t=film?intensity/100:0;const c=1+((film?.contrast??0)*t+a.contrast)/100;const sat=1+((film?.saturation??0)*t+a.saturation)/100;const warm=(film?.warmth??0)*t+a.warmth;const fade=((film?.fade??0)*t+a.fade);const grain=(film?.grain??0)*t+a.grain;
 for(let i=0;i<data.length;i+=4){let r=data[i],g=data[i+1],b=data[i+2];const lum=.2126*r+.7152*g+.0722*b;const exp=2**(a.exposure/50);const n=noise(i/4)*grain*(.35+.65*(1-lum/255));const x=(i/4)%w,y=Math.floor(i/4/w);const vig=1-a.vignette/100*.6*Math.min(1,((x/w-.5)**2+(y/h-.5)**2)*2);const tint=(film?.tint??0)*t;
 r=lum+(r-lum)*sat;g=lum+(g-lum)*sat;b=lum+(b-lum)*sat;
 const tone=(v:number)=>{v=((v-127.5)*c+127.5)*exp;if(v>200&&t>0){const soft=200+55*(1-Math.exp(-(v-200)/55));v=v+(soft-v)*t;}return (v*(1-fade/255)+fade+n)*vig;};
 const bloom=(film?.bloom??0)*t*Math.max(0,(lum-180)/75);r=tone(r+warm+tint)+bloom;g=tone(g+warm*.13-tint*.4)+bloom*.5;b=tone(b-warm)+bloom*.3;
 if(film?.mono){const gray=.2126*r+.7152*g+.0722*b;r=r*(1-t)+gray*t;g=g*(1-t)+gray*t;b=b*(1-t)+gray*t;}
 data[i]=clamp(r);data[i+1]=clamp(g);data[i+2]=clamp(b);
 }
}
export function loadImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('This image could not be opened. Try a JPEG, PNG or WebP.'));im.src=src;});}
export function canvas(w:number,h:number){const el=document.createElement('canvas');el.width=Math.max(1,Math.round(w));el.height=Math.max(1,Math.round(h));return el;}
export function ratioValue(ratio:string,original:number){if(ratio==='Original')return original;const [a,b]=ratio.split(':').map(Number);return a/b;}
export async function renderPhoto(src:string,edit:Edit,max=2400,before=false){
 const image=await loadImage(src);const rotated=canvas(edit.rotation%180?image.naturalHeight:image.naturalWidth,edit.rotation%180?image.naturalWidth:image.naturalHeight);const rc=rotated.getContext('2d')!;rc.translate(rotated.width/2,rotated.height/2);rc.rotate(edit.rotation*Math.PI/180);rc.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);
 const ratio=ratioValue(edit.ratio,rotated.width/rotated.height);let w=rotated.width,h=w/ratio;if(h>rotated.height){h=rotated.height;w=h*ratio;}const scale=Math.min(1,max/Math.max(w,h));const photo=canvas(w*scale,h*scale);const ctx=photo.getContext('2d')!;const sw=w/edit.zoom,sh=h/edit.zoom;const sx=(rotated.width-sw)/2+edit.x/100*(rotated.width-sw)/2,sy=(rotated.height-sh)/2+edit.y/100*(rotated.height-sh)/2;ctx.drawImage(rotated,sx,sy,sw,sh,0,0,photo.width,photo.height);
 if(!before){const pixels=ctx.getImageData(0,0,photo.width,photo.height);gradePixels(pixels.data,photo.width,photo.height,films.find(f=>f.id===edit.film),edit.intensity,edit.adjustments);ctx.putImageData(pixels,0,0);}
 const glow=before?0:(films.find(f=>f.id===edit.film)?.bloom??0)*edit.intensity/100;
 if(glow>0){const mask=canvas(photo.width,photo.height),mc=mask.getContext('2d')!;const highlights=ctx.getImageData(0,0,photo.width,photo.height);for(let i=0;i<highlights.data.length;i+=4){const l=.2126*highlights.data[i]+.7152*highlights.data[i+1]+.0722*highlights.data[i+2];highlights.data[i+3]=Math.max(0,l-185)*2;if(edit.film==='cine'){highlights.data[i]=255;highlights.data[i+1]=85;highlights.data[i+2]=35;}}mc.putImageData(highlights,0,0);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=glow/60;ctx.filter=`blur(${Math.max(1,Math.max(photo.width,photo.height)*.006)}px)`;ctx.drawImage(mask,0,0);ctx.restore();}
 if(edit.frame==='No Border')return photo;
 const p=Math.max(photo.width,photo.height)*.055*edit.thickness;const bottom=edit.frame==='Polaroid'||edit.frame==='Mini Instant'?p*3.2:p*1.4;const out=canvas(photo.width+2*p,photo.height+p+bottom);const oc=out.getContext('2d')!;oc.fillStyle=edit.frame==='35mm Film'?'#292823':edit.frame==='Vintage Paper'?'#e6dcc6':edit.paper;oc.fillRect(0,0,out.width,out.height);oc.drawImage(photo,p,p);oc.fillStyle=edit.frame==='35mm Film'?'#e8b874':'#554d44';oc.font=`${Math.max(12,p*.52)}px Georgia`;oc.textAlign='center';const date=edit.date?new Date().toLocaleDateString():'';if(edit.caption&&date&&(edit.frame==='Polaroid'||edit.frame==='Mini Instant')){oc.fillText(edit.caption,out.width/2,photo.height+p+bottom*.42,out.width-p*2);oc.fillText(date,out.width/2,photo.height+p+bottom*.78,out.width-p*2);}else oc.fillText([edit.caption,date].filter(Boolean).join(' · '),out.width/2,photo.height+p+bottom*.64,out.width-p*2);
 if(edit.frame==='35mm Film'){oc.fillStyle='#f7f4eb';for(let x=8;x<out.width;x+=p*.95){oc.fillRect(x,p*.22,p*.5,p*.45);oc.fillRect(x,out.height-p*.68,p*.5,p*.45);}}
 return out;
}
export function blobOf(c:HTMLCanvasElement,type='image/png'):Promise<Blob>{return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Export failed')),type,.95));}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function fileData(file:Blob):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result as string);r.onerror=reject;r.readAsDataURL(file);});}
