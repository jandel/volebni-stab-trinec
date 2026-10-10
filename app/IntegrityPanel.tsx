'use client';
import {CheckCircle2,Info,ShieldCheck} from 'lucide-react';
import type {Integrity} from '@/lib/integrity';
import type {ArchiveStatus} from '@/lib/history-types';
import {sourceTime} from '@/lib/display';
export default function IntegrityPanel({report,archive}:{report:Integrity;archive:ArchiveStatus}){
 return <section className={`integrity-panel integrity-${report.status}`} aria-label="Kontrola shody dat"><details open={report.status==='mismatch'}><summary><ShieldCheck size={18}/><strong>{report.label}</strong><span>Kontrola dat</span></summary><div className="integrity-checks">{report.checks.length?report.checks.map(c=><article key={c.key} className={`check-${c.status}`}><div>{c.status==='ok'?<CheckCircle2 size={15}/>:<Info size={15}/>}<strong>{c.label}</strong></div><p>{c.detail}</p></article>):<p>Kontroly se spustí po prvním sečteném okrsku. Prázdný výsledek nepovažujeme za nulu hlasů.</p>}</div><p className="integrity-times">Čas souhrnu města: {sourceTime(report.cityTime)} · kandidáti: {sourceTime(report.candidateTime)} (Praha). Shoda znamená shodu dostupných součtů, nikoli odhad zbývajících okrsků.</p></details>{archive.error&&<p className="archive-error" role="status"><Info size={15}/>{archive.error}</p>}</section>;
}
