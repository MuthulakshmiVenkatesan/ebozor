'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { InfoIcon, CallIcon, WhatsappIcon, SaveTickIcon, FormDownArrowIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import RemoveSaveCandidateModal from '../components/RemoveSaveCandidateModal'
import PhoneNumberModal from '@/components/PagesComponent/JobDashboard/components/PhoneNumberModal'
import savedsearch from '../../../../../public/assets/img/jobdashboard/savedsearch.svg'
import user from '../../../../../public/assets/img/jobdashboard/user.jpeg'
import location from '../../../../../public/assets/img/jobdashboard/icons/location.svg'
import cake from '../../../../../public/assets/img/jobdashboard/icons/cake.svg'
import education from '../../../../../public/assets/img/jobdashboard/icons/education.svg'
import language from '../../../../../public/assets/img/jobdashboard/icons/language.svg'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { getSavedCandidateDetailsApi, savedCandidateDetailsApi } from '@/utils/api'

const LANGUAGE_OPTIONS = ['Arabic', 'English', 'Hindi', 'Urdu', 'Punjabi', 'Tagalog']
const EMIRATE_OPTIONS = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah']
const CATEGORY_OPTIONS = ['Accounting', 'Sales', 'Engineering', 'Marketing', 'Customer Service']
const POSITION_OPTIONS = ['Accounting Manager', 'Salesperson', 'Senior Developer', 'HR Executive']
const SALARY_OPTIONS = ['Any', 'Up to 5,000 AED', '5,000 - 10,000 AED', '10,000+ AED']
const NATIONALITY_OPTIONS = ['Pakistani', 'Indian', 'Filipino', 'Egyptian', 'Nepali']
const KEYWORD_OPTIONS = ['Accounting', 'Sales', 'Remote', 'Manager', 'Part Time', 'Full Time']
const MORE_OPTIONS = [
    { value: 'visa', label: 'Visa status' },
    { value: 'experience', label: 'Experience' },
]
const CANDIDATES_PER_PAGE = 10

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

function toDisplayValue(value) {
    const normalized = value != null ? String(value).trim() : ''
    return normalized || 'N / A'
}

function customFieldValue(item, fieldName) {
    const fields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const key = String(fieldName || '').toLowerCase()
    const field = fields.find((f) => String(f?.name || '').toLowerCase() === key)
    if (!field) return ''
    const val = field?.value
    if (Array.isArray(val)) {
        const first = val.find((x) => x != null && String(x).trim() !== '')
        return first != null ? String(first).trim() : ''
    }
    return val != null ? String(val).trim() : ''
}

function pickPhoneFromSource(raw) {
    if (!raw || typeof raw !== 'object') return ''
    const keys = [
        'phone',
        'mobile',
        'contact_number',
        'phone_number',
        'mobileno',
        'contact_phone',
        'whatsapp',
        'whatsapp_number',
        'telephone',
    ]
    for (const key of keys) {
        const value = raw[key]
        if (value == null) continue
        const normalized = String(value).trim()
        if (normalized) return normalized
    }
    const userObj = raw.user && typeof raw.user === 'object' ? raw.user : null
    const extra = [
        () => customFieldValue(raw, 'Phone number'),
        () => customFieldValue(raw, 'Phone Number'),
        () => customFieldValue(raw, 'Mobile'),
        () => raw.contact,
        () => raw.user_number,
        () => userObj?.mobile,
        () => userObj?.phone,
        () => userObj?.phone_number,
    ]
    for (const get of extra) {
        try {
            const v = get()
            if (v == null) continue
            const s = String(v).trim()
            if (s) return s
        } catch {
            /* skip */
        }
    }
    return ''
}

