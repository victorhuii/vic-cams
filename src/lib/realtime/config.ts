import {validBackground} from '../camera/background';
import {frames,boothFilters,type BoothSettings} from '../../features/booth/render';
export type RoomConfig={settings:BoothSettings;count:number;revision:number};
export function readRoomConfig(value:unknown):RoomConfig|null{
 if(!value||typeof value!=='object')return null;const p=value as Partial<RoomConfig>,s=p.settings;
 if(!s||![4,6,8].includes(p.count??0)||!Number.isSafeInteger(p.revision)||(p.revision??0)<1)return null;
 if(!frames.some(f=>f.name===s.frame)||!['strip','double','separate','grid','print'].includes(s.layout)||!boothFilters.some(f=>f.name===s.filter))return null;
 if(!validBackground(s.background??'original')||!validBackground(s.photoBackground??'original'))return null;
 if(typeof s.caption!=='string'||s.caption.length>60||typeof s.date!=='boolean')return null;
 if(!Number.isFinite(s.intensity)||s.intensity<0||s.intensity>100||!Number.isFinite(s.zoom)||s.zoom<1||s.zoom>3||!Number.isFinite(s.x)||Math.abs(s.x)>100||!Number.isFinite(s.y)||Math.abs(s.y)>100)return null;
 return {settings:{...s,background:s.background??'original',photoBackground:s.photoBackground??'original'},count:p.count!,revision:p.revision!};
}
