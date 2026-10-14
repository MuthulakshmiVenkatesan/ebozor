/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingDatePickerField } from './FloatingDatePickerField'
import { FloatingLabeledNativeSelect, FloatingOutlinedInput } from './floatingFormFields'

const DEGREE_OPTIONS = [
    'High School',
    'Diploma',
    'Bachelor’s Degree',
    'Master’s Degree',
    'Doctorate',
].map((v) => ({ value: v, label: v }))

const COUNTRY_OPTIONS = [
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Oman',
    'Bahrain',
    'India',
    'Pakistan',
    'Philippines',
].map((v) => ({ value: v, label: v }))

const DEFAULT_FORM = {
    degree: '',
    specialization: '',
    university: '',
    country: '',
    graduationYearPrimary: '',
    graduationYearSecondary: '',
}

/** Academic qualification dialog matching Qualifications design. */
export default function QualificationModal({ open, onClose, onSave, initialData = null }) {
    const [form, setForm] = useState(DEFAULT_FORM)

    const resetForm = useCallback(() => setForm({ ...DEFAULT_FORM }), [])

    useEffect(() => {
        if (!open) return
        setForm({
            degree: initialData?.degree ?? '',
            specialization: initialData?.specialization ?? '',
            university: initialData?.university_name ?? '',
            country: initialData?.country ?? '',
            graduationYearPrimary: initialData?.graduation_from ?? '',
            graduationYearSecondary: initialData?.graduation_to ?? '',
        })
    }, [open, initialData])

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

    const canSave = useMemo(() => {
        if (!form.degree) return false
        if (!form.university.trim()) return false
        if (!form.country) return false
        if (!form.graduationYearPrimary) return false
        return true
    }, [form])

    const handleSave = useCallback(() => {
        if (!canSave) return
        onSave?.(form)
        onClose()
    }, [canSave, form, onSave, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-[16px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qualification-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex max-h-[min(640px,90vh)] w-full max-w-[520px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[24px] py-[18px]">
                    <h2
                        id="qualification-modal-title"
                        className="text-[18px] font-[Inter-SemiBold] text-[#23262A]"
                    >
                        Qualifications
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex cursor-pointer items-center justify-center p-[4px]"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[24px] py-[24px]">
                    <p className="mb-[24px] text-[14px] font-[Inter-Regular] leading-snug text-[#23262a]">
                        Add your academic qualification details such as School, Undergrad and Post
                        graduation degree.
                    </p>

                    <div className="flex flex-col gap-[16px]">
                        <FloatingLabeledNativeSelect
                           
                            value={form.degree}
                            onChange={(v) => setForm((f) => ({ ...f, degree: v }))}
                            options={DEGREE_OPTIONS}
                            allowEmpty
                            emptyPlaceholder="Degree *"
                        />

                        <FloatingOutlinedInput
                            label="Specialization"
                            required={false}
                            value={form.specialization}
                            onChange={(v) => setForm((f) => ({ ...f, specialization: v }))}
                        />

                        <FloatingOutlinedInput
                            label="University Name"
                            required
                            value={form.university}
                            onChange={(v) => setForm((f) => ({ ...f, university: v }))}
                        />

                        <FloatingLabeledNativeSelect
                            value={form.country}
                            onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                            options={COUNTRY_OPTIONS}
                            allowEmpty
                            emptyPlaceholder="Country"
                        />

                        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                            <FloatingDatePickerField
                                label="Yr. of Graduation"
                                value={form.graduationYearPrimary}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, graduationYearPrimary: v }))
                                }
                            />
                            <FloatingDatePickerField
                                label="Yr. of Graduation"
                                value={form.graduationYearSecondary}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, graduationYearSecondary: v }))
                                }
                            />
                        </div>
                    </div>
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[24px] py-[16px]">
                    <div className="flex items-center justify-end gap-[12px]">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[8px_18px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_18px] text-[14px] font-[Inter-SemiBold] text-white ${
                                canSave
                                    ? 'cursor-pointer bg-[#23262a] hover:bg-[#1a1a1a]'
                                    : 'cursor-not-allowed bg-[#C5C8CE]'
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

