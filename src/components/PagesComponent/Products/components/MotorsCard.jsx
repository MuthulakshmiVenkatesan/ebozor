/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    getMotorsListingQueryFromPathname,
    isMotorsCarOfTheWeekItem,
    resolveMotorsListingItemLabel,
} from '@/utils/motorsListingPaths'
import { PaginationSinglePrevIcon, PaginationSingleNextIcon, PaginationDoublePrevIcon, PaginationDoubleNextIcon, PaginationNextIcon, PaginationPrevIcon, GalleryIcon, FavouriteIcon, SliderShareIcon } from '@/components/CustomFile/icons'
import { allItemApi } from '@/utils/api'
import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'
import { formatPriceAbbreviated, placeholderImage } from '@/utils'
import { getProductPromotionBadge, promotionBadgePillAppearance } from '@/utils/productPromotionBadge'
import { absoluteUrl } from '@/utils/siteUrl'
import Link from 'next/link'
import Newprojectcard from './Newprojectcard'
import BookInspectionCard from './BookInspectionCard'
import CommonProjectCard from './CommonProjectCard'
import VerifiedMain from '../../GetVerified/VerifiedMain'
import SaveAdsModal from './SaveAds'
import SharePopup from './SharePopup'
import calendar from '../../../../../public/assets/img/icons/calendar.svg'
import speedometer from '../../../../../public/assets/img/icons/speedometer.svg'
import steerings from '../../../../../public/assets/img/icons/steering-side.svg'
import regional from '../../../../../public/assets/img/icons/regional-specs.svg'
import map from '../../../../../public/assets/img/icons/map.svg'
import verifiedshield from '../../../../../public/assets/img/icons/verifiedshield.svg'
import calendarmonth from '../../../../../public/assets/img/icons/calendarmonth.svg'
import VerifiedAccount from '../../GetVerified/VerifiedAccount'
const VISIBLE_PAGE_BUTTONS = 5
const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Cars Wishlist', count: 12 },
    { name: 'Home Picks', count: 8 },
    { name: 'Weekend Deals', count: 5 },
]

// Fallback/static demo data for when API returns empty.
// The backend fields here are matched to what this UI reads (image(s), price, year, km, steering, specs, tags).
const DEMO_MOTORS_ITEMS = Array.from({ length: 30 }).map((_, i) => {
    const idx = i + 1
    const make = ['Toyota', 'Nissan', 'Mercedes-Benz', 'Hyundai', 'BMW'][i % 5]
    const model = ['Yaris', 'Patrol', 'G-Class', 'Elantra', 'X5'][i % 5]
    const variant = ['SE', 'GR', 'GXR', 'Sport', 'Limited'][i % 5]
    const title = `${make} • ${model} • ${variant}`
    const price = [45500, 239000, 186000, 72000, 98000, 120000][i % 6]
    const year = 2019 + (i % 6)
    const km = [35000, 19714, 33000, 120000, 55000, 88000][i % 6]
    const agencyName = ['Regolith Autotrade', 'Bashma Motors', 'Perfect Motors', 'Dubai Auto House'][i % 4]
    const location = ['Ras Al Khor, Dubai', 'Jebel Ali, Dubai', 'Al Quoz, Dubai', 'Dubai Marina'][i % 4]

    const isCarOfWeek = i % 3 === 0
    const isShowroom = i % 3 === 1
    const isPremium = i % 3 === 2

    return {
        id: idx,
        slug: `demo-motor-${idx}`,
        name: `I’ve been using ebozor for demo ${idx} | GCC I Camera, GPS I Accident Free`,
        title: `I’ve been using ebozor for demo ${idx} | GCC I Camera, GPS I Accident Free`,
        make,
        model,
        variant,
        description: `I’ve been using ebozor for demo ${idx} | GCC I Camera, GPS I Accident Free`,
        price: `${price.toLocaleString('en-US')}`,
        year: `${year}`,
        km: `${km.toLocaleString('en-US')}`,
        steering_side: 'Left Hand',
        regional_specs: i % 2 === 0 ? 'GCC Specs' : 'American Specs',
        location,
        agency_name: agencyName,
        listed_by: agencyName,
        imageCount: 16 - (i % 7),
        images: ['/assets/img/anothercar.png', '/assets/img/sellcar.png', '/assets/img/anothercar.png', '/assets/img/car.png'],
        car_of_the_week: isCarOfWeek,
        is_car_of_the_week: isCarOfWeek,
        showroom_of_the_month: isShowroom,
        is_showroom_of_the_month: isShowroom,
        is_premium: isPremium,
        premium: isPremium,
        show_only_to_premium: isPremium,
    }
})

