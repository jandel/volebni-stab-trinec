'use client';
import {Sparkles,ChevronDown} from 'lucide-react';
import type {AnalysisSummary,CommentaryLanguage} from '@/lib/coverage-types';
const time=(s:string)=>new Date(s).toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});
export default function CoverageSummary({summary,language,expanded=false}:{summary:Omit<AnalysisSummary,'demo'|'factIds'>&{demo?:boolean};language:CommentaryLanguage;expanded?:boolean}){
 const text=summary.text[language];
 return <article className="coverage-ai-card"><div className="coverage-ai-meta"><span><Sparkles size={14}/>{summary.demo?'AI ANALÝZA · SMYŠLENÁ UKÁZKA':'HODINOVÁ AI ANALÝZA'}</span><time>{time(summary.asOf)}</time></div><h3>{text.title}</h3><p>{text.paragraphs[0]}</p><details open={expanded||undefined}><summary>Celá analýza a co sledovat dál <ChevronDown size={15}/></summary><div>{text.paragraphs.slice(1).map((p,i)=><p key={i}>{p}</p>)}<h4>Co sledovat dál</h4><ul>{text.watch.map((p,i)=><li key={i}>{p}</li>)}</ul></div></details><footer>Podklady {time(summary.periodFrom)}–{time(summary.asOf)}{summary.demo?' · modelový čas':` · stav č. ${summary.sourceId}`} · AI interpretace uvedených dat</footer></article>;
}
