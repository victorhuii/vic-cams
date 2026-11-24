import {useEffect,useRef} from 'react';
type Widget={render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
declare global {interface Window {turnstile?:Widget}}
let loading:Promise<void>|undefined;
function load(){return loading??=new Promise<void>((resolve,reject)=>{if(window.turnstile){resolve();return;}const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>resolve();script.onerror=()=>{loading=undefined;script.remove();reject(new Error('Verification could not load. Check your connection.'));};document.head.append(script);});}
export function Turnstile({siteKey,onToken,onError}:{siteKey:string;onToken:(token:string)=>void;onError:(message:string)=>void}){
 const host=useRef<HTMLDivElement>(null),callbacks=useRef({onToken,onError});callbacks.current={onToken,onError};
 useEffect(()=>{let active=true,id:string|undefined;void load().then(()=>{if(active&&host.current&&window.turnstile)id=window.turnstile.render(host.current,{sitekey:siteKey,action:'replicate-preset',theme:'light',size:'flexible',callback:(token:string)=>callbacks.current.onToken(token),'expired-callback':()=>callbacks.current.onToken(''),'error-callback':()=>{callbacks.current.onToken('');callbacks.current.onError('Verification failed. Try again.');}});}).catch(e=>{if(active)callbacks.current.onError(e.message);});return()=>{active=false;if(id)window.turnstile?.remove(id);};},[siteKey]);
 return <div ref={host} className="preset-verification"/>;
}
