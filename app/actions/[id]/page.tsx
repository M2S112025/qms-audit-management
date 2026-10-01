import { Suspense } from 'react';
import { CorrectiveActionsWorkspace } from '@/components/actions/action-workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense><CorrectiveActionsWorkspace initialId={id}/></Suspense>}
