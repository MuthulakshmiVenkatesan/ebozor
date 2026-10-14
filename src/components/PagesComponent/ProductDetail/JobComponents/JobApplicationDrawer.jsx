/* eslint-disable react/prop-types */
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CloseIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import { FloatingSearchSelect } from './floatingFormFields'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import genderjob from '../../../../../public/assets/img/icons/genderjob.svg'
import audit from '../../../../../public/assets/img/icons/audit.svg'
import cap from '../../../../../public/assets/img/icons/cap.svg'
import luggage from '../../../../../public/assets/img/icons/luggage.svg'
import map from '../../../../../public/assets/img/icons/map.svg'
import briefcase from '../../../../../public/assets/img/icons/briefcase.svg'
import building from '../../../../../public/assets/img/icons/building.svg'
import id_card from '../../../../../public/assets/img/icons/id_card.svg'
import setting from '../../../../../public/assets/img/icons/setting.svg'
import bell from '../../../../../public/assets/img/icons/bell.svg'
import uploadfile from '../../../../../public/assets/img/icons/uploadfile.svg'


const VISA_OPTIONS = [
    'Not Applicable',
    'Business',
    'Employment',
    'Residence',
    'Spouse',
    'Student',
    'Tourist',
    'Visit',
]

const EDUCATION_OPTIONS = ['N/A', 'High-School / Secondary', 'Bachelors Degree', 'Masters Degree', 'PhD']

const EXPERIENCE_BANDS = ['0-1 Years', '1-2 Years', '2-5 Years', '5-10 Years', '10+ Years']

const NOTICE_OPTIONS = ['Available Immediately', 'Less than 2 Weeks', '1 Month', 'More than 1 Month']

const COUNTRIES = ['Albania', 'United Arab Emirates', 'India', 'Pakistan', 'Philippines', 'United Kingdom', 'United States']

const INDUSTRIES = ['Accounting / Finance', 'Information Technology', 'Healthcare', 'Retail', 'Construction', 'Education']

const COUNTRY_SELECT_OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c }))
const INDUSTRY_SELECT_OPTIONS = INDUSTRIES.map((i) => ({ value: i, label: i }))

const NATIONALITY_LABELS = {
    Albania: 'Albanian',
    'United Arab Emirates': 'Emirati',
    India: 'Indian',
    Pakistan: 'Pakistani',
    Philippines: 'Filipino',
    'United Kingdom': 'British',
    'United States': 'American',
}

const PHONE_DIAL_CODES = ['+971', '+91', '+44', '+1', '+92', '+63', '+966']

const RESUME_ACCEPT =
    '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const DEFAULTS = {
    visa: '',
    education: '',
    totalExperience: '',
    fullName: '',
    email: '',
    nationality: '',
    phone: '',
    gender: '',
    locatedIn: '',
    jobStatus: '',
    jobCategory: '',
    currentCompany: '',
    currentPosition: '',
    industry: '',
    notice: '',
    resumeFile: null,
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
    value: c,
    label: NATIONALITY_LABELS[c] || c,
}))

function useOnClickOutside(ref, handler, enabled) {
    useEffect(() => {
        if (!enabled) return
        const listener = (e) => {
            const el = ref.current
            if (!el || el.contains(e.target)) return
            handler()
        }
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)
        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler, enabled])
}

function Chip({ selected, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-[8px] border border-[#23262a] p-[6px_16px] text-left text-[13px] font-[Inter-Regular] text-[#23262a] transition-colors ${selected ? 'bg-[#E8E8E8]' : 'bg-white hover:bg-[#F5F5F5]'
                }`}
        >
            {children}
        </button>
    )
}


/** Outlined field with label on the top border (Tailwind-only). */
function FloatingOutlinedInput({ label, required, value, onChange, type = 'text', autoComplete, placeholder }) {
    const [focused, setFocused] = useState(false)
    const ring = focused ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    return (
        <div className={`relative rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
            <label className="pointer-events-none absolute left-[11px] top-0 z-[1] -translate-y-1/2 bg-white px-[4px] text-[12px] font-[Inter-Regular] leading-tight text-[#000]">
                {label}
                {required ? <span className="text-[#DC2626]"> *</span> : null}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className="p-[16px_16px] w-full rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
            />
        </div>
    )
}

