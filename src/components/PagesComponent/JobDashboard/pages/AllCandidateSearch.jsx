'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import {
    InfoIcon,
    RightArrowIcon,
    SavePlusIcon,
    SaveTickIcon,
    CallIcon,
    WhatsappIcon,
    PaginationPrevIcon,
    PaginationNextIcon,
    FormDownArrowIcon,
} from '@/components/CustomFile/icons'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { recruiterItemsApi, savedCandidateDetailsApi } from '@/utils/api'
import user from '../../../../../public/assets/img/jobdashboard/user.jpeg'
import location from '../../../../../public/assets/img/jobdashboard/icons/location.svg'
import cake from '../../../../../public/assets/img/jobdashboard/icons/cake.svg'
import education from '../../../../../public/assets/img/jobdashboard/icons/education.svg'
import language from '../../../../../public/assets/img/jobdashboard/icons/language.svg'

const CANDIDATE_DETAIL_CACHE_KEY = 'jobdashboard_candidate_detail_cache'
const PER_PAGE = 10
const LANGUAGE_OPTIONS = ['Arabic', 'English', 'Hindi', 'Urdu', 'Punjabi', 'Tagalog']
const EMIRATE_OPTIONS = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah']
const CATEGORY_OPTIONS = ['Accounting', 'Sales', 'Engineering', 'Marketing', 'Customer Service']
const POSITION_OPTIONS = ['Accounting Manager', 'Salesperson', 'Senior Developer', 'HR Executive']
const NATIONALITY_OPTIONS = ['Pakistani', 'Indian', 'Filipino', 'Egyptian', 'Nepali']
const SALARY_OPTIONS = ['Any', 'Up to 5,000 AED', '5,000 - 10,000 AED', '10,000+ AED']
const KEYWORD_OPTIONS = ['Accounting', 'Sales', 'Remote', 'Manager', 'Part Time', 'Full Time']
const MORE_OPTIONS = [
    { value: 'visa', label: 'Visa status' },
    { value: 'experience', label: 'Experience' },
]

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

