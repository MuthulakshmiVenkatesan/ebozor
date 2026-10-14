/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingDatePickerField } from './FloatingDatePickerField'
import {
    FloatingLabeledNativeSelect,
    FloatingOutlinedInput,
    FloatingOutlinedInputWithActions,
    FloatingSearchSelect,
} from './floatingFormFields'

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

const COUNTRIES = ['Albania', 'United Arab Emirates', 'India', 'Pakistan', 'Philippines', 'United Kingdom', 'United States']

const NATIONALITY_LABELS = {
    Albania: 'Albanian',
    'United Arab Emirates': 'United Arab Emirates',
    India: 'Indian',
    Pakistan: 'Pakistani',
    Philippines: 'Filipino',
    'United Kingdom': 'British',
    'United States': 'American',
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
    value: c,
    label: NATIONALITY_LABELS[c] || c,
}))

const COUNTRY_SELECT_OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c }))

const LANGUAGE_OPTIONS = [
    'English',
    'Arabic',
    'Hindi',
    'Urdu',
    'Filipino',
    'French',
    'Spanish',
    'Mandarin',
].map((l) => ({ value: l, label: l }))

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'].map((g) => ({ value: g, label: g }))

const CAREER_OPTIONS = [
    'Entry Level',
    'Mid-Level',
    'Senior',
    'Lead',
    'Executive',
    'Director',
].map((x) => ({ value: x, label: x }))

const SALARY_OPTIONS = [
    'Negotiable',
    'Below 5,000',
    '5,000 - 10,000',
    '10,000 - 15,000',
    '15,000 - 20,000',
    '20,000+',
].map((x) => ({ value: x, label: x }))

const DEFAULT_FORM = {
    email: '',
    phone: '+971 ',
    gender: 'Female',
    dateOfBirth: '',
    language: '',
    nationality: 'Albania',
    currentLocation: 'Albania',
    visa: 'Tourist',
    careerLevel: '',
    desiredSalary: 'Negotiable',
}

function isValidEmail(value) {
    const v = value.trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/** Centered “Basic Info” dialog: outlined fields, Clear All + Save (enabled when required fields valid). */
export default function BasicInfoModal({ open, onClose, brandName = 'ebozor', onSave, initialData = null }) {
    const [form, setForm] = useState(DEFAULT_FORM)

    const resetForm = useCallback(() => setForm({ ...DEFAULT_FORM }), [])

    useEffect(() => {
        if (!open) return
        setForm({
            email: initialData?.email ?? '',
            phone: initialData?.mobile ?? '',
            gender: initialData?.gender
                ? String(initialData.gender).charAt(0).toUpperCase() + String(initialData.gender).slice(1).toLowerCase()
                : '',
            dateOfBirth: initialData?.date_of_birth ?? '',
            language: initialData?.language ?? '',
            nationality: initialData?.nationality ?? '',
            currentLocation: initialData?.current_location ?? '',
            visa: initialData?.visa_status ?? '',
            careerLevel: initialData?.career_level ?? '',
            desiredSalary: initialData?.desired_salary ?? '',
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
        return (
            isValidEmail(form.email) &&
            form.phone.replace(/\s/g, '').length >= 8 &&
            !!form.gender &&
            !!form.language &&
            !!form.nationality &&
            !!form.visa &&
            !!form.desiredSalary
        )
    }, [form])

    const handleSave = useCallback(() => {
        if (!canSave) return
        onSave?.(form)
        onClose()
    }, [canSave, form, onSave, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="basic-info-title">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex max-h-[min(640px,90vh)] w-full max-w-[480px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="basic-info-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Basic Info
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

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[20px] py-[20px]">
                    <div className="flex flex-col gap-[20px]">
                        <div>
                            <FloatingOutlinedInput
                                label="Email Id"
                                required
                                type="email"
                                value={form.email}
                                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                                autoComplete="email"
                            />
                            <p className="mt-[8px] text-[12px] font-[Inter-Regular] leading-snug text-[#000]">
                                This won&apos;t affect your login credentials for {brandName}.
                            </p>
                        </div>

                        <FloatingOutlinedInputWithActions
                            label="Phone No."
                            required
                            value={form.phone}
                            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                            showClear
                            showDialMenu
                        />

                        <FloatingLabeledNativeSelect
                            label="Gender"
                            required
                            value={form.gender}
                            onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                            options={GENDER_OPTIONS}
                            clearable
                            allowEmpty
                            emptyPlaceholder="Gender"
                        />

                        <FloatingDatePickerField
                            label="Date of Birth"
                            value={form.dateOfBirth}
                            onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
                        />

                        <FloatingSearchSelect
                            label="Language"
                            required
                            value={form.language}
                            onChange={(v) => setForm((f) => ({ ...f, language: v }))}
                            options={LANGUAGE_OPTIONS}
                            emptyPlaceholder="Language"
                        />

                        <FloatingSearchSelect
                            label="Nationality"
                            required
                            value={form.nationality}
                            onChange={(v) => setForm((f) => ({ ...f, nationality: v }))}
                            options={COUNTRY_OPTIONS}
                            emptyPlaceholder="Nationality"
                        />

                        <FloatingLabeledNativeSelect
                            label="Current Location"
                            required={false}
                            value={form.currentLocation}
                            onChange={(v) => setForm((f) => ({ ...f, currentLocation: v }))}
                            options={COUNTRY_SELECT_OPTIONS}
                            emptyPlaceholder="Current Location"
                        />

                        <FloatingLabeledNativeSelect
                            label="Visa Status"
                            required
                            value={form.visa}
                            onChange={(v) => setForm((f) => ({ ...f, visa: v }))}
                            options={VISA_OPTIONS}
                            clearable
                            allowEmpty
                            emptyPlaceholder="Visa Status"
                        />

                        <FloatingLabeledNativeSelect
                            // label="Career Level"
                            required={false}
                            value={form.careerLevel}
                            onChange={(v) => setForm((f) => ({ ...f, careerLevel: v }))}
                            options={CAREER_OPTIONS}
                            allowEmpty
                            emptyPlaceholder="Career Level"
                        />

                        <FloatingLabeledNativeSelect
                            label="Desired Salary (per month)"
                            required
                            value={form.desiredSalary}
                            onChange={(v) => setForm((f) => ({ ...f, desiredSalary: v }))}
                            options={SALARY_OPTIONS}
                            clearable
                            allowEmpty
                            emptyPlaceholder="Desired Salary"
                        />
                    </div>
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
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
                            className={`rounded-[6px] p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-white ${
                                canSave ? 'cursor-pointer bg-[#23262a] hover:bg-[#1a1a1a]' : 'cursor-not-allowed bg-[#C5C8CE]'
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