function pickPhoneFromCandidate(raw) {
    if (!raw || typeof raw !== 'object') return ''
    const nestedSources = [raw, raw.candidate, raw.job_info, raw.jobInfo, raw.item].filter(
        (source) => source && typeof source === 'object'
    )
    const seen = new Set()
    for (const source of nestedSources) {
        if (seen.has(source)) continue
        seen.add(source)
        const phone = pickPhoneFromSource(source)
        if (phone) return phone
    }
    return ''
}

function getCandidateCallablePhone(candidate) {
    if (!candidate) return ''
    const raw = String(candidate.phoneRaw || '').trim()
    if (hasCallableDigits(raw)) return raw
    const display = String(candidate.phoneNumber || '').trim()
    if (hasCallableDigits(display)) return display
    return ''
}

function dialDigits(value) {
    if (value == null) return ''
    return String(value).replace(/\D/g, '')
}

function hasCallableDigits(value) {
    return dialDigits(value).length >= 8
}

function openWhatsAppForPhone(rawPhone) {
    const d = dialDigits(rawPhone)
    if (d.length < 8) return
    window.open(`https://wa.me/${d}`, '_blank', 'noopener,noreferrer')
}

function CandidateCardSkeleton() {
    return (
        <div className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white animate-pulse">
            <div className="flex min-w-0 flex-1 gap-[14px] p-[16px] items-center justify-between border-b border-[rgba(143,143,143,0.16)]">
                <div className="flex items-center gap-[14px]">
                    <div className="h-[40px] w-[40px] rounded-full bg-[#eef1f4]" />
                    <div className="h-[16px] w-[180px] rounded bg-[#eef1f4]" />
                </div>
            </div>
            <div className="p-[20px]">
                <div className="h-[14px] w-[70%] rounded bg-[#eef1f4] mb-[8px]" />
                <div className="h-[14px] w-[55%] rounded bg-[#eef1f4] mb-[8px]" />
                <div className="h-[14px] w-[60%] rounded bg-[#eef1f4]" />
            </div>
        </div>
    )
}

function SearchableDropdownField({ id, label, value, options, onChange }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)
    const [menuPos, setMenuPos] = useState(null)
    const normalizedValue = String(value || '').toLowerCase()
    const filteredOptions = options.filter((option) =>
        String(option).toLowerCase().includes(normalizedValue)
    )

    const updateMenuPosition = () => {
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }

    useLayoutEffect(() => {
        if (!open) {
            setMenuPos(null)
            return undefined
        }
        updateMenuPosition()
        const onScroll = () => updateMenuPosition()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', onScroll)
        }
    }, [open, value])

    const dropdown =
        open && menuPos && typeof document !== 'undefined'
            ? createPortal(
                <div
                    className="fixed z-[10] max-h-[220px] overflow-auto rounded-[6px] border border-[#e5e7eb] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                    style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={`${id}-${option}`}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    onChange(option)
                                    setOpen(false)
                                }}
                                className="w-full cursor-pointer px-[10px] py-[8px] text-left text-[13px] font-[Inter-Regular] text-[#23262A] hover:bg-[#f7f7f8]"
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <p className="px-[10px] py-[8px] text-[12px] font-[Inter-Regular] text-[#23262A]">
                            No results
                        </p>
                    )}
                </div>,
                document.body
            )
            : null

    return (
        <div ref={wrapRef} className="relative min-w-[100px] flex-1">
            <input
                id={id}
                value={value}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search"
                className="peer h-[40px] w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white px-[10px] py-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#9CA3AF]"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[8px] top-[-8px] bg-[#f5f6f8] px-[4px] text-[10px] font-[Inter-SemiBold] text-[#666b72]"
            >
                {label}
            </label>
            {dropdown}
        </div>
    )
}


