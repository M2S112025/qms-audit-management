import { AuditsListPage } from '@/components/audits/audit-list';
export default async function Page({searchParams}:{searchParams:Promise<{new?:string}>}){const params=await searchParams;return <AuditsListPage openNew={params.new==='true'}/>}
