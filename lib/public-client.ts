import type {ClientData,PublicSnapshot} from './public-types';
import type {HistoryPage} from './history-types';
import {assetPath} from './runtime';
let snapshot:PublicSnapshot|null=null,pending:Promise<PublicSnapshot>|null=null;
export function validPublicSnapshot(value:unknown):value is PublicSnapshot{
 const s=value as PublicSnapshot|null;
 return Boolean(s&&s.schemaVersion===1&&typeof s.publication?.id==='string'&&(s.publication.publishedAt===null||Number.isFinite(Date.parse(s.publication.publishedAt)))&&s.state?.live?.precincts&&typeof s.state.live.lastBatch==='number'&&s.state.candidates?.precincts&&s.state.integrity&&s.state.archive&&Array.isArray(s.history)&&s.history.every(h=>Number.isSafeInteger(h.id)&&h.city&&h.integrity&&Array.isArray(h.possible)&&(h.elected===null||Array.isArray(h.elected))));
}
async function readSnapshot(force=false):Promise<PublicSnapshot>{
 if(pending)return pending;if(snapshot&&!force)return snapshot;
 pending=(async()=>{const response=await fetch(assetPath('/data/published.json')+`?v=${Math.floor(Date.now()/60000)}`,{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Zveřejněné výsledky se nepodařilo načíst.');const value=await response.json();if(!validPublicSnapshot(value))throw Error('Zveřejněná data mají neplatný formát.');snapshot=value;return value;})();
 try{return await pending;}finally{pending=null;}
}
export async function getPublicResults(_update=true):Promise<ClientData>{const s=await readSnapshot(true);return {...s.state,publication:s.publication};}
export async function getPublicHistory(before?:number):Promise<HistoryPage>{const s=await readSnapshot(),all=s.history.filter(h=>before===undefined||h.id<before),items=all.slice(-100);return {items,nextBefore:all.length>100?items[0].id:null,archive:s.state.archive};}
