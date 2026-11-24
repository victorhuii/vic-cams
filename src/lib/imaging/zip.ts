// ZIP store entries: photo formats are already compressed. No third-party upload service.
export async function photoZip(files:{name:string;blob:Blob}[]):Promise<Blob>{
 const chunks:BlobPart[]=[],central:BlobPart[]=[];let offset=0,centralSize=0;
 const encoder=new TextEncoder();
 function record(length:number){const bytes=new Uint8Array(length);return {bytes,view:new DataView(bytes.buffer)};}
 const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 for(const file of files){const name=encoder.encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer());let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
 if(offset+data.length>0xffffffff||name.length>65535)throw new Error('This batch is too large for one ZIP. Select fewer photos.');
 const {bytes,view}=record(30);view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,0x21,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);chunks.push(bytes,name,data);
 const header=record(46);header.view.setUint32(0,0x02014b50,true);header.view.setUint16(4,20,true);header.view.setUint16(6,20,true);header.view.setUint16(8,0x800,true);header.view.setUint16(14,0x21,true);header.view.setUint32(16,crc,true);header.view.setUint32(20,data.length,true);header.view.setUint32(24,data.length,true);header.view.setUint16(28,name.length,true);header.view.setUint32(42,offset,true);central.push(header.bytes,name);centralSize+=46+name.length;offset+=30+name.length+data.length;
 }
 const end=record(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,centralSize,true);end.view.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end.bytes],{type:'application/zip'});
}
