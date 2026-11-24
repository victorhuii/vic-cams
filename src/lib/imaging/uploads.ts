export const photoAccept='image/jpeg,image/png,image/webp,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.jpg,.jpeg,.png,.webp,.heic,.heif';
export const heicCandidate=(file:File)=>/\.hei[cf]$/i.test(file.name)||/^image\/hei[cf](?:-sequence)?$/i.test(file.type);
export function isPhotoFile(file:File){return ['image/jpeg','image/png','image/webp'].includes(file.type)||heicCandidate(file)||(!file.type||file.type==='application/octet-stream')&&/\.(jpe?g|png|webp)$/i.test(file.name);}
let queue:Promise<unknown>=Promise.resolve();
export async function normalizePhoto(file:File):Promise<File>{
 if(file.size>20*1024*1024)throw new Error('Choose photos under 20 MB.');
 let heic=heicCandidate(file);
 if(!heic&&!isPhotoFile(file)){
  const bytes=new Uint8Array(await file.slice(0,128).arrayBuffer());const brands=new TextDecoder('latin1').decode(bytes);
  heic=brands.slice(4,8)==='ftyp'&&!/avif|avis/.test(brands)&&/heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(brands.slice(8));
 }
 if(heic){const header=new Uint8Array(await file.slice(0,3).arrayBuffer());if(header[0]===255&&header[1]===216&&header[2]===255)return new File([file],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:file.lastModified});}
 if(heic){
  const convert=async()=>{try{const {heicTo}=await import('heic-to/csp');const blob=await heicTo({blob:file,type:'image/jpeg',quality:.95});if(!blob.size||blob.type!=='image/jpeg')throw new Error();if(blob.size>20*1024*1024)throw new Error('The converted JPG exceeds 20 MB. Export a smaller photo and try again.');return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:file.lastModified});}catch(e){if((e as Error).message.includes('exceeds 20 MB'))throw e;throw new Error(`Could not convert ${file.name} to JPG. Try exporting it as JPEG from Photos.`);}};
  const result=queue.then(convert);queue=result.catch(()=>{});return result;
 }
 if(!isPhotoFile(file))throw new Error('Choose JPEG, PNG, WebP or HEIC photos.');
 if(!file.type||file.type==='application/octet-stream'){const type=/\.png$/i.test(file.name)?'image/png':/\.webp$/i.test(file.name)?'image/webp':'image/jpeg';return new File([file],file.name,{type,lastModified:file.lastModified});}
 return file;
}
