/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingOutlinedInput } from '../../ProductDetail/JobComponents/floatingFormFields'

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   initialCourseName?: string;
 *   initialOrganization?: string;
 *   onSave?: (data: { courseName: string; issuingOrganization: string }) => void;
 * }} props
 */
export default function LicensesCertificatesModal({
    open,
    onClose,
    initialCourseName = '',
    initialOrganization = '',
    onSave,
}) {
    const [courseName, setCourseName] = useState('')
    const [issuingOrganization, setIssuingOrganization] = useState('')
    const [attemptedSave, setAttemptedSave] = useState(false)

    useEffect(() => {
        if (!open) return
        setCourseName(initialCourseName == null ? '' : String(initialCourseName))
        setIssuingOrganization(initialOrganization == null ? '' : String(initialOrganization))
        setAttemptedSave(false)
    }, [open, initialCourseName, initialOrganization])

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
        setCourseName('')
        setIssuingOrganization('')
        setAttemptedSave(false)
    }, [])

    const trimmedCourseName = String(courseName).trim()
    const trimmedOrganization = String(issuingOrganization).trim()
    const courseNameError =
        trimmedCourseName !== '' && trimmedCourseName.length < 5 ? 'Ensure this field has at least 5 characters' : ''
    const organizationError =
        trimmedOrganization !== '' && trimmedOrganization.length < 5 ? 'Ensure this field has at least 5 characters' : ''
    const canSave = trimmedCourseName.length >= 5 && trimmedOrganization.length >= 5

    const handleSave = useCallback(() => {
        setAttemptedSave(true)
        if (!canSave) return
        onSave?.({
            courseName: String(courseName).trim(),
            issuingOrganization: String(issuingOrganization).trim(),
        })
        onClose()
    }, [canSave, courseName, issuingOrganization, onSave, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1255] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="licenses-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
            <div
                className="relative z-[1] flex max-h-[90vh] w-[500px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="licenses-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Licenses or Certificates
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[24px]">
                    <p className="mb-[20px] text-[14px] font-[Inter-Regular] leading-snug text-[#3a3f47]">
                        Add your licences and certifications such as, Driving licence, safety permits and any other type of skill based
                        certifications.
                    </p>
                    <div className="flex flex-col gap-[18px]">
                        <FloatingOutlinedInput
                            label="Course Name"
                            required
                            value={courseName}
                            onChange={setCourseName}
                            placeholder="Course Name"
                            autoComplete="off"
                        />
                        {courseNameError && (attemptedSave || trimmedCourseName.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{courseNameError}</p>
                        ) : null}
                        <FloatingOutlinedInput
                            label="Issuing organization"
                            required
                            value={issuingOrganization}
                            onChange={setIssuingOrganization}
                            placeholder="Issuing organization"
                            autoComplete="organization"
                        />
                        {organizationError && (attemptedSave || trimmedOrganization.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{organizationError}</p>
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