function FloatingOutlinedInputWithActions({ label, required, value, onChange, type = 'text', showClear, showDialMenu }) {
    const [focused, setFocused] = useState(false)
    const [dialOpen, setDialOpen] = useState(false)
    const wrapRef = useRef(null)
    const ring = focused || dialOpen ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    useOnClickOutside(
        wrapRef,
        () => setDialOpen(false),
        dialOpen
    )

    return (
        <div ref={wrapRef} className="relative">
            <div className={`relative flex items-stretch rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                <label className="pointer-events-none absolute left-[11px] top-0 z-[1] -translate-y-1/2 bg-white px-[4px] text-[12px] font-[Inter-Regular] leading-tight text-[#000]">
                    {label}
                    {required ? <span className="text-[#DC2626]"> *</span> : null}
                </label>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="p-[16px_16px] w-full rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
                />
                <div className="flex shrink-0 items-center gap-[2px] pr-[8px]">
                    {showClear && value ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onChange('')}
                            className="cursor-pointer flex items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                            aria-label="Clear"
                        >
                            <CloseIcon className="w-[10px] h-[10px]" fill="#666666" />
                        </button>
                    ) : null}
                    {showDialMenu ? (
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setDialOpen((o) => !o)}
                                className="cursor-pointer flex items-center justify-center rounded-md text-[#23262a] hover:bg-[#F3F4F6]"
                                aria-expanded={dialOpen}
                                aria-haspopup="listbox"
                                aria-label="Country code"
                            >
                                <DownArrowIcon className="w-[24px] h-[24px]" stroke="#8f8f8f" />
                            </button>
                            {dialOpen ? (
                                <ul
                                    className="absolute right-0 top-full z-[30] mt-[6px] max-h-[200px] min-w-[140px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-[4px] shadow-lg"
                                    role="listbox"
                                >
                                    {PHONE_DIAL_CODES.map((code) => (
                                        <li key={code}>
                                            <button
                                                type="button"
                                                className="w-full px-[12px] py-[8px] text-left text-[13px] font-[Inter-Regular] text-[#23262a] hover:bg-[#F3F4F6]"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    const rest = value.replace(/^\+\d{1,4}\s*/, '').trim()
                                                    onChange(rest ? `${code} ${rest}` : code)
                                                    setDialOpen(false)
                                                }}
                                            >
                                                {code}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/**
 * Outlined floating-label combobox: filter text in the field (blue selection), clear + chevron, list with light-blue row + checkmark.
 */
function FloatingNativeSelect({
    label,
    required,
    value,
    onChange,
    options,
    clearable = false,
    allowEmpty = false,
    emptyPlaceholder = 'Select',
    className = '',
}) {
    const rootRef = useRef(null)
    const inputRef = useRef(null)
    const listId = useRef(`combo-list-${Math.random().toString(36).slice(2, 9)}`)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const selectedLabel = useMemo(() => {
        if (allowEmpty && (value === '' || value == null)) return ''
        const o = options.find((x) => String(x.value) === String(value))
        return o?.label ?? ''
    }, [value, options, allowEmpty])

    useEffect(() => {
        if (!open) return
        setQuery(selectedLabel)
        const t = requestAnimationFrame(() => {
            const el = inputRef.current
            if (el) {
                el.focus()
                el.select()
            }
        })
        return () => cancelAnimationFrame(t)
    }, [open, selectedLabel])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter((o) => o.label.toLowerCase().includes(q))
    }, [options, query])

    useOnClickOutside(
        rootRef,
        () => {
            setOpen(false)
            setQuery(selectedLabel)
        },
        open
    )

    const ring = open ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    const showClearClosed = clearable && value !== '' && value != null && !open
    const showClearOpen = open && query.length > 0

    return (
        <div ref={rootRef} className={`relative min-w-0 flex-1 ${className}`}>
            <div className={`relative rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                {/* <label className="pointer-events-none absolute left-[11px] top-0 z-[1] -translate-y-1/2 bg-white px-[4px] text-[11px] font-[Inter-Medium] leading-tight text-[#666666]">
                    {label}
                    {required ? <span className="text-[#DC2626]"> *</span> : null}
                </label> */}

                <div className="flex items-stretch">
                    {open ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-expanded={open}
                            aria-controls={listId.current}
                            aria-autocomplete="list"
                            role="combobox"
                            className="text-left p-[16px_16px] w-full rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
                        />
                    ) : (
                        <button
                            type="button"
                            className="text-left p-[16px_16px] w-full rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
                            onClick={() => setOpen(true)}
                            aria-expanded={false}
                            aria-haspopup="listbox"
                        >
                            <span className={!selectedLabel ? 'text-[#9CA3AF]' : 'text-[#23262a]'}>
                                {selectedLabel || emptyPlaceholder}
                            </span>
                        </button>
                    )}

                    <div className="flex shrink-0 items-center gap-[2px] pr-[8px]">
                        {showClearClosed ? (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(allowEmpty ? '' : options[0]?.value ?? '')
                                    setQuery('')
                                }}
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                                aria-label="Clear"
                            >
                                <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                            </button>
                        ) : null}
                        {showClearOpen ? (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setQuery('')}
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                                aria-label="Clear search"
                            >
                                <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                if (open) {
                                    setOpen(false)
                                    setQuery(selectedLabel)
                                } else {
                                    setOpen(true)
                                }
                            }}
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#23262a] hover:bg-[#F3F4F6]"
                            aria-label={open ? 'Close list' : 'Open list'}
                        >
                            <DownArrowIcon
                                className={`h-[24px] w-[24px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                stroke="#8f8f8f"
                            />
                        </button>
                    </div>
                </div>
            </div>

            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[35] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
                    <ul id={listId.current} className="max-h-[260px] overflow-y-auto py-[4px]" role="listbox">
                        {filtered.length === 0 ? (
                            <li className="px-[12px] py-[10px] text-[13px] text-[#9CA3AF]">No matches</li>
                        ) : (
                            filtered.map((o) => {
                                const isSel = String(o.value) === String(value)
                                return (
                                    <li key={String(o.value)}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isSel}
                                            className={`flex w-full cursor-pointer items-center justify-between gap-[8px] px-[12px] py-[10px] text-left text-[13px] font-[Inter-Regular] transition-colors ${isSel ? 'bg-[#DBEAFE] text-[#23262a]' : 'text-[#23262a] hover:bg-[#F3F4F6]'
                                                }`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                onChange(o.value)
                                                setOpen(false)
                                                setQuery(o.label)
                                            }}
                                        >
                                            <span className="min-w-0 truncate">{o.label}</span>
                                            {isSel ? (
                                                <span className="shrink-0 text-[14px] text-[#6B7280]" aria-hidden>
                                                    ✓
                                                </span>
                                            ) : null}
                                        </button>
                                    </li>
                                )
                            })
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}



/** Dashed resume drop zone: empty shows “Resume”; selected file shows filename (matches design reference). */
function ResumeUploadDropzone({ file, onChange }) {
    const inputId = useId()
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const dragDepth = useRef(0)

    useEffect(() => {
        if (!file && inputRef.current) inputRef.current.value = ''
    }, [file])

    const applyFile = (list) => {
        const f = list?.[0]
        if (f) onChange(f)
    }

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={RESUME_ACCEPT}
                className="sr-only"
                onChange={(e) => applyFile(e.target.files)}
            />
            <label
                htmlFor={inputId}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#0000001f] p-[30px] transition-colors ${dragOver ? 'bg-[#F5F9FE]' : ''}`}
                onDragEnter={(e) => {
                    e.preventDefault()
                    dragDepth.current += 1
                    setDragOver(true)
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                    dragDepth.current -= 1
                    if (dragDepth.current <= 0) {
                        dragDepth.current = 0
                        setDragOver(false)
                    }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    dragDepth.current = 0
                    setDragOver(false)
                    applyFile(e.dataTransfer.files)
                }}
            >
                <Image src={uploadfile} alt="uploadfile" width={40} height={40} />
                <p className="mt-[10px] truncate text-center text-[14px] font-[Inter-Regular] text-[#000]">
                    {file ? file.name : 'Resume'}
                </p>
            </label>
        </div>
    )
}

