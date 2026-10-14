'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ModalCloseIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { userRejectionRuleApi } from '@/utils/api'

const RULE_DEFINITIONS = [
    {
        id: 'local',
        title: 'Local Candidates',
        description: 'Reject candidates not based in the UAE.',
        variant: 'brand',
    },
    {
        id: 'screening',
        title: 'Screening Questions',
        description: 'Reject candidates based on the questions asked in the job post.',
        variant: 'success',
    },
    {
        id: 'experience',
        title: 'Experience',
        description: 'Reject candidates based on the job function and experience for each.',
        variant: 'brand',
    },
    {
        id: 'education',
        title: 'Minimum Education',
        description: 'Reject candidates based on their minimum education.',
        variant: 'brand',
    },
    {
        id: 'gender',
        title: 'Gender',
        description: 'Reject candidates based upon gender',
        variant: 'brand',
    },
    {
        id: 'nationality',
        title: 'Nationality',
        description: 'Reject candidates based upon their nationality.',
        variant: 'brand',
    },
]

function defaultEnabledMap() {
    return Object.fromEntries(RULE_DEFINITIONS.map((r) => [r.id, true]))
}

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

function enabledFromApi(data) {
    const next = defaultEnabledMap()
    next.local = String(data?.local_candidate ?? '0') === '1'
    next.screening = String(data?.screening_question ?? '0') === '1'
    next.experience = String(data?.experience ?? '0') === '1'
    next.education = String(data?.minimum_education ?? '0') === '1'
    next.gender = String(data?.gender ?? '0') === '1'
    next.nationality = String(data?.nationality ?? '0') === '1'
    return next
}

function payloadFromEnabled(userId, enabled) {
    return {
        user_id: userId,
        local_candidate: enabled?.local ? 1 : 0,
        screening_question: enabled?.screening ? 1 : 0,
        experience: enabled?.experience ? 1 : 0,
        minimum_education: enabled?.education ? 1 : 0,
        gender: enabled?.gender ? 1 : 0,
        nationality: enabled?.nationality ? 1 : 0,
    }
}

