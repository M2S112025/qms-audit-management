'use client';
import { useEffect, useState } from 'react';
import { actionSeed, type CorrectiveAction } from '@/data/actions';
import { getTodayISO } from '@/lib/date';
import { getFindings, updateFinding } from '@/lib/finding-store';

const KEY='qms-actions-v1';
const MIGRATION_KEY='qms-actions-canonical-v1';
const EVENT='qms-actions-change';

function legacyActions():CorrectiveAction[]{return getFindings().flatMap(f=>f.actions.map(a=>({id:a.id,findingId:f.id,auditId:a.auditId??f.auditId,title:a.title,description:a.description,type:a.type,status:a.status==='Completed'?'Completed':a.status==='In Progress'?'In Progress':'Planned',priority:a.priority,owner:a.owner,createdBy:f.createdBy,createdAt:f.createdAt,startDate:a.startDate,dueDate:a.dueDate,expectedOutcome:a.expectedOutcome,evidenceRequired:a.evidenceRequired,progress:a.status==='Completed'?100:a.status==='In Progress'?50:0,milestones:[],implementationPlan:'',implementationNotes:'',implementationSummary:'',actualCompletionDate:a.completedOn,outcome:a.effectiveness??'',evidence:[],comments:[],verificationAttempts:[],completedAt:a.completedOn,verifiedBy:a.completedBy,location:f.location,department:f.department,activity:[],updatedAt:f.createdAt} satisfies CorrectiveAction)))}
function rawRead():CorrectiveAction[]{if(typeof window==='undefined')return actionSeed;try{return JSON.parse(localStorage.getItem(KEY)??'null')??actionSeed}catch{return actionSeed}}
function migrate(){if(typeof window==='undefined'||localStorage.getItem(MIGRATION_KEY))return;const stored=rawRead();const legacy=legacyActions();const merged=[...stored,...legacy.filter(item=>!stored.some(existing=>existing.id===item.id))];localStorage.setItem(KEY,JSON.stringify(merged));getFindings().forEach(f=>{const ids=merged.filter(action=>action.findingId===f.id).map(action=>action.id);if(ids.length||f.actions.length)updateFinding(f.id,{correctiveActionIds:ids,actions:[]})});localStorage.setItem(MIGRATION_KEY,getTodayISO())}
function read(){migrate();return rawRead()}
function write(actions:CorrectiveAction[]){localStorage.setItem(KEY,JSON.stringify(actions));window.dispatchEvent(new Event(EVENT))}
export function useActions(){const [items,setItems]=useState<CorrectiveAction[]>(actionSeed);useEffect(()=>{const sync=()=>setItems(read());sync();window.addEventListener(EVENT,sync);return()=>window.removeEventListener(EVENT,sync)},[]);return items}
export function getActions(){return read()}
export function saveAction(action:CorrectiveAction){const next=[action,...read().filter(a=>a.id!==action.id)];write(next);syncFinding(action.findingId,next)}
export function updateAction(id:string,change:Partial<CorrectiveAction>|((action:CorrectiveAction)=>CorrectiveAction)){const next=read().map(a=>a.id===id?(typeof change==='function'?change(a):{...a,...change,updatedAt:getTodayISO()}):a);write(next);syncFinding(next.find(a=>a.id===id)?.findingId,next)}
function syncFinding(findingId:string|undefined,actions:CorrectiveAction[]){if(!findingId)return;const related=actions.filter(a=>a.findingId===findingId&&a.status!=='Cancelled');const complete=related.length>0&&related.every(a=>a.status==='Completed');updateFinding(findingId,f=>({...f,status:complete?'Awaiting Verification':'Action In Progress',correctiveActionIds:related.map(a=>a.id),actions:[]}))}
export function nextActionId(items:CorrectiveAction[]){const n=Math.max(...items.map(a=>Number(a.id.split('-').pop())).filter(Number.isFinite),23)+1;return`ACT-${new Date().getFullYear()}-${String(n).padStart(3,'0')}`}
