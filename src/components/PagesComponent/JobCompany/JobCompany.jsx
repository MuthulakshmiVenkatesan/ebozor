'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import companybanner from '../../../../public/assets/img/companybanner.svg'
import clientPlaceholder from '../../../../public/assets/img/client.png'
import shareblue from '../../../../public/assets/img/icons/shareblue.svg'
import saveIcon from '../../../../public/assets/img/icons/saveIcon.svg'
import bookmarkedIcon from '../../../../public/assets/img/icons/bookmarked.svg'
import SharePopup from '../CommonComponents/SharePopup'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { companyBookmarkApi, getFeaturedCompaniesApi } from '@/utils/api'
import { FEATURED_COMPANY_CACHE_KEY } from '../Jobs/Jobs'

/** Preview ends mid-word before "Read more", like the reference ("…allows us t"). */
const ABOUT_PREVIEW_LEN = 178
const NA = 'N / A'

const UAE_JOB_LINKS = [
    { label: 'Jobs in UAE' },
    { label: 'Jobs in Dubai' },
    { label: 'Jobs in Abu Dhabi' },
    { label: 'Jobs in Ras al Khaimah' },
    { label: 'Jobs in Sharjah' },
    { label: 'Jobs in Fujairah' },
    { label: 'Jobs in Ajman' },
    { label: 'Jobs in Umm al Quwain' },
    { label: 'Jobs in Al Ain' },
]

const toDisplayValue = (value) => {
    if (value === null || value === undefined) return NA
    const str = String(value).trim()
    return str === '' ? NA : str
}

const readCachedCompany = (companyId) => {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem(FEATURED_COMPANY_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (companyId != null && String(parsed?.id) !== String(companyId)) return null
        return parsed
    } catch {
        return null
    }
}

function CompanyDetailSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[180px_1fr_300px] lg:gap-x-[24px] lg:gap-y-0 pt-[30px] animate-pulse">
            <div className='w-[150px] h-[150px] relative'>
                <div className='absolute top-[-80px] w-[150px] h-[150px] rounded-[12px] bg-[#EAECEF]' />
            </div>
            <div className="min-w-0">
                <div className='flex items-center justify-between gap-[10px] mb-[20px]'>
                    <div className='h-[28px] w-[60%] rounded bg-[#EAECEF]' />
                    <div className='h-[20px] w-[80px] rounded bg-[#EAECEF]' />
                </div>
                <div className="mb-[20px] flex flex-col gap-[8px]">
                    <div className='h-[14px] w-[95%] rounded bg-[#EAECEF]' />
                    <div className='h-[14px] w-[90%] rounded bg-[#EAECEF]' />
                    <div className='h-[14px] w-[60%] rounded bg-[#EAECEF]' />
                </div>
                <div className="divide-y divide-[rgba(143,143,143,0.35)]">
                    <div className="grid grid-cols-[200px_1fr] gap-[20px] py-[20px] max-sm:grid-cols-2">
                        <div className='h-[18px] w-[120px] rounded bg-[#EAECEF]' />
                        <div className='h-[18px] w-[140px] rounded bg-[#EAECEF]' />
                    </div>
                    <div className="grid grid-cols-[200px_1fr] gap-[20px] py-[20px] max-sm:grid-cols-2">
                        <div className='h-[18px] w-[120px] rounded bg-[#EAECEF]' />
                        <div className='h-[18px] w-[180px] rounded bg-[#EAECEF]' />
                    </div>
                </div>
            </div>
            <div className="">
                <div className="mb-[40px] flex items-center justify-between gap-[12px]">
                    <div className='h-[20px] w-[140px] rounded bg-[#EAECEF]' />
                    <div className='h-[20px] w-[60px] rounded bg-[#EAECEF]' />
                </div>
                <div className='h-[20px] w-[120px] rounded bg-[#EAECEF]' />
            </div>
        </div>
    )
}

