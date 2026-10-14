'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { allItemApi } from '@/utils/api'
import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'
import { formatPriceAbbreviated, placeholderImage } from '@/utils'
import { getProductPromotionBadge, promotionBadgePropertyAppearance } from '@/utils/productPromotionBadge'
import { buildWhatsAppSendUrl } from '@/utils/whatsapp'
import { absoluteUrl } from '@/utils/siteUrl'
import { FavouriteIcon, LocationIcon, PaginationNextIcon, PaginationPrevIcon, GalleryIcon, VerifiedBadge, PaginationDoublePrevIcon, PaginationDoubleNextIcon, PaginationSinglePrevIcon, PaginationSingleNextIcon, ShareIcon } from '@/components/CustomFile/icons'
import VerifiedMain from '../../GetVerified/VerifiedMain'
import bed from '../../../../../public/assets/img/icons/bed.svg'
import bath from '../../../../../public/assets/img/icons/bath.svg'
import size from '../../../../../public/assets/img/icons/size.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import mailOutline from '../../../../../public/assets/img/icons/mailOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import client from '../../../../../public/assets/img/client.png'
import verifiedicon from '../../../../../public/assets/img/icons/verifiedicon.svg'
import play from '../../../../../public/assets/img/icons/play.svg'
import { BsCameraVideoFill } from 'react-icons/bs'
import CommonProjectCard from './CommonProjectCard'
import SaveAdsModal from './SaveAds'
import SharePopup from './SharePopup'
import Email from '@/components/PagesComponent/CommonComponents/Email'
import Call from '@/components/PagesComponent/CommonComponents/Call'

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

/** Actual DB slugs: Property → Property for Rent → Monthly/Daily Short Term. */
const PROPERTY_MONTHLY_SHORT_TERM_SLUG = 'monthly-short-term'
const PROPERTY_DAILY_SHORT_TERM_SLUG = 'daily-short-term'

function isCategorySlugUnder(slug, parentSlug) {
    const s = String(slug || '').trim().toLowerCase()
    const parent = String(parentSlug || '').trim().toLowerCase()
    if (!s || !parent) return false
    return s === parent || s.startsWith(`${parent}-`)
}

/** Listing URL `category_slug` (and fallback `slug`) identifies the short-term rental period. */
function detectPropertyShortTermRentalPeriod(categorySlug) {
    if (isCategorySlugUnder(categorySlug, PROPERTY_MONTHLY_SHORT_TERM_SLUG)) return 'Monthly'
    if (isCategorySlugUnder(categorySlug, PROPERTY_DAILY_SHORT_TERM_SLUG)) return 'Daily'
    return ''
}

function normalizeCfName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

/** API list items expose specs under `custom_fields` (Bedrooms, Bathrooms, Size(Sqft), Amenities, …). */
function findCustomField(customFields, predicate) {
    if (!Array.isArray(customFields)) return null
    return customFields.find((f) => f && predicate(f.name)) || null
}

function customFieldToDisplayString(field) {
    if (!field) return ''
    const v = field.value
    if (Array.isArray(v)) {
        return v
            .map((x) => (x == null ? '' : String(x).trim()))
            .filter(Boolean)
            .join(', ')
    }
    if (v != null && v !== '') return String(v).trim()
    return ''
}

function extractSpecsFromCustomFields(item) {
    const cf = item?.custom_fields
    const bedsF = findCustomField(cf, (n) => {
        const x = normalizeCfName(n)
        return x === 'bedrooms' || x.includes('bedroom')
    })
    const bathsF = findCustomField(cf, (n) => {
        const x = normalizeCfName(n)
        return x === 'bathrooms' || x.includes('bathroom')
    })
    const sizeF = findCustomField(cf, (n) => {
        const x = normalizeCfName(n)
        return x.includes('sqft') || x.includes('size')
    })
    const amenF = findCustomField(cf, (n) => normalizeCfName(n) === 'amenities')

    return {
        beds: customFieldToDisplayString(bedsF),
        baths: customFieldToDisplayString(bathsF),
        sqft: customFieldToDisplayString(sizeF),
        amenities: customFieldToDisplayString(amenF),
    }
}

