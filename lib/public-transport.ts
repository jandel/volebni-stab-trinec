import type {PublicSnapshot,PublicationInfo} from './public-types';

// The connector has a bounded request body. Binary parts stay well below it,
// even after base64 encoding and the connector's JSON envelope.
export const PART_BYTES=24*1024,MAX_SNAPSHOT_BYTES=8_000_000;
export type SnapshotManifest={schemaVersion:2;publication:PublicationInfo;encoding:'gzip-parts-v1';bytes:number;sha256:string;revision:{historyId:number;lastBatch:number};parts:{path:string;bytes:number;sha256:string}[]};
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
export const digest=async(bytes:Uint8Array)=>hex(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>));
export const base64=(bytes:Uint8Array)=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
export const unbase64=(text:string)=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export function isManifest(value:unknown):value is SnapshotManifest{
 const m=value as SnapshotManifest|null;
 return Boolean(m&&m.schemaVersion===2&&m.encoding==='gzip-parts-v1'&&typeof m.publication?.id==='string'&&/^[a-f0-9]{64}$/.test(m.publication.contentHash??'')&&Number.isSafeInteger(m.bytes)&&m.bytes>0&&m.bytes<=MAX_SNAPSHOT_BYTES&&/^[a-f0-9]{64}$/.test(m.sha256)&&Number.isSafeInteger(m.revision?.historyId)&&Number.isSafeInteger(m.revision?.lastBatch)&&Array.isArray(m.parts)&&m.parts.length>0&&m.parts.length<=330&&m.parts.every(p=>p&&Number.isSafeInteger(p.bytes)&&p.bytes>0&&p.bytes<=PART_BYTES&&/^[a-f0-9]{64}$/.test(p.sha256)&&p.path===`parts/${p.sha256}.gz.part`));
}
export async function packSnapshot(snapshot:PublicSnapshot,text:string){
 const bytes=new TextEncoder().encode(text);
 if(bytes.length>MAX_SNAPSHOT_BYTES)throw Error('Export překročil povolenou velikost.');
 const compressed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 const files:{path:string;content:string;bytes:number;sha256:string}[]=[];
 for(let start=0;start<compressed.length;start+=PART_BYTES){
  const part=compressed.slice(start,start+PART_BYTES),sha256=await digest(part);
  files.push({path:`parts/${sha256}.gz.part`,content:base64(part),bytes:part.length,sha256});
 }
 const manifest:SnapshotManifest={schemaVersion:2,publication:snapshot.publication,encoding:'gzip-parts-v1',bytes:bytes.length,sha256:await digest(bytes),revision:{historyId:snapshot.history.at(-1)?.id??0,lastBatch:snapshot.state.live.lastBatch},parts:files.map(({path,bytes,sha256})=>({path,bytes,sha256}))};
 return {manifest,files};
}
export async function unpackSnapshot(value:unknown,readPart:(path:string)=>Promise<Uint8Array>):Promise<unknown>{
 if((value as any)?.schemaVersion!==2)return value;
 if(!isManifest(value))throw Error('Neplatný soupis částí zveřejněných výsledků.');
 const chunks:Uint8Array<ArrayBuffer>[]=[];
 for(const part of value.parts){
  const bytes=await readPart(part.path);
  if(bytes.length!==part.bytes||await digest(bytes)!==part.sha256)throw Error('Část zveřejněných výsledků chybí nebo je poškozená.');
  chunks.push(new Uint8Array(bytes));
 }
 const reader=new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const decoded:Uint8Array[]= [];let size=0;
 try{for(;;){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>value.bytes)throw Error('Zveřejněné výsledky překročily uvedenou velikost.');decoded.push(result.value);}}finally{await reader.cancel().catch(()=>{});}
 if(size!==value.bytes)throw Error('Zveřejněné výsledky nejsou úplné.');
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of decoded){bytes.set(chunk,offset);offset+=chunk.length;}
 if(await digest(bytes)!==value.sha256)throw Error('Kontrolní součet zveřejněných výsledků nesouhlasí.');
 const snapshot=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(snapshot.schemaVersion!==1||snapshot.publication?.id!==value.publication.id||snapshot.publication?.contentHash!==value.publication.contentHash||(snapshot.history?.at(-1)?.id??0)!==value.revision.historyId||snapshot.state?.live?.lastBatch!==value.revision.lastBatch)throw Error('Části zveřejněných výsledků nepatří ke stejné verzi.');
 return snapshot;
}
