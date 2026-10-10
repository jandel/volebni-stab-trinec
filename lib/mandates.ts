import type {Party} from './types';
export type SeatRange={min:number;max:number;seats:number|null;eligible:boolean;adjustedShare:number;ordinaryThreshold:number};
export type MandateEstimate={available:boolean;official:boolean;threshold:number;total:number;allocated:number;lotterySeats:number;insufficientCandidates:boolean;parties:Record<string,SeatRange>};
export function estimateMandates(parties:Party[],seats:number,official=false):MandateEstimate{
 const totalVotes=parties.reduce((s,p)=>s+p.votes,0);
 const result:MandateEstimate={available:totalVotes>0,official,threshold:5,total:seats,allocated:0,lotterySeats:0,insufficientCandidates:false,parties:{}};
 if(!Number.isInteger(seats)||seats<1||parties.some(p=>!Number.isSafeInteger(p.votes)||p.votes<0||!Number.isInteger(p.candidates)||p.candidates<0))throw Error('Neplatné vstupy přepočtu mandátů.');
 let threshold=5;
 const passes=(p:Party,t:number)=>p.candidates>0&&(parties.length===1||100*p.votes*seats>=t*totalVotes*Math.min(p.candidates,seats));
 if(totalVotes>0&&parties.length>1){
  const enough=(t:number)=>{const ps=parties.filter(p=>passes(p,t));return ps.length>=2&&ps.reduce((s,p)=>s+Math.min(p.candidates,seats),0)>=Math.max(5,Math.floor(seats/2)+1);};
  while(threshold>0&&!enough(threshold))threshold--;
 }
 result.threshold=threshold;
 for(const p of parties)result.parties[p.id]={min:0,max:0,seats:totalVotes?0:null,eligible:totalVotes>0&&passes(p,threshold),adjustedShare:totalVotes&&p.candidates?100*p.votes*seats/(totalVotes*Math.min(p.candidates,seats)):0,ordinaryThreshold:threshold*Math.min(p.candidates,seats)/seats};
 if(!totalVotes)return result;
 if(official&&parties.every(p=>p.seats!==null)){
  for(const p of parties)result.parties[p.id]={...result.parties[p.id],min:p.seats!,max:p.seats!,seats:p.seats!};
  result.allocated=parties.reduce((s,p)=>s+(p.seats??0),0);result.insufficientCandidates=result.allocated<seats;return result;
 }
 result.official=false;
 type Q={id:number;votes:number;divisor:number};const qs:Q[]=[];
 for(const p of parties.filter(p=>result.parties[p.id].eligible))for(let d=1;d<=Math.min(p.candidates,seats);d++)qs.push({id:p.id,votes:p.votes,divisor:d});
 const compare=(a:Q,b:Q)=>b.votes*a.divisor-a.votes*b.divisor||b.votes-a.votes;
 qs.sort(compare);
 let taken=0;
 for(let i=0;i<qs.length&&taken<seats;){
  let j=i+1;while(j<qs.length&&compare(qs[i],qs[j])===0)j++;
  const group=qs.slice(i,j),available=seats-taken;
  if(group.length<=available){for(const q of group){const p=result.parties[q.id];p.min++;p.max++;p.seats=p.min;}taken+=group.length;}
  else{
   const counts:Record<string,number>={};for(const q of group)counts[q.id]=(counts[q.id]??0)+1;
   for(const [id,n] of Object.entries(counts)){const p=result.parties[id];p.min+=Math.max(0,available-(group.length-n));p.max+=Math.min(n,available);p.seats=p.min===p.max?p.min:null;}
   result.lotterySeats=available;taken+=available;
  }
  i=j;
 }
 result.allocated=Object.values(result.parties).reduce((s,p)=>s+p.min,0);result.insufficientCandidates=qs.length<seats;return result;
}
export function rankCandidates<T extends {id:string;order:number;active:boolean}>(candidates:T[],votes:Record<string,number>,partyVotes:number){
 const active=candidates.filter(c=>c.active);
 if(!active.length)return {threshold:null,ranked:[] as (T&{votes:number;promoted:boolean;rank:number})[]};
 if(active.some(c=>!Number.isSafeInteger(votes[c.id])||votes[c.id]<0)||active.reduce((s,c)=>s+votes[c.id],0)!==partyVotes)throw Error('Kandidátské a stranické hlasy nejsou ze stejného součtu.');
 const mean=Math.floor(partyVotes/active.length),threshold=Math.ceil(mean*11/10);
 const ranked=active.map(c=>({...c,votes:votes[c.id],promoted:votes[c.id]*10>=mean*11})).sort((a,b)=>Number(b.promoted)-Number(a.promoted)||(a.promoted?b.votes-a.votes:0)||a.order-b.order).map((c,i)=>({...c,rank:i+1}));
 return {threshold,ranked};
}
