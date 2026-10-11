'use client';
import {ArrowRight,BarChart3,Handshake,Users} from 'lucide-react';
import type {ReportView} from '@/lib/report-navigation';
import './post-election.css';

export default function ReportsNav({view,onChange}:{view:ReportView;onChange:(view:ReportView)=>void}){
 const items=[{id:'analysis' as const,title:'Výsledky 2022–2026',description:'Mapy, grafy a změny podpory',Icon:BarChart3},{id:'coalitions' as const,title:'Možné koalice',description:'9 většinových variant a průniky',Icon:Handshake},{id:'representatives' as const,title:'Zvolení zastupitelé',description:'27 profilů a jejich záměry',Icon:Users}];
 return <nav className="reports-nav" aria-label="Analýzy a přehledy">{items.map(({id,title,description,Icon})=><button key={id} className={view===id?'selected':''} aria-current={view===id?'page':undefined} onClick={()=>onChange(id)}><Icon size={22}/><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={15}/></button>)}</nav>;
}
