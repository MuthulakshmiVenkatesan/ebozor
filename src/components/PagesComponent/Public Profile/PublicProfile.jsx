'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ShareIcon, StarIcon } from '@/components/CustomFile/icons'
import user from '../../../../public/assets/img/user.jpeg'
import AdsEmptyData from './components/AdsEmptyData'
import AdsLiveGrid from './components/AdsLiveGrid'
import EmptyRatings from './components/EmptyRatings'
import RatingsLive from './components/RatingsLive'
import SharePopup from '../CommonComponents/SharePopup'
import tickmark from '../../../../public/assets/img/icons/tickmark.png'
import { getPublicProfileDataApi } from '@/utils/api'

const DEFAULT_RATINGS_DATA = {
    overallRating: 0,
    basedOnCount: 0,
    reviews: [],
}
const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
    const scriptIndex = payload.indexOf('<script')
    const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch (error) {
        console.error('get-public-profile-data parse error:', error)
        return {}
    }
}

function formatJoinLabel(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return ''
    const month = d.toLocaleString('en-US', { month: 'long' })
    const year = d.getFullYear()
    return `Joined on ${month} ${year}`
}

function normalizePropertyTypes(propertyTypeRaw) {
    const parts = Array.isArray(propertyTypeRaw) ? propertyTypeRaw : [propertyTypeRaw]
    return parts.map((x) => String(x ?? '').trim().toLowerCase()).filter(Boolean)
}

function resolveClassifiedVariant(propertyTypes) {
    if (propertyTypes.includes('furnituregarden')) return 'furniture'
    if (propertyTypes.includes('mobilestablets')) return 'mobile'
    return ''
}

function listingPurposeFromApiPropertyType(propertyTypes) {
    if (propertyTypes.includes('sale') || propertyTypes.includes('sell')) return 'sale'
    return 'rent'
}

function buildItemDetailHref(slug, propertyTypeRaw, itemName = '', itemCategory = '') {
    const detailSlug = String(slug || '').trim()
    if (!detailSlug) return '/ads'

    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    const hasNewProject = propertyTypes.includes('newproject')
    const hasPropertyListing = propertyTypes.includes('sale') || propertyTypes.includes('sell') || propertyTypes.includes('rent')
    const hasClassifiedListing =
        propertyTypes.includes('classified') ||
        propertyTypes.includes('furnituregarden') ||
        propertyTypes.includes('mobilestablets')
    const hasMotorListing = propertyTypes.includes('motor') || propertyTypes.includes('motors')

    const q = new URLSearchParams()
    q.set('slug', detailSlug)

    if (hasNewProject) {
        q.set('mode', 'new-project')
        return `/productdetail?${q.toString()}`
    }

    if (hasMotorListing) {
        q.set('mode', 'motors')
        q.set('item', String(itemCategory || '').trim())
        q.set('carOfWeek', '1')
        return `/productdetail?${q.toString()}`
    }

    if (hasPropertyListing) {
        const purpose = listingPurposeFromApiPropertyType(propertyTypes)
        q.set('mode', 'property')
        q.set('purpose', purpose)
        q.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || LISTING_SLUG_BY_PURPOSE.rent)
        return `/productdetail?${q.toString()}`
    }

    if (hasClassifiedListing) {
        q.set('mode', 'classified')
        const variant = resolveClassifiedVariant(propertyTypes)
        if (variant) q.set('variant', variant)
        return `/productdetail?${q.toString()}`
    }

    return `/productdetail?${q.toString()}`
}

