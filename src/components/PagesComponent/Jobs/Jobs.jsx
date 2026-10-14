'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';
import { userSignUpData } from '@/redux/reuducer/authSlice';
import { getCityData } from '@/redux/reuducer/locationSlice';
import { DownArrowIcon, GraduationIcon, LocationIcon, EducationIcon, SheildIcon, PhdIcon, FullTimeIcon, PartTimeIcon, ContractIcon, RemoteIcon, SearchIcon, CloseIcon, PaginationPrevIcon, PaginationNextIcon } from '@/components/CustomFile/icons';
import { categoryHomeApi, getFeaturedCompaniesApi, getPopularJobApi, jobQualificationCountApi, jobTypeCountApi, searchItemsApi } from '@/utils/api';
import { getJobsMenuHref } from '@/utils/jobsListingContext';
import category from '../../../../public/assets/img/jobs/category.png';
import companyPlaceholder from '../../../../public/assets/img/client.png';
import cvBanner from '../../../../public/assets/img/jobs/cv.png';
import jobbg from '../../../../public/assets/img/jobs/jobbg.png';
import CVModal from './components/CVModal';

const JOBS_RECRUITERS_CATEGORY_ID = 356
const JOBS_SEEKERS_CATEGORY_ID = 356
const JOBS_SEEKERS_ITEM_LABEL = 'Jobs Seekers'
const JOBS_SEEKERS_SLUG = 'jobs-jobs-seekers'
const JOBS_BY_CATEGORY_FEATURED_COUNT = 4

const getCustomFieldFirstValue = (item, fieldName) => {
    const rows = Array.isArray(item?.item_custom_field_values) ? item.item_custom_field_values : []
    const found = rows.find(
        (row) => String(row?.custom_field?.name || '').toLowerCase() === String(fieldName || '').toLowerCase()
    )
    const v = found?.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ')
    return v != null ? String(v) : ''
}

const getQualificationIcon = (title) => {
    const t = String(title || '').toLowerCase()
    if (t.includes('phd') || t.includes('doctorate') || t.includes('doctor')) {
        return <PhdIcon />
    }
    if (t.includes('master')) {
        return <GraduationIcon className='w-[38px] h-[38px]' fill="#1270EC" />
    }
    if (t.includes('bachelor') || /\bdegree\b/.test(t)) {
        return <SheildIcon />
    }
    return <EducationIcon />
}

const getEmploymentTypeIcon = (title) => {
    const t = String(title || '').toLowerCase()
    if (t.includes('part')) {
        return <PartTimeIcon />
    }
    if (t.includes('contract') || t.includes('temporary') || t.includes('freelance')) {
        return <ContractIcon />
    }
    if (t.includes('remote') || t.includes('work from home') || t.includes('wfh')) {
        return <RemoteIcon />
    }
    return <FullTimeIcon />
}

export const FEATURED_COMPANY_CACHE_KEY = 'jobs_featured_company_cache'

const parseApiPayload = (payload) => {
    if (typeof payload === 'string') {
        const scriptIndex = payload.indexOf('<script')
        const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim()
        if (!jsonText) return {}
        try {
            return JSON.parse(jsonText)
        } catch (e) {
            console.error('Jobs search parse failed:', e)
            return {}
        }
    }
    return payload || {}
}

const buildSuggestionMatchHaystack = (item) => {
    const parts = [
        item?.name,
        item?.translated_name,
        item?.category?.name,
        item?.category?.translated_name,
    ]
    return parts.map((p) => String(p || '').toLowerCase()).join(' ')
}

const filterSuggestionsByVisibleText = (rows, searchRaw) => {
    const q = String(searchRaw || '').trim().toLowerCase()
    if (!q || !Array.isArray(rows)) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    if (!tokens.length) return rows
    return rows.filter((item) => {
        const hay = buildSuggestionMatchHaystack(item)
        return tokens.every((t) => hay.includes(t))
    })
}

const slugifyLabel = (value = '') =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

const buildProductsFilterHref = (mode, itemLabel, slugOverride) => {
    const m = String(mode || 'jobs').trim() || 'jobs'
    const label = String(itemLabel || '').trim()
    const slug = slugOverride ? String(slugOverride).trim() : slugifyLabel(label)
    const q = new URLSearchParams()
    q.set('mode', m)
    q.set('item', label)
    q.set('slug', slug)
    return `/products?${q.toString()}`
}

const formatAdsCountText = (value) => {
    if (value == null || value === '') return '— Ads'
    const n = Number(value)
    if (Number.isNaN(n)) return '— Ads'
    return `${n.toLocaleString()} Ads`
}

