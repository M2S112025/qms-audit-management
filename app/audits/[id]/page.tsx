import { AuditWorkspace } from '@/components/audits/audit-workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AuditWorkspace id={id}/>}
