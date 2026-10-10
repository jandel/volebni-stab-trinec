import type {Election,Precinct,LiveState} from './types';
import type {CandidateSnapshot,CandidateState} from './candidate-types';
import type {Integrity} from './integrity';
export type ArchiveStatus={error:string|null;lastSuccess:string|null};
export type DataBundle={live:LiveState;candidates:CandidateState;integrity:Integrity;archive:ArchiveStatus};
export type HistoryPayload={city:Election;candidateCity:CandidateSnapshot|null;precincts:Record<string,Precinct>;integrity:Integrity};
export type HistoryRow={id:number;observedAt:string;payload:HistoryPayload};
export type HistoryIndex={id:number;observedAt:string;city:Election;integrity:Integrity;elected:string[]|null;possible:string[];candidateTime:string|null;candidateCounted:number};
export type HistoryPage={items:HistoryIndex[];nextBefore:number|null;archive:ArchiveStatus};
