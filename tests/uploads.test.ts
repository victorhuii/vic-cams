import {expect,it} from 'vitest';
import {heicCandidate,normalizePhoto,photoAccept} from '../src/lib/imaging/uploads';
it('recognizes HEIC names and HEIF MIME types and includes them in the picker',()=>{expect(heicCandidate(new File([],'PHONE.HEIC'))).toBe(true);expect(heicCandidate(new File([],'photo',{type:'image/heif'}))).toBe(true);expect(photoAccept).toContain('.heic');});
it('preserves ordinary images and names while handling missing MIME types',async()=>{const file=new File(['photo'],'a.jpg',{type:'image/jpeg'});expect(await normalizePhoto(file)).toBe(file);const inferred=await normalizePhoto(new File(['photo'],'PHOTO.PNG'));expect(inferred.type).toBe('image/png');expect(inferred.name).toBe('PHOTO.PNG');await expect(normalizePhoto(new File(['not a picture'],'file.txt',{type:'text/plain'}))).rejects.toThrow('Choose JPEG');});

it("accepts JPEG bytes already converted by a browser even when the name still ends in HEIC",async()=>{const converted=await normalizePhoto(new File([new Uint8Array([255,216,255,224])],"PHONE.HEIC",{type:"image/jpeg"}));expect(converted.name).toBe("PHONE.jpg");expect(converted.type).toBe("image/jpeg");});