function pickPhoneFromListingItem(item) {
    if (!item || typeof item !== 'object') return ''
    const user = item.user && typeof item.user === 'object' ? item.user : null
    const keys = [
        () => customFieldValue(item, 'Phone number'),
        () => customFieldValue(item, 'Phone Number'),
        () => customFieldValue(item, 'Mobile'),
        () => item.contact,
        () => item.phone,
        () => item.mobile,
        () => item.phone_number,
        () => item.user_number,
        () => user?.mobile,
        () => user?.phone,
        () => user?.phone_number,
    ]
    for (const get of keys) {
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

function dialDigits(value) {
    if (value == null) return ''
    return String(value).replace(/\D/g, '')
}

/** Enough digits for tel: / wa.me (avoids opening empty or junk links). */
function hasCallableDigits(value) {
    return dialDigits(value).length >= 8
}

function openWhatsAppForPhone(rawPhone) {
    const d = dialDigits(rawPhone)
    if (d.length < 8) return
    window.open(`https://wa.me/${d}`, '_blank', 'noopener,noreferrer')
}

function openTelForPhone(rawPhone) {
    const d = dialDigits(rawPhone)
    if (d.length < 8) return
    window.location.href = `tel:${d}`
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

function mapItemToCandidate(item) {
    const nationality = customFieldValue(item, 'Nationality')
    const locationValue = customFieldValue(item, 'Current Location')
    const languageValue = item?.user?.language
    const educationLevel = customFieldValue(item, 'Education Level')
    const expectedSalary = customFieldValue(item, 'Expected Salary')
    const currentPosition = item?.user?.experience_job_titel
    const resume = customFieldValue(item, 'Upload your CV')
    const phoneRaw = pickPhoneFromListingItem(item)

    return {
        id: item?.id,
        name: toDisplayValue(item?.user?.name || item?.name),
        profile: String(item?.user?.profile || '').trim(),
        nationality: toDisplayValue(nationality),
        currentPosition: toDisplayValue(currentPosition),
        desiredSalary: toDisplayValue(expectedSalary),
        location: toDisplayValue(locationValue || item?.city || item?.address),
        experience: toDisplayValue(item?.user?.date_of_birth),
        education: toDisplayValue(educationLevel),
        languages: toDisplayValue(languageValue),
        phone: toDisplayValue(phoneRaw),
        phoneRaw,
        isSaved: item?.recruiter_like === true || String(item?.recruiter_like ?? '0') === '1' || String(item?.is_saved ?? '0') === '1',
        resumeUrl: resume || '',
    }
}

function cacheCandidateForDetailPage(candidate) {
    if (!candidate?.id || typeof window === 'undefined') return
    try {
        sessionStorage.setItem(
            CANDIDATE_DETAIL_CACHE_KEY,
            JSON.stringify({
                id: candidate.id,
                name: candidate.name,
                profile: candidate.profile,
                nationality: candidate.nationality,
                currentPosition: candidate.currentPosition,
                desiredSalary: candidate.desiredSalary,
                location: candidate.location,
                dateOfBirth: candidate.experience,
                education: candidate.education,
                languages: candidate.languages,
                isSaved: Boolean(candidate.isSaved),
                resume: candidate.resumeUrl,
                phoneNumber: candidate.phone,
                phoneRaw: candidate.phoneRaw,
            })
        )
    } catch {
        /* ignore */
    }
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

const AllCandidateSearch = () => {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [listTab, setListTab] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [allCandidates, setAllCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [apiLastPage, setApiLastPage] = useState(1)
    const [savedCount, setSavedCount] = useState(0)
    const [unsavedCount, setUnsavedCount] = useState(0)
    const [languageQuery, setLanguageQuery] = useState('')
    const [emirateQuery, setEmirateQuery] = useState('')
    const [categoryQuery, setCategoryQuery] = useState('')
    const [positionQuery, setPositionQuery] = useState('')
    const [nationalityQuery, setNationalityQuery] = useState('')
    const [keywordQuery, setKeywordQuery] = useState('')
    const [salaryQuery, setSalaryQuery] = useState('')
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

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!resolvedUserId) {
                if (!cancelled) {
                    setLoading(false)
                    setAllCandidates([])
                    setApiLastPage(1)
                    setSavedCount(0)
                    setUnsavedCount(0)
                }
                return
            }
            setLoading(true)
            try {
                const response = await recruiterItemsApi.getRecruiterItems({
                    page: currentPage,
                    limit: PER_PAGE,
                    user_id: resolvedUserId,
                    type: 'saved',
                })
                const parsed = parseApiPayload(response?.data)
                const dataBlock = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const list = Array.isArray(dataBlock?.data)
                    ? dataBlock.data
                    : Array.isArray(parsed?.data)
                        ? parsed.data
                        : []
                const mapped = list.map(mapItemToCandidate)
                if (!cancelled) {
                    setAllCandidates(mapped)
                    const lastPage = Number(dataBlock?.last_page || parsed?.last_page || 1)
                    setApiLastPage(lastPage > 0 ? lastPage : 1)
                    const resolvedSavedCount = Number(dataBlock?.saved_count ?? parsed?.saved_count ?? mapped.filter((c) => c.isSaved).length)
                    const resolvedUnsavedCount = Number(
                        dataBlock?.unsaved_count ??
                        parsed?.unsaved_count ??
                        Math.max(
                            0,
                            Number(dataBlock?.total_count ?? parsed?.total_count ?? mapped.length) - resolvedSavedCount
                        )
                    )
                    setSavedCount(Number.isFinite(resolvedSavedCount) ? resolvedSavedCount : 0)
                    setUnsavedCount(Number.isFinite(resolvedUnsavedCount) ? resolvedUnsavedCount : 0)
                }
            } catch {
                if (!cancelled) {
                    setAllCandidates([])
                    setApiLastPage(1)
                    setSavedCount(0)
                    setUnsavedCount(0)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [currentPage, resolvedUserId])

    const selectedMoreLabel = MORE_OPTIONS.find((opt) => opt.value === moreBy)?.label || 'Visa status'
    const filteredCandidates = useMemo(() => {
        const byTab =
            listTab === 'saved'
                ? allCandidates.filter((c) => c.isSaved)
                : listTab === 'unsaved'
                    ? allCandidates.filter((c) => !c.isSaved)
                    : allCandidates
        return byTab.filter((candidate) => {
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
        listTab,
        allCandidates,
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
        hasActiveFilters ? Math.ceil(filteredCandidates.length / PER_PAGE) : Number(apiLastPage || 1)
    )
    const displayedCandidates = hasActiveFilters
        ? filteredCandidates.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
        : filteredCandidates

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
    }, [listTab, languageQuery, emirateQuery, categoryQuery, positionQuery, nationalityQuery, keywordQuery, salaryQuery])

    const toggleSaveCandidate = async (candidate) => {
        if (!resolvedUserId || !candidate?.id) return
        const currentlySaved = Boolean(candidate?.isSaved)
        try {
            await savedCandidateDetailsApi.savedCandidateDetails({
                user_id: resolvedUserId,
                type: 'all',
                item_id: candidate.id,
            })
        } catch (e) {
            console.error('Failed to save candidate details:', e)
            return
        }
        setAllCandidates((prev) =>
            prev.map((row) =>
                String(row.id) === String(candidate.id)
                    ? { ...row, isSaved: !currentlySaved }
                    : row
            )
        )
        setSavedCount((prev) => Math.max(0, currentlySaved ? prev - 1 : prev + 1))
        setUnsavedCount((prev) => Math.max(0, currentlySaved ? prev + 1 : prev - 1))
    }

    const leadingPages = [1, 2, 3, 4, 5].filter((p) => p <= totalPages)
    const lastLeadingPage = leadingPages.length ? leadingPages[leadingPages.length - 1] : 1
    const showTrailingPage = totalPages > lastLeadingPage

    return (
        <div className="px-[24px] pb-[40px]">
            <div className="mb-[16px] flex items-start gap-[10px] rounded-[6px] bg-[#1270ec] p-[16px_16px]">
                <div>
                    <InfoIcon className="w-[20px] h-[20px]" />
                </div>
                <p className="text-[14px] font-[Inter-Regular] text-white">
                    Showing candidates from jobs recruiter listing. Missing values are displayed as N / A.
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

            <div className="mb-[14px] flex gap-[8px] bg-white rounded-[6px] p-[8px] max-sm:overflow-x-auto hide_scrollbar max-sm:whitespace-nowrap">
                {[
                    { id: 'all', label: `All Candidates (${allCandidates.length})` },
                    { id: 'saved', label: `Saved Candidates (${savedCount})` },
                    { id: 'unsaved', label: `Unsaved Candidates (${unsavedCount})` },
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setListTab(t.id)}
                        className={`cursor-pointer rounded-[6px] p-[6px_10px] text-[14px] transition text-[#212121] ${listTab === t.id
                            ? 'bg-[#f2f2f2] font-[Inter-SemiBold]'
                            : 'bg-[#fff] font-[Inter-Regular]'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-[16px]">
                {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => <CandidateCardSkeleton key={`all-candidate-skeleton-${idx}`} />)
                ) : displayedCandidates.map((candidate) => (
                    <div
                        key={candidate.id}
                        className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white"
                    >
                        <div className="flex min-w-0 flex-1 gap-[14px] p-[16px] items-center justify-between border-b border-[rgba(143,143,143,0.16)] max-sm:flex-col max-sm:items-start">
                            <Link
                                href={`/jobdashboard/candidatedetail?id=${encodeURIComponent(String(candidate.id ?? ''))}`}
                                onClick={() => cacheCandidateForDetailPage(candidate)}
                                className="flex min-w-0 items-center gap-[14px] rounded-[6px] outline-none transition hover:opacity-80"
                            >
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full" aria-hidden>
                                    <Image src={candidate.profile || user} alt="user" width={40} height={40} className="h-[40px] w-[40px] rounded-full object-cover" />
                                </div>
                                <h2 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">{candidate.name}</h2>
                            </Link>
                            <div className="flex items-start justify-between gap-[8px]">
                                {candidate.isSaved ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleSaveCandidate(candidate)}
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[6px] border border-[#d8e7fc] bg-[#d8e7fc] p-[8px_16px] text-[#0c4a9d]"
                                    >
                                        <SaveTickIcon className="h-[18px] w-[18px]" />
                                        <p className="text-[14px] font-[Inter-SemiBold]">Saved</p>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => toggleSaveCandidate(candidate)}
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] border border-[rgba(143,143,143,0.16)] rounded-[6px] p-[8px_16px]"
                                    >
                                        <SavePlusIcon className="h-[18px] w-[18px] text-[#2563eb]" />
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#0c4a9d]">Unsaved</p>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-[20px] flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-[10px]">
                            <div className="flex items-center gap-[14px] max-sm:flex-col max-sm:items-start">
                                <div className="flex flex-col gap-[4px]">
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Nationality:</p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.nationality}</p>
                                    </div>
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Current Position:</p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.currentPosition}</p>
                                    </div>
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Desired Salary:</p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.desiredSalary}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <div className="flex items-start gap-[8px]">
                                        <Image src={location} alt="location" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] truncate w-[150px]">{candidate.location}</p>
                                    </div>
                                    <div className="flex items-start gap-[8px]">
                                        <Image src={cake} alt="cake" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] truncate w-[150px]">{candidate.experience}</p>
                                    </div>
                                    <div className="flex items-start gap-[8px]">
                                        <Image src={education} alt="education" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] truncate w-[150px]">{candidate.education}</p>
                                    </div>
                                    <div className="flex items-start gap-[8px]">
                                        <Image src={language} alt="language" width={20} height={16} className="h-[16px] w-[20px] shrink-0" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] truncate w-[150px]">{candidate.languages}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-[10px] sm:flex-row lg:flex-col">
                                <button
                                    type="button"
                                    onClick={() => openTelForPhone(candidate.phoneRaw)}
                                    disabled={!hasCallableDigits(candidate.phoneRaw)}
                                    className="inline-flex cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#DC0000] bg-white p-[8px_30px] transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CallIcon className="h-[18px] w-[18px] text-[#DC0000]" />
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#DC0000]">{candidate.phone}</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openWhatsAppForPhone(candidate.phoneRaw)}
                                    disabled={!hasCallableDigits(candidate.phoneRaw)}
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

            <div className="mt-[20px] flex items-center justify-center gap-[8px]">
                <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Previous page"
                >
                    <PaginationPrevIcon className="h-[12px] w-[12px]" stroke={currentPage === 1 ? '#8F8F8F' : '#000'} />
                </button>

                {leadingPages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-[6px] border p-[0_8px] text-[14px] font-[Inter-Medium] ${currentPage === page
                            ? 'border-[#23262A] bg-[#23262A] text-white'
                            : 'border-[rgba(143,143,143,0.35)] bg-white text-[#23262A]'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {showTrailingPage ? (
                    <>
                        <span className="inline-flex h-[32px] items-center justify-center px-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">...</span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            className={`inline-flex h-[32px] min-w-[40px] cursor-pointer items-center justify-center rounded-[6px] border p-[0_10px] text-[14px] font-[Inter-Medium] ${currentPage === totalPages
                                ? 'border-[#23262A] bg-[#23262A] text-white'
                                : 'border-[rgba(143,143,143,0.35)] bg-white text-[#23262A]'
                                }`}
                        >
                            {totalPages}
                        </button>
                    </>
                ) : null}

                <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Next page"
                >
                    <PaginationNextIcon className="h-[12px] w-[12px]" stroke={currentPage === totalPages ? '#8F8F8F' : '#000'} />
                </button>
            </div>
        </div>
    )
}

export default AllCandidateSearch
