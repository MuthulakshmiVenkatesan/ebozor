'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getVerificationStatusApi } from '@/utils/api'
import ReSubmitAccount from './ReSubmitAccount'
import VerifiedAccount from './VerifiedAccount'
import UnverifiedAccount from './UnverifiedAccount'

const VerifiedMain = ({ showTickBadge = true, showVerifiedBadge = true }) => {
    const isUserLoggedIn = useSelector((state) => !!state?.UserSignup?.data?.token)
    const [verificationStatus, setVerificationStatus] = useState('not_applied')

    const refreshVerificationStatus = useCallback(async () => {
        try {
            const res = await getVerificationStatusApi.getVerificationStatus()
            if (res?.data?.error === true) {
                setVerificationStatus('not_applied')
                return
            }
            const status = String(res?.data?.data?.status || '').trim().toLowerCase()
            setVerificationStatus(status || 'not_applied')
        } catch {
            setVerificationStatus('not_applied')
        }
    }, [])

    useEffect(() => {
        if (!isUserLoggedIn) {
            setVerificationStatus('not_applied')
            return
        }
        refreshVerificationStatus()
    }, [isUserLoggedIn, refreshVerificationStatus])

    if (!isUserLoggedIn) {
        return <UnverifiedAccount showVerifiedBadge={showVerifiedBadge} />
    }

    if (verificationStatus === 'approved') {
        return null
    }

    if (verificationStatus === 'rejected') {
        return <ReSubmitAccount onVerificationSubmitted={refreshVerificationStatus} />
    }

    if (
        verificationStatus === 'pending' ||
        verificationStatus === 'submitted' ||
        verificationStatus === 'resubmitted'
    ) {
        return (
            <VerifiedAccount
                onVerificationSubmitted={refreshVerificationStatus}
                showTickBadge={showTickBadge}
            />
        )
    }

    return (
        <UnverifiedAccount
            showVerifiedBadge={showVerifiedBadge}
            onVerifiedSuccess={refreshVerificationStatus}
        />
    )
}

export default VerifiedMain
