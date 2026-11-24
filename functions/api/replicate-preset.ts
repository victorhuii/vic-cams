import {json,failure,type Context} from '../_lib/presets';
import {requirePresetOwner} from '../_lib/presetAccess';
export async function onRequestPost({request,env}:Context){try{await requirePresetOwner(request,env);return json({error:'Use Custom to import a Markdown preset created in ChatGPT.'},410);}catch(e){return failure(e);}}
