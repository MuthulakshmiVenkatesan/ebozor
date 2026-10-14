'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { RightArrowIcon, SavePlusIcon, CallIcon, WhatsappIcon, PaginationPrevIcon, PaginationNextIcon, SaveTickIcon, FormDownArrowIcon, SaveSearchIcon } from '@/components/CustomFile/icons'
import SaveSearchModal from '../components/SaveSearchModal'
import user from '../../../../../public/assets/img/jobdashboard/user.jpeg'
import location from '../../../../../public/assets/img/jobdashboard/icons/location.svg'
import cake from '../../../../../public/assets/img/jobdashboard/icons/cake.svg'
import education from '../../../../../public/assets/img/jobdashboard/icons/education.svg'
import language from '../../../../../public/assets/img/jobdashboard/icons/language.svg'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { candidateDetailsApi, getSavedCandidateDetailsApi, getUnsavedCandidateDetailsApi, savedCandidateDetailsApi } from '@/utils/api'
import PhoneNumberModal from '@/components/PagesComponent/JobDashboard/components/PhoneNumberModal'
const SAVED_SEARCHES_STORAGE_KEY = 'jobdashboard_saved_searches'
const CANDIDATE_DETAIL_CACHE_KEY = 'jobdashboard_candidate_detail_cache'

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
                cvUrl: typeof candidate.cvUrl === 'string' ? candidate.cvUrl : '',
                resume: typeof candidate.cvUrl === 'string' ? candidate.cvUrl : '',
                phoneNumber: toDisplayValue(candidate.phoneRaw),
                phoneRaw: typeof candidate.phoneRaw === 'string' ? candidate.phoneRaw : '',
            })
        )
    } catch {
        /* ignore quota / private mode */
    }
}

