'use client';
import { useEffect,useState } from 'react';
import { audits as auditSeed,type Audit } from '@/data/audits';
import { auditPrograms as programSeed,type AuditProgram } from '@/data/programs';
import { recurrenceSeed,type AuditRecurrence } from '@/data/recurrences';

const AUDITS_KEY='qms-audits-v1';const PROGRAMS_KEY='qms-programs-v1';const RECURRENCES_KEY='qms-recurrences-v1';const EVENT='qms-data-change';
function read<T>(key:string,seed:T):T{if(typeof window==='undefined')return seed;try{return JSON.parse(localStorage.getItem(key)??'null')??seed}catch{return seed}}
function write<T>(key:string,value:T){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new CustomEvent(EVENT,{detail:key}))}
function normalizeAudit(audit:Audit):Audit{return audit.status==='Awaiting Closure'?{...audit,status:'Review & Report'}:audit}
function readAudits(){const stored=read<Audit[]>(AUDITS_KEY,auditSeed).map(normalizeAudit);return[...stored,...auditSeed.filter(seed=>!stored.some(item=>item.id===seed.id)).map(normalizeAudit)]}
function readPrograms(){const stored=read<AuditProgram[]>(PROGRAMS_KEY,programSeed);return[...stored,...programSeed.filter(seed=>!stored.some(item=>item.id===seed.id))]}
function readRecurrences(){return read<AuditRecurrence[]>(RECURRENCES_KEY,recurrenceSeed)}
export function useQmsAudits(){const [items,setItems]=useState<Audit[]>(auditSeed);useEffect(()=>{const sync=()=>setItems(readAudits());sync();const handler=(e:Event)=>{if((e as CustomEvent).detail===AUDITS_KEY)sync()};window.addEventListener(EVENT,handler);return()=>window.removeEventListener(EVENT,handler)},[]);return items}
export function useQmsPrograms(){const [items,setItems]=useState<AuditProgram[]>(programSeed);useEffect(()=>{const sync=()=>setItems(readPrograms());sync();const handler=(e:Event)=>{if((e as CustomEvent).detail===PROGRAMS_KEY)sync()};window.addEventListener(EVENT,handler);return()=>window.removeEventListener(EVENT,handler)},[]);return items}
export function saveAudit(audit:Audit,programId?:string){const current=readAudits();write(AUDITS_KEY,[audit,...current.filter(a=>a.id!==audit.id)]);if(programId){const programs=readPrograms().map(p=>p.id===programId?{...p,auditIds:Array.from(new Set([audit.id,...p.auditIds])),lastUpdated:'Just now'}:p);write(PROGRAMS_KEY,programs)}}
export function saveAuditSeries(items:Audit[],recurrence:AuditRecurrence,programId?:string){const ids=new Set(items.map(item=>item.id));write(AUDITS_KEY,[...items,...readAudits().filter(item=>!ids.has(item.id))]);write(RECURRENCES_KEY,[recurrence,...readRecurrences().filter(item=>item.id!==recurrence.id)]);if(programId){const programs=readPrograms().map(program=>program.id===programId?{...program,auditIds:Array.from(new Set([...items.map(item=>item.id),...program.auditIds])),lastUpdated:'Just now'}:program);write(PROGRAMS_KEY,programs)}}
export function updateAudit(id:string,changes:Partial<Audit>){const current=readAudits();const audit=current.find(a=>a.id===id);if(audit)saveAudit({...audit,...changes},changes.programId??audit.programId)}
export function savePrograms(programs:AuditProgram[]){write(PROGRAMS_KEY,programs)}
export function nextAuditId(items:Audit[],year=2026){const highest=Math.max(...items.filter(item=>item.id.startsWith(`AUD-${year}-`)).map(a=>Number(a.id.split('-').pop())).filter(Number.isFinite),0);return `AUD-${year}-${String(highest+1).padStart(3,'0')}`}
export function nextRecurrenceId(year:number){const highest=Math.max(...readRecurrences().filter(item=>item.id.startsWith(`REC-${year}-`)).map(item=>Number(item.id.split('-').pop())).filter(Number.isFinite),0);return `REC-${year}-${String(highest+1).padStart(3,'0')}`}
