import {test,expect} from '@playwright/test';
import {loadEnv} from 'vite';

// Opt-in: creates permanent, clearly labeled draft images in the configured project.
test('live draft photos autosave to Supabase files and database',async({page})=>{
 test.skip(process.env.VIC_TEST_LIVE_STORAGE!=='1','Requires explicit permission to upload real draft files.');
 test.setTimeout(180000);
 const env=loadEnv('development',process.cwd(),'VITE_');
 const run=`DRAFT storage test ${new Date().toISOString()}`;
 await page.goto('/');
 expect(await page.evaluate(async()=>{const path='/src/lib/storage/cloud.ts';return (await import(path)).cloudEnabled;}),'Start Vite with VITE_CLOUD_ARCHIVE_ENABLED=true').toBe(true);
 const png=Buffer.from(await page.evaluate(label=>{const canvas=document.createElement('canvas');canvas.width=400;canvas.height=500;const c=canvas.getContext('2d')!;c.fillStyle='#fff6e8';c.fillRect(0,0,400,500);c.fillStyle='#39432f';c.font='22px sans-serif';c.fillText('DRAFT — SAVE TEST',30,200);c.font='12px sans-serif';c.fillText(label,30,235);return canvas.toDataURL('image/png').split(',')[1];},run),'base64');
 await page.locator('.film-card').click();
 await page.locator('input[type=file]').setInputFiles({name:`${run.replaceAll(':','-')}.png`,mimeType:'image/png',buffer:png});
 async function waitForSaved(count:number){await expect.poll(async()=>page.evaluate(async expected=>{const path='/src/lib/storage/archive.ts';const entries=await (await import(path)).list();const failed=entries.find((e:{cloudStatus?:string})=>e.cloudStatus==='failed');if(failed)throw new Error(`Actual Supabase save failed: ${failed.cloudError}`);return entries.length===expected&&entries.every((e:{cloudStatus?:string})=>e.cloudStatus==='saved');},count),{timeout:90000}).toBe(true);}
 await waitForSaved(2);
 await page.getByRole('navigation').getByRole('button',{name:'Photobooth',exact:true}).click();
 await page.locator('input[type=file][multiple]').setInputFiles(Array.from({length:4},(_,i)=>({name:`DRAFT-pose-${i+1}.png`,mimeType:'image/png',buffer:png})));
 await expect(page.locator('.review-shot')).toHaveCount(4);
 await waitForSaved(7);
 const report=await page.evaluate(async({url,key})=>{
  const path='/src/lib/storage/archive.ts';const entries=await (await import(path)).list();
  const session=JSON.parse(sessionStorage.getItem('vic-cams-gallery-auth')!);
  const headers={apikey:key,Authorization:`Bearer ${session.access_token}`};
  const response=await fetch(`${url}/rest/v1/photo_creations?session_id=eq.${entries[0].sessionId}&select=id,kind,source_path,output_path,metadata`,{headers});
  if(!response.ok)throw new Error(`Database verification failed (${response.status}): ${await response.text()}`);
  const rows=await response.json();let files=0;
  for(const entry of entries){const row=rows.find((r:{id:string})=>r.id===entry.id);if(!row)throw new Error(`Missing database row ${entry.id}`);
   const images=[{path:row.source_path,blob:await fetch(entry.source).then(r=>r.blob())},...(entry.output?[{path:row.output_path,blob:entry.output}]:[])];
   for(let i=0;i<(entry.shots?.length??0);i++)images.push({path:row.metadata.shots[i],blob:await fetch(entry.shots[i]).then(r=>r.blob())});
   for(const image of images){const download=await fetch(`${url}/storage/v1/object/authenticated/session-photos/${image.path}`,{headers});if(!download.ok)throw new Error(`Stored image unreadable (${download.status})`);const actual=await download.arrayBuffer(),expected=await image.blob.arrayBuffer();const digest=async(b:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).join(',');if(await digest(actual)!==await digest(expected))throw new Error('Stored image differs from original');files++;}
  }
  return {sessionId:entries[0].sessionId,folder:rows[0].source_path.split('/').slice(0,2).join('/'),databaseRows:rows.length,verifiedFiles:files};
 },{url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_PUBLISHABLE_KEY});
 expect(report.databaseRows).toBe(7);expect(report.verifiedFiles).toBeGreaterThanOrEqual(9);
 console.log('Verified live draft saves:',JSON.stringify(report));
 await test.info().attach('supabase-draft-verification',{body:JSON.stringify({run,...report},null,2),contentType:'application/json'});
});
