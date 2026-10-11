export type ReportView='analysis'|'coalitions'|'representatives';
export const isReportView=(view:string):view is ReportView=>['analysis','coalitions','representatives'].includes(view);
export function parseReportHash(hash:string):{view:ReportView;personId:string|null}|null{
 const [view,detail]=hash.replace(/^#/,'').split('/');
 if(!isReportView(view))return null;
 return {view,personId:view==='representatives'&&/^\d+-\d+$/.test(detail??'')?detail:null};
}
