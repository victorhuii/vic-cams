import {parseSettings,type CustomSettings} from '../../src/lib/imaging/customSettings';
export type Env={OPENAI_API_KEY?:string;OPENAI_PRESET_MODEL?:string;SUPABASE_URL?:string;SUPABASE_SERVICE_ROLE_KEY?:string;TURNSTILE_SITE_KEY?:string;TURNSTILE_SECRET_KEY?:string;PRESET_DAILY_LIMIT?:string};
export type Context={request:Request;env:Env};
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(e:unknown){return json({error:e instanceof HttpError?e.message:'The preset service is unavailable. Please try again.'},e instanceof HttpError?e.status:502);}
export function databaseReady(env:Env){return !!env.SUPABASE_URL&&!!env.SUPABASE_SERVICE_ROLE_KEY;}
export function replicationReady(env:Env){return databaseReady(env)&&!!env.OPENAI_API_KEY&&!!env.TURNSTILE_SECRET_KEY&&!!env.TURNSTILE_SITE_KEY;}
export async function body(request:Request,max:number){
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'Please use the preset editor on this site.');
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Expected a JSON request.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Missing request.');let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'Those images are too large. Choose smaller photos.');}chunks.push(value);}}finally{reader.releaseLock();}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(all));}catch{throw new HttpError(400,'Invalid request.');}
}
export async function db(env:Env,path:string,init:RequestInit={}){
 if(!databaseReady(env))throw new HttpError(503,'Shared presets need server setup.');
 const url=new URL(env.SUPABASE_URL!);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw new HttpError(503,'Preset database is not configured correctly.');
 return fetch(`${url.origin}/rest/v1/${path}`,{...init,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(15000)});
}
export async function verifyHuman(request:Request,env:Env,token:unknown){
 if(typeof token!=='string'||token.length<1||token.length>2048)throw new HttpError(400,'Complete the verification and try again.');
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')??undefined}),signal:AbortSignal.timeout(10000)});
 const result=await response.json() as {success:boolean;hostname:string;action:string};
 if(!response.ok||!result.success||result.hostname!==new URL(request.url).hostname||result.action!=='replicate-preset')throw new HttpError(403,'Verification expired. Please verify again.');
}
export type Draft={id:string;expires:number;settings:CustomSettings};
async function signingKey(env:Env){return crypto.subtle.importKey('raw',new TextEncoder().encode(`victor-film-preset-v1:${env.SUPABASE_SERVICE_ROLE_KEY}`),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),n=>n.toString(16).padStart(2,'0')).join('');
export async function signDraft(env:Env,settings:CustomSettings){const draft:Draft={id:crypto.randomUUID(),expires:Date.now()+3600000,settings};const payload=btoa(JSON.stringify(draft));const signature=hex(await crypto.subtle.sign('HMAC',await signingKey(env),new TextEncoder().encode(payload)));return `${payload}.${signature}`;}
export async function readDraft(env:Env,ticket:unknown){
 if(typeof ticket!=='string'||ticket.length>6000)throw new HttpError(400,'Invalid preset draft.');
 const [payload,signature,...rest]=ticket.split('.');if(rest.length||!payload||!/^[0-9a-f]{64}$/.test(signature??''))throw new HttpError(400,'Invalid preset draft.');
 const sig=Uint8Array.from(signature.match(/../g)!,h=>parseInt(h,16));if(!await crypto.subtle.verify('HMAC',await signingKey(env),sig,new TextEncoder().encode(payload)))throw new HttpError(403,'Invalid preset draft.');
 try{const d=JSON.parse(atob(payload)) as Draft;if(!/^[0-9a-f-]{36}$/.test(d.id)||!Number.isFinite(d.expires)||d.expires<Date.now())throw new Error();return {...d,settings:parseSettings(d.settings)};}catch{throw new HttpError(400,'This draft expired. Replicate the photos again.');}
}
