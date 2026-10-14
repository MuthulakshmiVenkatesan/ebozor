'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingOutlinedInput, FloatingSearchSelect } from '../../ProductDetail/JobComponents/floatingFormFields'

const VISA_OPTIONS = [
    'Not Applicable',
    'Business',
    'Employment',
    'Residence',
    'Spouse',
    'Student',
    'Tourist',
    'Visit',
].map((v) => ({ value: v, label: v }))

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'].map((v) => ({ value: v, label: v }))

const COUNTRIES = ['Albania', 'United Arab Emirates', 'India', 'Pakistan', 'Philippines', 'United Kingdom', 'United States']

const NATIONALITY_LABELS = {
    Albania: 'Albanian',
    'United Arab Emirates': 'Emirati',
    India: 'Indian',
    Pakistan: 'Pakistani',
    Philippines: 'Filipino',
    'United Kingdom': 'British',
    'United States': 'American',
}

const NATIONALITY_OPTIONS = COUNTRIES.map((c) => {
    const label = NATIONALITY_LABELS[c] || c
    return { value: label, label }
})

/** @typedef {'visaStatus' | 'languages' | 'dateOfBirth' | 'gender' | 'nationality'} BasicModalField */

const FIELD_CONFIG = {
    visaStatus: {
        kind: 'select',
        label: 'Visa Status',
        required: true,
        options: VISA_OPTIONS,
        emptyPlaceholder: 'Select',
    },
    languages: {
        kind: 'text',
        label: 'Languages',
        required: true,
        placeholder: 'e.g. English, Arabic',
    },
    dateOfBirth: {
        kind: 'date',
        label: 'Date of Birth',
        required: true,
    },
    gender: {
        kind: 'select',
        label: 'Gender',
        required: true,
        options: GENDER_OPTIONS,
        emptyPlaceholder: 'Select',
    },
    nationality: {
        kind: 'select',
        label: 'Nationality',
        required: true,
        options: NATIONALITY_OPTIONS,
        emptyPlaceholder: 'Select',
    },
}

/**
 * Basic Info dialog for job profile empty-state fields (visa, languages, DOB, gender, nationality).
 *
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   field: BasicModalField | null;
 *   initialValue?: string;
 *   onSave?: (field: BasicModalField, value: string) => void;
 * }} props
 */
export default function CommonBasicModal({ open, onClose, field = null, initialValue = '', onSave }) {
    const [draft, setDraft] = useState('')

    const meta = field ? FIELD_CONFIG[field] : null

    useEffect(() => {
        if (!open || !field) return
        setDraft(initialValue == null ? '' : String(initialValue))
    }, [open, field, initialValue])

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
        setDraft('')
    }, [])

    const canSave = Boolean(meta) && String(draft).trim() !== ''

    const handleSave = useCallback(() => {
        if (!canSave || !field) return
        onSave?.(field, String(draft).trim())
        onClose()
    }, [canSave, field, draft, onSave, onClose])

    if (!open || !field || !meta) return null

    return (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="common-basic-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
            <div
                className="relative z-[1] flex w-[480px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="relative z-0 flex shrink-0 items-center justify-between overflow-hidden rounded-t-[6px] border-b border-[rgba(143,143,143,0.25)] bg-white px-[20px] py-[18px]">
                    <h2 id="common-basic-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Basic Info
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="relative z-[2] min-h-0 flex-1 px-[20px] py-[24px]">
                    {meta.kind === 'select' ? (
                        <FloatingSearchSelect
                            label={meta.label}
                            required={meta.required}
                            value={draft}
                            onChange={setDraft}
                            options={meta.options}
                            emptyPlaceholder={meta.emptyPlaceholder}
                        />
                    ) : (
                        <FloatingOutlinedInput
                            label={meta.label}
                            required={meta.required}
                            type={meta.kind === 'date' ? 'date' : 'text'}
                            value={draft}
                            onChange={setDraft}
                            placeholder={meta.placeholder}
                            autoComplete={meta.kind === 'date' ? 'bday' : 'off'}
                        />
                    )}
                </div>

                <footer className="relative z-[1] shrink-0 border-t border-[rgba(143,143,143,0.25)] bg-white px-[20px] py-[16px]">
                    <div className="flex items-center justify-end gap-[12px]">
                        <button
                            type="button"
                            onClick={reset}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
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
