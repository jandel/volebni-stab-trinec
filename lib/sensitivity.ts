import type {Party} from './types';
import type {ModelInputs} from './model';
import {apportion,changeShare} from './model';
import {estimateMandates} from './mandates';
import type {MandateEstimate} from './mandates';
export type SeatPoint={share:number;delta:number;min:number;max:number;voters:number};
export type SeatSensitivity={id:number;available:boolean;current:{min:number;max:number};gain:SeatPoint|null;loss:SeatPoint|null;possibleGain:SeatPoint|null;possibleLoss:SeatPoint|null};
export function countsAt(inputs:ModelInputs,parties:Party[],shares=inputs.shares){
 const voters=Math.round(inputs.electorate*inputs.turnout/100),counts=apportion(voters,parties.map(p=>shares[p.id]));
 return {voters,counts,parties:parties.map((p,i)=>({...p,votes:counts[i]*p.candidates,seats:null}))};
}
export function seatSensitivity(inputs:ModelInputs,parties:Party[],seats:number,id:number):SeatSensitivity{
 const baseline=countsAt(inputs,parties),estimate=estimateMandates(baseline.parties,seats),current=estimate.parties[id];
 const result:SeatSensitivity={id,available:estimate.available,current:{min:current.min,max:current.max},gain:null,loss:null,possibleGain:null,possibleLoss:null};
 if(!estimate.available)return result;
 const origin=inputs.shares[id],index=parties.findIndex(p=>p.id===id),capacity=Math.min(parties[index].candidates,seats);
 const point=(q:number)=>{const data=countsAt(inputs,parties,changeShare(inputs.shares,id,q,[])),m=estimateMandates(data.parties,seats).parties[id];return {share:q/10,delta:(q-origin)/10,min:m.min,max:m.max,voters:data.counts[index]};};
 if(current.max<capacity)for(let q=origin+1;q<=1000;q++){const p=point(q);if(!result.possibleGain&&p.max>current.max)result.possibleGain=p;if(p.min>current.max){result.gain=p;break;}}
 if(current.min>0)for(let q=origin-1;q>=0;q--){const p=point(q);if(!result.possibleLoss&&p.min<current.min)result.possibleLoss=p;if(p.max<current.min){result.loss=p;break;}}
 return result;
}
export function coalitionRange(estimate:MandateEstimate,selected:number[]){
 if(!estimate.available)return {available:false,min:0,max:0,majority:Math.floor(estimate.total/2)+1};
 const set=new Set(selected),entries=Object.entries(estimate.parties),inside=entries.filter(([id])=>set.has(Number(id))).map(([,p])=>p),outside=entries.filter(([id])=>!set.has(Number(id))).map(([,p])=>p);
 const sum=(ps:typeof inside,k:'min'|'max')=>ps.reduce((s,p)=>s+p[k],0),total=estimate.insufficientCandidates?estimate.allocated:estimate.total;
 return {available:true,min:Math.max(sum(inside,'min'),total-sum(outside,'max')),max:Math.min(sum(inside,'max'),total-sum(outside,'min')),majority:Math.floor(estimate.total/2)+1};
}
