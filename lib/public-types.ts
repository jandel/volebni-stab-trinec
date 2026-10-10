import type {DataBundle,HistoryIndex} from './history-types';
import type {AnalysisSummary,CommentaryEvent} from './coverage-types';
export type PublicAnalysis=Omit<AnalysisSummary,'demo'|'factIds'>;
export type PublicCoverage={status:'waiting'|'active'|'paused'|'ended';events:CommentaryEvent[];summaries:PublicAnalysis[]};
export type PublicationInfo={id:string;publishedAt:string|null;sourceCheckedAt:string|null;contentHash?:string};
export type PublicSnapshot={schemaVersion:1;publication:PublicationInfo;state:DataBundle;history:HistoryIndex[];coverage?:PublicCoverage};
export type ClientData=DataBundle&{publication?:PublicationInfo;coverage?:PublicCoverage};
export type AutomaticPublication={enabled:boolean;intervalMinutes:number;nextCheckAt:string|null;lastCheckAt:string|null;expiresAt:string|null;lastResult:string|null};
export type PublishStatus={repository:string;publicUrl:string;configured:boolean;ownerConfigured:boolean;busy:boolean;lastSentAt:string|null;lastSnapshotId:string|null;lastCommit:string|null;lastCounted:number|null;verifiedAt:string|null;error:string|null;automatic:AutomaticPublication};