function getItemImages(item) {
    const imgs =
        item?.images ||
        item?.image_gallery ||
        item?.gallery_images ||
        item?.photos ||
        item?.image_urls ||
        []

    const arr = Array.isArray(imgs) ? imgs : []
    const normalized = arr
        .map((v) => {
            if (!v) return ''
            if (typeof v === 'string') return v.trim()
            if (typeof v === 'object') {
                const guess =
                    v?.url ||
                    v?.image ||
                    v?.src ||
                    v?.path ||
                    v?.photo ||
                    v?.image_url ||
                    v?.imageUrl ||
                    ''
                return typeof guess === 'string' ? guess.trim() : ''
            }
            return ''
        })
        .filter(Boolean)

    if (normalized.length) return normalized
    const single = item?.image
    if (typeof single === 'string' && single.trim()) return [single.trim()]
    return []
}

function formatMoney(val) {
    if (val === '' || val === null || val === undefined) return ''
    const n = typeof val === 'number' ? val : Number(String(val).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n !== 0) return `AED ${formatPriceAbbreviated(n)}`
    return String(val)
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

function digitsOnlyPhone(raw) {
    if (raw == null || raw === '') return ''
    return String(raw).replace(/\D/g, '')
}

/** Listing `user` embed: `country_code` + `mobile` → full international digits (no +). */
function contactPhoneDigitsFromUser(user) {
    if (!user) return ''
    const rawMobile = user.mobile
    if (rawMobile == null || String(rawMobile).trim() === '') return ''
    const mobileDigits = digitsOnlyPhone(rawMobile)
    if (!mobileDigits) return ''
    const ccDigits = user.country_code != null ? digitsOnlyPhone(user.country_code) : ''
    if (ccDigits && !mobileDigits.startsWith(ccDigits)) {
        return `${ccDigits}${mobileDigits}`
    }
    return mobileDigits
}

function PropertyCardRow({ item }) {
    const searchParams = useSearchParams()
    const images = useMemo(() => getItemImages(item), [item])
    const displayImages = images.length ? images : ['/assets/img/property/1.png']
    const [imgIndex, setImgIndex] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isEmailOpen, setIsEmailOpen] = useState(false)
    const [isCallOpen, setIsCallOpen] = useState(false)

    useEffect(() => {
        setImgIndex(0)
    }, [item?.id, item?.slug])

    const safeLen = displayImages.length
    const canPrev = imgIndex > 0
    const canNext = imgIndex < safeLen - 1

    const title = getFirstTruthy(item?.title, item?.name, item?.listing_title)
    const propertyType = getFirstTruthy(
        item?.property_type,
        item?.type,
        item?.category?.translated_name,
        item?.category?.name,
        item?.category_name,
        item?.propertyType
    )
    const cfSpecs = useMemo(() => extractSpecsFromCustomFields(item), [item])
    const beds = getFirstTruthy(
        item?.beds,
        item?.bedrooms,
        item?.bed_rooms,
        item?.bedroom,
        cfSpecs.beds
    )
    const baths = getFirstTruthy(
        item?.baths,
        item?.bathrooms,
        item?.bath_rooms,
        item?.bathroom,
        cfSpecs.baths
    )
    const sqft = getFirstTruthy(
        item?.sqft,
        item?.area_sqft,
        item?.size_sqft,
        item?.area,
        item?.size,
        cfSpecs.sqft
    )
    const amenitiesStr = getFirstTruthy(cfSpecs.amenities)
    const amenityParts = useMemo(() => {
        if (!amenitiesStr) return []
        return amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean)
    }, [amenitiesStr])
    const location = getFirstTruthy(item?.location, item?.address, item?.city, item?.state, item?.country)

    const price = formatMoney(getFirstTruthy(item?.price, item?.amount, item?.rent, item?.yearly_rent))
    const listingCategorySlug =
        searchParams?.get('category_slug') ||
        searchParams?.get('slug') ||
        ''
    const shortTermRentalPeriod = detectPropertyShortTermRentalPeriod(listingCategorySlug)
    const priceUnit =
        shortTermRentalPeriod ||
        getFirstTruthy(item?.price_unit, item?.rent_unit, item?.billing_period, 'Yearly')

    const detailSlug = item?.slug || item?.id || ''
    const q = new URLSearchParams()
    q.set('slug', String(detailSlug))
    q.set('mode', 'property')
    const selectedItem = searchParams?.get('item')
    const selectedPurpose = searchParams?.get('purpose')
    const selectedPropertyType = searchParams?.get('propertyType')
    if (selectedItem) q.set('item', selectedItem)
    if (selectedPurpose) q.set('purpose', selectedPurpose)
    if (selectedPropertyType) q.set('propertyType', selectedPropertyType)
    const href = `/productdetail?${q.toString()}`

    const email = getFirstTruthy(item?.user?.email, item?.email, item?.contact_email)
    const phone = getFirstTruthy(
        contactPhoneDigitsFromUser(item?.user),
        item?.contact,
        item?.phone,
        item?.mobile,
        item?.contact_phone,
        item?.contact_number
    )
    const clientLogo = getFirstTruthy(item?.client_image, item?.client_logo, item?.agency_logo, item?.company_logo, item?.user_image)
    const hasVideo = normalizeBoolean(item?.has_video, item?.video_available, item?.is_video_available) || Boolean(getFirstTruthy(item?.video_link, item?.videoUrl, item?.video_url))
    const isVerifiedUser = normalizeBoolean(item?.verified_user, item?.is_verified_user, item?.verified, item?.is_verified, item?.user_verified)
    const promotionBadge = useMemo(() => getProductPromotionBadge(item), [item])
    const listingUrl = useMemo(() => absoluteUrl(href), [href])

    const phoneDigits = useMemo(() => digitsOnlyPhone(phone), [phone])

    const waMessage = useMemo(() => {
        const ref = item?.id != null ? String(item.id) : String(detailSlug || '')
        return `Hello! I'm interested in this property${title ? `: ${title}` : ''}.\n\nLink: ${listingUrl}${ref ? `\nReference: ${ref}` : ''}`
    }, [title, listingUrl, item?.id, detailSlug])

    const waLink = useMemo(() => buildWhatsAppSendUrl(phoneDigits, waMessage), [phoneDigits, waMessage])
    const agentName = getFirstTruthy(item?.user?.name, item?.agent_name, item?.owner_name, item?.seller_name, '-')
    const agencyName = getFirstTruthy(item?.agency_name, item?.company_name, item?.category?.name, '-')
    const agentImage = getFirstTruthy(item?.user?.profile, item?.agent_image, item?.user_image, '')
    const referenceCode = getFirstTruthy(item?.reference_code, item?.id, '-')

    return (
        <div className="cursor-pointer w-full overflow-hidden rounded-[12px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-stretch max-sm:flex-col">
                <div className="relative w-[350px] max-w-[350px] shrink-0 max-sm:w-full">
                    <Link href={href} prefetch={false}>
                        <div className="relative overflow-hidden rounded-[12px_0px_0px_12px] bg-[#F5F5F5]">
                            <Image
                                src={displayImages[imgIndex] ?? '/assets/img/property/1.png'}
                                alt={title || 'Property'}
                                width={350}
                                height={270}
                                className="h-[260px] w-full object-cover"
                                onErrorCapture={placeholderImage}
                            />

                            <div className="absolute right-[12px] top-[10px] z-[2]">
                                <button
                                    type="button"
                                    className="cursor-pointer mr-[8px]"
                                    aria-label="Share"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setIsShareOpen(true)
                                    }}
                                >
                                    <ShareIcon className="w-[24px] h-[24px] text-white" />
                                </button>
                                <button
                                    type="button"
                                    className="cursor-pointer"
                                    aria-label="Favourite"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setIsSaved((prev) => !prev)
                                        setIsSaveAdsOpen(true)
                                    }}
                                >
                                    <FavouriteIcon
                                        className={`w-[24px] h-[24px] ${isSaved ? 'text-[#DC0000]' : 'text-white'}`}
                                        fill={isSaved ? '#DC0000' : '#fff'}
                                        fillOpacity={isSaved ? '1' : '0.9'}
                                        stroke={isSaved ? '#DC0000' : '#fff'}
                                    />
                                </button>
                            </div>

                            {isVerifiedUser ? (
                                <div className="absolute left-[10px] top-[10px] z-[2] rounded-[6px] bg-[#fff] px-[6px] py-[3px] flex items-center gap-[4px]">
                                    <Image src={verifiedicon} alt="verified" width={14} height={14} />
                                    <p className="text-[12px] font-[Inter-Regular] text-[#2b2d2e]">Verified</p>
                                </div>
                            ) : null}

                            <div className="flex items-center gap-[4px] justify-center absolute bottom-[10px] left-[10px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[2px_5px]">
                                <GalleryIcon className="w-[16px] h-[16px] text-white" />
                                <p className="text-[12px] font-[Inter-Medium] text-white">
                                    {`${imgIndex + 1}/${safeLen}`}
                                </p>
                            </div>

                            {hasVideo ? (
                                <div className="absolute bottom-[10px] right-[10px] z-[2] rounded-[6px] bg-[rgba(0,0,0,0.45)] px-[6px] py-[4px]">
                                    <Image src={play} alt="play" width={14} height={14} />
                                </div>
                            ) : null}


                            {safeLen > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setImgIndex((p) => Math.max(0, p - 1))
                                        }}
                                        className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                        aria-label="Previous image"
                                    >
                                        <PaginationPrevIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setImgIndex((p) => Math.min(safeLen - 1, p + 1))
                                        }}
                                        className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                        aria-label="Next image"
                                    >
                                        <PaginationNextIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                    </button>

                                    <div className="absolute bottom-[12px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                        {Array.from({ length: Math.min(6, safeLen) }).map((_, idx) => (
                                            <span
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={idx}
                                                className={`h-[7px] w-[7px] rounded-full ${idx === Math.min(imgIndex, 5) ? 'bg-white' : 'bg-[rgba(255,255,255,0.55)]'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </Link>
                </div>

                <div className="p-[16px] flex min-w-0 flex-1 flex-col justify-between gap-[12px]">
                    <div className="flex items-start justify-between gap-[12px]">
                        <div className="min-w-0">
                            <h4 className="mb-[6px] text-[18px] font-[Inter-Medium] text-[#2b2d2e] leading-[26px] truncate">
                                {price ? (
                                    <>
                                        <span className="text-[22px] font-[Inter-SemiBold] text-[#2b2d2e] leading-[26px] truncate">{price}{' '}</span>
                                        <span className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">{priceUnit}</span>
                                    </>
                                ) : (
                                    '—'
                                )}
                            </h4>
                            <p className="text-[14px] font-[Inter-Medium] text-[#2b2d2e] truncate">{propertyType}</p>
                        </div>

                        {promotionBadge.label ? (
                            <p {...promotionBadgePropertyAppearance(promotionBadge)}>{promotionBadge.label}</p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-[16px]">
                        <div className="flex items-center gap-[4px]">
                            <Image src={bed} alt="bed" width={16} height={16} />
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">
                                {beds ? `${beds} bed${String(beds) === '1' ? '' : 's'}` : '—'}
                            </p>
                        </div>
                        <div className="flex items-center gap-[4px]">
                            <Image src={bath} alt="bath" width={16} height={16} />
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">
                                {baths ? `${baths} bath${String(baths) === '1' ? '' : 's'}` : '—'}
                            </p>
                        </div>
                        <div className="flex items-center gap-[4px]">
                            <Image src={size} alt="size" width={16} height={16} />
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">
                                {sqft ? `${sqft} sqft` : '—'}
                            </p>
                        </div>
                    </div>

                    {amenityParts.length ? (
                        <div className="flex flex-wrap items-center text-[14px] font-[Inter-SemiBold] leading-normal">
                            {amenityParts.map((label, i) => (
                                <Fragment key={`${i}-${label}`}>
                                    {i > 0 ? (
                                        <span
                                            className="mx-[10px] shrink-0 text-[#2b2d2e] select-none"
                                            aria-hidden
                                        >
                                            |
                                        </span>
                                    ) : null}
                                    <span className="text-[#2b2d2e]">{label}</span>
                                </Fragment>
                            ))}
                        </div>
                    ) : null}

                    <div className="flex items-center gap-[8px] min-w-0">
                        <LocationIcon className="h-[16px] w-[16px]" />
                        <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e] truncate">{location}</p>
                    </div>

                    <div className="flex items-center justify-between gap-[10px] max-sm:flex-col max-sm:items-start">
                        <div className="flex flex-wrap items-center gap-[10px]">
                            <button
                                type="button"
                                className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#3a88ef14] px-[14px] py-[10px]"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsEmailOpen(true)
                                }}
                            >
                                <Image src={mailOutline} alt="email" width={18} height={18} />
                                <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">Email</p>
                            </button>
                            <button
                                type="button"
                                className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#ffedea80] px-[14px] py-[10px]"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsCallOpen(true)
                                }}
                            >
                                <Image src={phoneOutline} alt="phone" width={18} height={18} />
                                <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">Call</p>
                            </button>
                            {waLink ? (
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-[8px] rounded-[10px] bg-[#43bb3f1a] px-[14px] py-[10px] no-underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Image src={whatsapp} alt="" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">WhatsApp</p>
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex cursor-not-allowed items-center gap-[8px] rounded-[10px] bg-[#43bb3f1a] px-[14px] py-[10px] opacity-50"
                                >
                                    <Image src={whatsapp} alt="" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">WhatsApp</p>
                                </button>
                            )}
                        </div>
                        {clientLogo ? (
                            <div className="h-[40px] w-[80px] shrink-0 overflow-hidden">
                                <Image
                                    src={client}
                                    alt="Client"
                                    width={80}
                                    height={40}
                                    className="h-[40px] w-[80px] object-contain"
                                    onErrorCapture={placeholderImage}
                                />
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>
            <SaveAdsModal
                open={isSaveAdsOpen}
                onClose={() => setIsSaveAdsOpen(false)}
                onConfirm={() => {}}
                onNewList={() => {}}
                lists={SAVE_ADS_LISTS}
                currentListIndex={0}
            />
            <SharePopup
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                shareUrl={absoluteUrl(href)}
                title={title || 'Listing'}
            />
            <Call
                open={isCallOpen}
                onClose={() => setIsCallOpen(false)}
                agentName={agentName}
                agencyName={agencyName}
                agentImage={agentImage}
                referenceCode={String(referenceCode || '-')}
                phoneNumber={phone || '-'}
            />
            <Email
                open={isEmailOpen}
                onClose={() => setIsEmailOpen(false)}
                itemId={item?.id}
                image={displayImages[imgIndex] || displayImages[0]}
                price={price || '-'}
                beds={beds || '-'}
                baths={baths || '-'}
                sqft={sqft || '-'}
                location={location || '-'}
                referenceCode={String(referenceCode || '-')}
            />
        </div>
    )
}

export default function PropertyCard({ perPage = 15, onItemsTotalChange }) {
    const searchParams = useSearchParams()
    /** String form so effects run when the query changes (ReadonlyURLSearchParams ref can be stable). */
    const listingQueryKey = searchParams?.toString?.() ?? ''
    const sourceMode = (searchParams?.get('mode') || '').toLowerCase() || 'property'
    const subSlug = (searchParams?.get('slug') || '').toLowerCase()
    const selectedCategorySlug = (searchParams?.get('category_slug') || '').toLowerCase()
    const resolvedCategorySlug = selectedCategorySlug || subSlug || ''

    const [items, setItems] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const lastListingQueryKeyRef = useRef(null)
    const lastFetchSigRef = useRef('')

    const fetchPage = async (page) => {
        if (!sourceMode) return
        setIsLoading(true)
        try {
            const purpose = (searchParams?.get('purpose') || '').toLowerCase()
            const city = searchParams?.get('city')?.trim() || undefined
            const country = searchParams?.get('country')?.trim() || undefined
            const state = searchParams?.get('state')?.trim() || undefined
            const area = searchParams?.get('area') || undefined
            const areaId = searchParams?.get('area_id') || undefined
            const buildingId = searchParams?.get('building_id') || undefined
            const propertyTypeParam = searchParams?.get('propertyType') || undefined
            const minPrice = searchParams?.get('minPrice') || undefined
            const maxPrice = searchParams?.get('maxPrice') || undefined
            const agency = searchParams?.get('agency') || undefined
            const categoryId = searchParams?.get('category_id') || undefined
            const filterQuery = collectFilterParamsFromSearchParams(searchParams)
            const searchText =
                searchParams?.get('search')?.trim() ||
                searchParams?.get('keyword')?.trim() ||
                undefined
            const sortBy = searchParams?.get('sort_by')?.trim() || 'new-to-old'
            const params = {
                page,
                sort_by: sortBy,
                category_slug: resolvedCategorySlug || sourceMode,
                per_page: perPage,
                limit: perPage,
                purpose: purpose || undefined,
                city,
                country,
                state,
                area,
                area_id: areaId,
                building_id: buildingId,
                property_type: propertyTypeParam,
                min_price: minPrice,
                max_price: maxPrice,
                agency,
                category_id: categoryId,
                search: searchText,
                filterQuery,
            }

            const res = await allItemApi.getItems(params)
            const data = res?.data
            const inner = data?.data || {}
            const list = inner?.data || []

            if (!Array.isArray(list) || list.length === 0) {
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
        if (!sourceMode) return
        const queryChanged = lastListingQueryKeyRef.current !== listingQueryKey
        if (queryChanged) lastListingQueryKeyRef.current = listingQueryKey
        const page = queryChanged ? 1 : currentPage
        if (queryChanged) setCurrentPage(1)
        const sig = `${listingQueryKey}::${page}`
        if (lastFetchSigRef.current === sig) return
        lastFetchSigRef.current = sig
        fetchPage(page)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sourceMode, subSlug, selectedCategorySlug, listingQueryKey])

    const totalPages = Math.max(1, lastPage)
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(totalPages - (VISIBLE_PAGE_BUTTONS - 1), currentPage))
        const end = Math.min(totalPages, start + VISIBLE_PAGE_BUTTONS - 1)
        const arr = []
        for (let p = start; p <= end; p++) arr.push(p)
        return arr
    }, [currentPage, totalPages])

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading...</div>
            ) : items.length ? (
                <div className="flex flex-col gap-[18px]">
                    {items.map((item, index) => (
                        <div key={item?.id || item?.slug}>
                            <PropertyCardRow item={item} />
                            {index === 1 ? (
                                <div className="flex flex-col gap-[14px] py-[12px]">
                                    {/* <CommonProjectCard /> */}
                                    <VerifiedMain showTickBadge={false} />
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">No data found</div>
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

