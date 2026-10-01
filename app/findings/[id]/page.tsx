import { Suspense } from 'react';
import { FindingsWorkspace } from '@/components/findings/findings-workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense><FindingsWorkspace initialId={id}/></Suspense>}
