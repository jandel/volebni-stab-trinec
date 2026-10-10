import type {HistoryIndex} from './history-types';

export function historyCandidateChanges(items:HistoryIndex[],index:number){
 const current=items[index];
 if(!current||current.elected===null)return null;
 for(let i=index-1;i>=0;i--){
  const previous=items[i];if(previous.elected===null)continue;
  return {previousId:previous.id,previousAt:previous.observedAt,added:current.elected.filter(id=>!previous.elected!.includes(id)),lost:previous.elected.filter(id=>!current.elected!.includes(id))};
 }
 return null;
}