const SavedCandidates = () => {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [savedCandidates, setSavedCandidates] = useState([])
    const [removeCandidateId, setRemoveCandidateId] = useState(null)
    const [removeSaveSource, setRemoveSaveSource] = useState('application')
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCandidatesCount, setTotalCandidatesCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [languageQuery, setLanguageQuery] = useState('')
    const [emirateQuery, setEmirateQuery] = useState('')
    const [categoryQuery, setCategoryQuery] = useState('')
    const [positionQuery, setPositionQuery] = useState('')
    const [salaryQuery, setSalaryQuery] = useState('')
    const [nationalityQuery, setNationalityQuery] = useState('')
    const [keywordQuery, setKeywordQuery] = useState('')
    const [moreOpen, setMoreOpen] = useState(false)
    const [moreBy, setMoreBy] = useState('visa')
    const moreWrapRef = useRef(null)
    const [moreMenuPos, setMoreMenuPos] = useState(null)
    const resolvedUserId = useMemo(
        () =>
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null,
        [userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id]
    )

    const totalCandidates = Number(totalCandidatesCount || 0)

    const filteredCandidates = useMemo(() => {
        return savedCandidates.filter((candidate) => {
            const cLang = String(candidate.languages || '').toLowerCase()
            const cLoc = String(candidate.location || '').toLowerCase()
            const cPos = String(candidate.currentPosition || '').toLowerCase()
            const cNat = String(candidate.nationality || '').toLowerCase()
            const cSal = String(candidate.desiredSalary || '').toLowerCase()
            const cName = String(candidate.name || '').toLowerCase()
            const keywordBlob = `${cName} ${cPos} ${cLoc} ${cLang} ${cNat} ${cSal}`.toLowerCase()

            if (languageQuery && !cLang.includes(languageQuery.toLowerCase())) return false
            if (emirateQuery && !cLoc.includes(emirateQuery.toLowerCase())) return false
            if (categoryQuery && !cPos.includes(categoryQuery.toLowerCase())) return false
            if (positionQuery && !cPos.includes(positionQuery.toLowerCase())) return false
            if (nationalityQuery && !cNat.includes(nationalityQuery.toLowerCase())) return false
            if (salaryQuery && !cSal.includes(salaryQuery.toLowerCase())) return false
            if (keywordQuery && !keywordBlob.includes(keywordQuery.toLowerCase())) return false
            return true
        })
    }, [
        savedCandidates,
        languageQuery,
        emirateQuery,
        categoryQuery,
        positionQuery,
        nationalityQuery,
        keywordQuery,
        salaryQuery,
    ])
    const hasActiveFilters = Boolean(
        languageQuery || emirateQuery || categoryQuery || positionQuery || nationalityQuery || keywordQuery || salaryQuery
    )
    const totalPages = Math.max(
        1,
        Math.ceil((hasActiveFilters ? filteredCandidates.length : totalCandidates) / CANDIDATES_PER_PAGE)
    )
    const displayedCandidates = hasActiveFilters
        ? filteredCandidates.slice(
            (currentPage - 1) * CANDIDATES_PER_PAGE,
            currentPage * CANDIDATES_PER_PAGE
        )
        : filteredCandidates
    const visibleCount = hasActiveFilters ? filteredCandidates.length : totalCandidates

    useEffect(() => {
        const userId = resolvedUserId
        if (!userId) {
            setSavedCandidates([])
            setTotalCandidatesCount(0)
            setIsLoading(false)
            return
        }

        let cancelled = false
        const run = async () => {
            setIsLoading(true)
            try {
                const response = await getSavedCandidateDetailsApi.getSavedCandidateDetails({
                    user_id: userId,
                    offset: (currentPage - 1) * CANDIDATES_PER_PAGE,
                    limit: CANDIDATES_PER_PAGE,
                    include_listing_saves: true,
                })
                const parsed = parseApiPayload(response?.data)
                const list = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = list.map((candidate) => {
                    const phoneRaw = pickPhoneFromCandidate(candidate)
                    return {
                    id: candidate?.id,
                    name: toDisplayValue(candidate?.full_name),
                    profile: String(candidate?.profile || '').trim(),
                    phoneNumber: phoneRaw || '+97148376876',
                    phoneRaw,
                    nationality: toDisplayValue(candidate?.nationality),
                    currentPosition: toDisplayValue(candidate?.current_position),
                    desiredSalary: toDisplayValue(candidate?.desired_salary),
                    lastActivity: 'N / A',
                    location: toDisplayValue(candidate?.currentlt_locate),
                    experience: toDisplayValue(candidate?.date_of_birth),
                    education: toDisplayValue(candidate?.education_level),
                    languages: toDisplayValue(candidate?.language),
                    saveSource: candidate?.save_source === 'listing' ? 'listing' : 'application',
                }
                })
                if (!cancelled) {
                    setSavedCandidates(mapped)
                    setTotalCandidatesCount(Number(parsed?.total_data ?? mapped.length ?? 0))
                }
            } catch {
                if (!cancelled) {
                    setSavedCandidates([])
                    setTotalCandidatesCount(0)
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [currentPage, resolvedUserId])

    useLayoutEffect(() => {
        if (!moreOpen) {
            setMoreMenuPos(null)
            return undefined
        }
        const updateMoreMenuPosition = () => {
            const el = moreWrapRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            setMoreMenuPos({ top: r.bottom + 4, left: r.left, width: r.width })
        }
        updateMoreMenuPosition()
        window.addEventListener('scroll', updateMoreMenuPosition, true)
        window.addEventListener('resize', updateMoreMenuPosition)
        return () => {
            window.removeEventListener('scroll', updateMoreMenuPosition, true)
            window.removeEventListener('resize', updateMoreMenuPosition)
        }
    }, [moreOpen])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    useEffect(() => {
        setCurrentPage(1)
    }, [languageQuery, emirateQuery, categoryQuery, positionQuery, nationalityQuery, keywordQuery, salaryQuery])

    const removeCandidate = async (candidateId, saveSource = 'application') => {
        if (!resolvedUserId || !candidateId) return
        try {
            if (saveSource === 'listing') {
                await savedCandidateDetailsApi.savedCandidateDetails({
                    user_id: resolvedUserId,
                    type: 'all',
                    item_id: candidateId,
                })
            } else {
                await savedCandidateDetailsApi.savedCandidateDetails({
                    user_id: resolvedUserId,
                    job_info_id: candidateId,
                })
            }
            setSavedCandidates((prev) =>
                prev.filter(
                    (candidate) =>
                        !(String(candidate.id) === String(candidateId) && candidate.saveSource === saveSource)
                )
            )
            setTotalCandidatesCount((prev) => Math.max(0, prev - 1))
        } catch (e) {
            console.error('Failed to remove saved candidate:', e)
        }
    }

    const hasSavedCandidates = displayedCandidates.length > 0
    const selectedMoreLabel = MORE_OPTIONS.find((opt) => opt.value === moreBy)?.label || 'Visa status'

    return (
        <div className="px-[24px] pb-[40px]">
            <div className="mb-[16px] flex items-start gap-[10px] rounded-[6px] bg-[#1270ec] p-[16px_16px]">
                <div className="">
                    <InfoIcon className="w-[20px] h-[20px]" />
                </div>
                <p className="text-[14px] font-[Inter-Regular] text-white">We've provided a sample of candidates to help you get started. You can adjust the filters below to find the right candidates for your job.</p>
            </div>

            <div className="mb-[24px]" >
                <div className="flex flex-wrap items-start gap-[16px] mb-[8px]">
                    <h1 className="text-[20px] font-[Inter-Medium] leading-tight text-[#141414]">
                        Saved Candidates
                    </h1>
                </div>
                <p className="text-[14px] leading-[1.5] font-[Inter-Regular] text-[#23262A]">
                    Be as specific as you wish. We&apos;ll bring you candidate profiles that match your exact needs.
                </p>
            </div>

            <div className="mb-[20px] flex items-end gap-[10px] overflow-x-auto hide_scrollbar whitespace-nowrap pt-[4px]">
                    <SearchableDropdownField
                        id="language"
                        label="Language"
                        value={languageQuery}
                        options={LANGUAGE_OPTIONS}
                        onChange={setLanguageQuery}
                    />
                    <SearchableDropdownField
                        id="emirate"
                        label="Emirate"
                        value={emirateQuery}
                        options={EMIRATE_OPTIONS}
                        onChange={setEmirateQuery}
                    />
                    <SearchableDropdownField
                        id="category"
                        label="Category"
                        value={categoryQuery}
                        options={CATEGORY_OPTIONS}
                        onChange={setCategoryQuery}
                    />
                    <SearchableDropdownField
                        id="position"
                        label="Current Position"
                        value={positionQuery}
                        options={POSITION_OPTIONS}
                        onChange={setPositionQuery}
                    />
                    <SearchableDropdownField
                        id="salary"
                        label="Salary"
                        value={salaryQuery}
                        options={SALARY_OPTIONS}
                        onChange={setSalaryQuery}
                    />
                    <SearchableDropdownField
                        id="nationality"
                        label="Nationality"
                        value={nationalityQuery}
                        options={NATIONALITY_OPTIONS}
                        onChange={setNationalityQuery}
                    />
                    <SearchableDropdownField
                        id="keyword"
                        label="Keyword"
                        value={keywordQuery}
                        options={KEYWORD_OPTIONS}
                        onChange={setKeywordQuery}
                    />
                    <div ref={moreWrapRef} className="relative ">
                    <button
                        type="button"
                        onClick={() => setMoreOpen((prev) => !prev)}
                        className="flex  w-full cursor-pointer items-center justify-between rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[8px_12px] outline-none gap-[10px]"
                    >
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{selectedMoreLabel}</p>
                        <FormDownArrowIcon className={`h-[18px] w-[18px] text-[#6b7280] transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {moreOpen && moreMenuPos && typeof document !== 'undefined'
                        ? createPortal(
                            <div
                                className="fixed z-[10] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)] py-[4px]"
                                style={{ top: moreMenuPos.top, left: moreMenuPos.left, width: moreMenuPos.width }}
                            >
                                {MORE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setMoreBy(option.value)
                                            setMoreOpen(false)
                                        }}
                                        className={`flex w-full cursor-pointer items-center px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition ${moreBy === option.value ? 'bg-[#e0000014]' : 'bg-white hover:bg-[#e0000014]'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>,
                            document.body
                        )
                        : null}
                </div>
            </div>

            <p className="mb-[20px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                <span className="font-[Inter-SemiBold]">{visibleCount}</span> total candidates
            </p>

            {isLoading ? (
                <div className="flex flex-col gap-[16px]">
                    {Array.from({ length: 3 }).map((_, idx) => <CandidateCardSkeleton key={`saved-candidate-skeleton-${idx}`} />)}
                </div>
            ) : hasSavedCandidates ? (
                <div className="flex flex-col gap-[16px]">
                    {displayedCandidates.map((candidate) => (
                        <div
                            key={`${candidate.saveSource}-${candidate.id}`}
                            className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white"
                        >
                            <div className="flex min-w-0 flex-1 gap-[14px] p-[16px] items-center justify-between border-b border-[rgba(143,143,143,0.16)]">
                                <div className="flex items-center gap-[14px]">
                                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full " aria-hidden>
                                        <Image src={candidate.profile || user} alt="user" width={40} height={40} className="h-[40px] w-[40px] rounded-full object-cover" />
                                    </div>
                                    <h2 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">{candidate.name}</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRemoveCandidateId(candidate.id)
                                        setRemoveSaveSource(candidate.saveSource || 'application')
                                    }}
                                    className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[6px] border border-[#d8e7fc] bg-[#d8e7fc] p-[8px_16px] text-[#0c4a9d]"
                                >
                                    <SaveTickIcon className="h-[18px] w-[18px]" fill="#0c4a9d" />
                                    <p className="text-[14px] font-[Inter-SemiBold]">Saved</p>
                                </button>
                            </div>
                            <div className="p-[20px] flex justify-between items-center">
                                <div className="flex items-center gap-[14px]">
                                    <div className="flex flex-col gap-[4px]">
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Nationality:</p>
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{candidate.nationality}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Current Position:</p>
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{candidate.currentPosition}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Desired Salary:</p>
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{candidate.desiredSalary}</p>
                                        </div>
                                        {/* <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#43bb3f]">Last Activity:</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#43bb3f]">{candidate.lastActivity}</p>
                                        </div> */}
                                    </div>
                                    <div className="flex flex-col gap-[4px]">
                                        <div className="flex items-start gap-[8px]">
                                            <Image src={location} alt="location" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.location}</p>
                                        </div>
                                        <div className="flex items-start gap-[8px]">
                                            <Image src={cake} alt="cake" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.experience}</p>
                                        </div>
                                        <div className="flex items-start gap-[8px]">
                                            <Image src={education} alt="education" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.education}</p>
                                        </div>
                                        <div className="flex items-start gap-[8px]">
                                            <Image src={language} alt="language" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.languages}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center gap-[10px] sm:flex-row lg:flex-col">
                                    <button
                                        type="button"
                                        className="inline-flex  cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#DC0000] bg-white p-[8px_30px] transition"
                                        onClick={() => {
                                            setSelectedCandidate({
                                                ...candidate,
                                                phoneRaw: getCandidateCallablePhone(candidate) || candidate.phoneRaw,
                                            })
                                            setPhoneNumberModalOpen(true)
                                        }}
                                    >
                                        <CallIcon className="h-[18px] w-[18px] text-[#DC0000]" />
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#DC0000]">Show Phone Number</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openWhatsAppForPhone(getCandidateCallablePhone(candidate))}
                                        disabled={!hasCallableDigits(getCandidateCallablePhone(candidate))}
                                        className="inline-flex cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#008b04] bg-white p-[8px_30px] transition disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <WhatsappIcon className="h-[18px] w-[18px] text-[#25D366]" />
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#008b04]">WhatsApp</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-[6px]  bg-white p-[24px] [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                    <div>
                        <Image src={savedsearch} alt="savedsearch" className="h-[350px] w-[550px]" />
                    </div>
                    <p className="mb-[4px] text-center text-[14px] font-[Inter-Regular] text-[#464c55]">
                        We could not find anything that quite matches your search.
                    </p>
                    <p className="text-center text-[14px] font-[Inter-Regular] text-[#464c55]">
                        Please refine your search using the filters above.
                    </p>
                </div>
            )}

            {totalPages > 1 ? (
                <div className="mt-[20px] flex items-center justify-center gap-[8px]">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Previous page"
                    >
                        ‹
                    </button>
                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Next page"
                    >
                        ›
                    </button>
                </div>
            ) : null}

            <RemoveSaveCandidateModal
                open={Boolean(removeCandidateId)}
                onClose={() => {
                    setRemoveCandidateId(null)
                    setRemoveSaveSource('application')
                }}
                onConfirm={() => {
                    if (!removeCandidateId) return
                    removeCandidate(removeCandidateId, removeSaveSource)
                    setRemoveCandidateId(null)
                    setRemoveSaveSource('application')
                }}
            />
            <PhoneNumberModal
                open={phoneNumberModalOpen}
                onClose={() => {
                    setPhoneNumberModalOpen(false)
                    setSelectedCandidate(null)
                }}
                phoneNumber={selectedCandidate?.phoneNumber}
                phoneRaw={selectedCandidate?.phoneRaw}
                name={selectedCandidate?.name}
                imageSrc={selectedCandidate?.profile}
            />
        </div>
    )
}

export default SavedCandidates
