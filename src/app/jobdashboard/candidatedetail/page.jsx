import { Suspense } from 'react'
import CandidateDetail from '@/components/PagesComponent/JobDashboard/pages/CandidateDetai'

export default function JobDashboardCandidateDetailPage() {
    return (
        <Suspense fallback={<div className="p-[24px] text-[14px] font-[Inter-Regular] text-[#666b72]">Loading…</div>}>
            <CandidateDetail />
        </Suspense>
    )
}
