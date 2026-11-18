import {originalFrameArtwork,type OriginalFrame} from './originalFrames';
// Editable vector borders: photo windows always contain the visitor's own pictures.
export type FramePreset={name:string;color:string;ink:string;style?:string;poses?:number;defaultFilter?:string;original?:OriginalFrame};
export const referenceFrames:FramePreset[]=[
 {name:'Borderless',color:'#ffffff',ink:'#333333',style:'borderless'},
 {name:'Borderless Duo',color:'#ffffff',ink:'#333333',style:'duo'},
 {name:'Sepia Six-cut',color:'#595642',ink:'#f4ead1',style:'sepia',poses:6,defaultFilter:'Sepia'},
 {name:'Pink Gingham',color:'#f9d9df',ink:'#4a3837',style:'gingham'},
 {name:'Cozy Doodles',original:originalFrameArtwork['cozy-doodles'],color:'#dbe8e4',ink:'#383c38',style:'doodles'},
 {name:'Autumn Bears',color:'#ffde70',ink:'#493c29',style:'autumn'},
 {name:'Black Contact Sheet',color:'#100d0b',ink:'#ffffff',style:'contact'},
 {name:'Pink Six-cut',original:originalFrameArtwork['pink-six'],color:'#e8afb3',ink:'#fff8f1',style:'six',poses:6},
 {name:'Pink Crumb',color:'#000000',ink:'#ee9cba',style:'crumb',poses:6},
 {name:'Heart Sketch',original:originalFrameArtwork['heart-sketch'],color:'#ffffff',ink:'#df87ad',style:'hearts',poses:6},
 {name:'Star Buddies',original:originalFrameArtwork['star-buddies'],color:'#fff9eb',ink:'#8a7254',style:'stars'},
 {name:'Honey Bears',original:originalFrameArtwork['honey-bears'],color:'#f9e8c5',ink:'#8e7451',style:'bears'},
 {name:'Photoism Witch',color:'#000000',ink:'#ffffff',style:'photoism-witch',original:originalFrameArtwork['photoism-witch']},
 {name:'Photoism Pumpkin',color:'#341152',ink:'#ffffff',style:'photoism-pumpkin',original:originalFrameArtwork['photoism-pumpkin']},
 {name:'Pancake Bears',color:'#f9e7a2',ink:'#ad945d',style:'pancakes',original:originalFrameArtwork['pancake-bears']},
 {name:'Love Cats',color:'#f8c9c4',ink:'#fffdf6',style:'love-cats',original:originalFrameArtwork['love-cats']},
 {name:'Flower Pups',color:'#eaa7a3',ink:'#fffdf6',style:'flower-pups',original:originalFrameArtwork['flower-pups']},
 {name:'Picnic Bear',color:'#f4c3b7',ink:'#242424',style:'picnic-bear',original:originalFrameArtwork['picnic-bear']},
 {name:'Cloud Friends 10th',color:'#a0d6e8',ink:'#242424',style:'cloud-friends',original:originalFrameArtwork['cloud-friends']},
 {name:'Cherry Blossom',color:'#fce7e8',ink:'#665d5a',style:'blossom'},
];
export function presetPoses(name:string){return referenceFrames.find(f=>f.name===name)?.poses??4;}
export type Window={x:number;y:number;width:number;height:number};
export function frameGeometry(frame:FramePreset){const art=frame.original;if(art)return {width:art.width,height:art.height,windows:art.windows.map(([x,y,width,height])=>({x,y,width,height})),footer:art.datePoint[1]};return presetGeometry(frame.style!);}
export function presetGeometry(style:string){
 if(style==='duo')return {width:375,height:1364,windows:Array.from({length:4},(_,i)=>({x:0,y:i*341,width:375,height:341})),footer:0};
 if(style==='sepia')return {width:1040,height:1734,windows:Array.from({length:6},(_,i)=>({x:32+(i%2)*488,y:Math.floor(i/2)*578,width:488,height:578})),footer:0};
 if(style==='crumb')return {width:1040,height:1584,windows:Array.from({length:6},(_,i)=>({x:75+(i%2)*455,y:80+Math.floor(i/2)*450,width:434,height:434})),footer:1550};
 if(style==='contact')return {width:1040,height:1584,windows:Array.from({length:4},(_,i)=>({x:38+(i%2)*490,y:96+Math.floor(i/2)*746,width:474,height:650})),footer:1544};
 if(style==='six'||style==='hearts')return {width:1040,height:1584,windows:Array.from({length:6},(_,i)=>({x:style==='six'?88+(i%2)*456:34+(i%2)*492,y:(style==='six'?60:42)+Math.floor(i/2)*(style==='six'?468:434)+(style==='six'&&i%2?34:0),width:style==='six'?400:480,height:style==='six'?458:420})),footer:1540};
 if(style==='borderless')return {width:520,height:1736,windows:Array.from({length:4},(_,i)=>({x:0,y:i*434,width:520,height:434})),footer:0};
 const x=style==='doodles'?20:style==='gingham'?18:34;
 const top=style==='doodles'?90:style==='gingham'?54:44;
 return {width:528,height:1584,windows:Array.from({length:4},(_,i)=>({x,y:top+i*330,width:528-x*2,height:308})),footer:style==='stars'?1570:1547};
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
 }else if(style==='stars'){
  const chef= bear+'<path d="M-41 39Q0 53 41 39L47 95Q0 115-47 95Z" fill="#fffdf6"/><path d="M-35-38q-12-18 2-26q-2-21 17-21q16-18 29 0q25-7 23 21q17 15 3 26Z" fill="#fffdf6"/><path d="M-34-38h68v9h-68Z" fill="#fffdf6"/><g fill="#35372c"><circle cy="62" r="3"/><circle cy="83" r="3"/></g>';
  const baker=bunny+'<path d="M-39 40Q0 54 39 40L42 92Q0 111-42 92Z" fill="#bc916b"/><ellipse cy="-40" rx="39" ry="10" fill="#b58b61"/><path d="M-24-42q-5-35 24-35q29 0 24 35Z" fill="#c5a17b"/><path d="M-37 56q28-3 37 17q10-20 38-17M-4 74q-11-19 3-22q17 0 11 16" fill="#efd0a5"/>';
  ornaments+=decal(bear,55,310,.85,'#efc59a',-75)+decal(bunny,111,283,.85,'#fffef8',-48)+decal(chef,423,625,.72,'#efc59a',15)+decal(bunny,457,670,.85,'#fffef8',65)+decal(bunny,29,1008,.45,'#fffef8',-15)+decal(bear,486,1006,.45,'#efc59a',12)+decal(chef,143,1428,1.2,'#efc59a')+decal(baker,337,1445,1.15,'#fffef8')+decal(bunny,51,1516,.3,'#fffef8',-15);
  for(let i=0;i<16;i++)ornaments+=decal(star,i%2?520:8,9+i*92,.75,'#ffdc66',i*31);
  ornaments+=decal(star,463,1458,.8,'#ffdc66',18)+decal(star,410,1547,.7,'#ffdc66',-15)+decal(star,97,1563,.55,'#ffdc66');
 }else if(style==='doodles'){
  ornaments+=decal(bear,55,345,.75,'#f0ce9d',-12)+decal(bunny,135,345,.75,'#fffef5',12)+decal(bunny,445,675,.8,'#fffef5',-8)+decal(bear,445,1015,.7,'#f3d68e')+decal(bear,320,1435,1,'#f0ce9d',15)+decal(bunny,190,1445,.95,'#fffef5',-9);
  if(style==='doodles')ornaments+=`<g stroke="#444438" stroke-width="3" fill="none">${g.windows.map(w=>`<path d="M${w.x} ${w.y+4}q100-6 180 0t${w.width-180} 0v${w.height-8}q-100 8-180 0t-${w.width-180} 0Z"/>`).join('')}</g>`+decal('<path d="M-34 0q0-45 34-45T34 0ZM-5 0h10l7 26h-24Z"/>',355,80,1,'#e9b37e');
  for(let i=0;i<17;i++)ornaments+=decal(star,i%2?514:9,80+i*89,.5,'#ffe27b',i*37);
 }else if(style==='crumb'){
  const envelope='<path d="M-57-31 57-31 57 32-57 32ZM-57-31 0 8 57-31"/>';
  const cupcake='<path d="M-41 3h82l-10 49h-60ZM-36 0q-14-16 5-23q-8-17 15-22q8-25 23-6q25-4 21 17q25 1 13 24ZM-18 13l3 30M0 13v30M18 13l-3 30"/>';
  const lock='<path d="M-29-25v-20q0-37 29-37t29 37v20M-40-24q40-22 80 0v65q-40 20-80 0ZM0-9q-17 0-11 16l-7 16h36L11 7q6-16-11-16Z"/>';
  const balloon='<path d="M0 45C-85-5-52-65 0-31C52-65 85-5 0 45ZM-6 48l12 0-6 9Z M0 57q-20 36 20 58"/>';
  const bow='<path d="M0 0q-89-65-65-14q12 26 65 14q85-66 61-16Q50 11 0 0ZM-7 5q-35 35-28 70l28-15 13 15q16-40 8-68M-8-5h22v16H-8Z"/>';
  const cupid='<path d="M-38-17q-36-30-13-49q28-22 39 5q31-4 30 20q-4 26-30 26ZM-33-60q9-12 16 0M-41-26q22 16 48 0M-12-17q49 0 45 28q-8 21-43 7q-23 27-35 7q-8-17 18-25M30-8q43-68 27-73q-25 15-21 63M38 7q39-9 62 9l-29 12-25-9M21 27q33 53 70 49q-20-15-16-37M7 27q-9 44 22 43M-47 9l-28 34M-55 36l-20 7 8-22"/>';
  const cake='<path d="M-48-20q48-28 96 0v65q-48 28-96 0ZM-48-20q48 26 96 0M-48 2q48 26 96 0M-48 23q48 26 96 0"/>';
  const sketch=(shape:string,x:number,y:number,scale=1,rotation=0)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${shape}</g>`;
  ornaments='<defs><filter id="chalk" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="3" seed="7" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter></defs><text x="75" y="65" fill="#ee9cba" font-family="Georgia,serif" font-size="48">PHOTO CRUMB</text><g fill="none" stroke="#ee9cba" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#chalk)">';
  ornaments+=sketch(cupid,900,115,1.1,-12)+sketch(envelope,104,499,1.05,-16)+sketch(balloon,916,510,.9,-10)+sketch(balloon,980,540,.8,16)+sketch(cake,103,943,1.05,-5)+sketch(cupcake,572,980,1.05,-5)+sketch(bow,952,1310,1.1,18)+sketch(lock,105,1480,1.05,-22)+sketch(lock,197,1487,.95,19);
  for(const [x,y,scale,rotation] of [[65,158,.55,-18],[974,307,.55,20],[541,529,.5,-22],[69,833,.5,-16],[975,840,.5,20],[350,1513,.55,-12],[405,1518,.5,-22],[643,1524,.5,15],[702,1504,.55,18]])ornaments+=sketch(heart,x,y,scale*1.5,rotation);
  ornaments+='</g>';
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
export function frameThumbnail(frame:FramePreset){if(frame.original)return frame.original.src;const g=presetGeometry(frame.style!),layers=borderSvg(frame,true);return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.width} ${g.height}">${layers.under}${layers.over}</svg>`)}`;}
