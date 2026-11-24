// Shared by the canvas renderer and server: numeric adjustments only, never generated pixels.
export const settingRanges = {
 exposure:[-2,2], contrast:[-50,50], saturation:[-100,100], warmth:[-50,50], tint:[-50,50],
 shadows:[-80,80], highlights:[-80,80], blacks:[-50,50], whites:[-50,50],
 gamma:[.5,2], redGain:[.6,1.4], greenGain:[.6,1.4], blueGain:[.6,1.4],
 fade:[0,60], grain:[0,60], vignette:[0,80],
} as const;
export type CustomSettings = {[K in keyof typeof settingRanges]:number};
export const neutralSettings:CustomSettings={exposure:0,contrast:0,saturation:0,warmth:0,tint:0,shadows:0,highlights:0,blacks:0,whites:0,gamma:1,redGain:1,greenGain:1,blueGain:1,fade:0,grain:0,vignette:0};
export type SharedPreset={id:string;name:string;settings:CustomSettings};
export type ExcludedRegion={x:number;y:number;width:number;height:number};
export function parseSettings(value:unknown):CustomSettings {
 if(!value||typeof value!=='object')throw new Error('Invalid preset settings.');
 const result={...neutralSettings};
 for(const key of Object.keys(settingRanges) as (keyof CustomSettings)[]){const v=(value as Record<string,unknown>)[key];const [min,max]=settingRanges[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error(`Invalid preset adjustment: ${key}.`);result[key]=v;}
 return result;
}
export function parseRegions(value:unknown):ExcludedRegion[]{
 if(!Array.isArray(value)||value.length>8)throw new Error('Invalid watermark areas.');
 return value.map(r=>{if(!r||['x','y','width','height'].some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<0||r[k]>1)||r.width<=0||r.height<=0||r.x+r.width>1.001||r.y+r.height>1.001)throw new Error('Invalid watermark area.');return {x:r.x,y:r.y,width:r.width,height:r.height};});
}
