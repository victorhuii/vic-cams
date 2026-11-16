// Editable vector borders: photo windows always contain the visitor's own pictures.
export type FramePreset={name:string;color:string;ink:string;style?:string;poses?:number};
export const referenceFrames:FramePreset[]=[
 {name:'Borderless',color:'#ffffff',ink:'#333333',style:'borderless'},
 {name:'Pink Gingham',color:'#f9d9df',ink:'#4a3837',style:'gingham'},
 {name:'Cozy Doodles',color:'#dbe8e4',ink:'#383c38',style:'doodles'},
 {name:'Autumn Bears',color:'#ffde70',ink:'#493c29',style:'autumn'},
 {name:'Black Contact Sheet',color:'#100d0b',ink:'#ffffff',style:'contact'},
 {name:'Pink Six-cut',color:'#e8afb3',ink:'#fff8f1',style:'six',poses:6},
 {name:'Heart Sketch',color:'#ffffff',ink:'#df87ad',style:'hearts',poses:6},
 {name:'Star Buddies',color:'#fff9eb',ink:'#8a7254',style:'stars'},
 {name:'Honey Bears',color:'#f9e8c5',ink:'#8e7451',style:'bears'},
 {name:'Cherry Blossom',color:'#fce7e8',ink:'#665d5a',style:'blossom'},
];
export function presetPoses(name:string){return referenceFrames.find(f=>f.name===name)?.poses??4;}
export type Window={x:number;y:number;width:number;height:number};
export function presetGeometry(style:string){
 if(style==='contact')return {width:1040,height:1584,windows:Array.from({length:4},(_,i)=>({x:38+(i%2)*490,y:96+Math.floor(i/2)*746,width:474,height:650})),footer:1544};
 if(style==='six'||style==='hearts')return {width:1040,height:1584,windows:Array.from({length:6},(_,i)=>({x:style==='six'?88+(i%2)*456:34+(i%2)*492,y:(style==='six'?60:42)+Math.floor(i/2)*(style==='six'?468:434)+(style==='six'&&i%2?34:0),width:style==='six'?400:480,height:style==='six'?458:420})),footer:1540};
 if(style==='borderless')return {width:520,height:1736,windows:Array.from({length:4},(_,i)=>({x:0,y:i*434,width:520,height:434})),footer:0};
 const x=style==='doodles'?20:style==='gingham'?18:34;
 const top=style==='doodles'?90:style==='gingham'?54:44;
 return {width:528,height:1584,windows:Array.from({length:4},(_,i)=>({x,y:top+i*330,width:528-x*2,height:308})),footer:1547};
}
const heart='<path d="M0 13 C-48 -17 -25 -42 0 -20 C25 -42 48 -17 0 13Z"/>';
const leaf='<path d="M0 0 Q-42 -15 -16 -49 Q10 -52 27 -65 Q45 -12 0 0Z"/><path d="M0 0 18 -46" fill="none"/>';
const star='<path d="m0 -19 6 13 15 2-11 10 3 15L0 14l-14 7 3-15-11-10 15-2Z"/>';
const bear='<circle cx="-42" cy="-32" r="20"/><circle cx="42" cy="-32" r="20"/><ellipse cy="7" rx="61" ry="51"/><ellipse cy="55" rx="48" ry="29"/><g fill="#c79747" stroke="none"><circle cx="-42" cy="-32" r="10"/><circle cx="42" cy="-32" r="10"/></g><g fill="#292921" stroke="none"><ellipse cx="-21" cy="3" rx="4" ry="6"/><ellipse cx="21" cy="3" rx="4" ry="6"/><ellipse cy="17" rx="6" ry="4"/></g><path d="M0 20q-9 13-17 3M0 20q9 13 17 3" fill="none"/><g fill="#efa8a4" stroke="none"><ellipse cx="-36" cy="19" rx="10" ry="6"/><ellipse cx="36" cy="19" rx="10" ry="6"/></g><ellipse cx="-33" cy="56" rx="23" ry="15"/><ellipse cx="33" cy="56" rx="23" ry="15"/>';
const bunny='<ellipse cx="-16" cy="-42" rx="12" ry="29"/><ellipse cx="13" cy="-45" rx="12" ry="30"/><path d="M-45-15Q-66 5-49 24Q-55 49-23 47Q0 62 23 47Q55 49 49 24Q66 5 45-15Q0-42-45-15Z"/><g fill="#272822" stroke="none"><circle cx="-16" cy="4" r="4"/><circle cx="16" cy="4" r="4"/><ellipse cy="19" rx="6" ry="4"/></g><g fill="#efb2b2" stroke="none"><ellipse cx="-31" cy="20" rx="10" ry="6"/><ellipse cx="31" cy="20" rx="10" ry="6"/></g>';
const puppy='<path d="M-41-19Q-64-36-58-7L-48 16Q-58 42-27 42Q-12 60 0 42Q21 59 31 39Q62 41 49 13Q68-21 43-22Q19-45-10-29Q-32-38-41-19Z"/><g fill="#262821" stroke="none"><circle cx="-19" cy="3" r="4"/><circle cx="18" cy="3" r="4"/><ellipse cy="15" rx="6" ry="4"/></g><path d="M0 18q-5 12-13 3M0 18q5 12 13 3" fill="none"/><g fill="#f3b9bc" stroke="none"><ellipse cx="-32" cy="17" rx="9" ry="6"/><ellipse cx="32" cy="17" rx="9" ry="6"/></g>';
const flower='<path d="M0-12C-48-67-74-8-27 5C-73 37-23 78 0 30C23 78 73 37 27 5C74-8 48-67 0-12Z"/>';
function decal(shape:string,x:number,y:number,scale=1,fill='#dfb46d',rotate=0){return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="${fill}" stroke="#35372c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${shape}</g>`;}
export function borderSvg(frame:FramePreset,thumbnail=false){
 const style=frame.style!,g=presetGeometry(style);let art='';
 if(style==='gingham')art='<defs><pattern id="check" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#fff2df"/><path d="M11 0v44M0 11h44" stroke="#edbac1" stroke-width="22" opacity=".55"/></pattern></defs><rect width="100%" height="100%" fill="url(#check)"/>';
 else if(style==='doodles')for(let i=0;i<70;i++)art+=`<circle cx="${(i*93)%528}" cy="${(i*137)%1584}" r="6" fill="#fff6ce"/>`;
 else if(style==='bears'||style==='blossom')for(let i=0;i<23;i++)art+=decal(heart,(i*139)%528,(i*227)%1584,style==='bears'?1.3:2.6,style==='bears'?'#f4d2c4':'#f8ced2',i*23).replace('stroke="#35372c"','stroke="none"');
 if(thumbnail)art+=g.windows.map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.width}" height="${w.height}" fill="#b4bcb2"/>`).join('');
 // Pattern is beneath the photos; ornaments below cross the window edges.
 let ornaments='';
 if(style==='autumn'){
  for(let i=0;i<6;i++)ornaments+=decal(leaf,65+i*77,65,.65,['#b4bd50','#d69536','#eeba3f','#c86131'][i%4],i*42);
  ornaments+=decal(bear,55,300,.8,'#dba457',-8)+decal(bear,449,965,.9,'#dba457',8)+decal(bear,285,1430,1.05,'#dba457',-10)+decal(bunny,99,1458,.7,'#fff9e5');
  for(let i=0;i<18;i++)ornaments+=decal(leaf,(i*93+37)%528,i<6?400+(i*77)%650:1390+(i*31)%130,.55,['#c86a33','#e6a72d','#a7b54e'][i%3],i*47);
 }else if(style==='bears')ornaments+=decal(bear,70,296,1,'#dfb46b',-9)+decal(bear,451,640,.9,'#dfb46b',15)+decal(bear,10,975,1,'#dfb46b',-20)+decal(bear,265,1410,1.2,'#dfb46b');
 else if(style==='blossom'){
  ornaments+=decal(puppy,365,342,.75,'#f5d792',-10)+decal(puppy,448,345,.7,'#fffdf4',8)+decal(puppy,270,657,.7,'#fffdf4',12)+decal(puppy,320,1008,.75,'#f5d792',5)+decal(puppy,428,1330,1,'#f5d792',-18)+decal(puppy,190,1430,.85,'#fffdf4',-8)+decal(puppy,310,1435,.9,'#f5d792',12);
  for(let i=0;i<9;i++){const x=i%2?528:0,y=275+i*165;ornaments+=decal(flower,x,y,1.1,'#f9d4d8',i*35).replace('stroke="#35372c"','stroke="#f3bec7"');}
  for(let i=0;i<14;i++)ornaments+=`<path d="M${(i*133)%528} ${15+i*103}q-16-8-23 18q26 8 23-18" fill="#efb7c3" opacity=".7"/>`;
  for(const [x,y] of [[92,36],[280,33],[340,1047]])ornaments+=`<path d="M${x} ${y}q-30 5-25 16q30 8 73-2q12-9-8-13q-10-20-40-1Z" fill="#fffefa" stroke="#daedf0" stroke-width="4"/>`;
 }else if(style==='stars'||style==='doodles'){
  ornaments+=decal(bear,55,345,.75,'#f0ce9d',-12)+decal(bunny,135,345,.75,'#fffef5',12)+decal(bunny,445,675,.8,'#fffef5',-8)+decal(bear,445,1015,.7,'#f3d68e')+decal(bear,320,1435,1,'#f0ce9d',15)+decal(bunny,190,1445,.95,'#fffef5',-9);
  if(style==='doodles')ornaments+=`<g stroke="#444438" stroke-width="3" fill="none">${g.windows.map(w=>`<path d="M${w.x} ${w.y+4}q100-6 180 0t${w.width-180} 0v${w.height-8}q-100 8-180 0t-${w.width-180} 0Z"/>`).join('')}</g>`+decal('<path d="M-34 0q0-45 34-45T34 0ZM-5 0h10l7 26h-24Z"/>',355,80,1,'#e9b37e');
  for(let i=0;i<17;i++)ornaments+=decal(star,i%2?514:9,80+i*89,.5,'#ffe27b',i*37);
 }else if(style==='hearts'){
  for(const [x,y] of [[780,275],[275,715],[780,1150]])for(let i=0;i<3;i++)ornaments+=`<g transform="translate(${x+i*7} ${y+i*7}) scale(${6.7-i*.15} ${8-i*.2})" fill="none" stroke="#ed8fbb" stroke-width=".55" opacity=".85">${heart}</g>`;
 }else if(style==='contact'){
  ornaments+='<text x="1000" y="68" text-anchor="end" fill="white" font-family="Georgia" font-size="44">인생네컷</text>';
  g.windows.forEach((w,i)=>{ornaments+=`<g fill="white" font-family="sans-serif" font-size="14"><text x="${w.x}" y="${w.y-26}">▶ ${i+5}</text><text x="${w.x}" y="${w.y+w.height+23}">KEEP YOURSELF ALIVE</text><text x="${w.x+w.width}" y="${w.y+w.height+23}" text-anchor="end">${50+i}</text></g>`;});
 }else if(style==='six'){
  g.windows.forEach((w,i)=>{ornaments+=`<g fill="#fff8ef" font-family="sans-serif" font-size="13"><text transform="translate(${i%2?w.x+w.width+20:w.x-20} ${w.y+55}) rotate(90)">▼ ${i%3===0?'122':'LIFEFOURCUTS'}</text><text transform="translate(${i%2?w.x-12:w.x+w.width+14} ${w.y+w.height-40}) rotate(90)">▼</text></g>`;});
 }
 return {under:`<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}"><rect width="100%" height="100%" fill="${frame.color}"/>${art}</svg>`,over:`<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}">${ornaments}</svg>`};
}
export function frameThumbnail(frame:FramePreset){const g=presetGeometry(frame.style!),layers=borderSvg(frame,true);return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.width} ${g.height}">${layers.under}${layers.over}</svg>`)}`;}
