import data from '../data/post-election-2026.json';
import result from '../data/final-results-2026.json';
import {color,shortName} from './display';
import type {Election} from './types';

export const postElection=data;
export type ElectedProfile=typeof data.profiles[number];
export type Coalition=typeof data.coalitions[number];
export type Program=typeof data.programs[number];
export const reportParties=data.programs.map(p=>{const party=(result as Election).parties.find(x=>x.id===p.partyId)!;return {...p,color:color(party),short:shortName(party)};});
export const partyByCode=(code:string)=>reportParties.find(p=>p.code===code)!;
export const partyById=(id:number)=>reportParties.find(p=>p.partyId===id)!;
export const profileById=(id:string)=>data.profiles.find(p=>p.id===id);
export const normalizedSearch=(text:string)=>text.normalize('NFD').replace(/\p{M}/gu,'').replace(/[łŁ]/g,'l').toLocaleLowerCase('cs');
export function selectProfiles({query='',party='all',topic='all',evidence='all',sort='party'}:{query?:string;party?:string;topic?:string;evidence?:string;sort?:string}={}){
 const words=normalizedSearch(query).trim().split(/\s+/).filter(Boolean);
 return data.profiles.filter(p=>(party==='all'||p.partyCode===party)&&(topic==='all'||p.topics.includes(topic))&&(evidence==='all'||(evidence==='missing'?p.missingPersonal:!p.missingPersonal))&&words.every(word=>normalizedSearch(p.name).includes(word))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'cs'):sort==='votes'?b.votes-a.votes:0);
}
export function selectCoalitions({party='all',size='all',reserve='all'}:{party?:string;size?:string;reserve?:string}={}){
 return data.coalitions.filter(c=>(party==='all'||c.parties.includes(party))&&(size==='all'||c.parties.length===Number(size))&&(reserve==='all'||(reserve==='zero'?c.reserve===0:c.reserve>0)));
}
