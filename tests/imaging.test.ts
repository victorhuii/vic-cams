import {describe,it,expect} from 'vitest';
import {gradePixels,films,defaults,noise,ratioValue} from '../src/lib/imaging/engine';
import {createCode,validCode,signalingSecrets} from '../src/lib/realtime/duo';
describe('film processing',()=>{
 it('preserves every channel at zero intensity, including highlights and alpha',()=>{const input=new Uint8ClampedArray([250,240,230,255,41,81,121,128]);const data=input.slice();gradePixels(data,2,1,films[0],0,defaults);expect(data).toEqual(input);});
 it('keeps Original unchanged',()=>{const input=new Uint8ClampedArray([254,248,215,255]);const data=input.slice();gradePixels(data,1,1,undefined,100,defaults);expect(data).toEqual(input);});
 it('is deterministic and applies distinct actual pixel grades',()=>{const input=new Uint8ClampedArray([180,100,70,255,230,220,210,255]);const a=input.slice(),b=input.slice(),c=input.slice();gradePixels(a,2,1,films[0],100,defaults);gradePixels(b,2,1,films[0],100,defaults);gradePixels(c,2,1,films[4],100,defaults);expect(a).toEqual(b);expect(a).not.toEqual(input);expect(a).not.toEqual(c);expect(noise(100)).toBe(noise(100));});
 it('produces neutral monochrome and preserves alpha',()=>{const d=new Uint8ClampedArray([150,80,30,127]);gradePixels(d,1,1,films[7],100,defaults);expect(d[0]).toBe(d[1]);expect(d[1]).toBe(d[2]);expect(d[3]).toBe(127);});
 it('resolves crop ratios',()=>{expect(ratioValue('Original',1.7)).toBe(1.7);expect(ratioValue('4:5',1)).toBe(.8);});
});
describe('ephemeral room codes',()=>{it('accepts new random codes and rejects expired, future and malformed codes',()=>{const code=createCode();expect(validCode(code)).toBe(true);expect(validCode(code,Date.now()+3600001)).toBe(false);expect(validCode(code,Date.now()-120000)).toBe(false);expect(validCode('hello')).toBe(false);expect(createCode()).not.toBe(code);});});

it('public room topic cannot decrypt signaling ciphertext',async()=>{const code=createCode();const a=await signalingSecrets(code),b=await signalingSecrets(code);expect(a.topic).toBe(b.topic);const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},a.key,new TextEncoder().encode('private offer'));const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},b.key,encrypted);expect(new TextDecoder().decode(plain)).toBe('private offer');const topicKey=await crypto.subtle.importKey('raw',Uint8Array.from(a.topic.match(/../g)!,h=>parseInt(h,16)),'AES-GCM',false,['decrypt']);await expect(crypto.subtle.decrypt({name:'AES-GCM',iv},topicKey,encrypted)).rejects.toThrow();});