const JobCompany = () => {
    const searchParams = useSearchParams()
    const userData = useSelector(userSignUpData)
    const userId = useMemo(() => {
        const id = userData?.id
        return id != null && String(id).trim() !== '' ? id : null
    }, [userData?.id])
    const companyIdFromUrl = useMemo(() => {
        const raw = searchParams?.get('id')
        if (raw == null || raw === '') return null
        return raw
    }, [searchParams])

    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [bookmarked, setBookmarked] = useState(false)
    const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false)
    const [aboutExpanded, setAboutExpanded] = useState(false)
    const [detailsExpanded, setDetailsExpanded] = useState(false)
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)

    const handleToggleBookmark = async () => {
        if (!userId) {
            toast.error('Please login your account')
            return
        }
        const companyId = company?.id ?? companyIdFromUrl
        if (!companyId || isBookmarkSubmitting) return

        const nextBookmarked = !bookmarked
        setBookmarked(nextBookmarked)
        setCompany((prev) =>
            prev ? { ...prev, is_bookmarked: nextBookmarked } : prev
        )
        setIsBookmarkSubmitting(true)
        try {
            await companyBookmarkApi.companyBookmark({
                user_id: userId,
                company_id: companyId,
            })
        } catch (err) {
            console.error('Failed to update company bookmark:', err)
            setBookmarked(!nextBookmarked)
            setCompany((prev) =>
                prev ? { ...prev, is_bookmarked: !nextBookmarked } : prev
            )
            toast.error('Failed to update bookmark. Please try again.')
        } finally {
            setIsBookmarkSubmitting(false)
        }
    }

    useEffect(() => {
        const cached = readCachedCompany(companyIdFromUrl)
        if (cached) {
            setCompany(cached)
            setBookmarked(Boolean(cached?.is_bookmarked))
        }

        let cancelled = false
        const run = async () => {
            if (!cached) setIsLoading(true)
            try {
                const response = await getFeaturedCompaniesApi.getFeaturedCompanies({
                    ...(userId ? { user_id: userId } : {}),
                })
                const payload = response?.data
                const list = Array.isArray(payload?.data) ? payload.data : []
                const matched = companyIdFromUrl
                    ? list.find((c) => String(c?.id) === String(companyIdFromUrl))
                    : list[0]
                if (!cancelled && matched) {
                    setCompany(matched)
                    setBookmarked(Boolean(matched?.is_bookmarked))
                } else if (!cancelled && !cached) {
                    setCompany(null)
                }
            } catch (err) {
                console.error('Failed to fetch company details:', err)
                if (!cancelled && !cached) setCompany(null)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [companyIdFromUrl, userId])

    const aboutText = String(company?.description || '').trim()
    const needsToggle = aboutText.length > ABOUT_PREVIEW_LEN
    const aboutPreview = aboutText.slice(0, ABOUT_PREVIEW_LEN)

    const companyName = toDisplayValue(company?.company_name)
    const companySize = company?.company_size
        ? `${String(company.company_size).trim()} Employees`
        : NA
    const companyType = toDisplayValue(company?.company_type)
    const companyLogo =
        typeof company?.company_logo === 'string' && company.company_logo.trim()
            ? company.company_logo.trim()
            : null

    return (
        <div>
            <div className='w-full h-[220px] relative mt-[-30px]'>
                <Image src={companybanner} alt='companybanner' fill className='object-cover' />
            </div>
            <div className="w-full bg-white pb-[40px]">
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">
                    {isLoading && !company ? (
                        <CompanyDetailSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[180px_1fr_300px] lg:gap-x-[24px] lg:gap-y-0 pt-[30px]">
                            <div className='w-[150px] h-[150px] relative'>
                                {companyLogo ? (
                                    <Image
                                        src={companyLogo}
                                        alt={companyName}
                                        width={150}
                                        height={150}
                                        unoptimized
                                        className='absolute top-[-80px] w-[150px] h-[150px] object-contain border border-[#e0e1e3] rounded-[12px] bg-[#ffffff]'
                                    />
                                ) : (
                                    <Image
                                        src={clientPlaceholder}
                                        alt={companyName}
                                        width={150}
                                        height={150}
                                        className='absolute top-[-80px] w-[150px] h-[150px] object-contain border border-[#e0e1e3] rounded-[12px] bg-[#ffffff]'
                                    />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className='flex items-center justify-between gap-[10px] mb-[20px]'>
                                    <h4 className='text-[26px] font-[Inter-Bold] text-[#23262A] truncate'>{companyName}</h4>
                                    <div>
                                        <p className='p-[3px_6px] rounded-[4px] bg-[linear-gradient(94.47deg,_rgb(103,167,242)_2.35%,_rgb(37,128,235)_95.78%)] text-[12px] font-[Inter-Bold] text-white uppercase'>Featured</p>
                                    </div>
                                </div>
                                <div className="mb-[20px] text-[14px] font-[Inter-Regular] leading-[1.65] text-[#23262A] ">
                                    {aboutText ? (
                                        aboutExpanded || !needsToggle ? (
                                            <>
                                                {aboutText}{' '}
                                                {needsToggle ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAboutExpanded(false)}
                                                        className="ml-[4px] inline font-[Inter-Regular] text-[14px] text-[#1270EC] cursor-pointer"
                                                    >
                                                        Read less
                                                    </button>
                                                ) : null}
                                            </>
                                        ) : (
                                            <>
                                                {aboutPreview}
                                                <button
                                                    type="button"
                                                    onClick={() => setAboutExpanded(true)}
                                                    className="ml-[4px] inline font-[Inter-Regular] text-[14px] text-[#1270EC] cursor-pointer"
                                                >
                                                    Read more
                                                </button>
                                            </>
                                        )
                                    ) : (
                                        <span className="text-[#8F8F8F]">{NA}</span>
                                    )}
                                </div>

                                <div className="divide-y divide-[rgba(143,143,143,0.35)]">
                                    <div className="grid grid-cols-[200px_1fr] gap-[20px] py-[20px] max-sm:grid-cols-2">
                                        <h4 className="text-[16px] font-[Inter-SemiBold] text-[#6B6D70]">Company Size</h4>
                                        <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">{companySize}</p>
                                    </div>

                                    {detailsExpanded ? (
                                        <>
                                            <div className="grid grid-cols-[200px_1fr] gap-[20px] py-[20px] max-sm:grid-cols-2">
                                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#6B6D70]">Company Type</h4>
                                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    {companyType}
                                                </p>
                                            </div>
                                        </>
                                    ) : null}

                                    <div className="py-[20px] border-b border-[rgba(143,143,143,0.35)]">
                                        <button
                                            type="button"
                                            onClick={() => setDetailsExpanded((v) => !v)}
                                            className="cursor-pointer text-left text-[14px] font-[Inter-Regular] text-[#1270EC] underline decoration-[#1270EC] underline-offset-[3px] hover:opacity-90"
                                        >
                                            {detailsExpanded ? 'See less' : 'See more'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="">
                                <div className="mb-[40px] flex items-center justify-between gap-[12px]">
                                    <h3 className="text-[18px] font-[Inter-Bold] leading-none text-[#23262A]">Connect with us</h3>
                                    <button
                                        type="button"
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] text-[14px] font-[Inter-Medium] text-[#3B82F6]"
                                        onClick={() => setIsSharePopupOpen(true)}
                                    >
                                        <Image src={shareblue} alt='shareblue' width={16} height={16} className='w-[16px] h-[16px]' />
                                        Share
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleToggleBookmark}
                                    aria-pressed={bookmarked}
                                    disabled={isBookmarkSubmitting}
                                    className={`mt-[18px] inline-flex cursor-pointer items-center gap-[8px] text-[14px] font-[Inter-Medium] transition-colors text-[#23262A] ${isBookmarkSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <Image
                                        src={bookmarked ? bookmarkedIcon : saveIcon}
                                        alt=""
                                        width={18}
                                        height={18}
                                        className="h-[18px] w-[18px] shrink-0"
                                    />
                                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="mt-[40px]">
                        <h3 className="mb-[20px] text-[14px] font-[Inter-SemiBold] leading-none text-[#23262A]">
                            Jobs in UAE
                        </h3>
                        <ul className="flex flex-col gap-[6px] ">
                            {UAE_JOB_LINKS.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href='/jobs'
                                        className="inline-block text-[13px] font-[Inter-Regular] text-[#0F5DC4] hover:text-[#DC0000] hover:underline"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <SharePopup
                isOpen={isSharePopupOpen}
                onClose={() => setIsSharePopupOpen(false)}
                onShare={() => { }}
            />
        </div>
    )
}
export default JobCompany
