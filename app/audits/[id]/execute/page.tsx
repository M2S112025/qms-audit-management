import { AuditExecutionShell } from '@/components/execution/execution-shell';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AuditExecutionShell auditId={id}/>}
