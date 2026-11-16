import {referenceFrames,presetGeometry,borderSvg,type FramePreset} from './presets';
import {replacePhotoBackground} from '../../lib/camera/background';
import {canvas,renderPhoto,defaultEdit,loadImage} from '../../lib/imaging/engine';
export const frames:FramePreset[]=[{name:'Four-cut',color:'#9e8575',ink:'#fff9ef'},{name:'Classic White',color:'#fffdf7',ink:'#353535'},{name:'Black',color:'#242622',ink:'#fff9ef'},{name:'Cream',color:'#e9dfc9',ink:'#fff9ef'},{name:'Pink',color:'#eac9cb',ink:'#fff9ef'},{name:'Pastel Blue',color:'#cbdfe5',ink:'#fff9ef'},{name:'Retro Film',color:'#b98056',ink:'#fff9ef'},...referenceFrames];
export const boothFilters=[{name:'Original',film:'none'},{name:'Dreamy White',film:'dreamy'},{name:'Warm Film',film:'portra'},{name:'Soft Pink',film:'fuji'},{name:'Vintage',film:'gold'},{name:'B&W',film:'hp5'},{name:'Cool Pastel',film:'cine'},{name:'Disposable Flash',film:'disposable'}];
export type BoothSettings={frame:string;layout:string;filter:string;intensity:number;caption:string;date:boolean;zoom:number;x:number;y:number;background:string;photoBackground?:string};
export const boothDefaults:BoothSettings={frame:'Four-cut',layout:'double',filter:'Dreamy White',intensity:65,caption:'',date:true,zoom:1,x:0,y:0,background:'original',photoBackground:'original'};
export function poseGeometry(settings:BoothSettings,hasPair:boolean){const preset=frames.find(f=>f.name===settings.frame);if(preset?.style){const w=presetGeometry(preset.style).windows[0],paired=hasPair&&settings.layout!=='separate';return {width:paired?(w.width-6)/2:w.width,height:w.height,gap:6};}const paired=hasPair&&settings.layout!=='separate';return settings.layout==='grid'?{width:paired?502:510,height:340,gap:16}:{width:paired?227:460,height:308,gap:6};}
export async function renderPoseImage(src:string,settings:BoothSettings,hasPair:boolean,max=1800){const geometry=poseGeometry(settings,hasPair);const graded=await renderPhoto(src,{...structuredClone(defaultEdit),film:boothFilters.find(f=>f.name===settings.filter)?.film??'none',intensity:settings.intensity,frame:'No Border',ratio:`${geometry.width}:${geometry.height}`,zoom:settings.zoom,x:settings.x,y:settings.y},max);if(!settings.photoBackground||settings.photoBackground==='original')return graded;const image=await loadImage(await replacePhotoBackground(graded.toDataURL(),settings.photoBackground));const out=canvas(image.naturalWidth,image.naturalHeight);out.getContext('2d')!.drawImage(image,0,0);return out;}

