import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const root=new URL('../',import.meta.url);
const seed=JSON.parse(await readFile(new URL('static-site/seed.json',root),'utf8'));
const final=JSON.parse(await readFile(new URL('data/final-results-2026.json',root),'utf8'));
const {outputFiles}=await build({entryPoints:[new URL('lib/public-client.ts',root).pathname],bundle:true,format:'esm',platform:'node',write:false,define:{__PUBLIC_STATIC__:'true'}});
let instance=0;
const freshClient=()=>import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text+`\n// client ${++instance}`).toString('base64'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

function fixture(id='first',correctedVotes=final.validVotes){
 const snapshot=structuredClone(seed),city=structuredClone(final);
 city.validVotes=correctedVotes;
 Object.assign(snapshot.state.live,{city,precincts:city.precincts,lastBatch:76,checkedAt:'2026-10-10T18:49:02Z'});
 snapshot.history=[{id:89,city,integrity:snapshot.state.integrity,possible:[],elected:null}];
 snapshot.publication={id,publishedAt:'2026-10-10T18:49:02Z',sourceCheckedAt:'2026-10-10T18:48:39Z',contentHash:hash(JSON.stringify(snapshot.state))};
 const bytes=Buffer.from(JSON.stringify(snapshot)),compressed=gzipSync(bytes),parts=new Map();
 const manifest={schemaVersion:2,publication:snapshot.publication,encoding:'gzip-parts-v1',bytes:bytes.length,sha256:hash(bytes),revision:{historyId:89,lastBatch:76},parts:[]};
 for(let start=0;start<compressed.length;start+=1024){
  const part=compressed.subarray(start,start+1024),sha256=hash(part),path=`parts/${sha256}.gz.part`;
  parts.set('./data/'+path,part);manifest.parts.push({path,bytes:part.length,sha256});
 }
 return {snapshot,transport:manifest,parts};
}

function server(t,data=fixture()){
 const previous=globalThis.fetch;
 const s={data,calls:[],status:200,corrupt:false};
 globalThis.fetch=async(url,options)=>{
  s.calls.push({url,options});
  if(url==='./data/published.json')return Response.json(s.data.transport,{status:s.status});
  const part=s.data.parts.get(url);
  assert.ok(part,`Unexpected request: ${url}`);
  const body=Buffer.from(part);if(s.corrupt)body[0]^=255;
  return new Response(body);
 };
 t.after(()=>{globalThis.fetch=previous;});
 return s;
}

test('initial results and history share one fetch and the in-memory snapshot',async t=>{
 const c=await freshClient(),s=server(t);
 const [results,history]=await Promise.all([c.getPublicResults(false),c.getPublicHistory()]);
 assert.equal(results.live.city.complete,true);
 assert.equal(history.items[0].city.validVotes,results.live.city.validVotes);
 assert.equal(s.calls.length,1+s.data.parts.size);
 const requests=s.calls.length;
 await c.getPublicResults(false);await c.getPublicHistory();
 assert.equal(s.calls.length,requests);
});

test('manual refresh revalidates a stable URL and skips unchanged parts',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);const requests=s.calls.length;
 const results=await c.getPublicResults();
 assert.equal(results.publication.id,'first');
 assert.equal(s.calls.length,requests+1);
 assert.equal(s.calls.at(-1).url,'./data/published.json');
 assert.equal(s.calls.at(-1).options.cache,'no-cache');
});

test('a correction is loaded even with a complete city, identical counts and batch',async t=>{
 const c=await freshClient(),s=server(t);
 const before=await c.getPublicResults(false);
 s.data=fixture('correction',final.validVotes+1);
 const results=await c.getPublicResults(true),history=await c.getPublicHistory();
 assert.equal(results.live.city.complete,true);
 assert.equal(results.live.city.counted,before.live.city.counted);
 assert.equal(results.live.lastBatch,before.live.lastBatch);
 assert.equal(results.live.city.validVotes,final.validVotes+1);
 assert.equal(results.publication.id,'correction');
 assert.equal(history.items[0].city.validVotes,final.validVotes+1);
});

test('concurrent forced refreshes share one network operation',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);const requests=s.calls.length;
 await Promise.all([c.getPublicResults(true),c.getPublicResults(true),c.getPublicHistory()]);
 assert.equal(s.calls.length,requests+1);
});

test('a failed refresh preserves the last snapshot and a later retry can update it',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);s.status=503;
 await assert.rejects(c.getPublicResults(true),/nepodařilo načíst/);
 assert.equal((await c.getPublicResults(false)).publication.id,'first');
 s.status=200;s.data=fixture('after-retry');
 assert.equal((await c.getPublicResults(true)).publication.id,'after-retry');
});

test('corrupted new parts are rejected and the same publication can be retried',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);s.data=fixture('new');s.corrupt=true;
 await assert.rejects(c.getPublicResults(true),/poškozená/);
 assert.equal((await c.getPublicResults(false)).publication.id,'first');
 s.corrupt=false;
 assert.equal((await c.getPublicResults(true)).publication.id,'new');
});

test('changed manifest metadata cannot bypass transport consistency checks',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);
 s.data=fixture();s.data.transport.publication={...s.data.transport.publication,id:'wrong-id'};
 await assert.rejects(c.getPublicResults(true),/nepatří ke stejné verzi/);
 assert.equal((await c.getPublicResults(false)).publication.id,'first');
});

test('an invalid snapshot does not replace the last valid results',async t=>{
 const c=await freshClient(),s=server(t);
 await c.getPublicResults(false);s.data.transport={schemaVersion:1};
 await assert.rejects(c.getPublicResults(true),/neplatný formát/);
 assert.equal((await c.getPublicResults(false)).live.city.validVotes,final.validVotes);
});

test('uncompressed schema version 1 still supports initial load and corrections',async t=>{
 const c=await freshClient(),first=fixture(),s=server(t,{...first,transport:first.snapshot});
 await c.getPublicResults(false);
 assert.equal(s.calls.length,1);
 const correction=fixture('legacy-correction',final.validVotes+2);
 s.data={...correction,transport:correction.snapshot};
 assert.equal((await c.getPublicResults(true)).live.city.validVotes,final.validVotes+2);
 assert.equal(s.calls.length,2);
});
