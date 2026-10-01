import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PagePlaceholder } from '@/components/page-placeholder';
const pages:Record<string,[string,string]>={
 'audit-program':['Audit Program','Plan audit cycles, coverage and organizational schedules.'],audits:['Audits','Manage planned, active and completed audit records.'],findings:['Findings','Review nonconformities, observations and improvement opportunities.'],actions:['Corrective Actions','Track remediation, verification and closure activities.'],'audit-templates':['Audit Templates','Build reusable audit criteria and checklists.'],reports:['Reports','Analyze compliance trends and audit program performance.'],administration:['Administration','Configure organization settings, roles and reference data.'],help:['Help & Support','Access QMS guidance and support resources.']
};
export default async function Placeholder({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=pages[slug];if(!p)notFound();return <AppShell><PagePlaceholder title={p[0]} description={p[1]}/></AppShell>}
