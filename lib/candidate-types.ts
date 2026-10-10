import type {Party} from './types';
export type Candidate={id:string;partyId:number;order:number;name:string;active:boolean;age?:number;profession?:string};
export type CandidateSnapshot={generatedAt:string;fetchedAt:string;counted:number;complete:boolean;votes:Record<string,number>;parties:Party[];elected:Record<string,boolean>;sequence?:number;registered:number|null;issued:number|null};
export type CandidateState={city:CandidateSnapshot|null;precincts:Record<string,CandidateSnapshot>;cityError:string|null;precinctError:string|null;checkedAt:string|null;pendingPrecincts:number};
export const EMPTY_CANDIDATES:CandidateState={city:null,precincts:{},cityError:null,precinctError:null,checkedAt:null,pendingPrecincts:0};
