'use client';
import {useEffect,useMemo,useState} from 'react';
import type {CSSProperties} from 'react';
import {Info,Landmark,LockKeyhole,LockKeyholeOpen,RotateCcw,SlidersHorizontal,Users} from 'lucide-react';
import MajorityCalculator from './MajorityCalculator';
import SensitivityPanel from './SensitivityPanel';
import ScenarioPanel from './ScenarioPanel';
import {color,number,percent,shortName} from '@/lib/display';
import {changeShare,equalShares,modelElection,validModel} from '@/lib/model';
import {PUBLIC_STATIC} from '@/lib/runtime';
import type {ModelInputs} from '@/lib/model';
import type {Election} from '@/lib/types';
import type {Candidate} from '@/lib/candidate-types';
import initial from '@/data/initial-2026.json';
import historical from '@/data/results-2022.json';
import registry from '@/data/candidates-2026.json';

const base=initial as Election,ids=base.parties.map(p=>p.id),candidates=registry.candidates as Candidate[];
const defaults:ModelInputs={electorate:historical.registered,turnout:35,shares:equalShares(ids),locked:[]};
const storageKey=PUBLIC_STATIC?'trinec-public-model-2026-v1':'trinec-whole-list-model-2026-v1';
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export default function ModelPanel(){
 const [inputs,setInputs]=useState<ModelInputs>(defaults),[ready,setReady]=useState(false),[stored,setStored]=useState(true);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)??'null');if(validModel(saved,ids))setInputs(saved);}catch{setStored(false);}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(storageKey,JSON.stringify(inputs));setStored(true);}catch{setStored(false);}},[inputs,ready]);
 const model=useMemo(()=>modelElection(inputs,base.parties,candidates,base.seats),[inputs]);
 function setTurnout(value:number){if(Number.isFinite(value))setInputs(s=>({...s,turnout:Math.round(clamp(value,0,100)*10)/10}));}
 function setShare(id:number,value:number){if(Number.isFinite(value))setInputs(s=>({...s,shares:changeShare(s.shares,id,value*10,s.locked)}));}
 function toggleLock(id:number){setInputs(s=>({...s,locked:s.locked.includes(id)?s.locked.filter(x=>x!==id):[...s.locked,id]}));}
 const majority=Math.floor(base.seats/2)+1;
 return <section className="model-panel" aria-label="Modelování volebního výsledku">
  <div className="model-assumption"><span className="model-assumption-icon"><SlidersHorizontal size={20}/></span><div><strong>Jeden volič. Jedna celá kandidátka.</strong><p>Každý účastník modelu odevzdá platný hlas pro celou listinu. Kandidáti získávají mandáty v pořadí na kandidátce; neaktivní se vynechávají.</p></div><span className="model-badge">VLASTNÍ SCÉNÁŘ</span></div>
  <ScenarioPanel inputs={inputs} onLoad={setInputs} parties={base.parties} candidates={candidates} seats={base.seats}/>
  <div className="model-layout">
   <div className="model-controls">
    <section className="model-card turnout-card">
     <div className="model-section-heading"><div><span className="section-kicker">01 · KOLIK LIDÍ PŘIJDE</span><h2><Users size={20}/>Volební účast</h2></div><label className="model-number turnout-number"><input type="number" min="0" max="100" step="0.1" value={inputs.turnout} onFocus={e=>e.currentTarget.select()} onChange={e=>setTurnout(e.currentTarget.valueAsNumber)} aria-label="Volební účast v procentech"/><span>%</span></label></div>
     <input className="model-range turnout-range" type="range" min="0" max="100" step="0.1" value={inputs.turnout} onChange={e=>setTurnout(Number(e.target.value))} aria-label="Nastavit volební účast" aria-valuetext={percent(inputs.turnout,1)} style={{'--range-fill':`${inputs.turnout}%`} as CSSProperties}/>
     <div className="range-labels"><span>0 %</span><span>50 %</span><span>100 %</span></div>
     <div className="model-voter-count"><strong>{number(model.voters)}</strong><span>voličů z {number(inputs.electorate)}</span></div>
     <p className="turnout-help"><Info size={14}/><span>Při stejných podílech stran účast obvykle nemění mandáty, pouze počty hlasů. Rozdíl může vzniknout zaokrouhlením na celé voliče.</span></p>
     <details className="model-electorate"><summary>{inputs.electorate===historical.registered?'Základna: seznamy voličů z roku 2022 · upravit':'Vlastní počet oprávněných voličů · upravit'}</summary><label><span>Počet voličů v seznamech</span><input type="number" min="1" max="1000000" step="1" value={inputs.electorate} onFocus={e=>e.currentTarget.select()} onChange={e=>{const n=e.currentTarget.valueAsNumber;if(Number.isFinite(n))setInputs(s=>({...s,electorate:Math.round(clamp(n,1,1000000))}));}}/></label><p>Výchozí základna {number(historical.registered)} je skutečný počet zapsaných voličů v roce 2022. Pro rok 2026 ji můžete upravit; nejde o zveřejněný počet pro letošní volby.</p></details>
    </section>
    <section className="model-card support-card">
     <div className="model-section-heading"><div><span className="section-kicker">02 · KOHO BUDOU VOLIT</span><h2>Podpora kandidátek</h2></div><span className="sum-badge">Součet 100 %</span></div>
     <p className="model-helper">Podíl účastníků, kteří označí celou kandidátku. Změna posuvníku poměrně upraví ostatní podíly. Zámek udrží vybraný podíl pevný.</p>
     <div className="model-sliders">{base.parties.map(p=>{
      const locked=inputs.locked.includes(p.id),adjustable=ids.some(id=>id!==p.id&&!inputs.locked.includes(id));
      const maximum=(1000-inputs.locked.filter(id=>id!==p.id).reduce((s,id)=>s+inputs.shares[id],0))/10;
      return <div key={p.id} className={`model-party-control ${locked?'is-locked':''}`} style={{'--party-color':color(p),'--range-fill':`${inputs.shares[p.id]/10}%`} as CSSProperties}>
       <div className="model-party-heading"><span className="ballot-number">{p.id}</span><label htmlFor={`model-share-${p.id}`} title={p.name}>{shortName(p)}</label><label className="model-number"><input id={`model-share-${p.id}`} type="number" min="0" max={maximum} step="0.1" value={inputs.shares[p.id]/10} disabled={locked||!adjustable} onFocus={e=>e.currentTarget.select()} onChange={e=>setShare(p.id,e.currentTarget.valueAsNumber)} aria-label={`Podíl voličů: ${shortName(p)}`}/><span>%</span></label><button className="model-lock" aria-pressed={locked} aria-label={`${locked?'Odemknout':'Zamknout'} podíl ${shortName(p)}`} title={locked?'Odemknout podíl':'Zamknout podíl'} onClick={()=>toggleLock(p.id)}>{locked?<LockKeyhole size={15}/>:<LockKeyholeOpen size={15}/>}</button></div>
       <input className="model-range" type="range" min="0" max="100" step="0.1" value={inputs.shares[p.id]/10} disabled={locked||!adjustable} onChange={e=>setShare(p.id,Number(e.target.value))} aria-label={`Nastavit podporu: ${shortName(p)}`} aria-valuetext={`${percent(inputs.shares[p.id]/10,1)}, ${number(model.partyVoters[p.id])} voličů`}/>
       <div className="model-party-meta"><span>{number(model.partyVoters[p.id])} voličů · {model.parties.find(x=>x.id===p.id)!.candidates} aktivních kandidátů</span><span>{locked?'Zamčeno':!adjustable?'Ostatní podíly jsou zamčené':''}</span></div>
      </div>;
     })}</div>
     <div className="model-reset"><button onClick={()=>setInputs({...defaults,shares:equalShares(ids),locked:[]})}><RotateCcw size={14}/>Obnovit výchozí model</button><span>Rovnoměrná podpora · účast 35 %</span></div>
    </section>
   </div>
   <div className="model-outcome">
    <section className="model-card model-seats-card">
     <div className="model-section-heading"><div><span className="section-kicker">03 · VÝSLEDEK VAŠEHO SCÉNÁŘE</span><h2><Landmark size={20}/>Rozdělení mandátů</h2></div><span className="model-seat-total">{base.seats}<small>křesel</small></span></div>
     <div className="model-seat-visual" aria-label="Modelové rozdělení 27 mandátů"><div className="seat-strip">{model.parties.flatMap(p=>Array.from({length:model.mandates.parties[p.id].min},(_,i)=><i key={`${p.id}-${i}`} style={{background:color(p)}} title={`${shortName(p)} · mandát ${i+1}`}/>))}{Array.from({length:base.seats-model.mandates.allocated},(_,i)=><i key={`undecided-${i}`} className="unallocated" title={model.mandates.lotterySeats?'Závisí na losu':'Bez přiděleného mandátu'}/>)}</div><div className="model-seat-caption"><span>{number(model.totalVotes)} kandidátských hlasů</span><span>Většina: <strong>{majority} mandátů</strong></span></div></div>
     {!model.mandates.available&&<p className="model-alert">Při nulovém počtu hlasujících nelze rozdělit mandáty. Zvyšte účast.</p>}
     {model.mandates.lotterySeats>0&&<p className="model-alert">Přesná shoda: {model.mandates.lotterySeats} mandátů závisí na losu. Rozpětí a možné kandidáty zobrazujeme bez určení vítěze losu.</p>}
     {model.mandates.threshold<5&&model.mandates.available&&<p className="model-alert">V tomto scénáři se podle volebních pravidel snižuje vstupní kvórum na {model.mandates.threshold} %.</p>}
     <div className="model-results-scroll"><table className="model-results"><thead><tr><th>Kandidátka</th><th>Podíl hlasů</th><th>Mandáty</th></tr></thead><tbody>{model.parties.map(p=>{const m=model.mandates.parties[p.id];return <tr key={p.id}><td><span className="model-result-name"><i style={{background:color(p)}}/>{shortName(p)}</span><small>{number(p.votes)} hlasů{model.mandates.available&&!m.eligible?' · pod kvórem':''}</small></td><td>{percent(p.share)}</td><td><strong>{!model.mandates.available?'—':m.seats??`${m.min}–${m.max}`}</strong>{m.min>=majority&&<small>většina</small>}</td></tr>;})}</tbody></table></div>
     <div className="model-result-note"><Info size={16}/><p><strong>Podíl voličů a podíl hlasů nejsou totéž.</strong> Volba celé listiny dává jeden hlas každému aktivnímu kandidátovi. SPOLEČNÁ LEVICE PRO TŘINEC má 25 aktivních kandidátů, ostatní listiny 27. Mandáty se přepočítávají z těchto kandidátských hlasů.</p></div>
    </section>
    <MajorityCalculator parties={model.parties} estimate={model.mandates}/>
    <div className="model-context-note"><SlidersHorizontal size={16}/><p>Jde o váš model, nikoli průzkum nebo předpověď. Výchozí podpora je rozdělená rovnoměrně. {stored?'Rozpracovaný model se automaticky ukládá v tomto prohlížeči. Pojmenované varianty uložíte tlačítkem výše.':'Automatické uložení rozpracovaného modelu v tomto prohlížeči není dostupné.'}</p></div>
   </div>
  </div>
  <section className="model-card model-elected-section">
   <div className="model-section-heading"><div><span className="section-kicker">04 · KONKRÉTNÍ JMÉNA</span><h2>Kdo by získal mandát</h2></div><span className="model-elected-count">{model.mandates.available?`${model.mandates.allocated} přidělených${model.mandates.lotterySeats?` + ${model.mandates.lotterySeats} podle losu`:''}`:'Čeká na nenulovou účast'}</span></div>
   <p className="model-helper">Všichni aktivní kandidáti jedné listiny mají v tomto modelu stejný počet hlasů. Rozhoduje proto původní pořadí na kandidátce.</p>
   {model.elected.length>0?<div className="model-candidate-grid">{model.parties.filter(p=>model.mandates.parties[p.id].max>0).map(p=>{const m=model.mandates.parties[p.id];return <article className="model-candidate-list" key={p.id} style={{'--party-color':color(p)} as CSSProperties}><header><h3>{shortName(p)}</h3><strong>{m.seats??`${m.min}–${m.max}`}</strong></header><ol>{model.elected.filter(c=>c.partyId===p.id).map(c=><li key={c.id} value={c.order} className={c.certain?'':'possible-seat'}><span className="model-candidate-order">{c.order}.</span><div><strong>{c.name}</strong><small>{number(c.votes)} hlasů{!c.certain?' · mandát závisí na losu':''}</small></div></li>)}</ol></article>;})}</div>:<div className="model-empty">Nastavte nenulovou účast. Zde se zobrazí jména podle vašeho scénáře.</div>}
  </section>
  <SensitivityPanel inputs={inputs} parties={model.parties} candidates={candidates} seats={base.seats} onApply={setInputs}/>
  <details className="model-card model-method"><summary><Info size={17}/>Předpoklady a způsob výpočtu</summary><div><p>Model používá kandidátky Třince pro rok 2026 a rozděluje 27 mandátů. Všichni účastníci odevzdají platný hlas a označí právě jednu celou listinu. Nepočítáme jednotlivé křížky ani kombinování kandidátek.</p><p>Počet účastníků je počet oprávněných voličů × účast, zaokrouhlený na celé lidi. Mezi listiny se rozdělí podle nastavených podílů; zbývající jednotliví voliči připadnou největším desetinným zbytkům, při shodě podle čísla listiny. To je pouze konvence modelu pro zaokrouhlení voličů.</p><p>Každý aktivní kandidát získá tolik hlasů, kolik voličů označilo jeho listinu. Součet těchto hlasů určuje zisk strany. Mandáty přiděluje d’Hondtova metoda s upraveným vstupním kvórem pro kratší kandidátky. Přesnou shodu vyžadující los zobrazujeme jako rozpětí; hraniční kandidáty označujeme zvlášť.</p><p>Kandidátní registr ČSÚ byl ověřen 9. 10. 2026. Na listině SPOLEČNÁ LEVICE PRO TŘINEC jsou neaktivní kandidáti na původních pozicích 6 a 22; model je vynechává. Původní čísla ostatních kandidátů zůstávají zachována.</p><a href="https://csu.gov.cz/docs/107516/60133edd-7ea3-d25d-d3d0-c2ed275d42b3/rozdelovanimandatuzo26.pdf?version=1.1" target="_blank" rel="noreferrer">Metodika přidělování mandátů ČSÚ ↗</a></div></details>
 </section>;
}
