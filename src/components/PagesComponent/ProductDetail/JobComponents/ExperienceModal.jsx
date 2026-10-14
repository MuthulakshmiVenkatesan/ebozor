/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloseIcon, TickIcon } from '@/components/CustomFile/icons'
import { FloatingDatePickerField } from './FloatingDatePickerField'
import {
    FloatingLabeledNativeSelect,
    FloatingOutlinedInput,
} from './floatingFormFields'

const JOB_CATEGORY_OPTIONS = [
    'Accounting & Finance',
    'Administration',
    'Customer Service',
    'Engineering',
    'Hospitality',
    'Human Resources',
    'IT & Software',
    'Marketing',
    'Sales',
].map((v) => ({ value: v, label: v }))

const INDUSTRY_OPTIONS = [
    'Advertising',
    'Construction',
    'Education',
    'Healthcare',
    'Retail',
    'Technology',
    'Telecommunications',
    'Transportation & Logistics',
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
    mode: 'experience', // 'fresher' | 'experience'
    jobTitle: '',
    jobCategory: '',
    industry: '',
    company: '',
    country: '',
    description: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
}

/** Experience modal: fresher/experience toggle, job fields, dates, clear + save. */
export default function ExperienceModal({ open, onClose, onSave, initialData = null }) {
    const [form, setForm] = useState(DEFAULT_FORM)
    const [hasChosenMode, setHasChosenMode] = useState(false)

    const resetForm = useCallback(() => {
        setForm({ ...DEFAULT_FORM })
        setHasChosenMode(false)
    }, [])

    useEffect(() => {
        if (!open) return
        const isFresher = Number(initialData?.fresher) === 1
        const initialMode = isFresher ? 'fresher' : 'experience'
        const hasExperienceValues =
            Boolean(initialData?.experience_job_titel) ||
            Boolean(initialData?.experience_job_category) ||
            Boolean(initialData?.experience_company) ||
            Boolean(initialData?.experience_country) ||
            Boolean(initialData?.experience_start_date) ||
            Boolean(initialData?.experience_end_date) ||
            Number(initialData?.currently_working) === 1
        setForm({
            mode: initialMode,
            jobTitle: initialData?.experience_job_titel ?? '',
            jobCategory: initialData?.experience_job_category ?? '',
            industry: initialData?.experience_industry ?? '',
            company: initialData?.experience_company ?? '',
            country: initialData?.experience_country ?? '',
            description: initialData?.experience_job_description ?? '',
            startDate: initialData?.experience_start_date ?? '',
            endDate: initialData?.experience_end_date ?? '',
            currentlyWorking: Number(initialData?.currently_working) === 1,
        })
        setHasChosenMode(isFresher || hasExperienceValues)
    }, [open, initialData])

    useEffect(() => {
        if (!open) return
        // When the modal re-opens, start from the choice view again.
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
        if (!hasChosenMode) return false
        if (form.mode === 'fresher') {
            // For freshers, we do not require detailed experience fields.
            return true
        }
        if (!form.jobTitle.trim()) return false
        if (!form.jobCategory) return false
        if (!form.company.trim()) return false
        if (!form.country) return false
        if (!form.startDate) return false
        if (!form.currentlyWorking && !form.endDate) return false
        return true
    }, [form, hasChosenMode])

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
            aria-labelledby="experience-modal-title"
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
                        id="experience-modal-title"
                        className="text-[18px] font-[Inter-SemiBold] text-[#23262A]"
                    >
                        Experience
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

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[24px] py-[20px]">
                    <p className="mb-[16px] text-[14px] font-[Inter-Regular] text-[#23262a]">
                        Add your current and past work experiences.
                    </p>

                    <div className="mb-[20px] inline-flex gap-[8px] ">
                        <button
                            type="button"
                            onClick={() => {
                                setForm((f) => ({ ...f, mode: 'fresher' }))
                                setHasChosenMode(true)
                            }}
                            className={`cursor-pointer rounded-[6px] border px-[16px] py-[6px] text-[14px] font-[Inter-Regular] ${form.mode === 'fresher'
                                ? 'bg-[#23262a] border-[#23262a] text-white'
                                : 'bg-transparent border-[rgba(143,143,143,0.25)] text-[#23262a]'
                                }`}
                        >
                            Fresher
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setForm((f) => ({ ...f, mode: 'experience' }))
                                setHasChosenMode(true)
                            }}
                            className={`cursor-pointer rounded-[6px] border px-[16px] py-[6px] text-[14px] font-[Inter-Regular] ${form.mode === 'experience'
                                ? 'bg-[#23262a] border-[#23262a] text-white'
                                : 'bg-transparent border-[rgba(143,143,143,0.25)] text-[#23262a]'
                                }`}
                        >
                            Experience
                        </button>
                    </div>


                    {hasChosenMode && form.mode === 'experience' ? (
                        <div className="flex flex-col gap-[16px]">
                            <FloatingOutlinedInput
                                placeholder="Job Title *"
                                value={form.jobTitle}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, jobTitle: v }))
                                }
                            />

                            <FloatingLabeledNativeSelect

                                value={form.jobCategory}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, jobCategory: v }))
                                }
                                options={JOB_CATEGORY_OPTIONS}
                                allowEmpty
                                emptyPlaceholder="Job Category *"
                            />

                            <FloatingLabeledNativeSelect

                                value={form.industry}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, industry: v }))
                                }
                                options={INDUSTRY_OPTIONS}
                                allowEmpty
                                emptyPlaceholder="Industry"
                            />

                            <FloatingOutlinedInput
                                placeholder="Company *"
                                value={form.company}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, company: v }))
                                }
                            />

                            <FloatingLabeledNativeSelect
                                value={form.country}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, country: v }))
                                }
                                options={COUNTRY_OPTIONS}
                                allowEmpty
                                emptyPlaceholder="Country *"
                            />

                            <div className="relative mt-[12px]">
                                <label className="absolute -top-[10px] left-[16px] bg-white px-[6px] text-[12px] font-[Inter-Regular] text-[#23262a]">
                                    Job Descriptions
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="resize-none w-full rounded-[8px] border border-[#D0D0D0] p-[16px] pt-[18px] text-[14px] font-[Inter-Regular] text-[#23262a] outline-none focus:border-[#23262a]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                                <div>
                                    <p className="mb-[6px] text-[13px] font-[Inter-Regular] text-[#3a3f47]">
                                        Start Date <span className="text-[#3a3f47]">*</span>
                                    </p>
                                    <FloatingDatePickerField
                                        label=""
                                        value={form.startDate}
                                        onChange={(v) =>
                                            setForm((f) => ({
                                                ...f,
                                                startDate: v,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <p className="mb-[6px] text-[13px] font-[Inter-Regular] text-[#3a3f47]">
                                        End Date{form.currentlyWorking ? '' : ' *'}
                                    </p>
                                    <div className={form.currentlyWorking ? 'opacity-60' : ''}>
                                        <FloatingDatePickerField
                                            label=""
                                            value={form.endDate}
                                            onChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    endDate: v,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <label className="relative cursor-pointer mt-[4px] flex items-center gap-[8px] ">
                                <input
                                    type="checkbox"
                                    checked={form.currentlyWorking}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            currentlyWorking: e.target.checked,
                                            endDate: e.target.checked ? '' : f.endDate,
                                        }))
                                    }
                                    className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                    checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"                                />
                                {form.currentlyWorking ? (
                                    <TickIcon
                                        className="h-[16px] w-[16px] absolute left-[3px]"
                                        fill="#DC0000"
                                    />
                                ) : null}
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262a]">Currently working</p>
                            </label>
                        </div>
                    ) : null}
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
                            className={`rounded-[6px] p-[8px_18px] text-[14px] font-[Inter-SemiBold] text-white ${canSave
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

