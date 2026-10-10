'use client';
import {useState} from 'react';
import {Users} from 'lucide-react';
import type {Party} from '@/lib/types';
import type {MandateEstimate} from '@/lib/mandates';
import {coalitionRange} from '@/lib/sensitivity';
import {color,shortName} from '@/lib/display';
export default function MajorityCalculator({parties,estimate}:{parties:Party[];estimate:MandateEstimate}){
 const [selected,setSelected]=useState<number[]>([]),range=coalitionRange(estimate,selected);
 const verdict=!range.available?'Čekáme na nenulový výsledek':!selected.length?'Vyberte kombinaci stran':range.min>=range.majority?'Početní většina':range.max>=range.majority?'Většina závisí na losu':'Bez většiny';
 return <section className="majority-panel"><div className="minor-heading"><h3><Users size={18}/>Kalkulačka většiny</h3><span>Potřeba {range.majority} z {estimate.total} mandátů</span></div><div className="coalition-choices">{parties.map(p=><button key={p.id} className={selected.includes(p.id)?'chosen':''} aria-pressed={selected.includes(p.id)} onClick={()=>setSelected(s=>s.includes(p.id)?s.filter(id=>id!==p.id):[...s,p.id])}><i style={{background:color(p)}}/>{shortName(p)}</button>)}</div><div className={`coalition-result ${range.min>=range.majority?'has-majority':''}`}><strong>{range.available?(range.min===range.max?range.min:`${range.min}–${range.max}`):'—'}<small>mandátů</small></strong><div><b>{verdict}</b><p>{range.available&&selected.length>0?(range.min>=range.majority?`Rezerva nad hranicí většiny: ${range.min-range.majority} mandátů${range.max!==range.min?` (nejméně)`:''}.`:range.max<range.majority?`Do většiny chybí nejméně ${range.majority-range.max} mandátů.`:'Přesná shoda dovoluje variantu s většinou i bez ní.'):'Kliknutím přidávejte nebo odebírejte strany.'}</p></div></div><p className="analytics-note">Početní možnosti, bez posuzování politické slučitelnosti. Rozpětí zohledňuje společné omezení losovaných mandátů.</p></section>;
}