function normalizeBoolean(...vals) {
    for (const v of vals) {
        if (v === true) return true
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase()
            if (s === '1' || s === 'true' || s === 'yes') return true
        }
        if (typeof v === 'number') {
            if (v === 1) return true
        }
    }
    return false
}

function getFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function getItemImages(item) {
    const imgs =
        item?.images ||
        item?.gallery_images ||
        item?.image_gallery ||
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

function parsePrice(item) {
    const p = getFirstTruthy(item?.price, item?.amount)
    if (p === '') return ''
    return p
}

function normalizeCustomFieldName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "'")
        .replace(/\s+/g, ' ')
}

function getCustomFieldDisplayValue(item, ...fieldNames) {
    const fields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const targets = fieldNames.map(normalizeCustomFieldName).filter(Boolean)
    if (!targets.length) return ''
    const match = fields.find((f) => targets.includes(normalizeCustomFieldName(f?.name)))
    if (!match) return ''
    const raw = match?.custom_field_value?.value ?? match?.value
    if (Array.isArray(raw)) {
        const clean = raw
            .map((v) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim()))
            .filter(Boolean)
        return clean.join(', ')
    }
    if (typeof raw === 'string') return raw.trim()
    if (raw != null) return String(raw).trim()
    return ''
}

function parseNumberValue(v) {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(String(v).replace(/[^\d.]/g, ''))
    return Number.isNaN(n) ? null : n
}

function formatRentalAmount(v) {
    const n = parseNumberValue(v)
    if (n === null) return ''
    return formatPriceAbbreviated(n)
}

function formatKmAllowance(v, periodLabel) {
    if (v === '' || v === null || v === undefined) return ''
    const raw = String(v).trim()
    if (!raw) return ''
    if (raw.toLowerCase().includes('km')) return raw
    const n = parseNumberValue(raw)
    const value = n === null ? raw : Number(n).toLocaleString('en-US')
    return `${value} km per ${periodLabel}`
}

function formatMinimumRentalText(v) {
    if (v === '' || v === null || v === undefined) return ''
    const raw = String(v).trim()
    if (!raw) return ''
    const n = parseNumberValue(raw)
    const value = n !== null && /^\d+(\.\d+)?$/.test(raw) ? `${n} day${n === 1 ? '' : 's'}` : raw
    return `Minimum ${value} rental`
}

function getRentalInsuranceText(item) {
    const basicInsurance = getFirstTruthy(
        item?.basic_insurance,
        item?.basic_insurance_included,
        getCustomFieldDisplayValue(item, 'Basic Insurance', 'Basic insurance')
    )
    if (basicInsurance) return String(basicInsurance).trim()

    const fullInsurance = getFirstTruthy(
        item?.full_insurance,
        item?.full_insurance_terms,
        getCustomFieldDisplayValue(item, 'Full Insurance', 'Full insurance')
    )
    if (fullInsurance) return `Full Insurance: ${String(fullInsurance).trim()}`

    return getFirstTruthy(item?.insurance_text, item?.insurance)
}

function buildMakeModelVariantText(item) {
    const make = String(item?.car_make_name || '').trim()
    const model = String(item?.car_model_name || '').trim()
    const variant = String(item?.car_trim_name || '').trim()
    const parts = [make, model, variant].filter(Boolean)
    if (parts.length) return parts.join(' • ')
    return 'Make • Model • Trim'
}

function isRentalListing(item, isRentalMode) {
    if (isRentalMode) return true
    const weeklyPrice = getFirstTruthy(item?.weekly_price, item?.price_weekly, item?.week_price)
    const monthlyPrice = getFirstTruthy(item?.monthly_price, item?.price_monthly, item?.month_price)
    return weeklyPrice !== '' || monthlyPrice !== ''
}

