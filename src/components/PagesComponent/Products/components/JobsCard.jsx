/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { allItemApi } from '@/utils/api'
import { LocationIcon, PaginationNextIcon, PaginationPrevIcon, VerifiedBadge, PaginationDoublePrevIcon, PaginationDoubleNextIcon, PaginationSinglePrevIcon, PaginationSingleNextIcon, FavouriteIcon, ShareIcon } from '@/components/CustomFile/icons'
import { usePathname, useSearchParams } from 'next/navigation'
import { isJobsRecruiterContext } from '@/utils/jobsListingContext'
import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'
import CommonProjectCard from './CommonProjectCard'
import VerifiedMain from '../../GetVerified/VerifiedMain'
import { absoluteUrl } from '@/utils/siteUrl'
import { getProductPromotionBadge, promotionBadgePillAppearance } from '@/utils/productPromotionBadge'


const VISIBLE_PAGE_BUTTONS = 5
const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Cars Wishlist', count: 12 },
    { name: 'Home Picks', count: 8 },
    { name: 'Weekend Deals', count: 5 },
]

function getFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

/** Match API `custom_fields[].name` (case/spacing insensitive) and return stored value. */
function normalizeFieldLabel(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

function pickCustomFieldValue(customFields, candidateNames) {
    if (!Array.isArray(customFields) || !candidateNames?.length) return ''
    const wants = candidateNames.map((n) => normalizeFieldLabel(n)).filter(Boolean)
    for (const want of wants) {
        for (const field of customFields) {
            if (normalizeFieldLabel(field?.name) !== want) continue
            const v = field?.value ?? field?.custom_field_value?.value
            if (Array.isArray(v)) {
                const joined = v.map((x) => (x == null ? '' : String(x))).filter(Boolean).join(', ')
                if (joined) return joined
            } else if (v != null && v !== '') {
                return String(v)
            }
        }
    }
    return ''
}

function normalizeBoolean(...vals) {
    for (const v of vals) {
        if (v === true) return true
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase()
            if (s === '1' || s === 'true' || s === 'yes') return true
        }
        if (typeof v === 'number' && v === 1) return true
    }
    return false
}

function getPostedAgoMeta(createdAt) {
    if (!createdAt) return null
    const d = new Date(createdAt)
    if (Number.isNaN(d.getTime())) return null
    const diffMs = Date.now() - d.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffH < 1) return { label: 'Posted now', isRecent: true }
    if (diffH < 24) return { label: `Posted ${diffH} hours ago`, isRecent: true }
    const diffD = Math.floor(diffH / 24)
    return { label: `Posted ${diffD} days ago`, isRecent: false }
}

function formatSalaryLabel(item) {
    const fromCf = pickCustomFieldValue(item?.custom_fields, [
        'monthly salary',
        'expected salary',
        'salary',
    ])
    const cur = item?.currency ? String(item.currency).trim() : ''
    const cfLooksAmount = fromCf && /[0-9]/.test(fromCf)
    const cfWithCurrency =
        fromCf && cur && cfLooksAmount && !/^aed|usd|sar|eur|gbp/i.test(fromCf)
            ? `${cur} ${fromCf}`.trim()
            : fromCf || ''
    const raw = getFirstTruthy(
        cfWithCurrency,
        item?.salary,
        item?.salary_range,
        item?.salaryRange,
        item?.amount,
        typeof item?.price === 'number' && item.price > 0 ? item.price : '',
        item?.amount_range
    )
    if (!raw) return '—'
    if (typeof raw === 'string') return raw
    return String(raw)
}

function parseSalaryDisplay(salaryLabel) {
    if (!salaryLabel || salaryLabel === '—') return null
    const s = String(salaryLabel)
    // Matches: "AED 2,000 - 3,999 per month + Commission"
    // Captures: prefix ("AED "), amount ("2,000 - 3,999"), suffix (" per month + Commission")
    const m = s.match(/^([A-Za-z$€£]+\s*)([0-9][0-9,.\s\-–]*)(.*)$/)
    if (!m) return null
    const [, prefix, amount, suffix] = m
    const hasAmount = amount && amount.trim().length > 0
    if (!hasAmount) return null
    return { prefix, amount, suffix }
}

