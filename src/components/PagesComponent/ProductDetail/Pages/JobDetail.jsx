/* eslint-disable react/prop-types */
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isJobsRecruiterContext } from '@/utils/jobsListingContext'
import parse from 'html-react-parser'
import { FavouriteIcon, ShareIcon, ReportAdFlagIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import JobApplicationDrawer from '../JobComponents/JobApplicationDrawer'
import Image from 'next/image'
import salaryNew from '../../../../../public/assets/img/icons/salaryNew.svg'
import commitment from '../../../../../public/assets/img/icons/commitment.svg'
import genderimg from '../../../../../public/assets/img/icons/gender.svg'
import location_new from '../../../../../public/assets/img/icons/location_new.svg'
import experienceNew from '../../../../../public/assets/img/icons/experienceNew.svg'
import qualificationNew from '../../../../../public/assets/img/icons/qualification.svg'
import company from '../../../../../public/assets/img/company.svg'
import ProfileDetails from '../JobComponents/ProfileDetails'
import ReportListingModal from '../components/ReportListingModal'
import { getApplyInfoApi, manageFavouriteApi } from '@/utils/api'
import { useLoginModalGuard } from '@/hooks/useLoginModalGuard'

const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Cars Wishlist', count: 12 },
]

function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
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

function getAppliedAgoLabel(createdAt) {
    if (!createdAt) return ''
    const d = new Date(createdAt)
    if (Number.isNaN(d.getTime())) return ''
    const diffMs = Math.max(0, Date.now() - d.getTime())
    const sec = Math.floor(diffMs / 1000)
    if (sec < 60) return 'Applied a few seconds ago'
    const min = Math.floor(sec / 60)
    if (min < 60) return `Applied ${min} minute${min === 1 ? '' : 's'} ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `Applied ${hr} hour${hr === 1 ? '' : 's'} ago`
    const day = Math.floor(hr / 24)
    return `Applied ${day} day${day === 1 ? '' : 's'} ago`
}

function formatSalaryLabel(item) {
    const raw = firstTruthy(item?.salary, item?.salary_range, item?.salaryRange, item?.amount, item?.price, item?.amount_range)
    if (!raw) return '—'
    return typeof raw === 'string' ? raw : String(raw)
}

function parseSalaryDisplay(salaryLabel) {
    if (!salaryLabel || salaryLabel === '—') return null
    const m = String(salaryLabel).match(/^([A-Za-z$€£]+\s*)([0-9][0-9,.\s\-–]*)(.*)$/)
    if (!m) return null
    const [, prefix, amount, suffix] = m
    if (!amount?.trim()) return null
    return { prefix, amount, suffix }
}

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => n.toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    const v = row.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
    return v != null && v !== '' ? String(v) : ''
}


function MetaRow({ icon, children }) {
    return (
        <div className="flex items-start gap-[10px] min-w-0">
            <div className="shrink-0">{icon}</div>
            <div className="min-w-0 text-[14px] font-[Inter-Regular] text-[#23262a]">{children}</div>
        </div>
    )
}

function FactItem({ label, value }) {
    const display = value !== undefined && value !== null && value !== '' ? value : '—'
    return (
        <div className="flex gap-[4px] w-[50%] max-sm:w-full mb-[6px]">
            <h4 className="w-[60%] text-[14px] font-[Inter-Regular] text-[#23262a]">{label}</h4>
            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262a]">{display}</p>
        </div>
    )
}

function ApplyActionSkeleton({ className = '' }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Loading apply status"
            className={`rounded-[8px] bg-[#e8e8e8] animate-pulse ${className}`}
        />
    )
}