function getTagState(item) {
    const isCarOfWeek = isMotorsCarOfTheWeekItem(item)
    const isShowroomOfMonth = normalizeBoolean(
        item?.showroom_of_the_month,
        item?.is_showroom_of_the_month,
        item?.showroomOfTheMonth,
        item?.showroom_of_month,
        item?.isShowroomOfTheMonth
    )
    const isPremium = normalizeBoolean(
        item?.is_premium,
        item?.premium,
        item?.isPremium,
        item?.show_only_to_premium
    )

    return { isCarOfWeek, isShowroomOfMonth, isPremium }
}

function TagBadges({ item }) {
    const { isCarOfWeek, isShowroomOfMonth, isPremium } = getTagState(item)
    const promotionBadge = getProductPromotionBadge(item)
    const hasApiPromo = Boolean(promotionBadge.label)

    if (!isCarOfWeek && !isShowroomOfMonth && !isPremium && !hasApiPromo) return null

    if (isCarOfWeek) {
        return (
            <div className="flex items-center gap-[8px] max-sm:flex-col max-sm:items-start flex-wrap">
                <p className="rounded-[6px] bg-[linear-gradient(95.78deg,_rgb(38,166,154)_2.35%,_rgb(19,78,74)_95.78%)] p-[3px_5px] text-[10px] font-[Inter-Bold] text-white uppercase">
                    CAR OF THE WEEK
                </p>
                {hasApiPromo ? <p {...promotionBadgePillAppearance(promotionBadge)}>{promotionBadge.label}</p> : null}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-[8px] max-sm:flex-col max-sm:items-start">
            {isShowroomOfMonth ? (
                <p className="rounded-[6px] bg-[linear-gradient(100deg,_rgb(201,136,230)_100%,_rgb(144,63,180)_95.78%)] p-[3px_5px] text-[10px] font-[Inter-Bold] text-white uppercase">
                    SHOWROOM OF THE MONTH
                </p>
            ) : null}
            {hasApiPromo ? (
                <p {...promotionBadgePillAppearance(promotionBadge)}>{promotionBadge.label}</p>
            ) : isShowroomOfMonth || isPremium ? (
                <p className="rounded-[6px] bg-[linear-gradient(95.78deg,_rgb(255,189,61)_2.35%,_rgb(241,162,7)_95.78%)] p-[3px_5px] text-[10px] font-[Inter-Bold] text-white uppercase">
                    PREMIUM
                </p>
            ) : null}
        </div>
    )
}

function MotorCardRow({ item, isRentalMode = false, detailHref }) {
    const price = parsePrice(item)
    const images = useMemo(() => getItemImages(item), [item])
    const displayImages = images.length ? images : ['/assets/img/car.png']
    const photoCount = images.length
    const [imgIndex, setImgIndex] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    useEffect(() => {
        setImgIndex(0)
    }, [item?.id])
    const safeLen = displayImages.length
    const year = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Year'),
        item?.year,
        item?.model_year
    )
    const km = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Kilometers'),
        item?.km,
        item?.kilometers,
        item?.mileage
    )
    const steering = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Steering Side'),
        item?.steering_side,
        item?.steering
    )
    const specs = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Regional Specs'),
        item?.regional_specs,
        item?.specs_region,
        item?.gcc_specs
    )

    const location = getFirstTruthy(item?.location, item?.city, item?.state, item?.country)
    const title = item?.name || item?.title || ''
    const subtitle = buildMakeModelVariantText(item)
    const description = item?.description || item?.short_description || title
    const currency = getFirstTruthy(item?.currency, 'AED')

    const agencyName = getFirstTruthy(item?.agency_name, item?.agency, item?.dealer_name, item?.listed_by)
    const agencyLogo = getFirstTruthy(item?.agencyLogo, item?.agency_image, item?.dealer_logo, item?.dealerLogo, item?.company_logo)

    const weeklyPrice = getFirstTruthy(
        item?.weekly_rent,
        item?.rent_weekly,
        item?.price_per_week,
        item?.weekly_price,
        item?.price_weekly,
        item?.week_price,
        getCustomFieldDisplayValue(item, 'Weekly Rent', 'Weekly rent')
    )
    const monthlyPrice = getFirstTruthy(
        item?.monthly_rent,
        item?.rent_monthly,
        item?.price_per_month,
        item?.monthly_price,
        item?.price_monthly,
        item?.month_price,
        getCustomFieldDisplayValue(item, 'Monthly Rent', 'Monthly rent')
    )
    const kmPerWeek = getFirstTruthy(
        item?.km_per_week,
        item?.weekly_km,
        item?.weekly_kilometers,
        item?.weekly_km_limit,
        getCustomFieldDisplayValue(item, 'Km per week', 'Weekly km limit', 'Weekly mileage')
    )
    const kmPerMonth = getFirstTruthy(
        item?.km_per_month,
        item?.monthly_km,
        item?.monthly_kilometers,
        item?.monthly_km_limit,
        getCustomFieldDisplayValue(item, 'Km per month', 'Monthly km limit', 'Monthly mileage')
    )
    const minRentalDays = getFirstTruthy(
        item?.min_rental_days,
        item?.minimum_rental_days,
        item?.minimum_days_rental,
        item?.minimum_rental_period,
        getCustomFieldDisplayValue(item, 'Minimum Rental', 'Minimum rental', 'Min rental')
    )
    const insuranceText = getRentalInsuranceText(item)
    const weeklyPriceText = formatRentalAmount(getFirstTruthy(weeklyPrice, price))
    const monthlyPriceText = formatRentalAmount(monthlyPrice)
    const weeklyKmText = formatKmAllowance(kmPerWeek, 'week')
    const monthlyKmText = formatKmAllowance(kmPerMonth, 'month')
    const minimumRentalText = formatMinimumRentalText(minRentalDays)
    const isRentalItem = isRentalMode || weeklyPrice !== '' || monthlyPrice !== ''

    return (
        <div className="border-b border-[rgba(143,143,143,0.18)] py-[18px]">
            <div className="flex items-start gap-[22px] max-sm:flex-col">
                <div className={isRentalItem ? 'flex-shrink-0 w-[350px] max-w-[350px] max-sm:w-full' : 'flex-shrink-0 w-[282px] max-w-[282px] max-sm:w-full'}>
                    <div className="relative overflow-hidden rounded-[12px]">
                        <Image
                            src={displayImages[imgIndex] || '/assets/img/car.png'}
                            alt={title}
                            width={isRentalItem ? 350 : 360}
                            height={isRentalItem ? 300 : 190}
                            className={isRentalItem ? 'h-[300px] w-full object-cover' : 'h-[190px] w-full object-cover'}
                            onErrorCapture={placeholderImage}
                        />

                        <div className='absolute right-[12px] top-[6px] flex items-center gap-[4px]'>
                            <button
                                type="button"
                                className="cursor-pointer"
                                aria-label="Share listing"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsShareOpen(true)
                                }}
                            >
                                <SliderShareIcon className=" text-white" />
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

                        {photoCount ? (
                            <div className="flex items-center gap-[4px] justify-center absolute bottom-[10px] left-[10px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[2px_5px]">
                                <GalleryIcon className="w-[16px] h-[16px] text-white" />
                                <p className="text-[10px] font-[Inter-SemiBold] text-white">{photoCount}</p>
                            </div>
                        ) : null}

                        {safeLen > 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => (p - 1 + safeLen) % safeLen)
                                    }}
                                    className="cursor-pointer absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Previous image"
                                >
                                    <PaginationPrevIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => (p + 1) % safeLen)
                                    }}
                                    className="cursor-pointer absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Next image"
                                >
                                    <PaginationNextIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <div className="absolute bottom-[12px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                    {Array.from({ length: safeLen }).map((_, idx) => (
                                        <span
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={idx}
                                            className={`h-[7px] w-[7px] rounded-full transition-colors ${idx === imgIndex ? 'bg-[#000]' : 'bg-[rgba(255,255,255,0.9)]'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>


                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-[20px]">
                    <div className="flex items-start justify-between gap-[12px]">
                        <div className="min-w-0">
                            {!isRentalItem ? (
                                <p className="mb-[10px] text-[20px] font-[Inter-Bold] text-[#2b2d2e]">
                                    {price !== '' ? `AED ${formatPriceAbbreviated(price)}` : ''}
                                </p>
                            ) : null}
                            <div className="flex-wrap flex items-center [&>*+*]:before:content-['•'] [&>*+*]:before:mx-2 [&>*+*]:before:text-[#23262A]">
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A] truncate">
                                    {subtitle}
                                </p>
                                {/* <p className="text-[14px] font-[Inter-Medium] text-[#23262A] truncate">
                                    {subtitle}
                                </p>
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A] truncate">
                                    {subtitle}
                                </p> */}
                            </div>
                        </div>
                        {!isRentalItem ? (
                            <div className="shrink-0">
                                <TagBadges item={item} />
                            </div>
                        ) : null}
                    </div>
                    {!isRentalItem ? (
                        <p className="w-full truncate text-[16px] font-[Inter-Regular] text-[#2b2d2e] leading-[20px] max-sm:w-[280px]">
                            {title}
                        </p>
                    ) : null}


                    {!isRentalItem ? (
                        <div className="flex items-center gap-[8px] max-sm:flex-wrap">
                            <div className="flex items-center gap-[4px]">
                                <Image src={calendar} alt="calendar" width={16} height={16} />
                                <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{year ? year : ''}</p>
                            </div>
                            <div className="flex items-center gap-[4px]">
                                <Image src={speedometer} alt="speedometer" width={16} height={16} />
                                <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{km ? `${km} km` : ''}</p>
                            </div>
                            <div className="flex items-center gap-[4px]">
                                <Image src={steerings} alt="steering" width={16} height={16} />
                                <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{steering || ''}</p>
                            </div>
                            <div className="flex items-center gap-[4px]">
                                <Image src={regional} alt="regional" width={16} height={16} />
                                <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{specs || ''}</p>
                            </div>
                        </div>
                    ) : null}

                    {isRentalItem ? (
                        <>
                            <div className="flex items-center gap-[12px] divide-x divide-[#8F8F8F] mb-[4px] max-sm:flex-wrap">
                                <p className="pr-[12px] text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{year ? year : ''}</p>
                                <p className="px-[12px] text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{km ? `${km} km` : ''}</p>
                                <p className="px-[12px] text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{steering || ''}</p>
                                <p className="px-[12px] text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{specs || ''}</p>
                            </div>
                            <p className="w-full truncate text-[16px] font-[Inter-Regular] text-[#2b2d2e] leading-[20px] max-sm:w-[280px]">
                                {title}
                            </p>
                            {weeklyPriceText || monthlyPriceText ? (
                                <div className="flex flex-wrap items-center gap-[18px] max-sm:flex-wrap">
                                    {weeklyPriceText ? (
                                        <div className="rounded-[4px] bg-[#F3F3F5] p-[12px]">
                                            <h4 className="mb-[4px] text-[14px] font-[Inter-Medium] text-[#2b2d2e]">
                                                {currency} <span className="text-[18px] font-[Inter-Bold]">{weeklyPriceText}</span> Weekly
                                            </h4>
                                            {weeklyKmText ? <p className="text-[14px] font-[Inter-Medium] text-[#2b2d2e]">{weeklyKmText}</p> : null}
                                        </div>
                                    ) : null}
                                    {monthlyPriceText ? (
                                        <div className="rounded-[4px] bg-[#F3F3F5] p-[12px]">
                                            <h4 className="mb-[4px] text-[14px] font-[Inter-Medium] text-[#2b2d2e]">
                                                {currency} <span className="text-[18px] font-[Inter-Bold]">{monthlyPriceText}</span> Monthly
                                            </h4>
                                            {monthlyKmText ? <p className="text-[14px] font-[Inter-Medium] text-[#2b2d2e]">{monthlyKmText}</p> : null}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {minimumRentalText || insuranceText ? (
                                <div className="flex flex-wrap items-center gap-[18px] text-[14px] font-[Inter-Regular] text-[#2b2d2e]">
                                    {minimumRentalText ? (
                                        <p className="flex items-center gap-[6px]">
                                            <Image src={calendarmonth} alt="calendar" width={16} height={16} />
                                            {minimumRentalText}
                                        </p>
                                    ) : null}
                                    {insuranceText ? (
                                        <p className="flex items-center gap-[6px]">
                                            <Image src={verifiedshield} alt="verified" width={16} height={16} />
                                            {insuranceText}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    ) : null}

                    <div className="flex items-center justify-between gap-[12px]">
                        <div className="flex items-center gap-[6px] min-w-0">
                            <Image src={map} alt="location" width={12} height={12} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e] truncate">{location}</p>
                        </div>
                        {isRentalItem && agencyLogo ? (
                            <Image
                                src={agencyLogo}
                                alt={agencyName || 'Agency'}
                                width={70}
                                height={40}
                                className="h-[40px] w-[70px] object-contain"
                                onErrorCapture={placeholderImage}
                            />
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
                shareUrl={absoluteUrl(detailHref || `/productdetail?slug=${encodeURIComponent(String(item?.slug || item?.id || ''))}&mode=motors`)}
                title={title || 'Listing'}
            />
        </div>
    )
}

function MotorCardRowCarOfWeek({ item, detailHref }) {
    const images = useMemo(() => getItemImages(item), [item])
    const thumbs = images.slice(0, 3)
    const photoCount = images.length
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const year = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Year'),
        item?.year,
        item?.model_year
    )
    const km = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Kilometers'),
        item?.km,
        item?.kilometers,
        item?.mileage
    )
    const steering = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Steering Side'),
        item?.steering_side,
        item?.steering
    )
    const specs = getFirstTruthy(
        getCustomFieldDisplayValue(item, 'Regional Specs'),
        item?.regional_specs,
        item?.specs_region,
        item?.gcc_specs
    )

    const location = getFirstTruthy(item?.location, item?.city, item?.state, item?.country)
    const title = item?.name || item?.title || ''
    const subtitle = buildMakeModelVariantText(item)
    const price = parsePrice(item)
    const description = item?.description || item?.short_description || title
    const agencyName = getFirstTruthy(item?.agency_name, item?.agency, item?.dealer_name, item?.listed_by)
    const agencyLogo = getFirstTruthy(item?.agencyLogo, item?.agency_image, item?.dealer_logo, item?.dealerLogo)

    return (
        <div className="border-b border-[rgba(143,143,143,0.18)] py-[18px]">
            <div className="flex items-start gap-[22px] max-sm:flex-col">
                <div className="w-[282px] max-w-[282px] flex-shrink-0 max-sm:w-full">
                    <div className="relative overflow-hidden rounded-t-[12px]">
                        <Image
                            src={images[0] || '/assets/img/car.png'}
                            alt={title}
                            width={360}
                            height={190}
                            className="h-[190px] w-full object-cover"
                            onErrorCapture={placeholderImage}
                        />



                        {/* Gallery heart icon */}
                        <div className='absolute right-[12px] top-[6px] flex items-center gap-[4px]'>
                            <button
                                type="button"
                                className="cursor-pointer"
                                aria-label="Share listing"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsShareOpen(true)
                                }}
                            >
                                <SliderShareIcon className="text-white" />
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

                        {/* {photoCount ? (
                            <div className="absolute bottom-[10px] left-[10px] rounded-[6px] bg-[rgba(0,0,0,0.35)] px-[8px] py-[4px]">
                                <p className="text-[12px] font-[Inter-SemiBold] text-white">{photoCount}</p>
                            </div>
                        ) : null} */}
                    </div>

                    {thumbs.length ? (
                        <div className="mt-[10px] grid grid-cols-3 gap-[8px]">
                            {thumbs.map((src, idx) => (
                                <div key={`${src}-${idx}`} className="relative overflow-hidden rounded-b-[12px]">
                                    <Image
                                        src={src || '/assets/img/car.png'}
                                        alt=""
                                        width={110}
                                        height={70}
                                        className="h-[80px] w-full object-cover"
                                        onErrorCapture={placeholderImage}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-[24px]">
                    <div className="flex items-start justify-between gap-[12px]">
                        <div className="flex flex-col gap-[14px]">
                            <p className="text-[20px] font-[Inter-Bold] text-[#2b2d2e]">
                                {price !== '' ? `AED ${formatPriceAbbreviated(price)}` : ''}
                            </p>
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">
                                {subtitle}
                            </p>
                        </div>

                        <div className="shrink-0">
                            <p className="rounded-[6px] bg-[linear-gradient(95.78deg,_rgb(38,166,154)_2.35%,_rgb(19,78,74)_95.78%)] p-[3px_5px] text-[10px] font-[Inter-Bold] text-white uppercase">
                                CAR OF THE WEEK
                            </p>
                        </div>
                    </div>

                    <p className="w-full truncate text-[16px] font-[Inter-Regular] text-[#2b2d2e] leading-[20px] max-sm:w-[280px]">
                        {title}
                    </p>

                    <div className="flex items-center gap-[8px] max-sm:flex-wrap">
                        <div className="flex items-center gap-[4px]">
                            <Image src={calendar} alt="calendar" width={16} height={16} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{year ? year : ''}</p>
                        </div>
                        <div className="flex items-center gap-[4px]">
                            <Image src={speedometer} alt="speedometer" width={16} height={16} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{km ? `${km} km` : ''}</p>
                        </div>
                        <div className="flex items-center gap-[4px]">
                            <Image src={steerings} alt="steering" width={16} height={16} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{steering || ''}</p>
                        </div>
                        <div className="flex items-center gap-[4px]">
                            <Image src={regional} alt="regional" width={16} height={16} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e]">{specs || ''}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-[6px]">
                        <Image src={map} alt="location" width={12} height={12} />
                        <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e] truncate">{location}</p>
                    </div>

                    {agencyName ? (
                        <div className="flex items-center justify-between gap-[12px]">
                            <div className="flex flex-col gap-[4px]">
                                <p className="text-[12px] font-[Inter-Regular] text-[#666]">Listed by</p>
                                <p className="text-[16px] font-[Inter-SemiBold] text-[#000]">{agencyName}</p>
                            </div>
                            {agencyLogo ? (
                                <Image
                                    src={agencyLogo}
                                    alt=""
                                    width={56}
                                    height={56}
                                    className="h-[56px] w-[56px] rounded-full object-cover"
                                />
                            ) : null}
                        </div>
                    ) : null}
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
                shareUrl={absoluteUrl(detailHref || `/productdetail?slug=${encodeURIComponent(String(item?.slug || item?.id || ''))}&mode=motors`)}
                title={title || 'Listing'}
            />
        </div>
    )
}

export default function MotorsCard({ perPage = 15, onItemsTotalChange }) {
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const pathname = usePathname()
    const motorsPathQuery = getMotorsListingQueryFromPathname(pathname)
    const sourceMode = (searchParams?.get('mode') || motorsPathQuery?.mode || '').toLowerCase()
    const subSlug = (
        searchParams?.get('category_slug') ||
        searchParams?.get('slug') ||
        motorsPathQuery?.slug ||
        ''
    ).toLowerCase()
    const itemLabel = (searchParams?.get('item') || motorsPathQuery?.item || '').toLowerCase()
    const listingItemRaw = useMemo(
        () =>
            resolveMotorsListingItemLabel({
                pathname,
                categorySlug: subSlug,
                itemParam: searchParams?.get('item') || motorsPathQuery?.item || '',
            }),
        [pathname, subSlug, searchParams, motorsPathQuery?.item]
    )

    const RENTAL_ITEM_LABELS = new Set([
        'economy cars',
        'suv rentals',
        'luxury rentals',
        'monthly rentals',
        'daily rentals',
        'chauffeur service',
    ])

    const isRentalMode =
        sourceMode.includes('rent') ||
        subSlug.includes('rent') ||
        subSlug.includes('rental') ||
        itemLabel.includes('rent') ||
        itemLabel.includes('rental') ||
        RENTAL_ITEM_LABELS.has(itemLabel.replace(/\s+/g, ' ').trim())

    const [items, setItems] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const fetchPage = async (page) => {
        if (!sourceMode) return
        setIsLoading(true)
        try {
            const demoTotalPages = Math.max(1, Math.ceil(DEMO_MOTORS_ITEMS.length / perPage))
            const setDemo = (p) => {
                const safePage = Math.max(1, Math.min(demoTotalPages, p))
                const start = (safePage - 1) * perPage
                const slice = DEMO_MOTORS_ITEMS.slice(start, start + perPage)
                setItems(slice)
                setCurrentPage(safePage)
                setLastPage(demoTotalPages)
                onItemsTotalChange?.(DEMO_MOTORS_ITEMS.length)
            }

            const city = searchParams?.get('city')?.trim() || undefined
            const minPrice = searchParams?.get('minPrice')?.trim() || undefined
            const maxPrice = searchParams?.get('maxPrice')?.trim() || undefined
            const searchText =
                searchParams?.get('search')?.trim() ||
                searchParams?.get('keyword')?.trim() ||
                undefined
            const makeId = searchParams?.get('make_id')?.trim() || undefined
            const modelId = searchParams?.get('model_id')?.trim() || undefined
            const makeModelParam = searchParams?.get('make_model')?.trim() || undefined
            const filterQuery = collectFilterParamsFromSearchParams(searchParams)
            const sortBy = searchParams?.get('sort_by')?.trim() || 'new-to-old'
            const params = {
                page,
                sort_by: sortBy,
                category_slug: subSlug || sourceMode,
                per_page: perPage,
                limit: perPage,
                city,
                min_price: minPrice,
                max_price: maxPrice,
                search: searchText,
                make_id: makeId,
                model_id: modelId,
                make_model: makeModelParam,
                filterQuery,
            }
            const run = async (nextParams) => {
                const res = await allItemApi.getItems(nextParams)
                const data = res?.data
                if (!data || data.error === true) return { list: [], inner: {} }
                const inner = data?.data || {}
                const list = inner?.data || []
                return { list: Array.isArray(list) ? list : [], inner }
            }

            const first = await run(params)
            let list = first.list
            let inner = first.inner

            if (!list || list.length === 0) {
                setDemo(page)
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
            const demoTotalPages = Math.max(1, Math.ceil(DEMO_MOTORS_ITEMS.length / perPage))
            setItems(DEMO_MOTORS_ITEMS.slice(0, perPage))
            setCurrentPage(1)
            setLastPage(demoTotalPages)
            onItemsTotalChange?.(DEMO_MOTORS_ITEMS.length)
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
        const start = Math.max(1, Math.min(totalPages - (VISIBLE_PAGE_BUTTONS - 1), currentPage - 0))
        const end = Math.min(totalPages, start + VISIBLE_PAGE_BUTTONS - 1)
        const arr = []
        for (let p = start; p <= end; p++) arr.push(p)
        return arr
    }, [currentPage, totalPages])

    return (
        <div className="w-full">
            <div className="">
                {isLoading ? (
                    <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading...</div>
                ) : items.length ? (
                    <div>
                        {items.map((item, index) => {
                            const isCarOfWeekRow =
                                getTagState(item).isCarOfWeek && !isRentalListing(item, isRentalMode)
                            let detailHref = `/productdetail?slug=${encodeURIComponent(String(item?.slug || item?.id || ''))}&mode=motors`
                            if (listingItemRaw) {
                                detailHref += `&item=${encodeURIComponent(listingItemRaw)}`
                            }
                            if (isCarOfWeekRow) {
                                detailHref += '&carOfWeek=1'
                            }
                            return (
                            <div key={item?.id || item?.slug}>
                                <Link href={detailHref} prefetch={false}>
                                    {isCarOfWeekRow ? (
                                        <MotorCardRowCarOfWeek item={item} detailHref={detailHref} />
                                    ) : (
                                        <MotorCardRow item={item} isRentalMode={isRentalMode} detailHref={detailHref} />
                                    )}
                                </Link>
                                {index === 1 ? <BookInspectionCard /> : null}
                                {index === 2 ? (
                                    <div className="flex flex-col gap-[14px] py-[12px]">
                                        {/* <CommonProjectCard /> */}
                                        <VerifiedMain showTickBadge={false} />
                                    </div>
                                ) : null}
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">No items found</div>
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
                                    <PaginationDoublePrevIcon className="rtl:rotate-180" fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Previous page"
                                >
                                    <PaginationSinglePrevIcon className="rtl:rotate-180" fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
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
                                    <PaginationSingleNextIcon className="rtl:rotate-180" fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Last page"
                                >
                                    <PaginationDoubleNextIcon className="rtl:rotate-180" fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

            </div>
        </div>
    )
}

