'use client';
import {MapPin} from 'lucide-react';
import type {Election,LiveState} from '@/lib/types';
import {precinctCoverage} from '@/lib/integrity';
import {number,percent} from '@/lib/display';
export default function CoveragePanel({live,historical,venues,onSelect}:{live:LiveState;historical:Election;venues:Record<string,{pollingPlace:string}>;onSelect:(id:number)=>void}){
 const c=precinctCoverage(live,historical);
 return <section className="coverage-panel"><div className="table-heading"><div><span className="section-kicker">CO UŽ VÍME A CO JEŠTĚ CHYBÍ</span><h2><MapPin size={20}/>Váha dostupných okrsků</h2></div><span className="coverage-count">{c.counted} / 38 okrsků</span></div><div className="coverage-body"><div className="coverage-weight"><strong>{percent(c.percent,1)}</strong><div><p>historické voličské základny</p><small>{number(c.weight)} z {number(c.total)} zapsaných voličů v roce 2022</small></div></div><div className="coverage-track"><i style={{width:`${c.percent}%`}}/></div><p className="model-helper">Podle velikosti okrsků v roce 2022. Jde o orientační váhu, nikoli podíl již sečtených letošních hlasů. Používáme okrsky skutečně načtené do mapy; městský souhrn může být napřed.</p><details><summary>{c.missing.length?`Zbývá ${c.missing.length} okrsků · zobrazit od největších`:'Všech 38 okrsků je dostupných'}</summary><div className="missing-precincts">{c.missing.map(p=><button key={p.id} onClick={()=>onSelect(p.id)}><span><strong>Okrsek {p.id}</strong><small>{venues[p.id]?.pollingPlace??'Volební místnost'}</small></span><span>{number(p.registered)}<small>voličů v roce 2022</small></span></button>)}</div></details></div></section>;
}
