import {relativeCandidate} from './integrity';
import type {Candidate,CandidateSnapshot,CandidateState} from './candidate-types';
import type {Election} from './types';
import data2022 from '../data/candidates-2022.json';
import data2026 from '../data/candidates-2026.json';
import historic from '../data/results-2022.json';
export const REGISTRIES:Record<number,Candidate[]>={2022:data2022.candidates as Candidate[],2026:data2026.candidates as Candidate[]};
const city:CandidateSnapshot={generatedAt:data2022.retrievedAt,fetchedAt:data2022.retrievedAt,counted:38,complete:true,votes:Object.fromEntries(data2022.candidates.map(c=>[c.id,c.votes])),parties:(historic as Election).parties,elected:Object.fromEntries(data2022.candidates.map(c=>[c.id,c.elected===true])),registered:historic.registered,issued:historic.issued};
const precincts:Record<string,CandidateSnapshot>={};
for(const [id,votes] of Object.entries(data2022.precinctVotes)){const p=(historic as Election).precincts[id];precincts[id]={...city,counted:1,votes,registered:p.registered,issued:p.issued};}
export const HISTORIC_CANDIDATES:CandidateState={city,precincts,cityError:null,precinctError:null,checkedAt:data2022.retrievedAt,pendingPrecincts:0};
export const candidateVotesForMap=(state:CandidateState,id:string)=>Object.fromEntries(Object.entries(state.precincts).filter(([,s])=>id in s.votes).map(([p,s])=>[p,s.votes[id]]));

export type CandidateMandate='elected'|'projected'|'lottery'|'out';
export function compareByMandate(a:Candidate,b:Candidate,projections:Record<string,{mandate:CandidateMandate}>,cityVotes:Record<string,number>={}){
 const priority=(c:Candidate)=>{
  if(!c.active)return 4;
  const mandate=projections[c.id]?.mandate;
  return mandate==='elected'||mandate==='projected'?0:mandate==='lottery'?1:mandate==='out'?2:3;
 };
 return priority(a)-priority(b)||(cityVotes[b.id]??-1)-(cityVotes[a.id]??-1)||a.partyId-b.partyId||a.order-b.order;
}

export function candidateRatiosForMap(state:CandidateState,id:string,registry:Candidate[]){const c=registry.find(c=>c.id===id);if(!c)return {};return Object.fromEntries(Object.entries(state.precincts).flatMap(([pid,scope])=>{const r=relativeCandidate(scope,c,registry);return r?[[pid,r.ratio]]:[];}));}
