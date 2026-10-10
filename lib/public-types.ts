import type {DataBundle,HistoryIndex} from './history-types';
export type PublicationInfo={id:string;publishedAt:string|null;sourceCheckedAt:string|null};
export type PublicSnapshot={schemaVersion:1;publication:PublicationInfo;state:DataBundle;history:HistoryIndex[]};
export type ClientData=DataBundle&{publication?:PublicationInfo};
export type PublishStatus={repository:string;publicUrl:string;configured:boolean;ownerConfigured:boolean;busy:boolean;lastSentAt:string|null;lastSnapshotId:string|null;lastCommit:string|null;lastCounted:number|null;verifiedAt:string|null;error:string|null};
