import {PreviewStrip} from './PreviewStrip';
import {useEffect,useState} from 'react';
export type PreviewPhoto={id:string;name:string;source:string|Blob;thumbnail?:string};
export function PhotoPreview({photos,selectedId,onSelect,render,onReorder,disabled,label='Photo preview'}:{photos:PreviewPhoto[];selectedId?:string;onSelect?:(id:string)=>void;render?:(photo:PreviewPhoto)=>Promise<string>;onReorder?:(from:string,to:string)=>void;disabled?:boolean;label?:string}){
 const [localId,setLocalId]=useState(''),[image,setImage]=useState(''),[error,setError]=useState('');
 const requested=selectedId??localId;const active=photos.find(p=>p.id===requested)??photos[0];const index=active?photos.findIndex(p=>p.id===active.id):-1;
 function select(id:string){setLocalId(id);onSelect?.(id);}
 useEffect(()=>{let live=true,url='';setImage('');setError('');if(!active)return;const load=async()=>{try{let src:string;if(render)src=await render(active);else if(typeof active.source==='string')src=active.source;else{url=URL.createObjectURL(active.source);src=url;}if(live)setImage(src);}catch(e){if(live)setError((e as Error).message);}};void load();return()=>{live=false;if(url)URL.revokeObjectURL(url);};},[active?.id,active?.source,render]);
 if(!active)return <section className="photo-preview" aria-label={label}><h2>{label}</h2><p className="muted">Select photos to preview them here.</p></section>;
 return <section className="photo-preview" aria-label={label}><div className="photo-preview-heading"><h2>{label}</h2><span>{index+1} / {photos.length}</span></div><div className="photo-preview-stage">{image?<img src={image} alt={`Large preview: ${active.name}`}/>:<p role="status">{error||'Loading preview…'}</p>}</div><div className="photo-preview-navigation"><button className="text-button" disabled={index<=0} onClick={()=>select(photos[index-1].id)}>Previous</button><span>{active.name}</span><button className="text-button" disabled={index>=photos.length-1} onClick={()=>select(photos[index+1].id)}>Next</button></div>{photos.length>1&&<PreviewStrip photos={photos} activeId={active.id} onSelect={select} onReorder={onReorder} disabled={disabled}/>}</section>;
}
