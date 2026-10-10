import type {Candidate} from './candidate-types';
import type {Party} from './types';
import {estimateMandates} from './mandates';

// Integer tenths of a percentage point keep every scenario at exactly 100 %.
export const SHARE_UNITS=1000;
export type ModelInputs={electorate:number;turnout:number;shares:Record<string,number>;locked:number[]};

/** Convert proportional weights to whole units, preserving the requested total.
 * Equal remainders use input order, a modelling convention, not an election rule. */
export function apportion(total:number,weights:number[]):number[]{
 if(!Number.isSafeInteger(total)||total<0||!weights.length||weights.some(w=>!Number.isFinite(w)||w<0))throw Error('Neplatné rozdělení modelových podílů.');
 const sum=weights.reduce((s,w)=>s+w,0);
 const normalized=sum?weights:weights.map(()=>1),denominator=sum||weights.length;
 const exact=normalized.map(w=>total*w/denominator),values=exact.map(Math.floor);
 const order=exact.map((v,i)=>({i,remainder:v-values[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 const rest=total-values.reduce((s,n)=>s+n,0);
 for(let i=0;i<rest;i++)values[order[i].i]++;
 return values;
}

export function equalShares(ids:number[]):Record<string,number>{
 const units=apportion(SHARE_UNITS,ids.map(()=>1));
 return Object.fromEntries(ids.map((id,i)=>[id,units[i]]));
}

export function changeShare(shares:Record<string,number>,id:number,requested:number,locked:number[]):Record<string,number>{
 if(locked.includes(id)||!(id in shares)||!Number.isFinite(requested))return shares;
 const others=Object.keys(shares).map(Number).filter(k=>k!==id&&!locked.includes(k));
 if(!others.length)return shares;
 const fixed=locked.reduce((sum,k)=>sum+(shares[k]??0),0);
 const value=Math.max(0,Math.min(SHARE_UNITS-fixed,Math.round(requested)));
 const remainder=apportion(SHARE_UNITS-fixed-value,others.map(k=>shares[k]));
 return {...shares,[id]:value,...Object.fromEntries(others.map((k,i)=>[k,remainder[i]]))};
}

export function validModel(input:unknown,ids:number[]):input is ModelInputs{
 if(!input||typeof input!=='object')return false;
 const m=input as ModelInputs;
 return Number.isInteger(m.electorate)&&m.electorate>=1&&m.electorate<=1000000
  &&Number.isFinite(m.turnout)&&m.turnout>=0&&m.turnout<=100
  &&Boolean(m.shares)&&Object.keys(m.shares).length===ids.length
  &&ids.every(id=>Number.isInteger(m.shares[id])&&m.shares[id]>=0&&m.shares[id]<=SHARE_UNITS)
  &&ids.reduce((s,id)=>s+m.shares[id],0)===SHARE_UNITS
  &&Array.isArray(m.locked)&&m.locked.every(id=>ids.includes(id))&&new Set(m.locked).size===m.locked.length;
}

export function modelElection(inputs:ModelInputs,source:Party[],candidates:Candidate[],seats:number){
 const ids=source.map(p=>p.id);
 if(!validModel(inputs,ids))throw Error('Neplatné nastavení volebního modelu.');
 const voters=Math.round(inputs.electorate*inputs.turnout/100);
 const counts=apportion(voters,ids.map(id=>inputs.shares[id]));
 const lists=Object.fromEntries(source.map(p=>[p.id,candidates.filter(c=>c.partyId===p.id&&c.active).sort((a,b)=>a.order-b.order).slice(0,seats)]));
 const partyVoters=Object.fromEntries(ids.map((id,i)=>[id,counts[i]]));
 const parties=source.map(p=>({...p,candidates:lists[p.id].length,votes:partyVoters[p.id]*lists[p.id].length,seats:null,share:0}));
 const totalVotes=parties.reduce((sum,p)=>sum+p.votes,0);
 parties.forEach(p=>{p.share=totalVotes?p.votes/totalVotes*100:0;});
 const mandates=estimateMandates(parties,seats);
 const elected=parties.flatMap(p=>lists[p.id].slice(0,mandates.parties[p.id].max).map((c,i)=>({...c,votes:partyVoters[p.id],certain:i<mandates.parties[p.id].min})));
 return {voters,partyVoters,totalVotes,parties,mandates,elected};
}
