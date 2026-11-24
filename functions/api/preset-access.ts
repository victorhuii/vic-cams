import {body,failure,json,type Context} from '../_lib/presets';
import {checkOwnerPassword,createOwnerCookie} from '../_lib/presetAccess';
export async function onRequestPost({request,env}:Context){
 try{const input=await body(request,2048);await checkOwnerPassword(request,env,input.password);const response=json({unlocked:true});response.headers.set('Set-Cookie',await createOwnerCookie(env));return response;}catch(e){return failure(e);}
}
