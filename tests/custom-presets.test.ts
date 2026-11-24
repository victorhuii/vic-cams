import {afterEach,describe,expect,it,vi} from 'vitest';
import {gradeCustomPixels} from '../src/lib/imaging/customGrade';
import {neutralSettings,parseRegions,parseSettings} from '../src/lib/imaging/customSettings';
import {db,readDraft,signDraft,type Env} from '../functions/_lib/presets';
import {onRequestPost as replicate} from '../functions/api/replicate-preset';
import {onRequestPost as publish} from '../functions/api/film-presets';
const env:Env={OPENAI_API_KEY:'test-only-fake-key',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-fake-service-key',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-site'};
const request=(path:string,value:unknown)=>new Request(`https://studio.example${path}`,{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:JSON.stringify(value)});
const input={original:'data:image/jpeg;base64,AA==',goal:'data:image/jpeg;base64,AA==',token:'verified-token',excludedRegions:[{x:.7,y:.8,width:.2,height:.1}]};
afterEach(()=>vi.unstubAllGlobals());
describe('numeric custom grades',()=>{
 it('preserves source pixels at zero intensity and neutral settings, including alpha',()=>{const original=new Uint8ClampedArray([255,230,10,128,20,70,120,255]);const zero=original.slice(),neutral=original.slice();gradeCustomPixels(zero,2,1,{...neutralSettings,exposure:2,grain:60},0);gradeCustomPixels(neutral,2,1,neutralSettings,100);expect(zero).toEqual(original);expect(neutral).toEqual(original);});
 it('applies a deterministic, portable grade without changing alpha',()=>{const source=new Uint8ClampedArray([120,100,80,128,220,200,180,255]),a=source.slice(),b=source.slice();const settings={...neutralSettings,exposure:.4,warmth:12,grain:8};gradeCustomPixels(a,2,1,settings,100);gradeCustomPixels(b,2,1,settings,100);expect(a).toEqual(b);expect(a).not.toEqual(source);expect(a[3]).toBe(128);expect(a[7]).toBe(255);});
 it('rejects missing/nonfinite/out-of-range settings and invalid exclusions',()=>{expect(()=>parseSettings({...neutralSettings,exposure:NaN})).toThrow();expect(()=>parseSettings({...neutralSettings,exposure:3})).toThrow();expect(()=>parseSettings({exposure:0})).toThrow();expect(()=>parseRegions([{x:.9,y:.1,width:.5,height:.2}])).toThrow();});
});
it('signed drafts reject changes and expired tickets',async()=>{const ticket=await signDraft(env,neutralSettings);expect((await readDraft(env,ticket)).settings).toEqual(neutralSettings);const [payload,sig]=ticket.split('.');const changed=JSON.parse(atob(payload));changed.settings.warmth=40;await expect(readDraft(env,`${btoa(JSON.stringify(changed))}.${sig}`)).rejects.toThrow('Invalid preset draft');vi.spyOn(Date,'now').mockReturnValue(Date.now()+3600001);await expect(readDraft(env,ticket)).rejects.toThrow('expired');vi.restoreAllMocks();});
it('analyzes two images with watermark exclusions and only returns settings, never image generation',async()=>{
 let sent:Record<string,any>|undefined;
 vi.stubGlobal('fetch',vi.fn(async(url:string,init:RequestInit)=>{if(url.includes('siteverify'))return Response.json({success:true,hostname:'studio.example',action:'replicate-preset'});if(url.includes('reserve_film_replication'))return Response.json(true);if(url.includes('api.openai.com')){sent=JSON.parse(init.body as string);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({usable:true,note:'Watermark ignored; approximate color match.',settings:{...neutralSettings,warmth:14}})}]}]});}throw new Error('Unexpected endpoint');}));
 const response=await replicate({request:request('/api/replicate-preset',input),env});expect(response.status).toBe(200);const result=await response.json() as any;expect(result.settings.warmth).toBe(14);expect((await readDraft(env,result.ticket)).settings).toEqual(result.settings);expect(sent?.store).toBe(false);expect(sent?.tools).toBeUndefined();expect(sent?.instructions).toContain('Do not interpret white lettering as lifted whites');expect(sent?.input[0].content[0].text).toContain('"x":0.7');expect(sent?.input[0].content.filter((c:any)=>c.type==='input_image')).toHaveLength(2);
});
it('blocks paid calls when verification fails or the daily quota is full',async()=>{
 const fetcher=vi.fn(async(url:string)=>{if(url.includes('siteverify'))return Response.json({success:true,hostname:'studio.example',action:'replicate-preset'});if(url.includes('reserve_film_replication'))return Response.json(false);throw new Error('Paid call should not run');});vi.stubGlobal('fetch',fetcher);expect((await replicate({request:request('/api/replicate-preset',input),env})).status).toBe(429);expect(fetcher).toHaveBeenCalledTimes(2);
 fetcher.mockImplementation(async()=>Response.json({success:true,hostname:'attacker.example',action:'replicate-preset'}));expect((await replicate({request:request('/api/replicate-preset',input),env})).status).toBe(403);
});
it('publishes only validated signed settings and never uploads reference images',async()=>{const ticket=await signDraft(env,neutralSettings);const fetcher=vi.fn(async(_url:string,init:RequestInit)=>{const row=JSON.parse(init.body as string);expect(Object.keys(row).sort()).toEqual(['id','name','settings']);expect(row.name).toBe('Sunday film');return Response.json([row]);});vi.stubGlobal('fetch',fetcher);const response=await publish({request:request('/api/film-presets',{ticket,name:' Sunday film '}),env});expect(response.status).toBe(200);expect(fetcher).toHaveBeenCalledTimes(1);expect((await publish({request:request('/api/film-presets',{ticket:'forged',name:'Bad'}),env})).status).toBe(400);expect(fetcher).toHaveBeenCalledTimes(1);});
it('rejects cross-origin calls before database writes',async()=>{const req=new Request('https://studio.example/api/film-presets',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'});expect((await publish({request:req,env})).status).toBe(403);});

it('uses modern secret keys only as apikey and keeps legacy JWT compatibility',async()=>{
 const fetcher=vi.fn(async()=>Response.json([]));vi.stubGlobal('fetch',fetcher);
 await db({...env,SUPABASE_SECRET_KEY:'sb_secret_test-only'},'film_presets');
 let headers=(fetcher.mock.calls as unknown as [string,RequestInit][])[0][1].headers as Headers;expect(headers.get('apikey')).toBe('sb_secret_test-only');expect(headers.has('Authorization')).toBe(false);
 await db(env,'film_presets');headers=(fetcher.mock.calls as unknown as [string,RequestInit][])[1][1].headers as Headers;expect(headers.get('Authorization')).toBe(`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
 const modern={...env,SUPABASE_SECRET_KEY:'sb_secret_test-only'};expect((await readDraft(modern,await signDraft(modern,neutralSettings))).settings).toEqual(neutralSettings);
});
