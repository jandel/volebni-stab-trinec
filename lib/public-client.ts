import type {ClientData,PublicSnapshot,PublicCoverage} from './public-types';
import type {HistoryPage} from './history-types';
import {assetPath} from './runtime';
import {isManifest,unpackSnapshot} from './public-transport';
let snapshot:PublicSnapshot|null=null,pending:Promise<PublicSnapshot>|null=null;
let verifiedManifest:string|null=null;
export function validPublicCoverage(value:unknown,sourceIds:Set<number>):value is PublicCoverage{
 const object=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const string=(x:unknown,max:number)=>typeof x==='string'&&x.length>0&&x.length<=max;
 const date=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
 const source=(x:Record<string,any>)=>string(x.id,200)&&Number.isSafeInteger(x.sourceId)&&sourceIds.has(x.sourceId);
 const bilingual=(x:unknown,check:(t:Record<string,any>)=>boolean)=>object(x)&&['cs','local'].every(k=>object(x[k])&&check(x[k]));
 if(!object(value)||!['waiting','active','paused','ended'].includes(value.status)||!Array.isArray(value.events)||value.events.length>120||!Array.isArray(value.summaries)||value.summaries.length>40)return false;
 return value.events.every(e=>object(e)&&source(e)&&date(e.observedAt)&&['results','lead','seats','correction','candidates','final','warning'].includes(e.kind)&&bilingual(e.text,t=>string(t.title,500)&&string(t.body,12000)))&&value.summaries.every(s=>object(s)&&source(s)&&!('demo' in s)&&!('factIds' in s)&&date(s.createdAt)&&date(s.asOf)&&date(s.periodFrom)&&bilingual(s.text,t=>string(t.title,180)&&Array.isArray(t.paragraphs)&&t.paragraphs.length>=3&&t.paragraphs.length<=6&&t.paragraphs.every((p:unknown)=>string(p,1800))&&Array.isArray(t.watch)&&t.watch.length>=1&&t.watch.length<=3&&t.watch.every((p:unknown)=>string(p,600))));
}
export function validPublicSnapshot(value:unknown):value is PublicSnapshot{
 const s=value as PublicSnapshot|null;
 return Boolean(s&&s.schemaVersion===1&&typeof s.publication?.id==='string'&&(s.publication.publishedAt===null||Number.isFinite(Date.parse(s.publication.publishedAt)))&&s.state?.live?.precincts&&typeof s.state.live.lastBatch==='number'&&s.state.candidates?.precincts&&s.state.integrity&&s.state.archive&&Array.isArray(s.history)&&s.history.every(h=>Number.isSafeInteger(h.id)&&h.city&&h.integrity&&Array.isArray(h.possible)&&(h.elected===null||Array.isArray(h.elected)))&&(s.coverage===undefined||validPublicCoverage(s.coverage,new Set(s.history.map(h=>h.id)))));
}
async function readSnapshot(force=false):Promise<PublicSnapshot>{
 if(pending)return pending;if(snapshot&&!force)return snapshot;
 pending=(async()=>{
  // Revalidate the stable URL so manual refresh can see corrections and use HTTP validators.
  const response=await fetch(assetPath('/data/published.json'),{cache:'no-cache',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Zveřejněné výsledky se nepodařilo načíst.');
  const transport:unknown=await response.json();
  const manifest=isManifest(transport)?JSON.stringify(transport):null;
  // Only reuse a manifest whose complete payload has already passed validation.
  if(snapshot&&manifest!==null&&manifest===verifiedManifest)return snapshot;
  const value=await unpackSnapshot(transport,async path=>{const part=await fetch(assetPath('/data/'+path),{signal:AbortSignal.timeout(30000)});if(!part.ok)throw Error('Část zveřejněných výsledků zatím není dostupná.');return new Uint8Array(await part.arrayBuffer());});
  if(!validPublicSnapshot(value))throw Error('Zveřejněná data mají neplatný formát.');
  snapshot=value;verifiedManifest=manifest;return value;
 })();
 try{return await pending;}finally{pending=null;}
}
export async function getPublicResults(update=true):Promise<ClientData>{const s=await readSnapshot(update);return {...s.state,publication:s.publication,coverage:s.coverage};}
export async function getPublicHistory(before?:number):Promise<HistoryPage>{const s=await readSnapshot(),all=s.history.filter(h=>before===undefined||h.id<before),items=all.slice(-100);return {items,nextBefore:all.length>100?items[0].id:null,archive:s.state.archive};}