function JobCardRow({ item, useJobDetailRoute, isRecruiterView, detailQuery }) {
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const title = getFirstTruthy(
        item?.title,
        item?.name,
        item?.job_title,
        pickCustomFieldValue(item?.custom_fields, ['job role']),
        item?.role
    )
    const employerName = getFirstTruthy(
        item?.company_name,
        item?.company,
        pickCustomFieldValue(item?.custom_fields, ['company name']),
        item?.employer_name,
        item?.employer,
        item?.agency_name,
        item?.agency,
        item?.listed_by
    )
    const employmentType = getFirstTruthy(
        item?.employment_type,
        item?.employmentType,
        item?.employment,
        pickCustomFieldValue(item?.custom_fields, ['employment type', 'commitment']),
        item?.type,
        item?.work_type
    )
    const workExperience = getFirstTruthy(
        item?.experience,
        item?.work_experience,
        item?.min_experience,
        item?.minExperience,
        item?.experience_level,
        pickCustomFieldValue(item?.custom_fields, ['minimum work experience', 'work experience'])
    )
    const educationLevel = getFirstTruthy(
        item?.education_level,
        item?.education,
        item?.min_education,
        item?.minimum_education,
        item?.qualification,
        pickCustomFieldValue(item?.custom_fields, [
            'minimum education level',
            'education level',
            'education qualifications',
        ])
    )
    const hideCompanyName =
        pickCustomFieldValue(item?.custom_fields, ['hide company name']).toLowerCase() === 'yes'
    const employerDisplay = hideCompanyName ? 'Confidential' : employerName
    const salaryLabel = formatSalaryLabel(item)
    const salaryDisplay = parseSalaryDisplay(salaryLabel)
    const location = getFirstTruthy(item?.location, item?.city, item?.state, item?.country)
    const postedAgoMeta = getPostedAgoMeta(item?.created_at)

    // Recruiter view: current position should come only from custom_fields.
    const currentPosition = pickCustomFieldValue(item?.custom_fields, [
        'current position',
        'current role',
        'position',
        'designation',
    ])

    const promotionBadge = useMemo(() => getProductPromotionBadge(item), [item])
    const isVerifiedUser = normalizeBoolean(
        item?.verified_user,
        item?.is_verified_user,
        item?.verified,
        item?.is_verified,
        item?.user_verified,
        item?.user?.is_verified
    )

    const companyImage = getFirstTruthy(item?.company_image, item?.companyImage)
    const hasCompanyImage = Boolean(companyImage && String(companyImage).trim())

    const slug = item?.slug || item?.id || ''
    const baseDetailParams =
        detailQuery && (detailQuery.mode || detailQuery.item)
            ? `&mode=${encodeURIComponent(detailQuery.mode || '')}&item=${encodeURIComponent(detailQuery.item || '')}`
            : ''
    const recruiterDetailSuffix =
        detailQuery?.recruiter === '1' || detailQuery?.recruiter === '0'
            ? `&recruiter=${encodeURIComponent(detailQuery.recruiter)}`
            : ''

    const href = useJobDetailRoute
        ? `/productdetail?slug=${encodeURIComponent(String(slug))}${baseDetailParams}${recruiterDetailSuffix}`
        : `/product-details/${slug}`

    const shareUrl = useJobDetailRoute
        ? absoluteUrl(`/productdetail?slug=${encodeURIComponent(String(slug))}${baseDetailParams}${recruiterDetailSuffix}`)
        : absoluteUrl(`/product-details/${slug}`)

    return (
        <Link href={href} prefetch={false} className="block">
            <div className="rounded-[14px] bg-white p-[16px] shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),_0px_3px_4px_rgba(0,0,0,0.07),_0px_1px_8px_rgba(0,0,0,0.06)] hover:shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.1),_0px_6px_10px_rgba(0,0,0,0.07),_0px_1px_18px_rgba(0,0,0,0.06)] transition">
                <div className="max-sm:flex-col flex items-start justify-between gap-[14px]">
                    <div className="flex flex-col gap-[10px] flex-1">
                        <div className="flex items-start justify-between gap-[12px]">
                            <h3 className="text-[16px] font-[Inter-SemiBold] text-[#2B2D2E] truncate">{title || 'Job'}</h3>
                            <div className="flex items-center gap-[8px] shrink-0 max-sm:flex-col max-sm:items-start">
                                {promotionBadge.label ? (
                                    <p {...promotionBadgePillAppearance(promotionBadge)}>{promotionBadge.label}</p>
                                ) : null}
                                {isVerifiedUser ? (
                                    <div className="rounded-[6px] flex items-center gap-[4px] bg-[#F5F9FE] border border-[#B0D0F9] p-[3px_5px]">
                                        <div className="w-[18px] h-[18px]">
                                            <VerifiedBadge className="w-[18px] h-[18px]" fill="#3A88EF" />
                                        </div>
                                        <p className='text-[10px] font-[Inter-Bold] text-[#3A88EF] uppercase'>VERIFIED USER</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {isRecruiterView ? (
                            <p className="text-[14px] font-[Inter-Regular] text-[#2B2D2E] truncate">
                                Current Position : {currentPosition || '—'}
                            </p>
                        ) : employerDisplay ? (
                            <p className="text-[14px] font-[Inter-Regular] text-[#0c4a9d] truncate">{employerDisplay}</p>
                        ) : null}

                        <div className='max-sm:flex-col max-sm:items-start flex items-center justify-between'>
                            <div className='flex flex-col gap-[12px]'>
                                {salaryDisplay ? (
                                    <p className="text-[14px] font-[Inter-Regular] text-[#2B2D2E]">
                                        <span className="font-[Inter-Regular]">{salaryDisplay.prefix}</span>
                                        <span className="font-[Inter-Bold]">{salaryDisplay.amount}</span>
                                        <span className="font-[Inter-Regular]">{salaryDisplay.suffix}</span>
                                    </p>
                                ) : (
                                    <p className="text-[14px] font-[Inter-Regular] text-[#2B2D2E]">{salaryLabel}</p>
                                )}
                                {!isRecruiterView ? (
                                <div className="flex flex-wrap gap-[10px]">
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">EMPLOYMENT TYPE</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{employmentType || '—'}</p>
                                    </div>
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">MINIMUM WORK EXPERIENCE</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{workExperience || '—'}</p>
                                    </div>
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">MINIMUM EDUCATION LEVEL</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{educationLevel || '—'}</p>
                                    </div>
                                </div>
                                ) : null}
                                {isRecruiterView ? (
                                <div className="flex flex-wrap gap-[10px]">
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">COMMITMENT</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{employmentType || '—'}</p>
                                    </div>
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">WORK EXPERIENCE</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{workExperience || '—'}</p>
                                    </div>
                                    <div className="flex flex-col gap-[4px] rounded-[4px] bg-[#F7F7F8] p-[6px_10px] border border-[#F6F6F6]">
                                        <p className="text-[10px] font-[Inter-Regular] text-[#2B2D2E] uppercase">EDUCATION LEVEL</p>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#17191C] truncate">{educationLevel || '—'}</p>
                                    </div>
                                </div>
                                ) : null}
                            </div>
                            {hasCompanyImage ? (
                                <div className="shrink-0">
                                    <div className="rounded-[10px] border border-[rgba(143,143,143,0.2)] p-[4px] bg-white flex items-center justify-center overflow-hidden">
                                        <Image
                                            src={companyImage}
                                            alt=""
                                            width={70}
                                            height={70}
                                            className="rounded-[10px] h-[80px] w-[70px] object-cover"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="max-sm:flex-wrap flex items-center gap-[12px]">
                            {postedAgoMeta ? (
                                <div className="flex items-center gap-[8px] min-w-0">
                                    <p
                                        className={`text-[14px] font-[Inter-Regular] truncate ${postedAgoMeta.isRecent ? 'text-[#1DAD18]' : 'text-[#8F8F8F]'
                                            }`}
                                    >
                                        {postedAgoMeta.label}
                                    </p>
                                </div>
                            ) : (
                                <span />
                            )}

                            <div className='border-r border-[#0000001f] h-[16px]'>

                            </div>

                            <div className="flex items-center gap-[8px] min-w-0">
                                <LocationIcon />
                                <p className="text-[14px] font-[Inter-Regular] text-[#2B2D2E] truncate">{location || '—'}</p>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </Link>
    )
}

export default function JobsCard({ perPage = 15, onItemsTotalChange }) {
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const pathname = usePathname()
    const sourceMode = (searchParams?.get('mode') || 'jobs').toLowerCase()
    const subSlug = (
        searchParams?.get('category_slug') ||
        searchParams?.get('slug') ||
        ''
    ).toLowerCase()
    const itemParamRaw = (searchParams?.get('item') || '').trim()
    const itemParam = itemParamRaw.toLowerCase()
    const recruiterQs = searchParams?.get('recruiter')

    const isRecruiterView = isJobsRecruiterContext({
        pathname,
        itemParam: itemParamRaw,
        recruiter: recruiterQs,
    })

    const [items, setItems] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const fetchPage = async (page) => {
        if (!sourceMode) return
        setIsLoading(true)
        try {
            const run = async (nextParams) => {
                const res = await allItemApi.getItems(nextParams)
                const data = res?.data
                if (!data || data.error === true) return { list: [], inner: {} }
                const inner = data?.data || {}
                const list = inner?.data || []
                return { list: Array.isArray(list) ? list : [], inner }
            }

            const city = searchParams?.get('city')?.trim() || undefined
            const keywordSearch = searchParams?.get('search')?.trim() || undefined
            const employmentTypeParam = searchParams?.get('employment_type')?.trim() || undefined
            const educationParam = searchParams?.get('education')?.trim() || undefined
            const sortBy = searchParams?.get('sort_by')?.trim() || 'new-to-old'
            const filterQuery = collectFilterParamsFromSearchParams(searchParams)
            const params = {
                page,
                sort_by: sortBy,
                category_slug: subSlug || sourceMode,
                per_page: perPage,
                limit: perPage,
                city,
                search: keywordSearch,
                employment_type: employmentTypeParam,
                education: educationParam,
                filterQuery,
            }

            const first = await run(params)
            let list = first.list
            let inner = first.inner

            if (!list || list.length === 0) {
                setItems([])
                setCurrentPage(1)
                setLastPage(1)
                onItemsTotalChange?.(0)
                return
            }

            setItems(list)
            setCurrentPage(inner?.current_page || page)
            setLastPage(inner?.last_page || page)
            const t = inner?.total
            if (typeof t === 'number' && Number.isFinite(t)) {
                onItemsTotalChange?.(t)
            }
        } catch (e) {
            console.error(e)
            setItems([])
            setCurrentPage(1)
            setLastPage(1)
            onItemsTotalChange?.(0)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [sourceMode, subSlug, searchParamsKey])

    useEffect(() => {
        if (!sourceMode) return
        fetchPage(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sourceMode, subSlug, searchParamsKey])

    const totalPages = Math.max(1, lastPage)
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(totalPages - (VISIBLE_PAGE_BUTTONS - 1), currentPage))
        const end = Math.min(totalPages, start + VISIBLE_PAGE_BUTTONS - 1)
        const arr = []
        for (let p = start; p <= end; p++) arr.push(p)
        return arr
    }, [currentPage, totalPages])

    return (
        <div className="flex flex-col gap-[20px]">
            {isLoading ? (
                <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading...</div>
            ) : items.length > 0 ? (
                items.map((item, index) => (
                    <div key={item?.id || item?.slug}>
                        <JobCardRow
                            item={item}
                            useJobDetailRoute={sourceMode === 'jobs'}
                            isRecruiterView={isRecruiterView}
                            detailQuery={{
                                mode: sourceMode,
                                item: itemParamRaw || itemParam,
                                recruiter: isRecruiterView ? '1' : '0',
                            }}
                        />
                        {index === 1 ? (
                            <div className="flex flex-col gap-[14px] py-[12px]">
                                {/* <CommonProjectCard /> */}
                                <VerifiedMain showTickBadge={false} />
                            </div>
                        ) : null}
                    </div>
                ))
            ) : (
                <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                    No jobs found.
                </div>
            )}

            {totalPages > 1 ? (
                <div className="mt-[20px] pb-[16px] flex items-center justify-center">
                    <div className="w-full flex justify-between items-center gap-[10px]">
                        <div className="flex items-center gap-[10px]">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(1)}
                                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="First page"
                            >
                                <PaginationDoublePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <PaginationSinglePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                            </button>
                        </div>

                        <div className="flex items-center gap-[10px]">
                            {visiblePages.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCurrentPage(p)}
                                    className={`rounded-[6px] w-[40px] h-[40px] flex items-center justify-center cursor-pointer text-[12px] font-[Inter-Medium] border ${currentPage === p
                                        ? 'bg-[#23262A] text-white border-[#23262A]'
                                        : 'bg-white text-[#23262A] border-[rgba(143,143,143,0.35)]'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-[10px]">
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <PaginationSingleNextIcon fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Last page"
                            >
                                <PaginationDoubleNextIcon fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
