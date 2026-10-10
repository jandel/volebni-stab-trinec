import type {LiveState,Precinct,Election} from './types';
import type {Candidate,CandidateSnapshot,CandidateState} from './candidate-types';
export type DataCheck={key:string;label:string;status:'ok'|'pending'|'mismatch';detail:string};
export type Integrity={status:'waiting'|'consistent'|'pending'|'mismatch';label:string;checks:DataCheck[];candidateCityAligned:boolean;candidatePrecinctsAligned:number;cityTime:string|null;candidateTime:string|null};
const sums=(ps:Precinct[],field:'registered'|'issued'|'validVotes')=>ps.reduce((s,p)=>s+p[field],0);
export function cityCandidatesAligned(city:Election|null,c:CandidateSnapshot|null){
 return Boolean(city&&c&&city.counted===c.counted&&city.registered===c.registered&&city.issued===c.issued&&city.parties.length===c.parties.length&&city.parties.every(p=>c.parties.find(x=>x.id===p.id)?.votes===p.votes));
}
export function precinctCandidatesAligned(p:Precinct,c:CandidateSnapshot|undefined){
 return Boolean(c&&c.sequence===p.sequence&&c.registered===p.registered&&c.issued===p.issued&&c.parties.every(x=>(p.votes[x.id]??0)===x.votes)&&Object.keys(p.votes).every(id=>c.parties.some(x=>x.id===Number(id)))&&c.parties.reduce((sum,x)=>sum+x.votes,0)===p.validVotes);
}
export function checkIntegrity(live:LiveState,candidates:CandidateState):Integrity{
 const city=live.city,cc=candidates.city,ps=Object.values(live.precincts),checks:DataCheck[]=[];
 const aligned=ps.filter(p=>precinctCandidatesAligned(p,candidates.precincts[p.id]));
 const result:Integrity={status:'waiting',label:'Čekáme na první výsledky',checks,candidateCityAligned:cityCandidatesAligned(city,cc),candidatePrecinctsAligned:aligned.length,cityTime:city?.generatedAt??null,candidateTime:cc?.generatedAt??null};
 if(!city||city.counted===0)return result;
 const sameCount=city.counted===ps.length;
 const coreMatches=sameCount&&city.registered===sums(ps,'registered')&&city.issued===sums(ps,'issued')&&city.validVotes===sums(ps,'validVotes')&&city.parties.every(p=>p.votes===ps.reduce((s,o)=>s+(o.votes[p.id]??0),0));
 checks.push({key:'core',label:'Město ↔ okrsky',status:!sameCount?'pending':coreMatches?'ok':'mismatch',detail:!sameCount?`Souhrn ${city.counted}/${city.total}, uložené okrsky ${ps.length}/${city.total}.`:coreMatches?'Počty voličů, obálek a všechny stranické součty souhlasí.':'Stejný počet okrsků, odlišné součty. Může probíhat zveřejňování opravy.'});
 const candidateSameCount=cc?.counted===city.counted;
 checks.push({key:'candidateCity',label:'Město ↔ kandidáti',status:!candidateSameCount?'pending':result.candidateCityAligned?'ok':'mismatch',detail:!candidateSameCount?`Kandidátský souhrn ${cc?.counted??0}/${city.total} okrsků.`:result.candidateCityAligned?'Počty voličů, obálek a hlasů všech listin souhlasí.':'Kandidátský a stranický souhrn zatím nepopisují stejný stav.'});
 checks.push({key:'candidatePrecincts',label:'Opravy kandidátských okrsků',status:aligned.length===ps.length?'ok':'pending',detail:`${aligned.length}/${ps.length} uložených okrsků má kandidátská data odpovídající poslední revizi a počtům obálek.`});
 const ready=Boolean(cc&&result.candidateCityAligned&&coreMatches&&aligned.length===ps.length);
 const candidateSums=ready&&Object.entries(cc!.votes).every(([id,v])=>aligned.every(p=>Number.isSafeInteger(candidates.precincts[p.id].votes[id]))&&aligned.reduce((s,p)=>s+candidates.precincts[p.id].votes[id],0)===v);
 checks.push({key:'candidateSums',label:'Kandidáti: souhrn ↔ okrsky',status:!ready?'pending':candidateSums?'ok':'mismatch',detail:!ready?'Porovnání čeká na všechny odpovídající části dat.':candidateSums?'Hlasy všech kandidátů souhlasí se součtem dostupných okrsků.':'Některý kandidátský součet se liší. Rozdíl zachováváme viditelný do dalšího ověření.'});
 const errors=[live.cityError,live.precinctError,candidates.cityError,candidates.precinctError].filter(Boolean);
 if(errors.length)checks.push({key:'sources',label:'Dostupnost zdrojů',status:'pending',detail:errors.join(' ')});
 result.status=checks.some(c=>c.status==='mismatch')?'mismatch':checks.some(c=>c.status==='pending')?'pending':'consistent';
 result.label=result.status==='consistent'?(city.complete?'Konečné součty jsou ověřené':'Dostupné součty souhlasí'):result.status==='mismatch'?'Součty zatím nesouhlasí':'Části dat se doplňují';
 return result;
}
export function relativeCandidate(scope:CandidateSnapshot|null|undefined,candidate:Candidate,registry:Candidate[]){
 if(!scope||!candidate.active||!Number.isSafeInteger(scope.votes[candidate.id]))return null;
 const active=registry.filter(c=>c.active&&c.partyId===candidate.partyId);
 if(!active.length||active.some(c=>!Number.isSafeInteger(scope.votes[c.id])))return null;
 const average=active.reduce((s,c)=>s+scope.votes[c.id],0)/active.length;
 return average>0?{average,ratio:scope.votes[candidate.id]/average}:null;
}
export function precinctCoverage(live:LiveState,historical:Election){
 const records=Object.values(historical.precincts),total=records.reduce((s,p)=>s+p.registered,0);
 const counted=records.filter(p=>Boolean(live.precincts[p.id])),missing=records.filter(p=>!live.precincts[p.id]).sort((a,b)=>b.registered-a.registered||a.id-b.id);
 const weight=counted.reduce((s,p)=>s+p.registered,0);
 return {total,weight,percent:total?weight/total*100:0,counted:counted.length,missing};
}
