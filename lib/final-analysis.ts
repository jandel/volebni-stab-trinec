import type {Election,Party} from './types';
import type {Candidate} from './candidate-types';
import {estimateMandates,rankCandidates} from './mandates';
import {MATCHES} from './display';
import past from '../data/results-2022.json';
import current from '../data/final-results-2026.json';
import oldRegistry from '../data/candidates-2022.json';
import newRegistry from '../data/candidates-2026.json';
import finalVotes from '../data/final-candidate-votes-2026.json';
import timeline from '../data/final-history-2026.json';

type Person=Candidate&{firstName:string;lastName:string;age:number;residence:string;votes:number|null;elected:boolean|null};
export const analysisPast=past as Election;
export const analysisCurrent=current as Election;
const sum=(xs:number[])=>xs.reduce((s,x)=>s+x,0);
const norm=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('cs').replace(/\s+/g,' ').trim();
const personKey=(c:Person)=>norm(`${c.firstName} ${c.lastName}`);
// Reviewed surname change. Age, residence and office also agree. Sources are exposed in the report.
export const PERSON_ALIASES:Record<string,string>={'3-7':'3-4'};
export function matchPerson(c:Person,people:Person[],aliases:Record<string,string>={}){
 const direct=aliases[c.id];
 const matches=people.filter(p=>direct?p.id===direct:personKey(p)===personKey(c)&&c.age-p.age>=3&&c.age-p.age<=5);
 if(matches.length>1)throw Error(`Nejednoznačná osoba: ${c.name}`);
 return matches[0]??null;
}
export function validateFinal(e:Election,votes:Record<string,number>,registry:Candidate[]){
 if(!e.complete||e.counted!==e.total||Object.keys(e.precincts).length!==e.total)throw Error('Analýza vyžaduje úplné výsledky.');
 for(const metric of ['registered','issued','validVotes'] as const)if(sum(Object.values(e.precincts).map(p=>p[metric]))!==e[metric])throw Error(`Nesouhlasí ${metric}.`);
 if(sum(e.parties.map(p=>p.votes))!==e.validVotes||sum(e.parties.map(p=>p.seats??0))!==e.seats)throw Error('Nesouhlasí městský součet.');
 for(const p of e.parties){
  if(sum(Object.values(e.precincts).map(x=>x.votes[p.id]??0))!==p.votes)throw Error(`Nesouhlasí okrsky ${p.id}.`);
  const active=registry.filter(c=>c.active&&c.partyId===p.id);
  if(active.length!==p.candidates||active.some(c=>!Number.isSafeInteger(votes[c.id])||votes[c.id]<0)||sum(active.map(c=>votes[c.id]))!==p.votes)throw Error(`Nesouhlasí kandidáti ${p.id}.`);
 }
 const calculated=estimateMandates(e.parties,e.seats);
 if(e.parties.some(p=>calculated.parties[p.id].seats!==p.seats))throw Error('Přepočet nesouhlasí s oficiálními mandáty.');
}
export function correlation(xs:number[],ys:number[]){
 if(xs.length!==ys.length||xs.length<3)return null;
 const mx=sum(xs)/xs.length,my=sum(ys)/ys.length;
 const denominator=Math.sqrt(sum(xs.map(x=>(x-mx)**2))*sum(ys.map(y=>(y-my)**2)));
 return denominator?sum(xs.map((x,i)=>(x-mx)*(ys[i]-my)))/denominator:null;
}
export function buildFinalAnalysis(){
 const now=analysisCurrent,old=analysisPast,people=newRegistry.candidates as Person[],oldPeople=oldRegistry.candidates as Person[],votes=finalVotes.votes as Record<string,number>;
 validateFinal(now,votes,people);
 validateFinal(old,Object.fromEntries(oldPeople.map(c=>[c.id,c.votes??0])),oldPeople);
 const share=(e:Election,id:number)=>100*e.parties.find(p=>p.id===id)!.votes/e.validVotes;
 const winner=(ps:Party[],v:Record<string,number>)=>{const max=Math.max(...Object.values(v));return ps.filter(p=>v[p.id]===max).map(p=>p.id);};
 const precincts=Object.values(now.precincts).sort((a,b)=>a.id-b.id).map(p=>{
  const o=old.precincts[p.id];if(!o)throw Error(`Chybí historický okrsek ${p.id}`);
  const winnerNow=winner(now.parties,p.votes),winnerOld=winner(old.parties,o.votes);
  return {id:p.id,now:p,old:o,winnerNow,winnerOld,turnoutNow:100*p.issued/p.registered,turnoutOld:100*o.issued/o.registered,turnoutDelta:100*(p.issued/p.registered-o.issued/o.registered),shares:Object.fromEntries(now.parties.map(a=>[a.id,100*(p.votes[a.id]??0)/p.validVotes])),deltas:Object.fromEntries(now.parties.map(a=>{const id=MATCHES[a.id]?.id;return [a.id,id===null||id===undefined?null:100*((p.votes[a.id]??0)/p.validVotes-(o.votes[id]??0)/o.validVotes)];})),sameWinner:winnerNow.length===1&&winnerOld.length===1&&MATCHES[winnerNow[0]]?.id===winnerOld[0]};
 });
 const model=estimateMandates(old.parties.map(p=>({...p,seats:null})),now.seats);
 const parties=[...now.parties].sort((a,b)=>b.votes-a.votes).map(p=>{
  const match=MATCHES[p.id],before=old.parties.find(x=>x.id===match?.id)??null;
  const deltas=precincts.map(x=>x.deltas[p.id]).filter((x):x is number=>x!==null);
  return {...p,share:share(now,p.id),before,previousShare:before?share(old,before.id):null,delta:before?share(now,p.id)-share(old,before.id):null,matchNote:match?.note??'',approximate:p.id===3||p.id===7,wins:precincts.filter(x=>x.winnerNow.length===1&&x.winnerNow[0]===p.id).length,oldWins:before?precincts.filter(x=>x.winnerOld.length===1&&x.winnerOld[0]===before.id).length:null,gains:deltas.filter(x=>x>0).length,losses:deltas.filter(x=>x<0).length,modelSeats:before?model.parties[before.id].seats:null,seatShare:100*(p.seats??0)/now.seats,oldSeatShare:before?100*(before.seats??0)/old.seats:null,correlation:before?correlation(precincts.map(x=>x.turnoutDelta),precincts.map(x=>x.deltas[p.id]!)):null};
 });
 const candidates=now.parties.flatMap(p=>{
  const active=people.filter(c=>c.partyId===p.id&&c.active),ranks=rankCandidates(active,votes,p.votes);
  return ranks.ranked.map(c=>{
   const previous=matchPerson(c,oldPeople,PERSON_ALIASES),previousParty=previous?old.parties.find(p=>p.id===previous.partyId)!:null;
   const ratio=c.votes/(p.votes/active.length),previousRatio=previous&&previousParty&&previous.votes!==null?previous.votes/(previousParty.votes/oldPeople.filter(x=>x.active&&x.partyId===previous.partyId).length):null;
   const elected=now.electedCandidates?.includes(c.id)??false;
   if(elected!==(c.rank<=(p.seats??0)))throw Error(`Oficiální zvolení nesouhlasí: ${c.id}`);
   return {...c,party:p,ratio,aboveAverage:(ratio-1)*100,elected,positionGain:c.order-c.rank,enteredByReordering:elected&&c.order>(p.seats??0),previous,previousParty,previousRatio};
  });
 }).sort((a,b)=>b.ratio-a.ratio);
 const oldElected=oldPeople.filter(c=>c.elected);
 const returning=oldElected.map(person=>({person,current:candidates.find(c=>c.previous?.id===person.id)??null}));
 const reelected=returning.filter(x=>x.current?.elected),unsuccessful=returning.filter(x=>x.current&&!x.current.elected),notRunning=returning.filter(x=>!x.current);
 const newlyCompared=candidates.filter(c=>c.elected&&!c.previous?.elected);
 const turnoutNow=100*now.issued/now.registered,turnoutOld=100*old.issued/old.registered,standardized=100*now.issued/old.registered;
 const history=timeline.points.map(p=>({...p,percent:100*p.counted/p.total,leader:[...p.parties].sort((a,b)=>b.votes-a.votes)[0].id,shares:Object.fromEntries(p.parties.map(x=>[x.id,100*x.votes/sum(p.parties.map(y=>y.votes))]))}));
 return {now,old,parties,precincts,candidates,turnout:{now:turnoutNow,old:turnoutOld,delta:turnoutNow-turnoutOld,votersDelta:now.issued-old.issued,registeredDelta:now.registered-old.registered,increased:precincts.filter(x=>x.turnoutDelta>0).length,standardized,numeratorEffect:standardized-turnoutOld,denominatorEffect:turnoutNow-standardized},turnover:{returning,reelected,unsuccessful,notRunning,newlyCompared},history,archiveRows:timeline.archiveRows,unmatchedOld:old.parties.filter(p=>!Object.values(MATCHES).some(m=>m.id===p.id)),model2022:model,changedWinners:precincts.filter(p=>!p.sameWinner).length};
}
export const finalAnalysis=buildFinalAnalysis();
