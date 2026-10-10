import type { Party,Precinct } from './types';
export const number=(n:number)=>new Intl.NumberFormat('cs-CZ').format(n);
export const percent=(n:number|null,places=2)=>n===null?'—':`${n.toLocaleString('cs-CZ',{minimumFractionDigits:places,maximumFractionDigits:places})} %`;
export const pp=(n:number|null)=>n===null?'—':`${n>0?'+':''}${n.toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2})} p. b.`;
export function color(p:Pick<Party,'name'>){const n=p.name.toLocaleLowerCase('cs');if(n.includes('osobnosti'))return '#159578';if(n.includes('ano'))return '#245c9c';if(n.startsWith('nezávislí'))return '#8a6eb0';if(n.includes('kdu'))return '#c39a26';if(n.includes('společně'))return '#3e8cac';if(n.includes('pirátská'))return '#636a75';if(n.includes('levice')||n.includes('čssd'))return '#d27a59';return '#c2649b';}
export function shortName(p:Pick<Party,'name'>){if(p.name.includes('Věcně'))return 'Volte Třinec';if(p.name==='Česká pirátská strana')return 'Piráti';return p.name;}
export function leader(p:Precinct|undefined,parties:Party[]){if(!p||p.validVotes===0)return [];const max=Math.max(...Object.values(p.votes));return parties.filter(x=>p.votes[x.id]===max);}
export const share=(p:Precinct|undefined,id:number)=>p&&p.validVotes>0?(p.votes[id]??0)/p.validVotes*100:null;
export const turnout=(p:Precinct|undefined)=>p&&p.registered>0?p.issued/p.registered*100:null;
export function weighted(pr:Precinct[],id:number){const votes=pr.reduce((s,p)=>s+(p.votes[id]??0),0),total=pr.reduce((s,p)=>s+p.validVotes,0);return total?votes/total*100:null;}
export function blend(a:string,b:string,t:number){t=Math.min(1,Math.max(0,t));const c=(h:string,i:number)=>parseInt(h.slice(i,i+2),16);return '#'+[1,3,5].map(i=>Math.round(c(a,i)+(c(b,i)-c(a,i))*t).toString(16).padStart(2,'0')).join('');}
export function sourceTime(s:string|null){if(!s)return 'dosud neověřeno';const [d,t]=s.split('T');return `${d.split('-').reverse().join('. ')} · ${(t??'').slice(0,8)}`;}
export function checkedTime(s:string|null){return s?new Date(s).toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'dosud neověřeno';}
// Explicit, reviewable matches. Ballot numbers are never used as cross-year identity.
export const MATCHES:Record<number,{id:number|null;note:string}>={
  1:{id:null,note:'Bez automaticky přiřazeného předchůdce.'},
  2:{id:null,note:'Nová koalice; není automaticky ztotožněna s ČSSD a nezávislými z roku 2022.'},
  3:{id:3,note:'Shodný místní název, jiné složení: v roce 2022 STAN + nezávislí, v roce 2026 NOVÁ GENERACE + nezávislí. Srovnání politické značky, nikoli totožné koalice.'},
  4:{id:7,note:'KDU-ČSL: shodný kód volební strany.'},
  5:{id:5,note:'ANO 2011: shodný kód volební strany.'},
  6:{id:1,note:'SPOLEČNĚ PRO TŘINEC: shodný kód a složení ODS + TOP 09.'},
  7:{id:2,note:'NEZÁVISLÍ Třinec vs. NEZÁVISLÍ: změnil se název i registrace (NEZ + nezávislí oproti NEZ). Orientační srovnání místní značky.'},
};
