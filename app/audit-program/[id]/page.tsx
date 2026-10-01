import { notFound } from 'next/navigation';
import { ProgramDetailPage } from '@/components/audit-program/program-detail';
import { auditPrograms } from '@/data/programs';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!auditPrograms.some(p=>p.id===id))notFound();return <ProgramDetailPage id={id}/>}