function RuleToggle({ checked, onChange, variant = 'brand' }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative h-[14px] w-[40px] flex-none cursor-pointer rounded-full p-0 transition-colors ${checked ? 'bg-[#13a811]' : 'bg-[#ff5540]'
                }`}
        >
            <span
                className={`pointer-events-none absolute left-[2px] top-[-2px] h-[18px] w-[18px] rounded-full bg-[#fafafa] shadow-[0_1px_4px_rgba(0,0,0,0.16)] transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-[-2px]'
                    }`}
            />
        </button>
    )
}

const RejectionRulesDrawer = ({ open, onClose }) => {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [enabled, setEnabled] = useState(defaultEnabledMap)
    const [initialEnabled, setInitialEnabled] = useState(defaultEnabledMap)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const resolvedUserId =
        userData?.id ??
        userData?.data?.id ??
        userData?.user?.id ??
        authRoot?.data?.id ??
        authRoot?.data?.data?.id ??
        authRoot?.data?.user?.id ??
        null

    const allSelected = useMemo(
        () => RULE_DEFINITIONS.every((r) => enabled[r.id]),
        [enabled]
    )

    const syncFromApi = useCallback(async () => {
        if (!resolvedUserId) {
            const d = defaultEnabledMap()
            setEnabled(d)
            setInitialEnabled(d)
            return
        }
        setIsLoading(true)
        try {
            const response = await userRejectionRuleApi.getUserRejectionRule({ user_id: resolvedUserId })
            const parsed = parseApiPayload(response?.data)
            const payload = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
            const mapped = enabledFromApi(payload)
            setEnabled(mapped)
            setInitialEnabled(mapped)
        } catch {
            const d = defaultEnabledMap()
            setEnabled(d)
            setInitialEnabled(d)
        } finally {
            setIsLoading(false)
        }
    }, [resolvedUserId])

    useEffect(() => {
        if (!open) return undefined
        syncFromApi()
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [open, onClose, syncFromApi])

    const setRule = (id, value) => {
        setEnabled((prev) => ({ ...prev, [id]: value }))
    }

    const toggleSelectAll = () => {
        const next = !allSelected
        setEnabled(Object.fromEntries(RULE_DEFINITIONS.map((r) => [r.id, next])))
    }

    const handleReset = () => {
        setEnabled(initialEnabled)
    }

    const handleSave = async () => {
        if (!resolvedUserId || isSaving) return
        setIsSaving(true)
        let saveSuccess = false
        try {
            await userRejectionRuleApi.saveUserRejectionRule(payloadFromEnabled(resolvedUserId, enabled))
            setInitialEnabled(enabled)
            saveSuccess = true
        } catch {
            /* keep current toggle UI; user can retry */
        } finally {
            setIsSaving(false)
        }
        if (saveSuccess && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jobdashboard-rejection-rules-updated'))
        }
        onClose?.()
    }

    if (!open || typeof document === 'undefined') return null

    return createPortal(
        <div className="fixed inset-0 z-[1300] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="rejection-rules-title">
            <button
                type="button"
                className="absolute inset-0 cursor-default bg-[rgba(0,0,0,0.45)]"
                aria-label="Close drawer"
                onClick={() => onClose?.()}
            />
            <div
                className="relative z-[1] flex h-full w-full max-w-[500px] flex-col bg-[#fff]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="shrink-0 [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] bg-[#fff] p-[30px_24px]">
                    <div className="flex flex-col items-start justify-between gap-[14px]">
                        <div className="min-w-0 flex items-center justify-between gap-[12px] w-full">
                            <h2 id="rejection-rules-title" className="text-[20px] font-[Inter-Medium] leading-tight text-[#23262a] ">
                                Add or Edit Rejection Rules
                            </h2>
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                className="flex shrink-0 cursor-pointer items-center justify-center "
                                aria-label="Close"
                            >
                                <ModalCloseIcon className="h-[24px] w-[24px]" fill="#8f8f8f" />
                            </button>
                        </div>
                        <p className="text-[14px] font-[Inter-Regular] leading-snug text-[#23262a]">
                            Rejected applications can be restored from your candidates list.
                        </p>
                    </div>
                </header>

                <div className="overflow-y-auto">

                    <div className="mt-[5px]">
                        <div className="rounded-[8px] bg-[#ffedea] p-[16px]">
                            <p className="text-[12px] font-[Inter-Regular] leading-[24px] text-[#23262A]">
                                Changing default rejection rules will override rules for current and future listings.
                            </p>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col bg-[#f5f5f5] p-[24px]">
                        <div className="mb-[14px] flex items-center justify-between gap-[12px]">
                            <h3 className="text-[14px] font-[Inter-SemiBold] text-[#666b72]">Attributes</h3>
                            <div className="flex items-center gap-[10px]">
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#666b72]">Select All</p>
                                <RuleToggle checked={allSelected} onChange={toggleSelectAll} variant="brand" />
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 space-y-[12px]">
                            {isLoading ? (
                                Array.from({ length: RULE_DEFINITIONS.length }).map((_, idx) => (
                                    <div
                                        key={`rejection-skeleton-${idx}`}
                                        className="rounded-[6px] bg-white p-[16px_16px] [box-shadow:0px_8px_10px_-5px_rgba(0,0,0,0.1),0px_16px_24px_2px_rgba(0,0,0,0.07),0px_6px_30px_5px_rgba(0,0,0,0.06)] animate-pulse"
                                    >
                                        <div className="h-[14px] w-[160px] rounded bg-[#eef1f4] mb-[8px]" />
                                        <div className="h-[12px] w-[80%] rounded bg-[#eef1f4]" />
                                    </div>
                                ))
                            ) : (
                                RULE_DEFINITIONS.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="flex items-start justify-between gap-[16px] rounded-[6px]  bg-white p-[16px_16px] [box-shadow:0px_8px_10px_-5px_rgba(0,0,0,0.1),0px_16px_24px_2px_rgba(0,0,0,0.07),0px_6px_30px_5px_rgba(0,0,0,0.06)]"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[14px] font-[Inter-Medium] text-[#23262a] mb-[6px]">{rule.title}</h4>
                                            <p className="text-[12px] font-[Inter-Regular] leading-relaxed text-[#000000] opacity-[0.54]">
                                                {rule.description}
                                            </p>
                                        </div>
                                        <RuleToggle
                                            checked={!!enabled[rule.id]}
                                            onChange={(v) => setRule(rule.id, v)}
                                            variant={rule.variant}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <footer className="shrink-0 bg-white p-[16px_24px]">
                    <div className="flex gap-[12px]">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isLoading || isSaving}
                            className="flex-1 cursor-pointer rounded-[6px] border border-[#23262A] bg-white py-[8px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading || isSaving}
                            className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[8px] text-[14px] font-[Inter-SemiBold] text-white transition"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    )
}

export default RejectionRulesDrawer
