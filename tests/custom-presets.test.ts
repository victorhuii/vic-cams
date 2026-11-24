import {parsePresetMarkdown,chatGPTPresetPrompt} from '../src/lib/imaging/presetMarkdown';
import {createOwnerCookie} from '../functions/_lib/presetAccess';
import {onRequestPost as unlock} from '../functions/api/preset-access';
import {onRequestGet as sharedPresets} from '../functions/api/film-presets';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {gradeCustomPixels} from '../src/lib/imaging/customGrade';
import {neutralSettings,parseRegions,parseSettings} from '../src/lib/imaging/customSettings';
import {db,readDraft,signDraft,type Env} from '../functions/_lib/presets';
import {onRequestPost as replicate} from '../functions/api/replicate-preset';
import {onRequestPost as publish} from '../functions/api/film-presets';
const env:Env={CUSTOM_PRESET_PASSWORD:'test-owner-password',OPENAI_API_KEY:'test-only-fake-key',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-fake-service-key',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-site'};
const request=(path:string,value:unknown)=>new Request(`https://studio.example${path}`,{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:JSON.stringify(value)});
async function ownerRequest(path:string,value:unknown){const req=request(path,value);req.headers.set('Cookie',(await createOwnerCookie(env)).split(';')[0]);return req;}
const input={original:'data:image/jpeg;base64,AA==',goal:'data:image/jpeg;base64,AA==',token:'verified-token',excludedRegions:[{x:.7,y:.8,width:.2,height:.1}]};
afterEach(()=>vi.unstubAllGlobals());
describe('numeric custom grades',()=>{
 it('preserves source pixels at zero intensity and neutral settings, including alpha',()=>{const original=new Uint8ClampedArray([255,230,10,128,20,70,120,255]);const zero=original.slice(),neutral=original.slice();gradeCustomPixels(zero,2,1,{...neutralSettings,exposure:2,grain:60},0);gradeCustomPixels(neutral,2,1,neutralSettings,100);expect(zero).toEqual(original);expect(neutral).toEqual(original);});
 it('applies a deterministic, portable grade without changing alpha',()=>{const source=new Uint8ClampedArray([120,100,80,128,220,200,180,255]),a=source.slice(),b=source.slice();const settings={...neutralSettings,exposure:.4,warmth:12,grain:8};gradeCustomPixels(a,2,1,settings,100);gradeCustomPixels(b,2,1,settings,100);expect(a).toEqual(b);expect(a).not.toEqual(source);expect(a[3]).toBe(128);expect(a[7]).toBe(255);});
 it('rejects missing/nonfinite/out-of-range settings and invalid exclusions',()=>{expect(()=>parseSettings({...neutralSettings,exposure:NaN})).toThrow();expect(()=>parseSettings({...neutralSettings,exposure:3})).toThrow();expect(()=>parseSettings({exposure:0})).toThrow();expect(()=>parseRegions([{x:.9,y:.1,width:.5,height:.2}])).toThrow();});
});
it('signed drafts reject changes and expired tickets',async()=>{const ticket=await signDraft(env,neutralSettings);expect((await readDraft(env,ticket)).settings).toEqual(neutralSettings);const [payload,sig]=ticket.split('.');const changed=JSON.parse(atob(payload));changed.settings.warmth=40;await expect(readDraft(env,`${btoa(JSON.stringify(changed))}.${sig}`)).rejects.toThrow('Invalid preset draft');vi.spyOn(Date,'now').mockReturnValue(Date.now()+3600001);await expect(readDraft(env,ticket)).rejects.toThrow('expired');vi.restoreAllMocks();});
it('imports validated Markdown settings after owner login',async()=>{const markdown='# Film\n```json\n'+JSON.stringify({format:'victor-film-preset-v1',settings:neutralSettings})+'\n```';const fetcher=vi.fn(async(_url:string,init:RequestInit)=>Response.json([JSON.parse(init.body as string)]));vi.stubGlobal('fetch',fetcher);expect((await publish({request:await ownerRequest('/api/film-presets',{name:'My film',markdown}),env})).status).toBe(200);expect((await publish({request:await ownerRequest('/api/film-presets',{name:'Bad',markdown:'bad file'}),env})).status).toBe(400);expect(fetcher).toHaveBeenCalledTimes(1);});
it('rejects cross-origin calls before database writes',async()=>{const req=new Request('https://studio.example/api/film-presets',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'});req.headers.set('Cookie',(await createOwnerCookie(env)).split(';')[0]);expect((await publish({request:req,env})).status).toBe(403);});

it('uses modern secret keys only as apikey and keeps legacy JWT compatibility',async()=>{
 const fetcher=vi.fn(async()=>Response.json([]));vi.stubGlobal('fetch',fetcher);
 await db({...env,SUPABASE_SECRET_KEY:'sb_secret_test-only'},'film_presets');
 let headers=(fetcher.mock.calls as unknown as [string,RequestInit][])[0][1].headers as Headers;expect(headers.get('apikey')).toBe('sb_secret_test-only');expect(headers.has('Authorization')).toBe(false);
 await db(env,'film_presets');headers=(fetcher.mock.calls as unknown as [string,RequestInit][])[1][1].headers as Headers;expect(headers.get('Authorization')).toBe(`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
 const modern={...env,SUPABASE_SECRET_KEY:'sb_secret_test-only'};expect((await readDraft(modern,await signDraft(modern,neutralSettings))).settings).toEqual(neutralSettings);
});

it('blocks direct replicate and publish calls without owner access before any upstream calls',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await replicate({request:request('/api/replicate-preset',input),env})).status).toBe(401);
 expect((await publish({request:request('/api/film-presets',{name:'Unwanted',ticket:await signDraft(env,neutralSettings)}),env})).status).toBe(401);
 const forged=request('/api/film-presets',{});forged.headers.set('Cookie','victor_preset_owner=forged');expect((await publish({request:forged,env})).status).toBe(401);
 expect(fetcher).not.toHaveBeenCalled();
});
it('checks passwords on the server and issues a secure HttpOnly cookie only after success',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json(true)));
 const bad=await unlock({request:request('/api/preset-access',{password:'wrong'}),env});expect(bad.status).toBe(401);expect(bad.headers.has('Set-Cookie')).toBe(false);
 const good=await unlock({request:request('/api/preset-access',{password:env.CUSTOM_PRESET_PASSWORD}),env});expect(good.status).toBe(200);const cookie=good.headers.get('Set-Cookie')!;expect(cookie).toContain('HttpOnly; Secure; SameSite=Strict');expect(cookie).not.toContain(env.CUSTOM_PRESET_PASSWORD!);expect(await good.text()).not.toContain(env.CUSTOM_PRESET_PASSWORD!);
});
it('enforces the persistent login attempt limit and fails closed if no password is configured',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json(false)));
 expect((await unlock({request:request('/api/preset-access',{password:env.CUSTOM_PRESET_PASSWORD}),env})).status).toBe(429);
 expect((await unlock({request:request('/api/preset-access',{password:'anything'}),env:{...env,CUSTOM_PRESET_PASSWORD:undefined}})).status).toBe(503);
});
it('rejects expired owner cookies and invalidates cookies when the password changes',async()=>{
 const req=await ownerRequest('/api/film-presets',{});
 expect((await publish({request:req.clone(),env:{...env,CUSTOM_PRESET_PASSWORD:'changed'}})).status).toBe(401);
 const now=Date.now();vi.spyOn(Date,'now').mockReturnValue(now+3600001);try{expect((await publish({request:req,env})).status).toBe(401);}finally{vi.restoreAllMocks();}
});
it('keeps existing presets public without owner login and never exposes the password',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json([{id:'public-preset',name:'Shared film',settings:neutralSettings}])));
 const result=await sharedPresets({request:new Request('https://studio.example/api/film-presets'),env});expect(result.status).toBe(200);const data=await result.text();expect(data).toContain('Shared film');expect(data).not.toContain(env.CUSTOM_PRESET_PASSWORD!);
});

it('imports the prompt format and rejects malformed settings',()=>{expect(parsePresetMarkdown(chatGPTPresetPrompt).settings).toEqual(neutralSettings);expect(()=>parsePresetMarkdown('```json\n{"format":"wrong"}\n```')).toThrow('Unsupported');});
it('renders a trilinear LUT and blends intensity while preserving alpha',()=>{const values=[];for(let b=0;b<2;b++)for(let g=0;g<2;g++)for(let r=0;r<2;r++)values.push(255-r*255,g*255,b*255);const settings=parseSettings({...neutralSettings,lut:{size:2,data:btoa(String.fromCharCode(...values))}});const pixels=new Uint8ClampedArray([40,80,120,128]);gradeCustomPixels(pixels,1,1,settings,100);expect(Array.from(pixels)).toEqual([215,80,120,128]);expect(()=>parseSettings({...neutralSettings,lut:{size:2,data:'AA=='}})).toThrow();});