function isValidEmail(value) {
    const v = value.trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isAllowedResumeFile(file) {
    if (!file) return false
    const fileName = String(file?.name || '').toLowerCase()
    const mime = String(file?.type || '').toLowerCase()
    const extAllowed = ['.pdf', '.doc', '.docx'].some((ext) => fileName.endsWith(ext))
    const mimeAllowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(mime)
    return extAllowed || mimeAllowed
}

export default function JobApplicationDrawer({ open, onClose, productData, onApplySuccess }) {
    const [form, setForm] = useState(DEFAULTS)
    const [applicationSent, setApplicationSent] = useState(false)
    const [applyError, setApplyError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const userData = useSelector(userSignUpData)

    const resetForm = useCallback(() => setForm({ ...DEFAULTS }), [])

    const handleSaveAndApply = useCallback(async () => {
        const missingBasic =
            !form.fullName.trim() ||
            !isValidEmail(form.email) ||
            !form.nationality ||
            !form.phone.trim()
        if (missingBasic || !form.resumeFile) {
            setApplyError('Please fill in all required fields (name, email, nationality, phone) and attach your resume.')
            return
        }
        if (!isAllowedResumeFile(form.resumeFile)) {
            setApplyError('Resume must be a PDF, DOC, or DOCX file.')
            return
        }
        const itemId = productData?.id
        const userId = userData?.id
        if (!itemId || !userId) {
            setApplyError('Unable to submit application right now. Please login and try again.')
            return
        }
        setApplyError('')
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            const { addJobApplicationInfoApi } = await import('@/utils/api')
            const submitFn = addJobApplicationInfoApi?.addJobApplicationInfo
            if (typeof submitFn !== 'function') {
                throw new Error('Job application API is not available')
            }
            await submitFn({
                item_id: itemId,
                user_id: userId,
                full_name: form.fullName.trim(),
                email_id: form.email.trim(),
                nationality: form.nationality,
                phone_no: form.phone.trim(),
                gender: form.gender,
                visa_status: form.visa,
                education_level: form.education,
                total_experience: form.totalExperience,
                currentlt_locate: form.locatedIn,
                job_status: form.jobStatus,
                job_category: form.jobCategory,
                current_company: form.currentCompany,
                current_position: form.currentPosition,
                industry: form.industry,
                notice_period: form.notice,
                resume: form.resumeFile,
            })
            setApplicationSent(true)
            onApplySuccess?.()
        } catch (e) {
            console.error('Failed to submit job application:', e)
            setApplyError('Failed to submit application. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }, [form, isSubmitting, productData, userData, onApplySuccess])

    useEffect(() => {
        if (!open) return
        setApplicationSent(false)
        setApplyError('')
        setIsSubmitting(false)
    }, [open])

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

    if (!open) return null

    const jobTitle = productData?.name || productData?.title || productData?.job_title || 'this role'

    return (
        <div className="fixed inset-0 z-[240]" role="dialog" aria-modal="true" aria-labelledby="job-application-title">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close drawer"
            />
            <aside
                className="absolute right-0 rtl:left-0 rtl:right-auto top-0 z-[1] flex h-full w-[550px] max-sm:w-full flex-col bg-white shadow-[0px_8px_10px_-5px_rgba(0,0,0,0.1),_0px_16px_24px_2px_rgba(0,0,0,0.07),_0px_6px_30px_5px_rgba(0,0,0,0.06)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),_0px_3px_4px_rgba(0,0,0,0.07),_0px_1px_8px_rgba(0,0,0,0.06)] shrink-0 p-[24px] flex items-start justify-between">
                    <div className="flex items-start justify-between flex-col gap-[10px]">
                        <h2 id="job-application-title" className="text-[20px] font-[Inter-SemiBold] text-[#23262A]">
                            Job Application
                        </h2>
                        <p className="text-[14px] font-[Inter-Regular] leading-snug text-[#000]">
                            Edit your details for your job applications{' '}
                            <Link href="/profile" className="text-[#3A88EF]" onClick={(e) => e.stopPropagation()}>
                                here
                            </Link>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex shrink-0 items-center justify-center cursor-pointer"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-[10px] h-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[20px] mb-[20px]">
                    {applicationSent ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <Image
                                src="/assets/Mail%20Verification.svg"
                                alt=""
                                width={280}
                                height={183}
                                className="mx-auto max-w-full mb-[34px]"
                            />
                            <h3 className="mb-[20px] text-[18px] font-[Inter-SemiBold] text-[#666]">
                                Your Application has been sent successfully.
                            </h3>
                            <p className="mb-[14px] text-[14px] font-[Inter-Regular] leading-snug text-[#666]">
                                Complete your profile to increase your chances of getting hired
                            </p>
                            <Link
                                href="/jobprofile"
                                onClick={() => onClose()}
                                className="tems-center justify-center rounded-[8px] bg-[#DC0000] px-[32px] py-[12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity "
                            >
                                Go To Profile
                            </Link>
                        </div>
                    ) : (
                        <>
                            <section className="border-b border-[rgba(143,143,143,0.2)] py-[30px]">
                                <div className="mb-[30px]">
                                    <h3 className="text-[16px] font-[Inter-SemiBold] text-[#23262A] mb-[4px]">Basic Info</h3>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#a3a6aa]">
                                        This won&apos;t affect your login credentials
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 sm:gap-x-[20px] sm:gap-y-[22px]">
                                    <FloatingOutlinedInput
                                        label="Full Name"
                                        required
                                        value={form.fullName}
                                        onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                                        autoComplete="name"
                                    />
                                    <FloatingOutlinedInput
                                        label="Email Id"
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                                        autoComplete="email"
                                    />
                                    <FloatingSearchSelect
                                        label="Nationality"
                                        required
                                        value={form.nationality}
                                        onChange={(v) => setForm((f) => ({ ...f, nationality: v }))}
                                        options={COUNTRY_OPTIONS}
                                    />
                                    <FloatingOutlinedInputWithActions
                                        label="Phone No."
                                        required
                                        value={form.phone}
                                        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                                        showClear
                                        showDialMenu
                                    />
                                </div>
                            </section>

                            <section className="border-b border-[rgba(143,143,143,0.2)] py-[30px]">
                                <div className="mb-[30px]">
                                    <h3 className="text-[16px] font-[Inter-SemiBold] text-[#23262A] mb-[4px]">Application Details</h3>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#a3a6aa]">
                                        This is not visible to other users
                                    </p>
                                </div>
                                <div className="flex flex-col gap-[30px]">
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={genderjob} alt="gender" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Gender</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {['Male', 'Female', 'Prefer not to say'].map((g) => (
                                                <Chip key={g} selected={form.gender === g} onClick={() => setForm((f) => ({ ...f, gender: g }))}>
                                                    {g}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={audit} alt="audit" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Visa Status</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {VISA_OPTIONS.map((opt) => (
                                                <Chip key={opt} selected={form.visa === opt} onClick={() => setForm((f) => ({ ...f, visa: opt }))}>
                                                    {opt}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={cap} alt="cap" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Education Level</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {EDUCATION_OPTIONS.map((opt) => (
                                                <Chip key={opt} selected={form.education === opt} onClick={() => setForm((f) => ({ ...f, education: opt }))}>
                                                    {opt}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={luggage} alt="luggage" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Total Experience</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {EXPERIENCE_BANDS.map((opt) => (
                                                <Chip
                                                    key={opt}
                                                    selected={form.totalExperience === opt}
                                                    onClick={() => setForm((f) => ({ ...f, totalExperience: opt }))}
                                                >
                                                    {opt}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={map} alt="map" width={14} height={14} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Currently Located In</h4>
                                        </div>
                                        <FloatingNativeSelect
                                            label="Currently Located In"
                                            required={false}
                                            value={form.locatedIn}
                                            onChange={(v) => setForm((f) => ({ ...f, locatedIn: v }))}
                                            options={COUNTRY_SELECT_OPTIONS}
                                            allowEmpty
                                            clearable
                                            emptyPlaceholder="Select country"
                                        />
                                    </div>

                                </div>
                            </section>

                            <section className="py-[30px]">
                                <div className="mb-[30px]">
                                    <h3 className="text-[16px] font-[Inter-SemiBold] text-[#23262A] mb-[4px]">Work Experience</h3>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#a3a6aa]">
                                        This is not visible to other users
                                    </p>
                                </div>
                                <div className="flex flex-col gap-[30px]">
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={briefcase} alt="briefcase" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Job Status</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {['Fresher', 'Experienced'].map((s) => (
                                                <Chip
                                                    key={s}
                                                    selected={form.jobStatus === s}
                                                    onClick={() =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            jobStatus: s,
                                                            ...(s === 'Fresher'
                                                                ? { currentCompany: '', currentPosition: '', industry: '' }
                                                                : {}),
                                                        }))
                                                    }
                                                >
                                                    {s}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={briefcase} alt="id_card" width={24} height={24} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Job Category</h4>
                                        </div>
                                        <FloatingNativeSelect
                                            label="Job Category"
                                            required={false}
                                            value={form.jobCategory}
                                            onChange={(v) => setForm((f) => ({ ...f, jobCategory: v }))}
                                            options={INDUSTRY_SELECT_OPTIONS}
                                            allowEmpty
                                            clearable
                                            emptyPlaceholder="Select category"
                                        />
                                    </div>

                                    {form.jobStatus === 'Experienced' ? (
                                        <div className="flex flex-col gap-[30px]">
                                            <div className="flex items-center gap-[12px]">
                                                <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                                    <Image src={building} alt="id_card" width={24} height={24} />
                                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Current Company</h4>
                                                </div>
                                                <FloatingNativeSelect
                                                    label="Current Company"
                                                    required={false}
                                                    value={form.currentCompany}
                                                    onChange={(v) => setForm((f) => ({ ...f, currentCompany: v }))}
                                                    options={INDUSTRY_SELECT_OPTIONS}
                                                    allowEmpty
                                                    clearable
                                                    emptyPlaceholder="Select company"
                                                />
                                            </div>
                                            <div className="flex items-center gap-[12px]">
                                                <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                                    <Image src={id_card} alt="id_card" width={24} height={24} />
                                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Current Position</h4>
                                                </div>
                                                <FloatingNativeSelect
                                                    label="Current Position"
                                                    required={false}
                                                    value={form.currentPosition}
                                                    onChange={(v) => setForm((f) => ({ ...f, currentPosition: v }))}
                                                    options={INDUSTRY_SELECT_OPTIONS}
                                                    allowEmpty
                                                    clearable
                                                    emptyPlaceholder="Select position"
                                                />
                                            </div>
                                            <div className="flex items-center gap-[12px]">
                                                <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                                    <Image src={setting} alt="setting" width={24} height={24} />
                                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Industry</h4>
                                                </div>
                                                <FloatingNativeSelect
                                                    label="Industry"
                                                    required={false}
                                                    value={form.industry}
                                                    onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
                                                    options={INDUSTRY_SELECT_OPTIONS}
                                                    allowEmpty
                                                    clearable
                                                    emptyPlaceholder="Select industry"
                                                />
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="flex items-start gap-[12px]">
                                        <div className="flex shrink-0 items-center gap-[10px] w-[180px]">
                                            <Image src={bell} alt="bell" width={16} height={16} />
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">Notice Period</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-[8px]">
                                            {NOTICE_OPTIONS.map((opt) => (
                                                <Chip key={opt} selected={form.notice === opt} onClick={() => setForm((f) => ({ ...f, notice: opt }))}>
                                                    {opt}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <ResumeUploadDropzone
                                file={form.resumeFile}
                                onChange={(resumeFile) => setForm((f) => ({ ...f, resumeFile }))}
                            />
                        </>
                    )}
                </div>

                {applicationSent ? null : (
                    <footer className="shrink-0 bg-white p-[16px] shadow-[0px_-3px_3px_-2px_rgba(0,0,0,0.1),_0px_-3px_4px_rgba(0,0,0,0.07),_0px_-1px_8px_rgba(0,0,0,0.06)]">
                        {applyError ? (
                            <p className="mb-[12px] text-center text-[13px] font-[Inter-Regular] text-[#DC2626]" role="alert">
                                {applyError}
                            </p>
                        ) : null}
                        <div className="flex items-stretch gap-[12px]">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[6px_30px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                            >
                                Clear All
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleSaveAndApply()
                                }}
                                className="cursor-pointer min-w-0 flex-1 rounded-[6px] bg-[#23262a] p-[6px_12px] text-[14px] font-[Inter-SemiBold] text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Save & Apply'}
                            </button>
                        </div>
                    </footer>
                )}
            </aside>
        </div>
    )
}