export default function JobDetail({ productData, slug }) {
    const userData = useSelector(userSignUpData)
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const itemFromQuery = (searchParams?.get('item') || '').trim()
    const recruiterFromQuery = searchParams?.get('recruiter')
    const isRecruiterJobDetail = isJobsRecruiterContext({
        pathname,
        itemParam: itemFromQuery,
        recruiter: recruiterFromQuery,
    })

    const item = productData || {}

    const [isSaved, setIsSaved] = useState(!!productData?.is_liked)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false)
    const [applyInfo, setApplyInfo] = useState(null)
    const [applyInfoLoading, setApplyInfoLoading] = useState(() => Boolean(userData?.id && item?.id))
    const handleOpenSaveAds = async () => {
        const itemId = item?.id
        if (itemId) {
            try {
                await manageFavouriteApi.manageFavouriteApi({ item_id: itemId })
            } catch (e) {
                console.error('Failed to pre-save favourite:', e)
            }
        }
        setIsSaveAdsOpen(true)
    }
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [showFloatingHeader, setShowFloatingHeader] = useState(false)
    const fields = useMemo(() => {
        const item = productData || {}
        const title = firstTruthy(item?.title, item?.name, item?.job_title, item?.role)
        const employerName = firstTruthy(
            item?.company_name,
            item?.company,
            item?.employer_name,
            item?.employer,
            item?.agency_name,
            item?.listed_by
        )
        const employmentType = firstTruthy(
            customFieldValue(item, 'Employment Type'),
            item?.employment_type,
            item?.employmentType,
            item?.employment,
            item?.type,
            item?.work_type
        )
        const workExperience = firstTruthy(
            customFieldValue(item, 'Minimum Work Experience'),
            item?.experience,
            item?.work_experience,
            item?.min_experience,
            item?.experience_level
        )
        const educationLevel = firstTruthy(
            customFieldValue(item, 'Minimum Education Level'),
            item?.education_level,
            item?.education,
            item?.min_education,
            item?.qualification
        )
        const gender = firstTruthy(
            customFieldValue(item, 'Gender'),
            item?.gender,
            item?.preferred_gender,
            item?.candidate_gender
        )
        const salaryLabel = firstTruthy(customFieldValue(item, 'Monthly Salary'), formatSalaryLabel(item))
        const salaryDisplay = parseSalaryDisplay(salaryLabel)
        const location = firstTruthy(item?.location, item?.city, item?.state, item?.country, item?.address)
        const postedAgoMeta = getPostedAgoMeta(item?.created_at)
        const applicantsCount = firstTruthy(item?.applicants_count, item?.applicant_count, item?.applications_count)
        const languages = firstTruthy(item?.languages, item?.language, customFieldValue(item, 'Languages', 'languages'))
        const nationality = firstTruthy(customFieldValue(item, 'Nationality', 'nationality'), item?.nationality)
        const companySize = firstTruthy(customFieldValue(item, 'Company Size', 'company size'), item?.company_size, item?.companySize)

        return {
            title,
            employerName,
            employmentType,
            workExperience,
            educationLevel,
            gender,
            salaryLabel,
            salaryDisplay,
            location,
            postedAgoMeta,
            applicantsCount,
            languages,
            nationality,
            companySize,
        }
    }, [productData])

    const candidateCvUrl = useMemo(
        () =>
            firstTruthy(
                item?.cv_url,
                item?.resume_url,
                item?.candidate_cv_url,
                item?.candidate_cv,
                item?.cv,
                item?.resume,
                customFieldValue(item, 'CV', 'cv', 'Resume', 'resume', 'Candidate CV', 'candidate cv')
            ),
        [item]
    )

    const { requireLogin, loginModal } = useLoginModalGuard()

    const handleApplyClick = () => {
        requireLogin(() => setIsApplyDrawerOpen(true))
    }

    const openCandidateCv = () => {
        const url = String(candidateCvUrl || '').trim()
        if (!url) return
        requireLogin(() => {
            window.open(url, '_blank', 'noopener,noreferrer')
        })
    }

    const loadApplyInfo = useCallback(
        async (showLoading = true) => {
            const userId = userData?.id
            const itemId = item?.id
            if (!userId || !itemId) {
                setApplyInfo(null)
                setApplyInfoLoading(false)
                return
            }
            if (showLoading) {
                setApplyInfo(null)
                setApplyInfoLoading(true)
            }
            try {
                const response = await getApplyInfoApi.getApplyInfo({ user_id: userId, item_id: itemId })
                const payload = response?.data
                const rawData =
                    payload?.data && typeof payload?.data === 'object'
                        ? payload.data
                        : payload && typeof payload === 'object'
                            ? payload
                            : {}
                const appliedAt =
                    rawData?.created_at ||
                    rawData?.createdAt ||
                    rawData?.application_created_at ||
                    rawData?.applied_at ||
                    ''
                const applicantCount =
                    rawData?.applicant_count ??
                    rawData?.applicants_count ??
                    rawData?.applications_count ??
                    null
                const hasApplied =
                    rawData?.is_applied === true ||
                    rawData?.already_applied === true ||
                    Boolean(appliedAt)
                setApplyInfo({
                    hasApplied,
                    appliedAt,
                    applicantCount,
                })
            } catch (e) {
                setApplyInfo(null)
            } finally {
                setApplyInfoLoading(false)
            }
        },
        [userData?.id, item?.id]
    )

    const primaryActionClassName =
        'cursor-pointer inline-flex w-fit items-center justify-center rounded-[8px] bg-[#23262a] p-[8px_30px] text-[14px] font-[Inter-Medium] text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#23262a]'

    const {
        title,
        employerName,
        employmentType,
        workExperience,
        educationLevel,
        gender,
        salaryLabel,
        salaryDisplay,
        location,
        postedAgoMeta,
        applicantsCount,
        languages,
        nationality,
        companySize,
    } = fields

    const displayedApplicantsCount =
        applyInfo?.applicantCount !== undefined && applyInfo?.applicantCount !== null
            ? applyInfo.applicantCount
            : applicantsCount
    const applyButtonText =
        applyInfo?.hasApplied && applyInfo?.appliedAt
            ? getAppliedAgoLabel(applyInfo.appliedAt) || 'Applied'
            : 'Apply'

    const showApplyStatusSkeleton =
        !isRecruiterJobDetail && applyInfoLoading && Boolean(userData?.id && item?.id)

    const detailSlug = slug || item?.slug || item?.id || ''
    const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
    const shareUrl = `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}`

    const salaryLine = salaryDisplay ? (
        <>
            <span className="font-[Inter-Regular]">{salaryDisplay.prefix}</span>
            <span className="font-[Inter-Bold]">{salaryDisplay.amount}</span>
            <span className="font-[Inter-Regular]">{salaryDisplay.suffix}</span>
        </>
    ) : (
        salaryLabel
    )

    const mapsHref = location
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
        : '#'

    const descriptionHtml = item?.description ? String(item.description).replace(/\n/g, '<br />') : ''

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || window.pageYOffset || 0
            setShowFloatingHeader(y > 220)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        loadApplyInfo(true)
    }, [loadApplyInfo])

    return (
        <>
        <div className="w-full">
            <div className="grid grid-cols-[1fr_350px] gap-[20px] max-sm:grid-cols-1 products_grid">
                <div className="min-w-0">
                    <div className="border-b border-[rgba(143,143,143,0.4)] pb-[6px]">
                        <div className="flex flex-col gap-[24px]">
                            <div className="flex flex-col gap-[10px] sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1 pr-2">
                                    <h1 className="mb-[10px] text-[30px] font-[Inter-SemiBold] uppercase text-[#23262a]">
                                        {title || 'Job'}
                                    </h1>
                                    {employerName ? (
                                        <p className="text-[20px] font-[Inter-Medium] text-[#23262a]">{employerName}</p>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-[10px] shrink-0">
                                    <button
                                        type="button"
                                        className="flex p-[10px] cursor-pointer items-center justify-center rounded-full border border-[rgba(143,143,143,0.4)] bg-white"
                                        aria-label="Favourite"
                                        onClick={() => {
                                            setIsSaved((p) => !p)
                                            handleOpenSaveAds()
                                        }}
                                    >
                                        <FavouriteIcon
                                            className={`h-[18px] w-[18px] ${isSaved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
                                            fill={isSaved ? '#DC0000' : '#fff'}
                                            stroke={isSaved ? '#DC0000' : '#000'}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className="flex p-[10px] cursor-pointer items-center justify-center rounded-full border border-[rgba(143,143,143,0.4)] bg-white"
                                        aria-label="Share"
                                        onClick={() => setIsShareOpen(true)}
                                    >
                                        <ShareIcon className="h-[18px] w-[18px]" fill="#000" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-[12px] sm:grid-cols-2 sm:gap-x-[36px]">
                                <div className="flex flex-col gap-[12px]">
                                    <MetaRow icon={<Image src={salaryNew} alt="salary" width={24} height={24} />}>{salaryLine || '—'}</MetaRow>
                                    <MetaRow icon={<Image src={commitment} alt="commitment" width={24} height={24} />}>{employmentType || '—'}</MetaRow>
                                    <MetaRow icon={<Image src={genderimg} alt="gender" width={24} height={24} className="w-[24px] h-[24px]" />}>{gender || '—'}</MetaRow>
                                </div>
                                <div className="flex flex-col gap-[12px]">
                                    <MetaRow
                                        icon={<Image src={location_new} alt="location" width={24} height={24} />}
                                    >
                                        {location ? (
                                            <Link
                                                href={mapsHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[14px] font-[Inter-Regular] text-[#23262a] underline decoration-[#23262a] underline-offset-2 "
                                            >
                                                {location}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </MetaRow>
                                    <MetaRow icon={<Image src={experienceNew} alt="experience" width={24} height={24} />}>{workExperience || '—'}</MetaRow>
                                    <MetaRow icon={<Image src={qualificationNew} alt="qualification" width={24} height={24} />}>{educationLevel || '—'}</MetaRow>
                                </div>
                            </div>

                            <div className='flex items-center justify-between'>
                                <div className="relative flex gap-[14px] ">
                                    {isRecruiterJobDetail ? (
                                        candidateCvUrl ? (
                                            <button
                                                type="button"
                                                onClick={openCandidateCv}
                                                className="cursor-pointer inline-flex w-fit items-center justify-center rounded-[8px] bg-[#23262a] p-[10px_20px] text-[14px] font-[Inter-Medium] text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#23262a]"
                                            >
                                                Show Candidate Details & CV
                                            </button>
                                        ) : (
                                            <button type="button"  className="cursor-pointer inline-flex w-fit items-center justify-center rounded-[8px] bg-[#23262a] p-[10px_20px] text-[14px] font-[Inter-Medium] text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#2322a]" title="No CV available for this profile">
                                                Show Candidate Details & CV
                                            </button>
                                        )
                                    ) : showApplyStatusSkeleton ? (
                                        <ApplyActionSkeleton className="h-[38px] w-[96px]" />
                                    ) : applyInfo?.hasApplied ? (
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#1dad18]">{applyButtonText}</p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleApplyClick}
                                            className="cursor-pointer inline-flex w-fit items-center justify-center rounded-[8px] bg-[#23262a] p-[8px_30px] text-[14px] font-[Inter-Medium] text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#23262a]"
                                        >
                                            Apply
                                        </button>
                                    )}
                                    <div className="flex flex-wrap items-center gap-[14px]">
                                        {displayedApplicantsCount !== '' && displayedApplicantsCount != null ? (
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262a] whitespace-nowrap">{displayedApplicantsCount} Applicants</p>
                                        ) : null}
                                        {displayedApplicantsCount !== '' && displayedApplicantsCount != null && postedAgoMeta ? (
                                            <div className="bg-[#8f8f8f] p-[2px] rounded-full" aria-hidden>
                                                
                                            </div>
                                        ) : null}
                                        {postedAgoMeta ? (
                                            <p className={postedAgoMeta.isRecent ? 'text-[14px] font-[Inter-Regular] text-[#1dad18]' : 'text-[14px] font-[Inter-Regular] text-[#666666]'}>
                                                {postedAgoMeta.label}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <div>
                                    <Image src={company} alt="company" width={80} height={60} className="w-[80px] h-[60px]" />
                                </div>
                            </div>


                        </div>
                    </div>
                    <div id="job-details-block" className="py-[40px] border-b border-[rgba(143,143,143,0.4)]">
                        <h2 className="mb-[20px] text-[22px] font-[Inter-Bold] text-[#23262a]">Job Details</h2>
                        {descriptionHtml ? (
                            <div className="mb-[28px] text-[14px] font-[Inter-Regular] text-[#23262a] [&_a]:text-[#0c4a9d] [&_a]:underline">
                                {parse(descriptionHtml)}
                            </div>
                        ) : (
                            <p className="mb-[28px] text-[14px] font-[Inter-Regular] text-[#23262a]">No description provided.</p>
                        )}

                        <div className="grid grid-cols-2 gap-[14px]">
                            <FactItem label="Languages" value={languages} />
                            <FactItem label="Nationality" value={nationality} />
                            <FactItem label="Company Size" value={companySize} />
                        </div>
                    </div>

                    <div className='mt-[50px] text-center w-full mb-[20px]'>
                        <button
                            type="button"
                            onClick={() => setIsReportOpen(true)}
                            className="flex w-full justify-center cursor-pointer items-center gap-[8px]"
                        >
                            <ReportAdFlagIcon className="w-[18px] h-[18px]" />
                            <p className="text-[14px] font-[Inter-Medium] text-[#23262a]">Report This Ad</p>
                        </button>
                    </div>
                </div>
                <div className="w-[350px] max-sm:w-full">
                    <ProfileDetails />
                </div>

            </div>
            <SaveAdsModal
                open={isSaveAdsOpen}
                onClose={() => setIsSaveAdsOpen(false)}
                onConfirm={() => { }}
                onNewList={() => { }}
                lists={SAVE_ADS_LISTS}
                currentListIndex={0}
                itemId={item?.id}
            />
            <SharePopup isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} shareUrl={shareUrl} title={title || 'Listing'} />
            {!isRecruiterJobDetail ? (
                <JobApplicationDrawer
                    open={isApplyDrawerOpen}
                    onClose={() => setIsApplyDrawerOpen(false)}
                    productData={productData}
                    onApplySuccess={() => loadApplyInfo(false)}
                />
            ) : null}
            <ReportListingModal
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                brandName="ebozor"
                onSubmitReport={() => { }}
                productData={productData}
            />
            {showFloatingHeader ? (
                <div className="fixed inset-x-0 top-[0px] bg-[#fff]  p-[20px]  z-[40] flex justify-center shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] ">
                    <div className="flex w-full max-w-[1170px] items-center justify-between gap-[12px] max-sm:flex-col max-sm:items-start ">
                        <div className="min-w-0">
                            <h3 className="truncate text-[22px] font-[Inter-SemiBold] text-[#23262A]">{title || 'Job'}</h3>
                            <p className="mt-[2px] truncate text-[14px] font-[Inter-Regular] text-[#23262A]">
                                {employerName || 'Company'}{' '}
                                {salaryLabel ? <span className="font-[Inter-SemiBold]">AED {salaryLabel}</span> : null}{' '}
                                <span className="text-[#23262A]">Per Month</span> • {location || 'UAE'} • {employmentType || 'Full Time'}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-[30px]">
                            {isRecruiterJobDetail ? (
                                candidateCvUrl ? (
                                    <button
                                        type="button"
                                        onClick={openCandidateCv}
                                        className="cursor-pointer inline-flex items-center justify-center rounded-[8px] bg-[#23262A] p-[8px_60px] text-[14px] font-[Inter-SemiBold] text-white hover:bg-[#1a1a1a]"
                                    >
                                        Show Candidate CV
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="cursor-not-allowed inline-flex items-center justify-center rounded-[8px] bg-[#23262A] p-[8px_60px] text-[14px] font-[Inter-SemiBold] text-white opacity-50"
                                        title="No CV available for this profile"
                                    >
                                        Show Candidate CV
                                    </button>
                                )
                            ) : showApplyStatusSkeleton ? (
                                <ApplyActionSkeleton className="h-[38px] w-[152px]" />
                            ) : applyInfo?.hasApplied ? (
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#1dad18]">{applyButtonText}</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleApplyClick}
                                    className="cursor-pointer inline-flex items-center justify-center rounded-[8px] bg-[#23262A] p-[8px_60px] text-[14px] font-[Inter-SemiBold] text-white"
                                >
                                    Apply
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSaved((p) => !p)
                                    handleOpenSaveAds()
                                }}
                                aria-label="Favourite"
                                className="cursor-pointer inline-flex items-center justify-center "
                            >
                                <FavouriteIcon
                                    className={`h-[18px] w-[18px] ${isSaved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
                                    fill={isSaved ? '#DC0000' : '#fff'}
                                    stroke={isSaved ? '#DC0000' : '#000'}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsShareOpen(true)}
                                aria-label="Share"
                                className="cursor-pointer inline-flex items-center justify-center "
                            >
                                <ShareIcon className="h-[16px] w-[16px]" fill="#000" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
        {loginModal}
        </>
    )
}
