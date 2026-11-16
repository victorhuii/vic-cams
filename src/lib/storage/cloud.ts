import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import type {Saved} from './archive';
export const cloudEnabled=import.meta.env.VITE_CLOUD_ARCHIVE_ENABLED==='true';
let client:SupabaseClient|undefined;let login:Promise<string>|undefined;
function getClient(){if(!import.meta.env.VITE_SUPABASE_URL||!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)throw new Error('Cloud storage is missing its Supabase settings.');return client??=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{storage:sessionStorage,storageKey:'vic-cams-gallery-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});}
async function userId(){if(!login)login=(async()=>{const auth=getClient().auth;const current=await auth.getSession();if(current.error)throw current.error;if(current.data.session)return current.data.session.user.id;const result=await auth.signInAnonymously();if(result.error)throw result.error;return result.data.user!.id;})().catch(e=>{login=undefined;throw e;});return login;}
export async function uploadEntry(entry:Saved){
 const uid=await userId(),supabase=getClient(),folder=`${uid}/${entry.sessionId}/${entry.id}`;const bucket=supabase.storage.from('session-photos');
 async function image(src:string|Blob,name:string){const blob=typeof src==='string'?await fetch(src).then(r=>{if(!r.ok)throw new Error('Photo source could not be read.');return r.blob();}):src;if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw new Error('Unsupported image format.');if(blob.size>20*1024*1024)throw new Error('Photo exceeds the 20 MB cloud limit. Download it to keep a copy.');const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';const path=`${folder}/${name}.${ext}`;const result=await bucket.upload(path,blob,{contentType:blob.type,upsert:true,cacheControl:'0'});if(result.error)throw result.error;return path;}
 const source=await image(entry.source,'source');const output=entry.output?await image(entry.output,'output'):null;const shots:string[]=[],paired:string[]=[];
 for(let i=0;i<(entry.shots?.length??0);i++)if(entry.shots![i])shots[i]=await image(entry.shots![i],`pose-${i}`);
 for(let i=0;i<(entry.paired?.length??0);i++)if(entry.paired![i])paired[i]=await image(entry.paired![i],`partner-${i}`);
 const result=await supabase.from('photo_creations').upsert({id:entry.id,owner_id:uid,session_id:entry.sessionId,kind:entry.kind,title:entry.title,created_at:new Date(entry.created).toISOString(),source_path:source,output_path:output,metadata:{edit:entry.edit,settings:entry.settings,selection:entry.selection,shots,paired}},{onConflict:'id'});if(result.error)throw result.error;
}