export default function PublicProfile() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState('ads')
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [profileData, setProfileData] = useState({
        user: null,
        totalItems: 0,
        items: [],
        ratings: DEFAULT_RATINGS_DATA,
    })

    const userIdParam = String(searchParams.get('user_id') || '').trim()

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!userIdParam) {
                setProfileData({ user: null, totalItems: 0, items: [], ratings: DEFAULT_RATINGS_DATA })
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const response = await getPublicProfileDataApi.getPublicProfileData({ user_id: userIdParam })
                const parsed = parseApiPayload(response?.data)
                const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const apiUser = data?.user && typeof data.user === 'object' ? data.user : null
                const apiItems = Array.isArray(data?.items) ? data.items : []
                const apiReviews = Array.isArray(apiUser?.seller_review) ? apiUser.seller_review : []

                const mappedItems = apiItems.map((row = {}) => ({
                    id: String(row?.id ?? ''),
                    imageSrc: String(row?.image || '').trim() || '/assets/img/classified/1.png',
                    title: String(row?.name || '').trim(),
                    price: Number(row?.price || 0),
                    currency: String(row?.currency || 'AED').trim(),
                    href: buildItemDetailHref(row?.slug, row?.property_type, row?.name, row?.item_category),
                }))

                const mappedReviews = apiReviews.map((row = {}, index) => ({
                    id: String(row?.id ?? `review-${index}`),
                    reviewerName: String(row?.reviewer_name || row?.name || 'User').trim(),
                    role: String(row?.role || 'buyer').toLowerCase() === 'seller' ? 'seller' : 'buyer',
                    avatarSrc: String(row?.profile || row?.avatar || '').trim() || user,
                    rating: Number(row?.rating || 0),
                    timeAgo: String(row?.time_ago || '').trim(),
                    tags: Array.isArray(row?.tags) ? row.tags.filter(Boolean) : [],
                    text: String(row?.review || row?.comment || '').trim(),
                }))

                const ratingsData = {
                    overallRating: Number(apiUser?.average_rating || 0),
                    basedOnCount: Number(apiUser?.reviews_count || mappedReviews.length || 0),
                    reviews: mappedReviews,
                }

                if (!cancelled) {
                    setProfileData({
                        user: apiUser,
                        totalItems: Number(data?.total_items || mappedItems.length || 0),
                        items: mappedItems,
                        ratings: ratingsData,
                    })
                }
            } catch (error) {
                console.error('get-public-profile-data error:', error)
                if (!cancelled) {
                    setProfileData({ user: null, totalItems: 0, items: [], ratings: DEFAULT_RATINGS_DATA })
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userIdParam])

    const apiUser = profileData.user
    const displayName = [String(apiUser?.name || '').trim(), String(apiUser?.last_name || '').trim()].filter(Boolean).join(' ').trim()
    const joinedLabel = formatJoinLabel(apiUser?.created_at)
    const isVerifiedUser = Number(apiUser?.is_verified) === 1
    const ratingCount = profileData.ratings.basedOnCount ?? 0
    const hasRatings = ratingCount > 0
    const avgRatingLabel = useMemo(() => {
        const n = Number(profileData.ratings.overallRating)
        if (Number.isNaN(n)) return '0.0'
        return n.toFixed(1)
    }, [profileData.ratings.overallRating])



    return (
        <div className="w-full">
            <div className='relative w-full border-b border-[rgba(143,143,143,0.2)] bg-white'>
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-[20px]">
                        <div className="flex items-start gap-[20px] max-sm:gap-[14px]">
                            <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8EAED] ring-1 ring-[rgba(143,143,143,0.2)]">
                                {loading ? (
                                    <div className="h-full w-full animate-pulse bg-[#e5e7eb]" />
                                ) : (
                                    <Image src={String(apiUser?.profile || '').trim() || user} alt="" width={100} height={100} className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0 pt-[2px]">
                                <div className="mb-[4px] flex flex-wrap items-center gap-[6px]">
                                    {loading ? (
                                        <div className="h-[18px] w-[180px] animate-pulse rounded bg-[#e5e7eb]" />
                                    ) : (
                                        <h1 className="text-[16px] font-[Inter-Bold] leading-tight text-[#23262A] sm:text-[17px]">{displayName || 'User'}</h1>
                                    )}
                                    {isVerifiedUser ? (
                                        <Image src={tickmark} alt="tickmark" width={16} height={16} className="w-[16px] h-[16px]" />
                                    ) : null}
                                </div>
                                <p
                                    className={`text-[12px] font-[Inter-Regular] text-[#6B7280] sm:text-[13px] ${isVerifiedUser && hasRatings ? 'mb-[8px]' : ''}`}
                                >
                                    {loading ? <span className="inline-block h-[12px] w-[120px] animate-pulse rounded bg-[#e5e7eb]" /> : joinedLabel}
                                </p>
                                {isVerifiedUser && hasRatings ? (
                                    <div className="inline-flex max-w-full items-center gap-[8px] rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-[#f7f7f8] p-[3px_6px] ">
                                        <StarIcon className="w-[12px] h-[12px]" fill="#23262A" />
                                        <p className="text-[12px] font-[Inter-SemiBold] text-[#23262A]">{avgRatingLabel}</p>
                                        <span className="h-[12px] w-px shrink-0 bg-[#D1D5DB]" aria-hidden />
                                        <p className="text-[12px] font-[Inter-Regular] text-[#4B5563]">
                                            {ratingCount} Rating{ratingCount === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSharePopupOpen(true)}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-[8px] rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] py-[6px] text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors"
                        >
                            <ShareIcon className="h-[18px] w-[18px]" fill="#23262A" />
                            Share
                        </button>
                    </div>

                    <div className="flex gap-[32px] border-b border-[rgba(143,143,143,0.22)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ads')}
                            className={`relative p-[12px_24px] text-[14px] font-[Inter-SemiBold] transition-colors cursor-pointer border-b-[2px] ${activeTab === 'ads' ? 'text-[#23262A] border-[#DC0000]' : 'font-[Inter-Regular] text-[#9CA3AF] border-transparent'
                                }`}
                        >
                            Ads

                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ratings')}
                            className={`relative p-[12px_24px] text-[14px] transition-colors cursor-pointer border-b-[2px] ${activeTab === 'ratings' ? 'font-[Inter-SemiBold] text-[#23262A] border-[#DC0000]' : 'font-[Inter-Regular] text-[#9CA3AF] border-transparent'
                                }`}
                        >
                            Ratings

                        </button>
                    </div>
                </div>
            </div>

            <div className='bg-[#f7f7f8b3]'>
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container !py-[24px]">
                    <div className="">
                        {loading ? (
                            <div className="grid grid-cols-4 gap-[24px] max-sm:grid-cols-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={`skeleton-${i}`} className="overflow-hidden rounded-[8px] bg-white">
                                        <div className="h-[172px] w-full animate-pulse bg-[#e5e7eb]" />
                                        <div className="p-[16px]">
                                            <div className="h-[18px] w-[90px] animate-pulse rounded bg-[#e5e7eb]" />
                                            <div className="mt-[8px] h-[14px] w-[80%] animate-pulse rounded bg-[#e5e7eb]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'ads' ? (
                            profileData.items.length > 0 ? (
                                <AdsLiveGrid
                                    ads={profileData.items.map((ad) => ({
                                        id: ad.id,
                                        imageSrc: ad.imageSrc,
                                        title: ad.title,
                                        price: ad.price,
                                        currency: ad.currency,
                                        href: ad.href,
                                    }))}
                                    totalCount={profileData.totalItems}
                                />
                            ) : <AdsEmptyData />
                        ) : profileData.ratings.reviews.length > 0 ? (
                            <RatingsLive data={profileData.ratings} />
                        ) : (
                            <EmptyRatings />
                        )}
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
