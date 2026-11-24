import {db,HttpError,type Env} from './presets';
const cookieName='victor_preset_owner';
const encode=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),n=>n.toString(16).padStart(2,'0')).join('');
const digest=(value:string)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
async function accessKey(env:Env){
 const serverSecret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 if(!env.CUSTOM_PRESET_PASSWORD||!serverSecret)throw new HttpError(503,'Custom preset access needs server setup.');
 return crypto.subtle.importKey('raw',new TextEncoder().encode(`victor-owner-v1:${serverSecret}:${env.CUSTOM_PRESET_PASSWORD}`),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function createOwnerCookie(env:Env){
 const payload=btoa(JSON.stringify({purpose:'preset-owner',expires:Date.now()+3600000}));
 const signature=encode(await crypto.subtle.sign('HMAC',await accessKey(env),new TextEncoder().encode(payload)));
 return `${cookieName}=${payload}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=3600`;
}
export async function requirePresetOwner(request:Request,env:Env){
 const value=request.headers.get('Cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
 if(!value||value.length>1000)throw new HttpError(401,'Enter the Custom password to continue.');
 const [payload,signature,...extra]=value.split('.');if(extra.length||!payload||!/^[a-f0-9]{64}$/.test(signature??''))throw new HttpError(401,'Unlock Custom again to continue.');
 const bytes=Uint8Array.from(signature.match(/../g)!,h=>parseInt(h,16));
 if(!await crypto.subtle.verify('HMAC',await accessKey(env),bytes,new TextEncoder().encode(payload)))throw new HttpError(401,'Unlock Custom again to continue.');
 try{const data=JSON.parse(atob(payload));if(data.purpose!=='preset-owner'||typeof data.expires!=='number'||data.expires<=Date.now())throw new Error();}catch{throw new HttpError(401,'Unlock Custom again to continue.');}
}
export async function checkOwnerPassword(request:Request,env:Env,password:unknown){
 if(!env.CUSTOM_PRESET_PASSWORD)throw new HttpError(503,'Custom preset access needs server setup.');
 if(typeof password!=='string'||password.length<1||password.length>256)throw new HttpError(401,'Incorrect password.');
 // Persist the limit across worker instances without storing the visitor's IP.
 const bucket=encode(await digest(`victor-login:${env.CUSTOM_PRESET_PASSWORD}:${request.headers.get('CF-Connecting-IP')||'local'}`));
 const limit=await db(env,'rpc/reserve_film_preset_login',{method:'POST',body:JSON.stringify({login_bucket:bucket})});
 if(!limit.ok)throw new HttpError(503,'Custom preset access needs database setup.');
 if(await limit.json()!==true)throw new HttpError(429,'Too many password attempts. Try again in 15 minutes.');
 const provided=new Uint8Array(await digest(password)),expected=new Uint8Array(await digest(env.CUSTOM_PRESET_PASSWORD));let difference=0;for(let i=0;i<provided.length;i++)difference|=provided[i]^expected[i];
 if(difference!==0)throw new HttpError(401,'Incorrect password.');
}
