import {canvas,renderPhoto,defaultEdit} from '../../lib/imaging/engine';
export const frames=[{name:'Four-cut',color:'#9e8575',ink:'#fff9ef'},{name:'Classic White',color:'#fffdf7',ink:'#fff9ef'},{name:'Black',color:'#242622',ink:'#fff9ef'},{name:'Cream',color:'#e9dfc9',ink:'#fff9ef'},{name:'Pink',color:'#eac9cb',ink:'#fff9ef'},{name:'Pastel Blue',color:'#cbdfe5',ink:'#fff9ef'},{name:'Retro Film',color:'#b98056',ink:'#fff9ef'}];
export const boothFilters=[{name:'Original',film:'none'},{name:'Dreamy White',film:'dreamy'},{name:'Warm Film',film:'portra'},{name:'Soft Pink',film:'fuji'},{name:'Vintage',film:'gold'},{name:'B&W',film:'hp5'},{name:'Cool Pastel',film:'cine'},{name:'Disposable Flash',film:'disposable'}];
export type BoothSettings={frame:string;layout:string;filter:string;intensity:number;caption:string;date:boolean;zoom:number;x:number;y:number};
export const boothDefaults:BoothSettings={frame:'Four-cut',layout:'double',filter:'Dreamy White',intensity:65,caption:'',date:true,zoom:1,x:0,y:0};
export function frameDate(now=new Date()){return `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;}
let fontsReady:Promise<unknown>|undefined;
export function loadFrameFonts(){return fontsReady??=Promise.all([new FontFace('Frame Korean','url(/fonts/frame-korean.ttf)',{weight:'200'}),new FontFace('Frame Date','url(/fonts/frame-date.ttf)')].map(async font=>{const loaded=await font.load();document.fonts.add(loaded);}));}
function triangle(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.lineTo(x,y+19);ctx.closePath();ctx.fill();}
function sideLabel(ctx:CanvasRenderingContext2D,text:string,x:number,y:number){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.font='13px "Frame Date"';ctx.textAlign='left';ctx.fillText(text,0,0);ctx.restore();}
async function referenceStrip(shots:string[],paired:string[],selected:number[],settings:BoothSettings,max:number){
 await loadFrameFonts();const frame=frames.find(f=>f.name===settings.frame)??frames[0];const single=canvas(528,1584),ctx=single.getContext('2d')!;ctx.fillStyle=frame.color;ctx.fillRect(0,0,528,1584);
 for(let n=0;n<selected.length;n++){const index=selected[n],sources=paired.length?[shots[index],paired[index]]:[shots[index]];for(let side=0;side<sources.length;side++){if(!sources[side])continue;const w=sources.length===2?227:460;const graded=await renderPhoto(sources[side],{...structuredClone(defaultEdit),film:boothFilters.find(f=>f.name===settings.filter)?.film??'none',intensity:settings.intensity,frame:'No Border',ratio:sources.length===2?'3:4':'3:2',zoom:settings.zoom,x:settings.x,y:settings.y},1800);ctx.drawImage(graded,34+side*233,44+n*330,w,308);}}
 ctx.fillStyle=frame.ink;
 sideLabel(ctx,'122',21,202);triangle(ctx,17,215);triangle(ctx,509,112);
 sideLabel(ctx,'LIFEFOURCUTS',510,572);triangle(ctx,509,590);triangle(ctx,17,744);
 sideLabel(ctx,'LIFEFOURCUTS',21,1076);triangle(ctx,17,1095);sideLabel(ctx,'122',510,1180);triangle(ctx,509,1197);
 ctx.textAlign='center';ctx.font='200 52px "Frame Korean"';ctx.fillText('인생네컷',264,1454);
 if(settings.caption){ctx.font='14px "Frame Date", sans-serif';ctx.fillText(settings.caption,264,1493,450);}
 if(settings.date){ctx.font='20px "Frame Date"';ctx.fillText(frameDate(),264,1547);}
 const copies=settings.layout==='double'||settings.layout==='print'?2:1;const width=settings.layout==='print'?1200:528*copies,height=settings.layout==='print'?1800:1584;const scale=Math.min(1,max/Math.max(width,height));const out=canvas(width*scale,height*scale),oc=out.getContext('2d')!;
 // Assemble at integer coordinates before resizing to avoid a seam in scaled previews.
 const combined=canvas(528*copies,1584),cc=combined.getContext('2d')!;
 for(let c=0;c<copies;c++)cc.drawImage(single,c*528,0);
 oc.drawImage(combined,0,0,out.width,out.height);
 return out;
}
export async function renderStrip(shots:string[],paired:string[],selected:number[],settings:BoothSettings,max=1800){
 await loadFrameFonts();
 if(settings.layout!=='grid')return referenceStrip(shots,paired,selected,settings,max);
 const isPair=paired.length>0;const frame=frames.find(f=>f.name===settings.frame)??frames[0];const grid=true;const rows=grid?2:4,columns=grid?2:1;const rowWidth=isPair?1020:510;const p=32,photoH=340;const width=rowWidth*columns+p*(columns+1),height=rows*photoH+p*(rows+1)+155;
 const base=canvas(width,height),ctx=base.getContext('2d')!;ctx.fillStyle=frame.color;ctx.fillRect(0,0,width,height);
 for(let n=0;n<selected.length;n++){const index=selected[n];const sources=isPair?[shots[index],paired[index]]:[shots[index]];for(let side=0;side<sources.length;side++){if(!sources[side])continue;const graded=await renderPhoto(sources[side],{...structuredClone(defaultEdit),film:boothFilters.find(f=>f.name===settings.filter)?.film??'none',intensity:settings.intensity,frame:'No Border',ratio:'3:2',zoom:settings.zoom,x:settings.x,y:settings.y},1800);const x=p+(n%columns)*(rowWidth+p)+side*(rowWidth/2+8);const y=p+Math.floor(n/columns)*(photoH+p);ctx.drawImage(graded,x,y,isPair?(rowWidth-16)/2:rowWidth,photoH);}}
 ctx.fillStyle=frame.ink;ctx.textAlign='center';ctx.font='200 42px "Frame Korean"';ctx.fillText('인생네컷',width/2,height-100);ctx.font='18px sans-serif';ctx.fillText(settings.caption,width/2,height-63,width-60);if(settings.date)ctx.fillText(frameDate(),width/2,height-30);
 const out=base;
 const scale=Math.min(1,max/Math.max(out.width,out.height));if(scale<1){const small=canvas(out.width*scale,out.height*scale);small.getContext('2d')!.drawImage(out,0,0,small.width,small.height);return small;}return out;
}
