/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingOutlinedInput } from '../../ProductDetail/JobComponents/floatingFormFields'

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   initialRefName?: string;
 *   initialCompanyName?: string;
 *   initialEmail?: string;
 *   onSave?: (data: { refName: string; companyName: string; email: string }) => void;
 * }} props
 */
export default function ReferenceModal({
    open,
    onClose,
    initialRefName = '',
    initialCompanyName = '',
    initialEmail = '',
    onSave,
}) {
    const [refName, setRefName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [email, setEmail] = useState('')
    const [attemptedSave, setAttemptedSave] = useState(false)

    const isValidEmail = useCallback((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim()), [])

    useEffect(() => {
        if (!open) return
        setRefName(initialRefName == null ? '' : String(initialRefName))
        setCompanyName(initialCompanyName == null ? '' : String(initialCompanyName))
        setEmail(initialEmail == null ? '' : String(initialEmail))
        setAttemptedSave(false)
    }, [open, initialRefName, initialCompanyName, initialEmail])

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

    const reset = useCallback(() => {
        setRefName('')
        setCompanyName('')
        setEmail('')
        setAttemptedSave(false)
    }, [])

    const trimmedRefName = String(refName).trim()
    const trimmedCompanyName = String(companyName).trim()
    const trimmedEmail = String(email).trim()
    const refNameError = trimmedRefName !== '' && trimmedRefName.length < 3 ? 'Ensure this field has at least 3 characters' : ''
    const companyNameError =
        trimmedCompanyName !== '' && trimmedCompanyName.length < 3 ? 'Ensure this field has at least 3 characters' : ''
    const emailError = trimmedEmail !== '' && !isValidEmail(trimmedEmail) ? 'Please enter a valid email' : ''
    const canSave =
        trimmedRefName.length >= 3 && trimmedCompanyName.length >= 3 && trimmedEmail !== '' && isValidEmail(trimmedEmail)

    const handleSave = useCallback(() => {
        setAttemptedSave(true)
        if (!canSave) return
        onSave?.({
            refName: String(refName).trim(),
            companyName: String(companyName).trim(),
            email: String(email).trim(),
        })
        onClose()
    }, [canSave, refName, companyName, email, onSave, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1255] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="reference-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
            <div
                className="relative z-[1] flex max-h-[90vh] w-[500px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="reference-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Reference
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[24px]">
                    <p className="mb-[20px] text-[14px] font-[Inter-Regular] leading-snug text-[#3a3f47]">
                        Add details of your previous employer for background and experience check.
                    </p>
                    <div className="flex flex-col gap-[18px]">
                        <FloatingOutlinedInput label="Name" required value={refName} onChange={setRefName} placeholder="Name" autoComplete="name" />
                        {refNameError && (attemptedSave || trimmedRefName.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{refNameError}</p>
                        ) : null}
                        <FloatingOutlinedInput
                            label="Company Name"
                            required
                            value={companyName}
                            onChange={setCompanyName}
                            placeholder="Company Name"
                            autoComplete="organization"
                        />
                        {companyNameError && (attemptedSave || trimmedCompanyName.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{companyNameError}</p>
                        ) : null}
                        <FloatingOutlinedInput
                            label="Email"
                            required
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="Email"
                            autoComplete="email"
                        />
                        {emailError && (attemptedSave || trimmedEmail.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{emailError}</p>
                        ) : null}
                    </div>
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                    <div className="flex items-center justify-end gap-[8px]">
                        <button
                            type="button"
                            onClick={reset}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[6px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_16px] text-[14px] font-[Inter-SemiBold] ${
                                canSave ? 'cursor-pointer bg-[#23262a] text-white' : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'
                            }`}
                        >
                            Save
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}
