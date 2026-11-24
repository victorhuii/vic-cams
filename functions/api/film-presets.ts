import {requirePresetOwner} from '../_lib/presetAccess';
import {body,db,failure,HttpError,json,databaseReady,type Context} from '../_lib/presets';
import {parsePresetMarkdown} from '../../src/lib/imaging/presetMarkdown';
import {parseSettings} from '../../src/lib/imaging/customSettings';
export async function onRequestGet({env}:Context){
 try{const response=await db(env,'film_presets?select=id,name,settings&order=created_at.asc&limit=500');if(!response.ok)throw new HttpError(503,'Shared presets need database setup.');const rows=await response.json() as {id:string;name:string;settings:unknown}[];
 return json({presets:rows.map(p=>({...p,settings:parseSettings(p.settings)})),replicationAvailable:databaseReady(env)&&!!env.CUSTOM_PRESET_PASSWORD});}catch(e){return failure(e);}
}
export async function onRequestPost({request,env}:Context){
 try{await requirePresetOwner(request,env);const input=await body(request,350000);if(typeof input.name!=='string')throw new HttpError(400,'Give your preset a name.');const name=input.name.normalize('NFKC').trim().replace(/\s+/g,' ');if(name.length<1||name.length>40||/[\p{Cc}\p{Cf}<>]/u.test(name))throw new HttpError(400,'Use a preset name between 1 and 40 characters.');
 let parsed;try{parsed=parsePresetMarkdown(input.markdown);}catch(e){throw new HttpError(400,(e as Error).message);}const draft={id:crypto.randomUUID(),settings:parsed.settings};
 const response=await db(env,'film_presets?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({id:draft.id,name,settings:draft.settings})});
 if(!response.ok){if(response.status===409)throw new HttpError(409,'That preset name is taken. Choose another.');throw new HttpError(503,'Your preset could not be saved. Try again.');}
 let rows=await response.json() as unknown[];if(!rows.length){const existing=await db(env,`film_presets?id=eq.${draft.id}&select=id,name,settings`);if(!existing.ok)throw new Error();rows=await existing.json() as unknown[];}
 if(!rows.length)throw new Error();return json({preset:rows[0]});}catch(e){return failure(e);}
}
