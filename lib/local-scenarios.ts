import type {SavedScenario} from './scenarios';
import type {ModelInputs} from './model';
import {validModel} from './model';
import initial from '../data/initial-2026.json';
const key='trinec-public-scenarios-2026-v1',ids=initial.parties.map(p=>p.id);
export function parseLocalScenarios(raw:string|null):SavedScenario[]{
 if(raw===null)return [];const value=JSON.parse(raw);if(!Array.isArray(value)||value.length>12||value.some(s=>!s||typeof s.id!=='string'||!s.id||s.id.length>80||typeof s.name!=='string'||!s.name.trim()||s.name.length>60||!Number.isFinite(s.created)||!Number.isFinite(s.updated)||!validModel(s.inputs,ids)))throw Error('Uložené scénáře v tomto prohlížeči mají neplatný formát.');
 return value.map(s=>({id:s.id,name:s.name,inputs:s.inputs,created:s.created,updated:s.updated}));
}
const local=()=>parseLocalScenarios(localStorage.getItem(key));
export async function readScenarios():Promise<SavedScenario[]>{return local();}
export async function saveScenario(name:string,inputs:ModelInputs):Promise<SavedScenario>{const items=local();if(items.length>=12)throw Error('Lze uložit nejvýše 12 scénářů. Některý nejprve smažte.');if(!name.trim()||name.trim().length>60||!validModel(inputs,ids))throw Error('Zadejte platný název a model.');const now=Date.now(),item={id:crypto.randomUUID(),name:name.trim(),inputs:structuredClone(inputs),created:now,updated:now};try{localStorage.setItem(key,JSON.stringify([...items,item]));}catch{throw Error('Prohlížeč nepovolil uložení scénáře.');}return item;}
export async function deleteScenario(id:string){try{localStorage.setItem(key,JSON.stringify(local().filter(s=>s.id!==id)));}catch{throw Error('Scénář se nepodařilo smazat v tomto prohlížeči.');}}