function pickCvUrl(raw) {
    if (!raw || typeof raw !== 'object') return ''
    const keys = [
        'cv_url',
        'resume_url',
        'candidate_cv_url',
        'candidate_cv',
        'cv',
        'resume',
        'cv_file',
        'attachment',
        'attachments',
    ]
    for (const k of keys) {
        const v = raw[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (Array.isArray(v)) {
            const first = v.find((x) => typeof x === 'string' && x.trim())
            if (first) return first.trim()
        }
    }
    return ''
}

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

function pickPhoneFromCandidate(raw) {
    if (!raw || typeof raw !== 'object') return ''
    const keys = ['phone', 'mobile', 'contact_number', 'phone_number', 'mobileno', 'contact_phone']
    for (const key of keys) {
        const value = raw[key]
        if (value == null) continue
        const normalized = String(value).trim()
        if (normalized) return normalized
    }
    const user = raw.user && typeof raw.user === 'object' ? raw.user : null
    const extra = [
        () => customFieldValue(raw, 'Phone number'),
        () => customFieldValue(raw, 'Phone Number'),
        () => customFieldValue(raw, 'Mobile'),
        () => raw.contact,
        () => raw.user_number,
        () => user?.mobile,
        () => user?.phone,
        () => user?.phone_number,
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

const CandidateSearch = () => {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [listTab, setListTab] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [languageQuery, setLanguageQuery] = useState('')
    const [emirateQuery, setEmirateQuery] = useState('')
    const [categoryQuery, setCategoryQuery] = useState('')
    const [positionQuery, setPositionQuery] = useState('')
    const [nationalityQuery, setNationalityQuery] = useState('')
    const [keywordQuery, setKeywordQuery] = useState('')
    const [salaryQuery, setSalaryQuery] = useState('')
    const [savedCandidates, setSavedCandidates] = useState([])
    const [savedCount, setSavedCount] = useState(0)
    const [savedCandidatesTotalCount, setSavedCandidatesTotalCount] = useState(0)
    const [unsavedCandidates, setUnsavedCandidates] = useState([])
    const [unsavedCount, setUnsavedCount] = useState(0)
    const [unsavedCandidatesTotalCount, setUnsavedCandidatesTotalCount] = useState(0)
    const [moreOpen, setMoreOpen] = useState(false)
    const [moreBy, setMoreBy] = useState('visa')
    const moreWrapRef = useRef(null)
    const [moreMenuPos, setMoreMenuPos] = useState(null)
    const fixedTopRef = useRef(null)
    const [fixedTopHeight, setFixedTopHeight] = useState(0)
    const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false)
    const [allCandidates, setAllCandidates] = useState([])
    const [allCandidatesCount, setAllCandidatesCount] = useState(0)
    const [isCandidatesLoading, setIsCandidatesLoading] = useState(true)
    const [isSavedCandidatesLoading, setIsSavedCandidatesLoading] = useState(false)
    const [isUnsavedCandidatesLoading, setIsUnsavedCandidatesLoading] = useState(false)
    const [rulesRefreshKey, setRulesRefreshKey] = useState(0)
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const formattedAllCount = Number(allCandidatesCount || 0).toLocaleString('en-US')
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
    const filteredCandidates = useMemo(() => {
        const byTab = (() => {
            if (listTab === 'saved') {
                return savedCandidates
            }
            if (listTab === 'unsaved') {
                return unsavedCandidates
            }
            return allCandidates
        })()

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
        allCandidates,
        listTab,
        savedCandidates,
        unsavedCandidates,
        languageQuery,
        emirateQuery,
        categoryQuery,
        positionQuery,
        nationalityQuery,
        keywordQuery,
        salaryQuery,
    ])
    const hasActiveFilters =
        Boolean(languageQuery || emirateQuery || categoryQuery || positionQuery || nationalityQuery || keywordQuery || salaryQuery)
    const totalPages = Math.max(
        1,
        Math.ceil(
            (
                listTab === 'all' && !hasActiveFilters
                    ? Number(allCandidatesCount || 0)
                    : listTab === 'saved' && !hasActiveFilters
                        ? Number(savedCandidatesTotalCount || 0)
                        : listTab === 'unsaved' && !hasActiveFilters
                            ? Number(unsavedCandidatesTotalCount || 0)
                        : filteredCandidates.length
            ) / CANDIDATES_PER_PAGE
        )
    )
    const leadingPages = [1, 2, 3, 4, 5].filter((p) => p <= totalPages)
    const lastLeadingPage = leadingPages.length ? leadingPages[leadingPages.length - 1] : 1
    const showTrailingPage = totalPages > lastLeadingPage
    const selectedMoreLabel = MORE_OPTIONS.find((opt) => opt.value === moreBy)?.label || 'Visa status'

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

    useLayoutEffect(() => {
        const el = fixedTopRef.current
        if (!el) return undefined
        const updateHeight = () => setFixedTopHeight(el.offsetHeight)
        updateHeight()
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight)
            return () => window.removeEventListener('resize', updateHeight)
        }
        const observer = new ResizeObserver(updateHeight)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])
    const paginatedCandidates =
        (listTab === 'all' || listTab === 'saved' || listTab === 'unsaved') && !hasActiveFilters
            ? filteredCandidates
            : filteredCandidates.slice(
                (currentPage - 1) * CANDIDATES_PER_PAGE,
                currentPage * CANDIDATES_PER_PAGE
            )

    useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const onRulesUpdated = () => setRulesRefreshKey((v) => v + 1)
        window.addEventListener('jobdashboard-rejection-rules-updated', onRulesUpdated)
        return () => window.removeEventListener('jobdashboard-rejection-rules-updated', onRulesUpdated)
    }, [])

    useEffect(() => {
        if (listTab === 'saved') return
        const userId = resolvedUserId
        if (!userId) {
            setAllCandidates([])
            setAllCandidatesCount(0)
            setIsCandidatesLoading(false)
            return
        }

        let cancelled = false
        const run = async () => {
            setIsCandidatesLoading(true)
            try {
                const response = await candidateDetailsApi.getCandidateDetails({
                    user_id: userId,
                    offset: (currentPage - 1) * CANDIDATES_PER_PAGE,
                    limit: CANDIDATES_PER_PAGE,
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
                        isSaved: String(candidate?.is_saved ?? '0') === '1',
                        cvUrl: pickCvUrl(candidate),
                    }
                })
                if (!cancelled) {
                    setAllCandidates(mapped)
                    setAllCandidatesCount(Number(parsed?.total_data ?? mapped.length ?? 0))
                    setSavedCount(Number(parsed?.saved_count ?? 0))
                    setUnsavedCount(Number(parsed?.unsaved_count ?? 0))
                }
            } catch {
                if (!cancelled) {
                    setAllCandidates([])
                    setAllCandidatesCount(0)
                }
            } finally {
                if (!cancelled) setIsCandidatesLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [currentPage, resolvedUserId, listTab, rulesRefreshKey])

    useEffect(() => {
        if (listTab !== 'saved') return
        const userId = resolvedUserId
        if (!userId) {
            setSavedCandidates([])
            setIsSavedCandidatesLoading(false)
            return
        }
        let cancelled = false
        const run = async () => {
            setIsSavedCandidatesLoading(true)
            try {
                const response = await getSavedCandidateDetailsApi.getSavedCandidateDetails({
                    user_id: userId,
                    offset: (currentPage - 1) * CANDIDATES_PER_PAGE,
                    limit: CANDIDATES_PER_PAGE,
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
                        isSaved: true,
                        cvUrl: pickCvUrl(candidate),
                    }
                })
                if (!cancelled) {
                    setSavedCandidates(mapped)
                    setSavedCandidatesTotalCount(Number(parsed?.total_data ?? mapped.length ?? 0))
                }
            } catch {
                if (!cancelled) {
                    setSavedCandidates([])
                    setSavedCandidatesTotalCount(0)
                }
            } finally {
                if (!cancelled) setIsSavedCandidatesLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [listTab, currentPage, resolvedUserId, rulesRefreshKey])

    useEffect(() => {
        if (listTab !== 'unsaved') return
        const userId = resolvedUserId
        if (!userId) {
            setUnsavedCandidates([])
            setUnsavedCandidatesTotalCount(0)
            setIsUnsavedCandidatesLoading(false)
            return
        }
        let cancelled = false
        const run = async () => {
            setIsUnsavedCandidatesLoading(true)
            try {
                const response = await getUnsavedCandidateDetailsApi.getUnsavedCandidateDetails({
                    user_id: userId,
                    offset: (currentPage - 1) * CANDIDATES_PER_PAGE,
                    limit: CANDIDATES_PER_PAGE,
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
                        isSaved: false,
                        cvUrl: pickCvUrl(candidate),
                    }
                })
                if (!cancelled) {
                    setUnsavedCandidates(mapped)
                    setUnsavedCandidatesTotalCount(Number(parsed?.total_data ?? mapped.length ?? 0))
                }
            } catch {
                if (!cancelled) {
                    setUnsavedCandidates([])
                    setUnsavedCandidatesTotalCount(0)
                }
            } finally {
                if (!cancelled) setIsUnsavedCandidatesLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [listTab, currentPage, resolvedUserId, rulesRefreshKey])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    useEffect(() => {
        setCurrentPage(1)
    }, [listTab])

    const toggleSaveCandidate = async (candidate) => {
        if (!resolvedUserId || !candidate?.id) return
        const currentlySaved = Boolean(candidate?.isSaved)
        try {
            await savedCandidateDetailsApi.savedCandidateDetails({
                user_id: resolvedUserId,
                job_info_id: candidate.id,
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
        setSavedCandidates((prev) => {
            const exists = prev.some((c) => String(c.id) === String(candidate.id))
            if (currentlySaved || exists) return prev.filter((c) => String(c.id) !== String(candidate.id))
            return [{ ...candidate, isSaved: true }, ...prev]
        })
        setUnsavedCandidates((prev) => {
            if (currentlySaved) return [{ ...candidate, isSaved: false }, ...prev]
            return prev.filter((c) => String(c.id) !== String(candidate.id))
        })
        setSavedCount((prev) => Math.max(0, currentlySaved ? prev - 1 : prev + 1))
        setSavedCandidatesTotalCount((prev) => Math.max(0, currentlySaved ? prev - 1 : prev + 1))
        setUnsavedCount((prev) => Math.max(0, currentlySaved ? prev + 1 : prev - 1))
        setUnsavedCandidatesTotalCount((prev) => Math.max(0, currentlySaved ? prev + 1 : prev - 1))
    }

    const handleSaveSearch = (searchName) => {
        const payload = {
            id: Date.now(),
            name: searchName,
            createdAt: new Date().toISOString(),
            filters: {
                language: languageQuery,
                emirate: emirateQuery,
                category: categoryQuery,
                currentPosition: positionQuery,
                salary: salaryQuery,
                nationality: nationalityQuery,
                keyword: keywordQuery,
                more: moreBy,
            },
        }

        try {
            const raw = localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY)
            const parsed = raw ? JSON.parse(raw) : []
            const list = Array.isArray(parsed) ? parsed : []
            localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify([payload, ...list]))
        } catch {
            localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify([payload]))
        }
    }

    return (
        <div className="mt-[calc(64px-100px)] px-[24px] pb-[40px] max-sm:mt-[calc(64px-130px)]">
            <div
                ref={fixedTopRef}
                className="fixed top-[64px] left-[280px] right-0 z-[8] bg-[#f5f6f8] px-[24px] pt-[24px] rtl:right-[280px] rtl:left-0 max-sm:left-0 max-sm:right-0"
            >
            <div className="mb-[24px]" >
                {/* <div className="flex flex-wrap items-start gap-[16px] mb-[8px]">
                    <h1 className="text-[20px] font-[Inter-Medium] leading-tight text-[#141414]">Candidate Search</h1>
                    <Link href="/jobdashboard/jobpackage"
                        className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[6px] border border-[#DC0000] p-[4px_10px] text-[12px] font-[Inter-Medium] text-[#DC0000] transition "
                    >
                        0 Credits Remaining
                        <RightArrowIcon className="w-[16px] h-[16px]" stroke='#DC0000' />
                    </Link>
                </div> */}
                <div className="flex items-center gap-[10px] justify-between max-sm:flex-col max-sm:items-start max-sm:gap-[10px] ">
                    <p className="text-[14px] leading-[1.5] font-[Inter-Regular] text-[#23262A]">
                        Be as specific as you wish. We&apos;ll bring you candidate profiles that match your exact needs.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSaveSearchModalOpen(true)}
                        className="flex items-center gap-[6px] rounded-[6px] bg-[#fff] p-[8px_16px] cursor-pointer "
                    >
                        <SaveSearchIcon className="w-[24px] h-[24px]" />
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Save Search</p>
                    </button>
                </div>
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
                    { id: 'all', label: `All Candidates (${formattedAllCount})` },
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
            </div>
            <div aria-hidden className="pointer-events-none" style={{ height: fixedTopHeight }} />

            <div className='flex flex-col gap-[16px]'>
                {(listTab === 'saved' ? isSavedCandidatesLoading : listTab === 'unsaved' ? isUnsavedCandidatesLoading : isCandidatesLoading) ? (
                    Array.from({ length: 3 }).map((_, idx) => <CandidateCardSkeleton key={`candidate-skeleton-${idx}`} />)
                ) : paginatedCandidates.map((candidate) => (
                    <div
                        key={candidate.id}
                        className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white"
                    >
                        <div className="flex min-w-0 flex-1 gap-[14px] p-[16px] items-center justify-between border-b border-[rgba(143,143,143,0.16)] max-sm:flex-col max-sm:items-start">
                            <Link
                                href={`/jobdashboard/candidatedetail?id=${encodeURIComponent(String(candidate.id ?? ''))}`}
                                onClick={() => cacheCandidateForDetailPage(candidate)}
                                className="flex min-w-0 items-center gap-[14px] rounded-[6px] outline-none transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#0c4a9d] focus-visible:ring-offset-2"
                            >
                                <div
                                    className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full "
                                    aria-hidden
                                >
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
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] transition border border-[rgba(143,143,143,0.16)] rounded-[6px] p-[8px_16px]"
                                    >
                                        <SavePlusIcon className="h-[18px] w-[18px] text-[#2563eb]" />
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#0c4a9d]">Save</p>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-[20px] flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-[10px] ">
                            <div className="flex items-center gap-[14px] max-sm:flex-col max-sm:items-start  ">
                                <div className="flex flex-col gap-[4px]">
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            Nationality:
                                        </p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.nationality}</p>
                                    </div>
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            Current Position:
                                        </p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.currentPosition}</p>
                                    </div>
                                    <div className="flex items-center gap-[8px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            Desired Salary:
                                        </p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate w-[150px]">{candidate.desiredSalary}</p>
                                    </div>
                                    {/* <div className="flex items-center gap-[8px]">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#43bb3f]">
                                            Last Activity:
                                        </p>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#43bb3f]">{candidate.lastActivity}</p>
                                    </div> */}
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
                                    className="inline-flex  cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#DC0000] bg-white p-[8px_30px] transition"
                                    onClick={() => {
                                        setSelectedCandidate(candidate)
                                        setPhoneNumberModalOpen(true)
                                    }}
                                >
                                    <CallIcon className="h-[18px] w-[18px] text-[#DC0000]" />
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#DC0000]">Show Phone Number</p>
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
                        <span className="inline-flex h-[32px] items-center justify-center px-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                            ...
                        </span>

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

            <SaveSearchModal
                open={saveSearchModalOpen}
                onClose={() => setSaveSearchModalOpen(false)}
                onSave={handleSaveSearch}
                userId={resolvedUserId}
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

export default CandidateSearch