export function frameDate(now=new Date()){return `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;}
let fontsReady:Promise<unknown>|undefined;
export function loadFrameFonts(){return fontsReady??=Promise.all([new FontFace('Frame Korean','url(/fonts/frame-korean.ttf)',{weight:'200'}),new FontFace('Frame Date','url(/fonts/frame-date.ttf)')].map(async font=>{const loaded=await font.load();document.fonts.add(loaded);}));}
function triangle(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.lineTo(x,y+19);ctx.closePath();ctx.fill();}
function sideLabel(ctx:CanvasRenderingContext2D,text:string,x:number,y:number){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.font='13px "Frame Date"';ctx.textAlign='left';ctx.fillText(text,0,0);ctx.restore();}
async function referenceStrip(shots:string[],paired:string[],selected:number[],settings:BoothSettings,max:number){
 await loadFrameFonts();const frame=frames.find(f=>f.name===settings.frame)??frames[0];const single=canvas(528,1584),ctx=single.getContext('2d')!;ctx.fillStyle=frame.color;ctx.fillRect(0,0,528,1584);
 for(let n=0;n<selected.length;n++){const index=selected[n],sources=paired.length?[shots[index],paired[index]]:[shots[index]];for(let side=0;side<sources.length;side++){if(!sources[side])continue;const w=sources.length===2?227:460;const graded=await renderPoseImage(sources[side],settings,sources.length===2);ctx.drawImage(graded,34+side*233,44+n*330,w,308);}}
 ctx.fillStyle=frame.ink;
 sideLabel(ctx,'122',21,202);triangle(ctx,17,215);triangle(ctx,509,112);
 sideLabel(ctx,'LIFEFOURCUTS',510,572);triangle(ctx,509,590);triangle(ctx,17,744);
 sideLabel(ctx,'LIFEFOURCUTS',21,1076);triangle(ctx,17,1095);sideLabel(ctx,'122',510,1180);triangle(ctx,509,1197);
 ctx.textAlign='center';ctx.font='200 52px "Frame Korean"';ctx.fillText('인생네컷',264,1454);
 if(settings.caption){ctx.font='14px "Frame Date", sans-serif';ctx.fillText(settings.caption,264,1493,450);}
 if(settings.date){ctx.font='20px "Frame Date"';ctx.fillText(frameDate(),264,1547);}
 const copies=settings.layout==='double'||settings.layout==='separate'||settings.layout==='print'?2:1;const width=settings.layout==='print'?1200:528*copies,height=settings.layout==='print'?1800:1584;const scale=Math.min(1,max/Math.max(width,height));const out=canvas(width*scale,height*scale),oc=out.getContext('2d')!;
 // Assemble at integer coordinates before resizing to avoid a seam in scaled previews.
 const combined=canvas(528*copies,1584),cc=combined.getContext('2d')!;
 for(let c=0;c<copies;c++)cc.drawImage(single,c*528,0);
 oc.drawImage(combined,0,0,out.width,out.height);
 return out;
}
async function presetStrip(shots:string[],paired:string[],selected:number[],settings:BoothSettings,frame:FramePreset,max:number){
 const geometry=presetGeometry(frame.style!),layers=borderSvg(frame);
 const base=canvas(geometry.width,geometry.height),ctx=base.getContext('2d')!;
 ctx.drawImage(await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(layers.under)}`),0,0);
 for(let n=0;n<geometry.windows.length;n++){
  const index=selected[n],w=geometry.windows[n];if(index===undefined)continue;
  const sources=paired.length?[shots[index],paired[index]]:[shots[index]];
  for(let side=0;side<sources.length;side++){if(!sources[side])continue;const photo=await renderPoseImage(sources[side],settings,sources.length===2);const width=sources.length===2?(w.width-6)/2:w.width;ctx.drawImage(photo,w.x+side*(width+6),w.y,width,w.height);}
 }
 ctx.drawImage(await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(layers.over)}`),0,0);
 if(geometry.footer){ctx.fillStyle=frame.ink;ctx.textAlign='center';const six=frame.style==='six';const contact=frame.style==='contact';const decorative=['autumn','doodles','stars','bears','blossom'].includes(frame.style!);const labelY=decorative?1515:frame.style==='hearts'?1460:frame.style==='gingham'?1460:geometry.footer-58;
  if(!contact){ctx.font=`200 ${six?38:decorative?24:32}px "Frame Korean"`;ctx.fillText('인생네컷',six?240:decorative?geometry.width-93:geometry.width/2,labelY);}
  if(settings.caption){ctx.font='18px "Frame Date"';ctx.fillText(settings.caption,geometry.width/2,geometry.footer-28,geometry.width-60);}
  if(settings.date){ctx.font='19px "Frame Date"';ctx.fillText(frameDate(),six?780:geometry.width/2,geometry.footer);}
 }
 const copies=['double','print'].includes(settings.layout)?2:1;
 const full=canvas(geometry.width*copies,geometry.height);for(let i=0;i<copies;i++)full.getContext('2d')!.drawImage(base,i*geometry.width,0);
 const width=settings.layout==='print'?1200:full.width,height=settings.layout==='print'?1800:full.height,scale=Math.min(1,max/Math.max(width,height));const out=canvas(width*scale,height*scale);out.getContext('2d')!.drawImage(full,0,0,out.width,out.height);return out;
}
export async function renderStrip(shots:string[],paired:string[],selected:number[],settings:BoothSettings,max=1800){
 await loadFrameFonts();
 const preset=frames.find(f=>f.name===settings.frame);
 if(preset?.style){if(settings.layout==='separate'){const left=await presetStrip(shots,[],selected,{...settings,layout:'strip'},preset,5000),right=await presetStrip(paired.length?paired:shots,[],selected,{...settings,layout:'strip'},preset,5000);const scale=Math.min(1,max/Math.max(left.width*2,left.height)),out=canvas(left.width*2*scale,left.height*scale),ctx=out.getContext('2d')!;ctx.drawImage(left,0,0,out.width/2,out.height);ctx.drawImage(right,out.width/2,0,out.width/2,out.height);return out;}return presetStrip(shots,paired,selected,settings,preset,max);}
 if(settings.layout==='separate'){const left=await referenceStrip(shots,[],selected,{...settings,layout:'strip'},5000),right=await referenceStrip(paired.length?paired:shots,[],selected,{...settings,layout:'strip'},5000);const scale=Math.min(1,max/1584),out=canvas(1056*scale,1584*scale),ctx=out.getContext('2d')!;const full=canvas(1056,1584);full.getContext('2d')!.drawImage(left,0,0);full.getContext('2d')!.drawImage(right,528,0);ctx.drawImage(full,0,0,out.width,out.height);return out;}
 if(settings.layout!=='grid')return referenceStrip(shots,paired,selected,settings,max);
 const isPair=paired.length>0;const frame=frames.find(f=>f.name===settings.frame)??frames[0];const grid=true;const rows=grid?2:4,columns=grid?2:1;const rowWidth=isPair?1020:510;const p=32,photoH=340;const width=rowWidth*columns+p*(columns+1),height=rows*photoH+p*(rows+1)+155;
 const base=canvas(width,height),ctx=base.getContext('2d')!;ctx.fillStyle=frame.color;ctx.fillRect(0,0,width,height);
 for(let n=0;n<selected.length;n++){const index=selected[n];const sources=isPair?[shots[index],paired[index]]:[shots[index]];for(let side=0;side<sources.length;side++){if(!sources[side])continue;const graded=await renderPoseImage(sources[side],settings,isPair);const x=p+(n%columns)*(rowWidth+p)+side*(rowWidth/2+8);const y=p+Math.floor(n/columns)*(photoH+p);ctx.drawImage(graded,x,y,isPair?(rowWidth-16)/2:rowWidth,photoH);}}
 ctx.fillStyle=frame.ink;ctx.textAlign='center';ctx.font='200 42px "Frame Korean"';ctx.fillText('인생네컷',width/2,height-100);ctx.font='18px sans-serif';ctx.fillText(settings.caption,width/2,height-63,width-60);if(settings.date)ctx.fillText(frameDate(),width/2,height-30);
 const out=base;
 const scale=Math.min(1,max/Math.max(out.width,out.height));if(scale<1){const small=canvas(out.width*scale,out.height*scale);small.getContext('2d')!.drawImage(out,0,0,small.width,small.height);return small;}return out;
}
