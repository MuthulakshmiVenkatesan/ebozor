/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoryIcon, CloseIcon, TickIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { adReportApi } from '@/utils/api'

const MIN_DETAIL_CHARS = 20

const SPAM_SUBTYPES = ['Commercial', 'Offensive', 'Irrelevant', 'Other']

const REPORT_REASONS = [
    {
        id: 'spam',
        label: 'Spam',
        isSpam: true,
        textareaLabel: 'Please tell us why you believe this is spam',
        confirm: 'You have chosen to Report this as spam.',
    },
    {
        id: 'fraud',
        label: 'Fraud',
        textareaLabel: 'Please tell us why you believe this is fraud',
        confirm: 'You have chosen to report this as fraud.',
    },
    {
        id: 'miscategorized',
        label: 'Miscategorized',
        textareaLabel: 'Please tell us why you believe this is miscategorized',
        confirm: 'This Ad will be reviewed and recategorized accordingly.',
    },
    {
        id: 'hiring_closed',
        label: 'Hiring Is Closed',
        textareaLabel: 'Please tell us why you believe this hiring is closed',
        confirm: 'You have chosen to report this hiring as closed.',
    },
    {
        id: 'other',
        label: 'Other',
        textareaLabel: 'Please tell us why you are reporting this ad',
        confirm: 'You have chosen to report this ad.',
    },
]

/** Motors / classified vehicle listings — matches product “Report this listing” spec. */
const MOTORS_REPORT_REASONS = [
    {
        id: 'spam',
        label: 'Spam',
        isSpam: true,
        textareaLabel: 'Please tell us why you believe this is spam',
        confirm: 'You have chosen to Report this as spam.',
    },
    {
        id: 'fraud',
        label: 'Fraud',
        textareaLabel: 'Please tell us why you believe this is fraud',
        confirm: 'You have chosen to report this as fraud.',
    },
    {
        id: 'miscategorized',
        label: 'Miscategorized',
        textareaLabel: 'Please tell us why you believe this is miscategorized',
        confirm: 'This Ad will be reviewed and recategorized accordingly.',
    },
    {
        id: 'repetitive_listing',
        label: 'Repetitive Listing',
        textareaLabel: 'Please tell us why you believe this is a repetitive listing',
        confirm: 'You have chosen to report this as a repetitive listing.',
    },
    {
        id: 'copyright_infringement',
        label: 'Copyright Infringement',
        textareaLabel: 'Please describe the copyright concern',
        confirm: 'You have chosen to report copyright infringement.',
    },
    {
        id: 'not_available',
        label: 'Not Available',
        textareaLabel: 'Please tell us why you believe this item is not available',
        confirm: 'You have chosen to report this listing as not available.',
    },
    {
        id: 'incorrect_pricing',
        label: 'Incorrect Pricing',
        textareaLabel: 'Please tell us what is wrong with the pricing',
        confirm: 'You have chosen to report incorrect pricing.',
    },
]

function isMotorsReportMode(mode) {
    const m = String(mode || '').toLowerCase()
    return m === 'motors' || m === 'motor'
}

function resetState() {
    return {
        step: 'list',
        reasonId: null,
        spamSubtype: '',
        details: '',
    }
}

/**
 * Report listing: reason list → detail form (spam has sub-radios) → success message.
 */
