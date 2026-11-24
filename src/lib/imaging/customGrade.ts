import type {CustomSettings} from './customSettings';
// Intensity blends with the untouched source, so zero is always exactly the original.
export function gradeCustomPixels(data:Uint8ClampedArray,w:number,h:number,s:CustomSettings,intensity:number){
 const t=Math.max(0,Math.min(1,intensity/100));if(t===0)return;
 for(let i=0;i<data.length;i+=4){const original=[data[i],data[i+1],data[i+2]];const lum=(.2126*original[0]+.7152*original[1]+.0722*original[2])/255;
 const shadow=(1-lum)**2,highlight=lum**2;
 const shift=s.shadows*.65*shadow+s.highlights*.65*highlight+s.blacks*(1-lum)**4+s.whites*lum**4;
 let [r,g,b]=original.map(v=>Math.max(0,(v*2**s.exposure+shift)/255)**(1/s.gamma)*255);
 r=(r+s.warmth+s.tint*.5)*s.redGain;g=(g+s.warmth*.13-s.tint*.5)*s.greenGain;b=(b-s.warmth+s.tint*.5)*s.blueGain;
 const gray=.2126*r+.7152*g+.0722*b,sat=1+s.saturation/100;
 const x=(i/4)%w,y=Math.floor(i/4/w);const vig=1-s.vignette/100*.6*Math.min(1,((x/w-.5)**2+(y/h-.5)**2)*2);
 let seed=Math.imul(i/4+1,374761393);seed=Math.imul(seed^(seed>>>13),1274126177);const n=(((seed^(seed>>>16))>>>0)/4294967295-.5)*s.grain*(.35+.65*(1-lum));
 [r,g,b].forEach((v,c)=>{v=gray+(v-gray)*sat;v=(v-127.5)*(1+s.contrast/100)+127.5;v=(v*(1-s.fade/255)+s.fade+n)*vig;data[i+c]=original[c]+(Math.max(0,Math.min(255,v))-original[c])*t;});
 }
}
