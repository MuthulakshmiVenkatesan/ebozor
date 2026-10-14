import { Suspense } from 'react'
import PaymentSummary from '@/components/PagesComponent/JobDashboard/pages/PaymentSummary'

export default function JobDashboardPaymentSummaryPage() {
    return (
        <Suspense fallback={null}>
            <PaymentSummary />
        </Suspense>
    )
}