const formatJobsCountLabel = (value) => {
    if (value == null || value === '') return '(— Jobs)'
    const n = Number(value)
    if (Number.isNaN(n)) return '(— Jobs)'
    return `(${n.toLocaleString()} Jobs)`
}

const resolveCategoryImage = (image) => {
    const src = String(image || '').trim()
    return src || category
}

const buildQualificationHref = (item, fieldName, city) => {
    const href = getJobsMenuHref(JOBS_SEEKERS_ITEM_LABEL, JOBS_SEEKERS_SLUG, '', {
        education: item?.name,
    })
    const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : ''
    const q = new URLSearchParams(query)
    const filterName = String(fieldName || '').trim()
    const label = String(item?.name || '').trim()
    if (filterName && label) {
        q.set(`filters[${filterName}]`, label)
    }
    const cityName = String(city || '').trim()
    if (cityName) q.set('city', cityName)
    return `/products?${q.toString()}`
}

const buildEmploymentTypeHref = (item, fieldName, city) => {
    const href = getJobsMenuHref(JOBS_SEEKERS_ITEM_LABEL, JOBS_SEEKERS_SLUG, '', {
        employment_type: item?.name,
    })
    const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : ''
    const q = new URLSearchParams(query)
    const filterName = String(fieldName || '').trim()
    const label = String(item?.name || '').trim()
    if (filterName && label) {
        q.set(`filters[${filterName}]`, label)
    }
    const cityName = String(city || '').trim()
    if (cityName) q.set('city', cityName)
    return `/products?${q.toString()}`
}


const JobsPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userData = useSelector(userSignUpData)
    const cityData = useSelector(getCityData)
    const userId = useMemo(() => {
        const id = userData?.id
        return id != null && String(id).trim() !== '' ? id : null
    }, [userData?.id])
    const selectedCity = useMemo(() => String(cityData?.city ?? '').trim(), [cityData?.city])
    const [showMoreCategories, setShowMoreCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [apiSuggestions, setApiSuggestions] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [popularJobs, setPopularJobs] = useState([])
    const [popularJobsLoading, setPopularJobsLoading] = useState(false)
    const [jobsByCategory, setJobsByCategory] = useState([])
    const [jobsByCategoryLoading, setJobsByCategoryLoading] = useState(false)
    const [jobsByQualification, setJobsByQualification] = useState([])
    const [jobsByQualificationLoading, setJobsByQualificationLoading] = useState(false)
    const [qualificationFieldName, setQualificationFieldName] = useState('')
    const [jobsByType, setJobsByType] = useState([])
    const [jobsByTypeLoading, setJobsByTypeLoading] = useState(false)
    const [employmentTypeFieldName, setEmploymentTypeFieldName] = useState('')
    const [cvModalOpen, setCvModalOpen] = useState(false)
    const [featuredCompanies, setFeaturedCompanies] = useState([])
    const [isFeaturedCompaniesLoading, setIsFeaturedCompaniesLoading] = useState(true)
    const featuredTrackRef = useRef(null)
    const [featuredSlidesPerView, setFeaturedSlidesPerView] = useState(6)
    const [featuredCurrentIndex, setFeaturedCurrentIndex] = useState(0)
    const [featuredContainerWidth, setFeaturedContainerWidth] = useState(0)
    const FEATURED_SLIDE_GAP = 16

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            setIsFeaturedCompaniesLoading(true)
            try {
                const response = await getFeaturedCompaniesApi.getFeaturedCompanies({
                    ...(userId ? { user_id: userId } : {}),
                })
                const payload = parseApiPayload(response?.data)
                const list = Array.isArray(payload?.data) ? payload.data : []
                if (!cancelled) setFeaturedCompanies(list)
            } catch (err) {
                console.error('Failed to fetch featured companies:', err)
                if (!cancelled) setFeaturedCompanies([])
            } finally {
                if (!cancelled) setIsFeaturedCompaniesLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userId])

    const cacheFeaturedCompanyForDetail = (company) => {
        if (typeof window === 'undefined' || !company?.id) return
        try {
            sessionStorage.setItem(
                FEATURED_COMPANY_CACHE_KEY,
                JSON.stringify(company)
            )
        } catch {
            /* ignore quota / private mode */
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const computeSlidesPerView = () => {
            const w = window.innerWidth
            if (w >= 1024) return 6
            if (w >= 768) return 4
            if (w >= 640) return 3
            return 2
        }
        const handleResize = () => {
            setFeaturedSlidesPerView(computeSlidesPerView())
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const el = featuredTrackRef.current
        if (!el || typeof ResizeObserver === 'undefined') return undefined
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setFeaturedContainerWidth(entry.contentRect.width)
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const featuredMaxIndex = Math.max(
        0,
        featuredCompanies.length - featuredSlidesPerView
    )

    useEffect(() => {
        setFeaturedCurrentIndex((prev) => Math.min(prev, featuredMaxIndex))
    }, [featuredMaxIndex])

    const featuredItemWidth =
        featuredSlidesPerView > 0 && featuredContainerWidth > 0
            ? (featuredContainerWidth -
                FEATURED_SLIDE_GAP * (featuredSlidesPerView - 1)) /
              featuredSlidesPerView
            : 0
    const featuredTranslateX =
        featuredItemWidth > 0
            ? -featuredCurrentIndex * (featuredItemWidth + FEATURED_SLIDE_GAP)
            : 0
    const featuredIsBeginning = featuredCurrentIndex <= 0
    const featuredIsEnd = featuredCurrentIndex >= featuredMaxIndex

    const handleFeaturedPrev = () => {
        setFeaturedCurrentIndex((prev) =>
            Math.max(0, prev - featuredSlidesPerView)
        )
    }
    const handleFeaturedNext = () => {
        setFeaturedCurrentIndex((prev) =>
            Math.min(featuredMaxIndex, prev + featuredSlidesPerView)
        )
    }

    const searchDebounceRef = React.useRef(null)
    const searchReqIdRef = React.useRef(0)
    const latestSearchParamsRef = React.useRef({
        q: '',
        categoryId: null,
    })

    const searchCategoryId = useMemo(() => {
        const raw =
            searchParams?.get('category_id') ??
            searchParams?.get('categoryId') ??
            searchParams?.get('parent_category_id')
        if (raw == null || raw === '') return null
        const n = Number(raw)
        return Number.isNaN(n) ? raw : n
    }, [searchParams])

    useEffect(() => {
        const categoryIdRaw = searchParams?.get('parent_category_id')
        if (!categoryIdRaw) {
            setPopularJobs([])
            setPopularJobsLoading(false)
            return
        }
        let cancelled = false
        setPopularJobsLoading(true)
        const loadPopularJobs = async () => {
            try {
                const response = await getPopularJobApi.getPopularJob({
                    category_id: categoryIdRaw,
                    ...(selectedCity ? { city: selectedCity } : {}),
                    ...(userId ? { user_id: userId } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const sections = Array.isArray(parsed?.data) ? parsed.data : []
                const section = sections.find((s) => s?.slug === 'popular-job') || sections[0]
                const rows = Array.isArray(section?.section_data) ? section.section_data : []
                const mapped = rows.map((row, idx) => ({
                    id: row?.id ?? `popular-${idx}`,
                    slug: row?.slug || '',
                    image: row?.image || category,
                    title: row?.name || '',
                    role: row?.category_name || getCustomFieldFirstValue(row, 'Job role') || getCustomFieldFirstValue(row, 'Job Role') || '—',
                    type: getCustomFieldFirstValue(row, 'Employment Type') || '—',
                    salary: getCustomFieldFirstValue(row, 'Monthly Salary') || '—',
                    country: row?.country || '—',
                }))
                if (!cancelled) setPopularJobs(mapped)
            } catch (e) {
                if (!cancelled) setPopularJobs([])
            } finally {
                if (!cancelled) setPopularJobsLoading(false)
            }
        }
        loadPopularJobs()
        return () => {
            cancelled = true
        }
    }, [searchParams, selectedCity, userId])

    useEffect(() => {
        let cancelled = false
        const loadJobsByCategory = async () => {
            setJobsByCategoryLoading(true)
            try {
                const response = await categoryHomeApi.getCategoryHome({
                    parent_category_id: JOBS_RECRUITERS_CATEGORY_ID,
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.category_item_count
                const mapped = (Array.isArray(rows) ? rows : [])
                    .map((row, idx) => {
                        const name = String(row?.name || '').trim()
                        if (!name) return null
                        return {
                            id: row?.category_id ?? row?.id ?? `jobs-cat-${idx}`,
                            name,
                            slug: String(row?.slug || '').trim() || slugifyLabel(name),
                            count: row?.count,
                            image: resolveCategoryImage(row?.image),
                        }
                    })
                    .filter(Boolean)
                if (!cancelled) setJobsByCategory(mapped)
            } catch (e) {
                console.error('jobs categoryhome fetch failed:', e)
                if (!cancelled) setJobsByCategory([])
            } finally {
                if (!cancelled) setJobsByCategoryLoading(false)
            }
        }
        loadJobsByCategory()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        const loadJobsByQualification = async () => {
            setJobsByQualificationLoading(true)
            try {
                const response = await jobQualificationCountApi.getJobQualificationCount({
                    parent_category_id: JOBS_SEEKERS_CATEGORY_ID,
                    ...(selectedCity ? { city: selectedCity } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.qualification_item_count
                const mapped = (Array.isArray(rows) ? rows : [])
                    .map((row, idx) => {
                        const name = String(row?.name || '').trim()
                        if (!name) return null
                        return {
                            id: row?.id ?? `jobs-qual-${idx}`,
                            name,
                            slug: String(row?.slug || '').trim() || slugifyLabel(name),
                            count: row?.count,
                        }
                    })
                    .filter(Boolean)
                if (!cancelled) {
                    setJobsByQualification(mapped)
                    setQualificationFieldName(String(parsed?.data?.custom_field_name || '').trim())
                }
            } catch (e) {
                console.error('jobs qualification count fetch failed:', e)
                if (!cancelled) {
                    setJobsByQualification([])
                    setQualificationFieldName('')
                }
            } finally {
                if (!cancelled) setJobsByQualificationLoading(false)
            }
        }
        loadJobsByQualification()
        return () => {
            cancelled = true
        }
    }, [selectedCity])

    useEffect(() => {
        let cancelled = false
        const loadJobsByType = async () => {
            setJobsByTypeLoading(true)
            try {
                const response = await jobTypeCountApi.getJobTypeCount({
                    parent_category_id: JOBS_SEEKERS_CATEGORY_ID,
                    ...(selectedCity ? { city: selectedCity } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.type_item_count
                const mapped = (Array.isArray(rows) ? rows : [])
                    .map((row, idx) => {
                        const name = String(row?.name || '').trim()
                        if (!name) return null
                        return {
                            id: row?.id ?? `jobs-type-${idx}`,
                            name,
                            slug: String(row?.slug || '').trim() || slugifyLabel(name),
                            count: row?.count,
                        }
                    })
                    .filter(Boolean)
                if (!cancelled) {
                    setJobsByType(mapped)
                    setEmploymentTypeFieldName(String(parsed?.data?.custom_field_name || '').trim())
                }
            } catch (e) {
                console.error('jobs type count fetch failed:', e)
                if (!cancelled) {
                    setJobsByType([])
                    setEmploymentTypeFieldName('')
                }
            } finally {
                if (!cancelled) setJobsByTypeLoading(false)
            }
        }
        loadJobsByType()
        return () => {
            cancelled = true
        }
    }, [selectedCity])

    const featuredJobCategories = useMemo(
        () => jobsByCategory.slice(0, JOBS_BY_CATEGORY_FEATURED_COUNT),
        [jobsByCategory]
    )
    const moreJobCategories = useMemo(
        () => jobsByCategory.slice(JOBS_BY_CATEGORY_FEATURED_COUNT),
        [jobsByCategory]
    )

    latestSearchParamsRef.current = {
        q: searchQuery.trim(),
        categoryId: searchCategoryId,
    }

    const categoryTitleForItem = (item) =>
        item?.category?.translated_name || item?.category?.name || ''

    const getSuggestionProductsPath = (item) => {
        const itemLabel = categoryTitleForItem(item) || item?.name || ''
        return buildProductsFilterHref('jobs', itemLabel, item?.category?.slug)
    }

    const navigateToSuggestion = (item) => {
        const path = getSuggestionProductsPath(item)
        router.push(path)
        setSearchQuery(item?.name || '')
        setShowSearchDropdown(false)
    }

    useEffect(() => {
        const q = searchQuery.trim()
        if (!q) {
            setApiSuggestions([])
            setSearchLoading(false)
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current)
                searchDebounceRef.current = null
            }
            return
        }

        searchReqIdRef.current += 1
        const fetchGeneration = searchReqIdRef.current

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            const { q: liveQ, categoryId: liveCategoryId } = latestSearchParamsRef.current
            const trimmed = String(liveQ || '').trim()
            if (!trimmed) {
                if (fetchGeneration === searchReqIdRef.current) {
                    setApiSuggestions([])
                    setSearchLoading(false)
                }
                return
            }
            try {
                const response = await searchItemsApi.searchItems({
                    search: trimmed,
                    page: 1,
                    ...(liveCategoryId != null ? { category_id: liveCategoryId } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.data
                if (fetchGeneration !== searchReqIdRef.current) return
                const raw = Array.isArray(rows) ? rows : []
                setApiSuggestions(filterSuggestionsByVisibleText(raw, trimmed))
            } catch (e) {
                console.error('jobs search failed:', e)
                if (fetchGeneration === searchReqIdRef.current) setApiSuggestions([])
            } finally {
                if (fetchGeneration === searchReqIdRef.current) setSearchLoading(false)
            }
        }, 320)

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current)
                searchDebounceRef.current = null
            }
        }
    }, [searchQuery, searchCategoryId])

    return (
        <div className='w-full mx-auto'>
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                <div className="mb-[40px]">
                    <div className="relative w-full h-[220px] md:h-[260px] rounded-[18px]  ">
                        <Image
                            src={jobbg}
                            alt="Job search hero"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-10 py-6">
                            <div className="w-full flex flex-col items-center justify-center text-white">
                                <h1 className="font-[Inter-Bold] text-[30px] text-[#FFFFFF] text-center mb-[24px]">
                                    Job hunting made easy with Ebozor
                                </h1>
                                <div className="relative bg-[#FFF] rounded-[4px] p-[12px] flex items-center w-full max-w-[600px]">
                                    <input
                                        type="text"
                                        placeholder="Search for jobs"
                                        className="outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setShowSearchDropdown(Boolean(e.target.value.trim()))
                                        }}
                                        onFocus={() => setShowSearchDropdown(true)}
                                    />
                                    <button type="button" aria-label={showSearchDropdown ? 'Close' : 'Search'} onClick={() => setShowSearchDropdown(false)} className="flex items-center justify-center">
                                    {showSearchDropdown ? (
                                        <CloseIcon className="w-[10px] h-[10px]" />
                                    ) : (
                                        <SearchIcon stroke="#8F8F8F" />
                                    )}
                                    </button>

                                    {showSearchDropdown ? (
                                    <div className="absolute left-0 right-0 top-[56px] bg-white rounded-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.14)] border border-[rgba(143,143,143,0.18)] overflow-hidden z-[999]">
                                        <div className="p-[12px_14px] border-b border-[rgba(143,143,143,0.18)]">
                                            <p className="text-left text-[14px] font-[Inter-Regular] text-[#000] truncate">
                                                {searchQuery.trim()}
                                            </p>
                                        </div>

                                        {searchLoading && !apiSuggestions.length ? (
                                            <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Searching...
                                            </div>
                                        ) : apiSuggestions.length ? (
                                            <div className="max-h-[260px] overflow-y-auto">
                                                {apiSuggestions.map((item) => {
                                                    const title = item?.name || ''
                                                    return (
                                                        <button
                                                            key={item?.id ?? title}
                                                            type="button"
                                                            className="w-full flex items-center justify-between gap-[12px] px-[14px] py-[12px] hover:bg-[#F5F5F5] cursor-pointer"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                navigateToSuggestion(item)
                                                            }}
                                                        >
                                                            <span className="flex items-start flex-col gap-[4px] min-w-0">
                                                                <span className="text-[14px] font-[Inter-Regular] text-[#000] truncate block w-full text-left">{title}</span>
                                                                {categoryTitleForItem(item) ? (
                                                                    <span className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] whitespace-nowrap text-left">
                                                                        {categoryTitleForItem(item)}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                            <p className="text-[14px] font-[Inter-Regular] text-[#3A88EF] whitespace-nowrap">
                                                                {formatAdsCountText(item?.category?.adscount ?? item?.adscount)}
                                                            </p>
                                                        </button>
 
                                                )})}
                                            </div>
                                        ) : (
                                            <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No results
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                </div>
                            </div>
                            <Link href="/recuriter">
                                <button className="cursor-pointer absolute top-[20px] end-[20px] border border-[#52A6FF] text-[#52A6FF] bg-[#fff] rounded-[12px] p-[8px_12px] text-[12px] font-[Inter-SemiBold]">
                                    I AM A RECRUITER
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
                {popularJobsLoading || popularJobs.length > 0 ? (
                    <div className='mb-[40px]'>
                        <h2 className="text-[#000000] font-[Inter-Bold] text-[24px] mb-[20px]">
                            Popular Jobs
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
                            {popularJobsLoading ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={`popular-job-skeleton-${idx}`} className="border border-[rgba(143,143,143,0.50)] !p-[20px] rounded-[14px] shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] animate-pulse">
                                        <div className="w-[90px] h-[90px] rounded-[12px] bg-[#EAECEF] mb-[14px]" />
                                        <div className="flex flex-col gap-[10px]">
                                            <div className="h-[14px] w-[90px] rounded bg-[#EAECEF]" />
                                            <div className="h-[18px] w-[160px] rounded bg-[#EAECEF]" />
                                            <div className="h-[14px] w-[120px] rounded bg-[#EAECEF]" />
                                            <div className="h-[14px] w-[130px] rounded bg-[#EAECEF]" />
                                            <div className="h-[14px] w-[110px] rounded bg-[#EAECEF]" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                popularJobs.map((job) => (
                                    <Link href={`/productdetail?slug=${encodeURIComponent(String(job.slug || job.id))}&item=jobs-seekers&mode=jobs`} className='w-full' key={job.id}>
                                        <div className="cursor-pointer border border-[rgba(143,143,143,0.50)] !p-[20px] rounded-[14px] shadow-[0_2px_50px_0_rgba(0,0,0,0.06)]">
                                            <div className="w-[90px] h-[90px] rounded-[12px] overflow-hidden mb-[14px]">
                                                <Image src={job.image} alt={job.title || ''} width={90} height={90} className="w-[90px] h-[90px] object-cover" />
                                            </div>
                                            <div>
                                                <div className='mb-[10px]'>
                                                    <h4 className="text-[#3A88EF] font-[Inter-SemiBold] text-[14px]">{job.role}</h4>
                                                    <h3 className="text-[#000000] font-[Inter-SemiBold] text-[18px] truncate">{job.title}</h3>
                                                </div>
                                                <div className='flex items-start gap-[10px] flex-col'>
                                                    <p className="text-[#666] font-[Inter-Medium] text-[14px]">{job.type}</p>
                                                    <p className="text-[#666] font-[Inter-Medium] text-[14px]">{job.salary}</p>
                                                    <div className="flex items-center gap-[4px]">
                                                        <LocationIcon />
                                                        <p className="text-[#666] font-[Inter-Medium] text-[14px] truncate">{job.country}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                ) : null}

                <div className='mb-[40px]'>
                    <h2 className="text-[#000000] font-[Inter-Bold] text-[24px] mb-[20px]">
                        Jobs By Category
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
                        {jobsByCategoryLoading ? (
                            Array.from({ length: JOBS_BY_CATEGORY_FEATURED_COUNT }).map((_, idx) => (
                                <div key={`jobs-cat-skeleton-${idx}`} className="rounded-[5px_5px_10px_10px] shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] overflow-hidden bg-white animate-pulse">
                                    <div className="w-full h-[180px] bg-[#EAECEF]" />
                                    <div className="p-[20px_14px]">
                                        <div className="h-[14px] w-[70%] rounded bg-[#EAECEF] mb-[10px]" />
                                        <div className="h-[14px] w-[40%] rounded bg-[#EAECEF]" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            featuredJobCategories.map((item) => (
                                <Link
                                    href={buildProductsFilterHref('jobs', item.name, item.slug)}
                                    className='w-full'
                                    key={item.id}
                                >
                                    <div className="cursor-pointer rounded-[5px_5px_10px_10px] shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] overflow-hidden bg-white">
                                        <div className="w-full h-[180px]  relative">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover rounded-[5px_5px_0_0] w-full h-full"
                                            />
                                        </div>
                                        <div className="p-[20px_14px] rounded-[0_0_10px_10px]">
                                            <h3 className="text-[#000000] font-[Inter-SemiBold] text-[14px] mb-[6px]">
                                                {item.name}
                                            </h3>
                                            <p className="font-[Inter-Regular] text-[14px] text-[#666]">
                                                {formatJobsCountLabel(item.count)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {showMoreCategories && moreJobCategories.length > 0 && (
                        <div className="mt-[24px] flex flex-wrap gap-[10px] justify-center">
                            {moreJobCategories.map((item) => (
                                <Link
                                    href={buildProductsFilterHref('jobs', item.name, item.slug)}
                                    className=''
                                    key={item.id}
                                >
                                    <button
                                        type="button"
                                        className="p-[10px_22px] rounded-full border border-[#F5F9FE] bg-[#F5F9FE] flex items-center gap-[4px] hover:border-[#52A6FF] cursor-pointer transition-colors"
                                    >
                                        <h4 className='text-[#000000] font-[Inter-Regular] text-[16px]'>{item.name}</h4>
                                        <span className="text-[#8F8F8FB2] font-[Inter-Regular] text-[16px]">{formatJobsCountLabel(item.count)}</span>
                                    </button>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!jobsByCategoryLoading && moreJobCategories.length > 0 ? (
                        <div className='text-center flex items-center justify-center my-[30px]'>
                            <button
                                type="button"
                                className="cursor-pointer bg-transparent flex items-center gap-[4px]"
                                onClick={() => setShowMoreCategories((prev) => !prev)}
                            >
                                <p className="text-[#3A88EF] text-[16px] font-[Inter-Medium]">
                                    {showMoreCategories ? 'View Less Categories' : 'View More Categories'}
                                </p>
                                <span className={`transition-transform duration-200 ${showMoreCategories ? 'rotate-180' : ''}`}>
                                    <DownArrowIcon />
                                </span>
                            </button>
                        </div>
                    ) : null}
                </div>

                {jobsByQualificationLoading || jobsByQualification.length > 0 ? (
                <div className='mb-[40px]'>
                    <h2 className="text-[#000000] font-[Inter-Bold] text-[20px] mb-[16px]">
                        {selectedCity ? `Jobs By Qualification in ${selectedCity}` : 'Jobs By Qualification'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {jobsByQualificationLoading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={`jobs-qual-skeleton-${idx}`}
                                    className="flex flex-col items-center justify-center shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.50)] rounded-[18px] bg-[#fff] p-[26px_14px] animate-pulse"
                                >
                                    <div className="mb-[10px] h-[38px] w-[38px] rounded-full bg-[#EAECEF]" />
                                    <div className="h-[16px] w-[120px] rounded bg-[#EAECEF] mb-[8px]" />
                                    <div className="h-[14px] w-[72px] rounded bg-[#EAECEF]" />
                                </div>
                            ))
                        ) : (
                            jobsByQualification.map((item) => (
                                <Link
                                    href={buildQualificationHref(item, qualificationFieldName, selectedCity)}
                                    className='w-full'
                                    key={item.id}
                                >
                                    <div className="flex flex-col items-center justify-center shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.50)] rounded-[18px] bg-[#fff] p-[26px_14px]">
                                        <div className="mb-[10px]">{getQualificationIcon(item.name)}</div>
                                        <h3 className="text-[#000000] font-[Inter-Medium] text-[16px] mb-[4px]">
                                            {item.name}
                                        </h3>
                                        <p className="text-[#666] font-[Inter-Regular] text-[14px]">
                                            {formatJobsCountLabel(item.count)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
                ) : null}

                {jobsByTypeLoading || jobsByType.length > 0 ? (
                <div className='mb-[40px]'>
                    <h2 className="text-[#000000] font-[Inter-Bold] text-[20px] mb-[16px]">
                        {selectedCity ? `Jobs By Type in ${selectedCity}` : 'Jobs By Type'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {jobsByTypeLoading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={`jobs-type-skeleton-${idx}`}
                                    className="flex flex-col items-center justify-center shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.50)] rounded-[18px] bg-[#fff] p-[26px_14px] animate-pulse"
                                >
                                    <div className="mb-[10px] h-[38px] w-[38px] rounded-full bg-[#EAECEF]" />
                                    <div className="h-[16px] w-[120px] rounded bg-[#EAECEF] mb-[8px]" />
                                    <div className="h-[14px] w-[72px] rounded bg-[#EAECEF]" />
                                </div>
                            ))
                        ) : (
                            jobsByType.map((item) => (
                                <Link
                                    href={buildEmploymentTypeHref(item, employmentTypeFieldName, selectedCity)}
                                    className='w-full'
                                    key={item.id}
                                >
                                    <div className="flex flex-col items-center justify-center shadow-[0_2px_50px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.50)] rounded-[18px] bg-[#fff] p-[26px_14px]">
                                        <div className="mb-[10px]">{getEmploymentTypeIcon(item.name)}</div>
                                        <h3 className="text-[#000000] font-[Inter-Medium] text-[16px] mb-[4px]">
                                            {item.name}
                                        </h3>
                                        <p className="text-[#666] font-[Inter-Regular] text-[14px]">
                                            {formatJobsCountLabel(item.count)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
                ) : null}

                {isFeaturedCompaniesLoading || featuredCompanies.length > 0 ? (
                    <div className='mb-[40px]'>
                        <h2 className="text-[#000000] font-[Inter-Bold] text-[20px] mb-[16px]">
                            Featured Companies
                        </h2>
                        <div className="relative">
                            <div ref={featuredTrackRef} className="overflow-hidden">
                                {isFeaturedCompaniesLoading ? (
                                    <div
                                        className="flex"
                                        style={{ gap: `${FEATURED_SLIDE_GAP}px` }}
                                    >
                                        {Array.from({ length: featuredSlidesPerView }).map((_, idx) => (
                                            <div
                                                key={`featured-skeleton-${idx}`}
                                                className="shrink-0 animate-pulse"
                                                style={{
                                                    flex: featuredItemWidth > 0
                                                        ? `0 0 ${featuredItemWidth}px`
                                                        : `0 0 calc((100% - ${(featuredSlidesPerView - 1) * FEATURED_SLIDE_GAP}px) / ${featuredSlidesPerView})`,
                                                    width: featuredItemWidth > 0 ? `${featuredItemWidth}px` : undefined,
                                                }}
                                            >
                                                <div className="mb-[10px] rounded-[18px] bg-white shadow-[0_2px_40px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.30)] p-[18px]">
                                                    <div className="w-full h-[150px] rounded-[8px] bg-[#EAECEF]" />
                                                </div>
                                                <div className="h-[16px] w-[80%] rounded bg-[#EAECEF]" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className="flex transition-transform duration-300 ease-out"
                                        style={{
                                            gap: `${FEATURED_SLIDE_GAP}px`,
                                            transform: `translate3d(${featuredTranslateX}px, 0, 0)`,
                                        }}
                                    >
                                        {featuredCompanies.map((company) => {
                                            const companyName = company?.company_name || ''
                                            const logoUrl =
                                                typeof company?.company_logo === 'string' && company.company_logo.trim()
                                                    ? company.company_logo.trim()
                                                    : null
                                            return (
                                                <div
                                                    key={company.id}
                                                    className="shrink-0"
                                                    style={{
                                                        flex: featuredItemWidth > 0
                                                            ? `0 0 ${featuredItemWidth}px`
                                                            : `0 0 calc((100% - ${(featuredSlidesPerView - 1) * FEATURED_SLIDE_GAP}px) / ${featuredSlidesPerView})`,
                                                        width: featuredItemWidth > 0 ? `${featuredItemWidth}px` : undefined,
                                                    }}
                                                >
                                                    <Link
                                                        href={`/jobcompany?id=${encodeURIComponent(String(company.id))}`}
                                                        className='w-full block'
                                                        onClick={() => cacheFeaturedCompanyForDetail(company)}
                                                    >
                                                        <div className="mb-[10px] rounded-[18px] bg-white shadow-[0_2px_40px_0_rgba(0,0,0,0.06)] border border-[rgba(143,143,143,0.30)] p-[18px]">
                                                            <div className="w-full h-[150px] relative flex items-center justify-center">
                                                                {logoUrl ? (
                                                                    <Image
                                                                        src={logoUrl}
                                                                        alt={companyName}
                                                                        fill
                                                                        unoptimized
                                                                        className="object-contain"
                                                                    />
                                                                ) : (
                                                                    <Image
                                                                        src={companyPlaceholder}
                                                                        alt={companyName || 'Company logo'}
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[#000000] font-[Inter-Medium] text-[16px] truncate">
                                                                {companyName}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {!isFeaturedCompaniesLoading && !featuredIsBeginning && (
                                <button
                                    type="button"
                                    aria-label="Previous companies"
                                    onClick={handleFeaturedPrev}
                                    className="cursor-pointer absolute top-[75px] -left-[18px] z-10 w-[36px] h-[36px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-[rgba(143,143,143,0.30)] flex items-center justify-center hover:bg-[#F5F9FE] transition-colors"
                                >
                                    <PaginationPrevIcon className="w-[18px] h-[18px]" stroke="#23266A"  />
                                </button>
                            )}
                            {!isFeaturedCompaniesLoading && !featuredIsEnd && (
                                <button
                                    type="button"
                                    aria-label="Next companies"
                                    onClick={handleFeaturedNext}
                                    className="cursor-pointer absolute top-[75px] -right-[18px] z-10 w-[36px] h-[36px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-[rgba(143,143,143,0.30)] flex items-center justify-center hover:bg-[#F5F9FE] transition-colors"
                                >
                                    <PaginationNextIcon className="w-[18px] h-[18px]" stroke="#23266A"  />
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}

                <div className='mb-[40px]'>
                    <div className="flex flex-col md:flex-row items-center justify-between bg-[rgba(220,237,255,0.30)] rounded-[12px] p-[30px]">
                        <div className="">
                            <h2 className="text-[#000000] font-[Inter-Bold] text-[20px] mb-[26px]">
                                80% of the recruiters hire candidates with CV
                            </h2>
                            <div>
                                <h3 className="text-[#000000BF] font-[Inter-SemiBold] text-[14px] mb-[24px]">
                                    Here are some reasons why you should upload a CV to your profile:
                                </h3>
                                <ul className="list-disc pl-5 flex flex-col gap-[18px] mb-[30px]">
                                    <li className='text-[#000000BF] font-[Inter-SemiBold] text-[14px]'>Boost your chances of getting ahead of other candidates</li>
                                    <li className='text-[#000000BF] font-[Inter-SemiBold] text-[14px]'>Enable recruiters to easily view your contact details</li>
                                    <li className='text-[#000000BF] font-[Inter-SemiBold] text-[14px]'>Showcase your professional accomplishments</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCvModalOpen(true)}
                                className="cursor-pointer rounded-[6px] border border-[#DC0000] p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] transition-colors"
                            >
                                Update CV
                            </button>
                        </div>
                        <div className="w-full md:w-[260px] h-[280px] relative">
                            <Image
                                src={cvBanner}
                                alt="Upload CV illustration"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <CVModal open={cvModalOpen} onClose={() => setCvModalOpen(false)} />
        </div>
    );
};

export default JobsPage;