export default function ReportListingModal({ open, onClose, brandName = 'ebozor', onSubmitReport, mode, productData }) {
    const [step, setStep] = useState('list')
    const [reasonId, setReasonId] = useState(null)
    const [spamSubtype, setSpamSubtype] = useState('')
    const [details, setDetails] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const userData = useSelector(userSignUpData)

    const motorsMode = isMotorsReportMode(mode)
    const activeReasons = motorsMode ? MOTORS_REPORT_REASONS : REPORT_REASONS

    useEffect(() => {
        if (!open) return
        const s = resetState()
        setStep(s.step)
        setReasonId(s.reasonId)
        setSpamSubtype(s.spamSubtype)
        setDetails(s.details)
    }, [open, motorsMode])

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const selectedReason = useMemo(() => {
        const list = motorsMode ? MOTORS_REPORT_REASONS : REPORT_REASONS
        return list.find((r) => r.id === reasonId) ?? null
    }, [motorsMode, reasonId])

    const canSubmit = useMemo(() => {
        if (!selectedReason) return false
        const len = details.trim().length
        if (len < MIN_DETAIL_CHARS) return false
        if (selectedReason.isSpam && !spamSubtype) return false
        return true
    }, [selectedReason, details, spamSubtype])

    const pickReason = useCallback((id) => {
        setReasonId(id)
        setSpamSubtype('')
        setDetails('')
        setStep('form')
    }, [])

    const goBackToList = useCallback(() => {
        setStep('list')
        setReasonId(null)
        setSpamSubtype('')
        setDetails('')
    }, [])

    const submitReport = useCallback(async () => {
        if (!canSubmit || !selectedReason || isSubmitting) return
        const userId = userData?.id
        const itemId = productData?.id
        if (!userId || !itemId) return
        const payload = {
            user_id: userId,
            item_id: itemId,
            report_type: selectedReason.id,
            report_text: details.trim(),
            spam_type: selectedReason.isSpam ? spamSubtype : undefined,
        }
        setIsSubmitting(true)
        try {
            await adReportApi.addReport(payload)
            onSubmitReport?.({
                reasonId: selectedReason.id,
                reasonLabel: selectedReason.label,
                spamSubtype: selectedReason.isSpam ? spamSubtype : undefined,
                details: details.trim(),
            })
            setStep('success')
        } catch (e) {
            console.error('Failed to submit ad report:', e)
        } finally {
            setIsSubmitting(false)
        }
    }, [canSubmit, selectedReason, spamSubtype, details, onSubmitReport, userData, productData, isSubmitting])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex max-h-[min(90vh,640px)] w-[500px] max-sm:w-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.14)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {step === 'list' ? (
                    <>
                        <header className="relative flex shrink-0 items-center justify-center p-[20px]">
                            <h2 className="text-center text-[18px] font-[Inter-SemiBold] text-[#23262A]">Report this listing</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-[16px] rtl:left-[16px] rtl:right-0 rtl:justify-end top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center p-[6px]"
                                aria-label="Close"
                            >
                                <CloseIcon className="h-[14px] w-[14px]" fill="#23262A" />
                            </button>
                        </header>
                        <ul
                            className={
                                motorsMode
                                    ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-[24px] pb-[20px] pt-[4px]'
                                    : 'min-h-0 flex-1 overflow-y-auto overscroll-contain p-[20px]'
                            }
                        >
                            {activeReasons.map((r) => (
                                <li
                                    key={r.id}
                                    className={
                                        motorsMode
                                            ? 'border-b border-[#EEEEEE] py-[16px] last:border-b-0'
                                            : 'border-b border-[rgba(143,143,143,0.25)] p-[16px_8px] last:border-b-0'
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => pickReason(r.id)}
                                        className="w-full cursor-pointer text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262a] transition-colors "
                                    >
                                        {r.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : null}

                {step === 'form' && selectedReason ? (
                    <>
                        <header className="flex justify-between items-center border-b border-[rgba(143,143,143,0.25)] p-[20px]">
                            <button
                                type="button"
                                onClick={goBackToList}
                                className="cursor-pointer"
                                aria-label="Back"
                            >
                                <CategoryIcon className="h-[20px] w-[20px] rotate-180" fill="#23262A" />
                            </button>
                            <h2 className="text-center text-[18px] font-[Inter-SemiBold] text-[#23262A]">Report this listing</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer"
                                aria-label="Close"
                            >
                                <CloseIcon className="h-[14px] w-[14px]" fill="#23262A" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[20px] py-[20px]">
                            <div className="mb-[30px] flex items-center justify-between rounded-[8px] border border-[#D0D0D0] p-[12px]">
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262a]">{selectedReason.label}</p>
                                <TickIcon className="h-[20px] w-[20px]" fill="#DC0000" />
                            </div>

                            {selectedReason.isSpam ? (
                                <div className="">
                                    <h4 className="mb-[16px] text-[18px] font-[Inter-Medium] text-[#23262a]">What kind of spam is it?</h4>
                                    <div className="flex flex-col gap-[12px]">
                                        {SPAM_SUBTYPES.map((opt) => (
                                            <label
                                                key={opt}
                                                className="relative flex cursor-pointer items-center gap-[10px] text-[14px] font-[Inter-Regular] text-[#23262a]"
                                            >
                                                <input
                                                    type="radio"
                                                    name="spam-subtype"
                                                    value={opt}
                                                    checked={spamSubtype === opt}
                                                    onChange={() => setSpamSubtype(opt)}
                                                    className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded-full 
                            checked:bg-[#fff] checked:border-[#666] cursor-pointer relative"
                                                />
                                                {spamSubtype === opt ? (
                                                    <div className='p-[6px] bg-[#666] rounded-[50%] absolute left-[5px] rtl:right-[5px] rtl:left-auto'></div>
                                                ) : null}
                                                <p className="text-[14px] font-[Inter-Regular] text-[#666]">{opt}</p>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className={selectedReason.isSpam ? 'mt-[20px]' : 'mt-[20px]'}>
                                <label className="mb-[8px] block text-[14px] font-[Inter-Regular] text-[#666]" htmlFor="report-details">
                                    {selectedReason.textareaLabel}
                                </label>
                                <textarea
                                    id="report-details"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    rows={3}
                                    required
                                    minLength={MIN_DETAIL_CHARS}
                                    className="w-full resize-none rounded-[8px] border border-[#D0D0D0] p-[12px] text-[14px] font-[Inter-Regular] text-[#23262a] outline-none focus:border-[#23262a]"
                                    placeholder=""
                                />
                                <p className="mt-[6px] text-right text-[12px] font-[Inter-Regular] text-[#666]">
                                    Minimum {MIN_DETAIL_CHARS} characters
                                </p>
                            </div>

                            <p className="mt-[16px] text-center text-[14px] font-[Inter-SemiBold] leading-snug text-[#6B7280]">
                                {selectedReason.confirm}
                            </p>

                            <button
                                type="button"
                                disabled={!canSubmit || isSubmitting}
                                onClick={submitReport}
                                className={`mt-[20px] w-full rounded-[8px] py-[10px] text-[14px] font-[Inter-SemiBold] ${canSubmit && !isSubmitting ? 'cursor-pointer bg-[#23262a] text-white' : 'cursor-not-allowed bg-[#C5C8CE] text-[#666] opacity-50'
                                    }`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                ) : null}

                {step === 'success' ? (
                    <>
                        <header className="relative flex shrink-0 items-center justify-center border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                            <h2 className="text-center text-[17px] font-[Inter-SemiBold] text-[#23262A]">Report this listing</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-[16px] rtl:left-[16px] rtl:right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center p-[6px]"
                                aria-label="Close"
                            >
                                <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                            </button>
                        </header>
                        <div className="px-[24px] py-[28px] text-center">
                            <p className="text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262a]">
                                You have successfully reported this listing. Your feedback is important in helping us keep {brandName}{' '}
                                safe. Our team will review this shortly and take the appropriate action
                            </p>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
}

export function ReportAdFlagIcon({ className = '' }) {
    return (
        <svg
            className={className}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path d="M5 21V3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <path
                d="M5 4h11l-1.5 3.5L16 11H5V4z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    )
}
