import type {Edit} from '../imaging/engine';
export type Saved={id:string;kind:'film'|'booth';created:number;title:string;source:string;output?:Blob;edit?:Edit;shots?:string[];paired?:string[];selection?:number[];settings?:Record<string,string|number|boolean>};
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open('vic-cams',1);req.onupgradeneeded=()=>req.result.createObjectStore('creations',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(new Error('The local archive is unavailable. Check browser storage permissions.'));});}
async function transact<T>(mode:IDBTransactionMode,run:(s:IDBObjectStore)=>IDBRequest<T>){const d=await db();return new Promise<T>((resolve,reject)=>{const tx=d.transaction('creations',mode);const req=run(tx.objectStore('creations'));let result:T;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>{d.close();resolve(result);};tx.onerror=()=>{d.close();reject(new Error('Could not save. Your browser storage may be full. Download your photo to keep it safe.'));};});}
export const save=(entry:Saved)=>transact('readwrite',s=>s.put(entry));
export const list=()=>transact('readonly',s=>s.getAll()) as Promise<Saved[]>;
export const remove=(id:string)=>transact('readwrite',s=>s.delete(id));
