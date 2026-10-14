'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import ProfileLanding from '@/components/PagesComponent/JobDashboard/pages/ProfileLanding'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { getUserDetailApi } from '@/utils/api'

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf('<link')
    const scriptIndex = payload.indexOf('<script')
    let cutIndex = -1
    if (debugAssetIndex >= 0 && scriptIndex >= 0) cutIndex = Math.min(debugAssetIndex, scriptIndex)
    else if (debugAssetIndex >= 0) cutIndex = debugAssetIndex
    else if (scriptIndex >= 0) cutIndex = scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch {
        return {}
    }
}

export default function JobDashboardMyProfilePage() {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [canShowLanding, setCanShowLanding] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const userId =
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null
        if (!userId) {
            setCanShowLanding(true)
            setIsLoading(false)
            return
        }

        let cancelled = false
        const run = async () => {
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const detail = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const hasPersonalProfile = String(detail?.personal_profile ?? '0') === '1'
                const hasCompanyProfile = String(detail?.company_profile ?? '0') === '1'
                const shouldShowLanding = !hasPersonalProfile && !hasCompanyProfile

                if (cancelled) return
                if (shouldShowLanding) {
                    setCanShowLanding(true)
                } else {
                    router.replace('/jobdashboard')
                }
            } catch {
                if (!cancelled) {
                    setCanShowLanding(true)
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [router, userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id])

    if (isLoading) return null
    if (!canShowLanding) return null
    return <ProfileLanding />
}
