import {createPortal} from 'react-dom';
import {PhotoPreview,type PreviewPhoto} from '../../components/PhotoPreview';
import {normalizePhoto,photoAccept} from '../../lib/imaging/uploads';
import {useCallback,useEffect,useRef,useState} from 'react';
import {blobOf,download,fileData,films,renderPhoto,type Edit} from '../../lib/imaging/engine';
import {photoZip} from '../../lib/imaging/zip';
import {save} from '../../lib/storage/archive';
type Item={id:string;name:string;source:string;selected:boolean;thumb:string;output?:Blob;applied?:string;error?:string};
export function BulkFilm({files,edit,format,onClose,notify}:{files:File[];edit:Edit;format:string;onClose:()=>void;notify:(m:string)=>void}){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(false),[working,setWorking]=useState(false),[zipping,setZipping]=useState(false),[progress,setProgress]=useState('');
 const input=useRef<HTMLInputElement>(null),epoch=useRef(0),alive=useRef(true),cancel=useRef(false);
 useEffect(()=>{alive.current=true;const id=++epoch.current;void add(files,id);return()=>{alive.current=false;epoch.current++;cancel.current=true;};},[files]);
 const [previewHost,setPreviewHost]=useState<HTMLElement|null>(null);useEffect(()=>{setPreviewHost(document.getElementById('film-bulk-preview'));},[]);
 const renderPreview=useCallback(async(photo:PreviewPhoto)=>(await renderPhoto(photo.source as string,edit,1200)).toDataURL(),[edit]);
 const selected=items.filter(i=>i.selected);const locked=loading||working||zipping;
 async function add(incoming:File[],id=epoch.current){
  setLoading(true);let skipped=0;const capacity=30-items.length;
  try{for(const file of incoming.slice(0,Math.max(0,capacity))){if(!alive.current||epoch.current!==id)return;
   try{const normalized=await normalizePhoto(file);const source=await fileData(normalized);const c=await renderPhoto(source,{...structuredClone(edit),film:'none',custom:undefined,adjustments:{exposure:0,contrast:0,saturation:0,warmth:0,grain:0,fade:0,vignette:0},frame:'No Border',ratio:'Original',zoom:1,x:0,y:0,rotation:0},220,true);if(!alive.current||epoch.current!==id)return;
    const item:Item={id:crypto.randomUUID(),name:normalized.name,source,selected:true,thumb:c.toDataURL('image/jpeg',.85)};
    try{await save({id:crypto.randomUUID(),kind:'film',created:Date.now(),title:normalized.name,source});}catch(e){item.error=(e as Error).message;}
    if(alive.current&&epoch.current===id)setItems(previous=>[...previous,item]);
   }catch{skipped++;}
  }
  if(incoming.length>capacity)notify('Up to 30 photos fit in one batch. Add the remaining photos in another batch.');
  else if(skipped)notify(`${skipped} photo(s) skipped. Choose JPEG, PNG, WebP or HEIC files under 20 MB.`);
  }finally{if(alive.current&&epoch.current===id)setLoading(false);}
 }
 async function apply(){if(!selected.length||locked)return;cancel.current=false;setWorking(true);const settings=structuredClone(edit),targets=[...selected];const label=films.find(f=>f.id===settings.film)?.name||(settings.film.startsWith('custom:')?'Custom preset':'Original');let completed=0,failed=0;
  try{for(const item of targets){if(!alive.current||cancel.current)break;setProgress(`Applying ${label}: ${completed+failed+1} / ${targets.length}`);
   try{const c=await renderPhoto(item.source,settings,12000);const output=await blobOf(c,format);if(!alive.current||cancel.current)break;
    const thumb=await renderPhoto(item.source,settings,220);await save({id:item.id,kind:'film',created:Date.now(),title:item.name,source:item.source,output,edit:settings});
    if(alive.current)setItems(previous=>previous.map(p=>p.id===item.id?{...p,output,thumb:thumb.toDataURL('image/jpeg',.85),applied:label,error:undefined}:p));completed++;
   }catch(e){failed++;if(alive.current)setItems(previous=>previous.map(p=>p.id===item.id?{...p,error:(e as Error).message}:p));}
   await new Promise(resolve=>setTimeout(resolve,0));
  }}finally{if(alive.current){setWorking(false);setProgress(`${completed} photo(s) applied${failed?`, ${failed} failed`:''}${cancel.current?' · canceled':''}.`);}}
 }
 async function exportSelected(){if(!selected.length||selected.some(i=>!i.output)||locked)return;setZipping(true);try{const archive=await photoZip(selected.map((item,i)=>({name:`${String(i+1).padStart(2,'0')}-${item.name.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N} _-]/gu,'_')||'photo'}.${item.output!.type==='image/jpeg'?'jpg':'png'}`,blob:item.output!})));if(alive.current)download(archive,'victor-studio-photos.zip');}catch(e){if(alive.current)notify((e as Error).message);}finally{if(alive.current)setZipping(false);}}
 return <div className="bulk-film" onDragOver={e=>{e.preventDefault();e.stopPropagation();}} onDrop={e=>{e.preventDefault();e.stopPropagation();if(!locked)void add(Array.from(e.dataTransfer.files));}}><div className="bulk-heading"><h2>Batch photos</h2><button className="text-button" disabled={locked} onClick={onClose}>Back to single photo</button></div>
 <div className="bulk-actions"><button className="text-button" disabled={locked} onClick={()=>input.current?.click()}>Add photos</button><button className="text-button" disabled={locked||!items.length} onClick={()=>setItems(previous=>previous.map(i=>({...i,selected:true})))}>Select all</button><button className="text-button" disabled={locked||!selected.length} onClick={()=>setItems(previous=>previous.map(i=>({...i,selected:false})))}>Deselect all</button><span>{selected.length} / {items.length} selected</span></div>
 <input hidden ref={input} type="file" multiple accept={photoAccept} aria-label="Add batch photos" onChange={e=>{void add(Array.from(e.target.files??[]));e.target.value='';}}/>
 <div className="bulk-grid">{items.map((item,index)=><article className={`bulk-photo ${item.selected?'selected':''}`} key={item.id}><label><input type="checkbox" aria-label={`Select photo ${index+1}: ${item.name}`} disabled={locked} checked={item.selected} onChange={()=>setItems(previous=>previous.map(i=>i.id===item.id?{...i,selected:!i.selected}:i))}/><img src={item.thumb} alt={item.name}/><span>{item.name}</span></label><small>{item.applied||'Original'}</small>{item.error&&<p className="preset-error" role="alert">{item.error}</p>}</article>)}</div>
 <p className="muted">Choose a preset below, then apply it to your selected photos. Current crop and frame settings are included.</p>
 <div className="bulk-actions"><button className="button dark" disabled={locked||!selected.length} onClick={()=>void apply()}>Apply to selected ({selected.length})</button>{working&&<button className="text-button" onClick={()=>{cancel.current=true;}}>Cancel batch</button>}<button className="button" disabled={locked||!selected.length||selected.some(i=>!i.output)} onClick={()=>void exportSelected()}>{zipping?'Preparing ZIP…':'Download selected (.zip)'}</button></div>
 <p className="muted" role="status">{loading?'Loading photos…':progress}</p>{previewHost&&createPortal(<PhotoPreview photos={selected.map(item=>({id:item.id,name:item.name,source:item.source}))} render={renderPreview} label="Selected photo preview"/>,previewHost)}</div>;
}
