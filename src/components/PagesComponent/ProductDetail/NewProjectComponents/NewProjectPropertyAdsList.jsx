/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    FavouriteIcon,
    LocationIcon,
    GalleryIcon,
    PaginationDoublePrevIcon,
    PaginationDoubleNextIcon,
    PaginationSinglePrevIcon,
    PaginationSingleNextIcon,
    PaginationPrevIcon,
    PaginationNextIcon,
} from '@/components/CustomFile/icons'
import bed from '../../../../../public/assets/img/icons/bed.svg'
import bath from '../../../../../public/assets/img/icons/bath.svg'
import size from '../../../../../public/assets/img/icons/size.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import mailOutline from '../../../../../public/assets/img/icons/mailOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import verifiedicon from '../../../../../public/assets/img/icons/verifiedicon.svg'
import infoIcon from '../../../../../public/assets/img/icons/info.svg'
import client1 from '../../../../../public/assets/img/client.png'

const ADS_PER_PAGE = 2

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function formatMoney(val) {
    if (val === null || val === undefined || val === '') return ''
    const n = typeof val === 'number' ? val : Number(String(val).replace(/[^\d.]/g, ''))
    if (Number.isNaN(n)) return String(val)
    // Keep it close to screenshot formatting (commas + no decimals).
    const rounded = Math.round(n)
    return `AED ${rounded.toLocaleString('en-US')}`
}

function normalizeArray(maybe) {
    if (Array.isArray(maybe)) return maybe
    return []
}

function deriveHandoverLabel(ad) {
    const h = pickString(ad.handover, ad.handover_date, ad.handoverDate, ad.delivery, ad.handover_label)
    if (!h) return ''
    return h.includes('Q') ? `${h}` : `${h}`
}

function derivePaymentPlanLabel(ad) {
    const p = pickString(ad.payment_plan, ad.paymentPlan, ad.payment_plan_label, ad.payment_plan_text)
    if (!p) return ''
    // Screenshot style: “Payment Plan 70/30” (with 50/50 etc.)
    if (p.toLowerCase().includes('payment')) return p
    return `${p}`
}

function deriveTransactionChips(ad) {
    const tx = pickString(ad.transaction_type, ad.transactionType, ad.sale_type, ad.saleType, ad.off_plan_type, ad.resale_type)
    const t = tx.toLowerCase()
    // screenshot shows 2 chips after Verified
    if (t.includes('resale')) return ['Off-Plan', 'Resale']
    if (t.includes('initial')) return ['Off-Plan', 'Initial Sale']
    return ['Off-Plan', pickString(ad.secondary_chip, 'Resale')]
}

function adMatchesTab(ad, activeTab) {
    const tab = String(activeTab || 'All').trim().toLowerCase()
    if (!tab || tab === 'all') return true

    const tx = pickString(
        ad.transaction_type,
        ad.transactionType,
        ad.sale_type,
        ad.saleType,
        ad.off_plan_type,
        ad.resale_type
    ).toLowerCase()

    const listedBy = pickString(ad.listed_by, ad.listedBy, ad.seller_type, ad.sellerType).toLowerCase()
    const developerFlag = Boolean(ad?.is_developer || ad?.developer_listing || ad?.listed_by_developer)

    if (tab.includes('resale')) {
        return tx.includes('resale')
    }
    if (tab.includes('initial')) {
        return tx.includes('initial')
    }
    if (tab.includes('developer')) {
        return developerFlag || listedBy.includes('developer') || tx.includes('developer')
    }
    return true
}

const DEMO_ADS = [
    {
        id: 1,
        slug: 'binghatti-hillcrest-unit-1',
        verified_user: true,
        transaction_type: 'resale',
        images: ['/assets/img/property/2.png', '/assets/img/property/3.png', '/assets/img/property/1.png'],
        price: 690000,
        property_type: 'Apartment',
        beds: 'Studio',
        baths: '1',
        sqft: '402',
        roiLabel: 'HIGH ROI | PREMIUM INVEST | HIGH FLOOR',
        handover: 'Q2 2026',
        payment_plan: '70/30',
        location: 'Binghatti Hillcrest, Arjan, Dubai',
        clientLogoText: 'Erudite.',
        premium: true,
    },
    {
        id: 2,
        slug: 'binghatti-hillcrest-unit-2',
        verified_user: true,
        transaction_type: 'initial',
        images: ['/assets/img/property/3.png', '/assets/img/property/2.png', '/assets/img/property/1.png'],
        price: 1357799,
        property_type: 'Apartment',
        beds: '1 Bed',
        baths: '1',
        sqft: '909',
        roiLabel: 'Spacious Two-Bedroom Apartment',
        handover: 'Q2 2026',
        payment_plan: '70/30',
        location: 'Binghatti Hillcrest, JVC District 10, Jumeirah Village',
        clientLogoText: 'Erudite.',
        premium: true,
    },
    {
        id: 3,
        slug: 'binghatti-hillcrest-unit-3',
        verified_user: true,
        transaction_type: 'developer',
        listed_by: 'Developer',
        images: ['/assets/img/property/1.png', '/assets/img/property/2.png', '/assets/img/property/3.png'],
        price: 2009719,
        property_type: 'Apartment',
        beds: '2 beds',
        baths: '3',
        sqft: '1109',
        roiLabel: '10+ Premium Amenities | Family Friendly Environment',
        handover: 'Q4 2026',
        payment_plan: '50/50',
        location: 'Binghatti Hillcrest, Arjan, Dubai',
        clientLogoText: 'Binghatti',
        premium: false,
    },
]

export default function NewProjectPropertyAdsList({ productData = {}, activeTab = 'All', onTabChange }) {
    const [currentPage, setCurrentPage] = useState(1)

    const ads = useMemo(() => {
        const fromData = normalizeArray(productData?.property_ads || productData?.ads || productData?.items)
        if (fromData.length) return fromData
        return DEMO_ADS
    }, [productData])

    const filteredAds = useMemo(() => {
        return ads.filter((ad) => adMatchesTab(ad, activeTab))
    }, [activeTab, ads])

    const totalPages = Math.max(1, Math.ceil(filteredAds.length / ADS_PER_PAGE))

    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab, filteredAds.length])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    const pagedAds = useMemo(() => {
        const start = (currentPage - 1) * ADS_PER_PAGE
        return filteredAds.slice(start, start + ADS_PER_PAGE)
    }, [currentPage, filteredAds])

    return (
        <div className="w-full bg-white ">
            <div className="flex flex-col gap-5">
                {pagedAds.map((ad, idx) => (
                    <NewProjectPropertyAdCard
                        key={ad.id ?? idx}
                        ad={ad}
                        onDeveloperClick={() => {
                            if (onTabChange) onTabChange('Direct From Developer')
                        }}
                    />
                ))}
                {!filteredAds.length ? (
                    <div className="rounded-[10px] border border-[rgba(143,143,143,0.25)] bg-white p-6 text-[14px] font-[Inter-Regular] text-[#666]">
                        No property ads found for this tab.
                    </div>
                ) : null}

                {filteredAds.length > 0 && totalPages > 1 ? (
                    <div className="mt-[20px] pb-[16px] flex items-center justify-center">
                        <div className="w-full flex justify-center items-center gap-[10px]">
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="First page"
                                >
                                    <PaginationDoublePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Previous page"
                                >
                                    <PaginationSinglePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                                </button>
                            </div>
                            <div className="flex items-center gap-[10px]">
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const page = idx + 1
                                    const active = page === currentPage
                                    return (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`rounded-[6px] w-[40px] h-[40px] flex items-center justify-center cursor-pointer text-[12px] font-[Inter-Medium] border ${active
                                                ? 'bg-[#23262A] text-white border-[#23262A]'
                                                : 'bg-white text-[#23262A] border-[rgba(143,143,143,0.35)]'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Next page"
                                >
                                    <PaginationSingleNextIcon fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
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
        </div>
    )
}

function NewProjectPropertyAdCard({ ad, onDeveloperClick }) {
    const images = normalizeArray(ad.images || ad.image_gallery || ad.image_gallery_images || ad.image_urls || [])
    const displayImages = images.length ? images : ['/assets/img/property/1.png']

    const [isSaved, setIsSaved] = useState(false)
    const [imgIndex, setImgIndex] = useState(0)

    const verified = Boolean(ad.verified_user ?? ad.verified ?? ad.is_verified_user ?? ad.is_verified_user ?? false)
    const premium = Boolean(ad.premium ?? ad.isPremium)
    const title = pickString(ad.title, ad.name, ad.listing_title, ad.listingTitle)
    const propertyType = pickString(ad.property_type, ad.type, ad.category_name, ad.propertyType, 'Apartment')
    const beds = pickString(ad.beds, ad.bedrooms, ad.bedrooms_count, ad.bedroom)
    const baths = pickString(ad.baths, ad.bathrooms, ad.bath_rooms, ad.bathroom)
    const sqft = pickString(ad.sqft, ad.sqft_count, ad.area_sqft, ad.area, ad.size)
    const location = pickString(ad.location, ad.address, ad.city, ad.state, ad.country)
    const roiLabel = pickString(ad.roi_label, ad.roi, ad.high_roi, ad.roiText, ad.description)

    const handoverLabel = deriveHandoverLabel(ad)
    const paymentPlanLabel = derivePaymentPlanLabel(ad)

    const txChips = deriveTransactionChips(ad)
    const listedBy = pickString(ad.listed_by, ad.listedBy, ad.seller_type, ad.sellerType).toLowerCase()
    const isDeveloperListing =
        Boolean(ad?.is_developer || ad?.developer_listing || ad?.listed_by_developer) ||
        listedBy.includes('developer') ||
        String(ad?.transaction_type || '').toLowerCase().includes('developer')

    const priceText = ad.price ? formatMoney(ad.price) : formatMoney(ad.amount)
    const href = `/productdetail?slug=${encodeURIComponent(String(ad.slug || ad.id || ''))}&mode=property`
    const canPrev = imgIndex > 0
    const canNext = imgIndex < displayImages.length - 1
    const activeImage = displayImages[imgIndex] || displayImages[0]
    const dots = Array.from({ length: Math.min(5, displayImages.length || 1) })

    return (
        <div className="w-full overflow-hidden rounded-[16px] border border-[#F7F7F8] bg-white shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-stretch max-sm:flex-col">
                <div className="relative w-[350px] max-w-[350px] shrink-0 max-sm:w-full">
                    <Link href={href} prefetch={false} className="block">
                        <div className="relative overflow-hidden rounded-[12px_0px_0px_12px] bg-[#F5F5F5]">
                            <Image
                                src={activeImage}
                                alt={title || propertyType}
                                width={350}
                                height={300}
                                className="h-[300px] w-full object-cover"
                                onErrorCapture={() => { }}
                            />

                            <div className="absolute left-[10px] top-[10px] z-[2] flex items-center gap-[6px]">
                                {verified ? (
                                    <div className="flex items-center gap-[4px] rounded-[6px] bg-white px-[6px] py-[3px]">
                                        <Image src={verifiedicon} alt="verified" width={14} height={14} />
                                        <p className="text-[12px] font-[Inter-Regular] text-[#2b2d2e]">Verified</p>
                                    </div>
                                ) : null}
                                <div className="rounded-[6px] bg-[#fff] flex items-center ">
                                    <h4 className="text-[12px] font-[Inter-Regular] text-[#23262A] p-[3px_6px]">{txChips[0] || 'Off-Plan'}</h4>
                                    <p
                                        className={`rounded-[6px] p-[3px_6px] text-[12px] font-[Inter-Regular] text-[#fff] ${String(txChips[1] || '').toLowerCase().includes('initial')
                                            ? 'bg-[#e96b2b]'
                                            : 'bg-[#26a69a]'
                                            }`}
                                    >
                                        {txChips[1] || 'Resale'}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute right-[12px] top-[10px] z-[2]">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setIsSaved((v) => !v)
                                    }}
                                    className="cursor-pointer"
                                    aria-label="Favourite"
                                >
                                    <FavouriteIcon
                                        className={`w-[24px] h-[24px] ${isSaved ? 'text-[#DC0000]' : 'text-white'}`}
                                        fill={isSaved ? '#DC0000' : '#fff'}
                                        fillOpacity={isSaved ? '1' : '0.9'}
                                        stroke={isSaved ? '#DC0000' : '#fff'}
                                    />
                                </button>
                            </div>

                            <div className="absolute bottom-[10px] left-[10px] z-[2] rounded-[6px] bg-[rgba(0,0,0,0.35)] px-[6px] py-[2px]">
                                <p className="flex items-center gap-[6px] text-[12px] font-[Inter-Medium] text-white">
                                    <GalleryIcon className="h-[14px] w-[14px]" />
                                    {imgIndex + 1}/{displayImages.length}
                                </p>
                            </div>

                            {displayImages.length > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setImgIndex((p) => Math.max(0, p - 1))
                                        }}
                                        className="disabled:opacity-0 disabled:cursor-not-allowed absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)]"
                                        aria-label="Previous image"
                                    >
                                        <PaginationPrevIcon className="h-[12px] w-[12px]" stroke="#23262A" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setImgIndex((p) => Math.min(displayImages.length - 1, p + 1))
                                        }}
                                        className="disabled:opacity-0 disabled:cursor-not-allowed absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)]"
                                        aria-label="Next image"
                                    >
                                        <PaginationNextIcon className="h-[12px] w-[12px]" stroke="#23262A" />
                                    </button>
                                    <div className="absolute bottom-[14px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                        {dots.map((_, idx) => (
                                            <span
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={idx}
                                                className={`h-[7px] w-[7px] rounded-full ${idx === Math.min(imgIndex, dots.length - 1)
                                                    ? 'bg-white'
                                                    : 'bg-[rgba(255,255,255,0.55)]'
                                                    }`}
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
                        <div className="w-full flex flex-col gap-[10px]">
                            <div className="flex items-center justify-between gap-[10px]">
                                <h4 className="text-[18px] font-[Inter-Medium] text-[#23262A] truncate">
                                    AED <span className="text-[22px] font-[Inter-SemiBold]">
                                        {priceText || '—'}
                                    </span>
                                </h4>
                                {isDeveloperListing ? (
                                    <button
                                        type="button"
                                        onClick={() => onDeveloperClick?.()}
                                        className="cursor-pointer rounded-[6px] bg-[#fff3e0] p-[3px_7px] text-[10px] font-[Inter-Bold] text-[#ffa726] uppercase"
                                    >
                                        DEVELOPER
                                    </button>
                                ) : premium ? (
                                    <p className="rounded-[6px] bg-[#fff3e0] p-[3px_5px] text-[10px] font-[Inter-Bold] text-[#ffa726] uppercase">
                                        PREMIUM
                                    </p>
                                ) : (
                                    <span className="h-[18px]" />
                                )}
                            </div>
                            <p className="text-[16px] font-[Inter-Medium] text-[#23262A] truncate">{propertyType}</p>

                            <div className="flex flex-wrap items-center gap-[12px]">
                                <div className="flex items-center gap-[10px]">
                                    <Image src={bed} alt="bed" width={16} height={16} />
                                    <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">{beds}</p>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <Image src={bath} alt="bath" width={16} height={16} />
                                    <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">{baths} Bath</p>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <Image src={size} alt="size" width={16} height={16} />
                                    <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">{sqft} sqft</p>
                                </div>
                            </div>

                            <p className="text-[16px] font-[Inter-Medium] text-[#23262A]">
                                {roiLabel || 'HIGH ROI | PREMIUM INVEST | HIGH FLOOR'}
                            </p>

                            <div className="flex flex-wrap items-center gap-[10px]">
                                {handoverLabel ? (
                                    <p className="rounded-[6px] bg-[#f7f7f8] px-[12px] py-[6px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                        Handover <span className="font-[Inter-SemiBold]"> {handoverLabel}</span>
                                    </p>
                                ) : null}
                                {paymentPlanLabel ? (
                                    <div className="rounded-[6px] bg-[#f7f7f8] px-[12px] py-[6px] text-[14px] font-[Inter-Regular] text-[#23262A] flex items-center gap-[8px]">
                                        <p className="inline-flex items-center gap-[8px]">
                                            Payment Plan <span className="font-[Inter-SemiBold]"> {paymentPlanLabel}</span>
                                        </p>
                                        <Image src={infoIcon} alt="info" width={16} height={16} />
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-[6px] min-w-0">
                                <LocationIcon className="w-[18px] h-[18px]" stroke="#000" />
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A] truncate">{location}</p>
                            </div>

                            <div className="flex items-center justify-between gap-[10px] max-sm:flex-col max-sm:items-start">
                                <div className="flex flex-wrap items-center gap-[10px]">
                                    <button type="button" className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#3a88ef14] px-[14px] py-[10px]">
                                        <Image src={mailOutline} alt="email" width={18} height={18} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">Email</p>
                                    </button>
                                    <button type="button" className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#ffedea80] px-[14px] py-[10px]">
                                        <Image src={phoneOutline} alt="phone" width={18} height={18} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">Call</p>
                                    </button>
                                    <button type="button" className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#43bb3f1a] px-[14px] py-[10px]">
                                        <Image src={whatsapp} alt="WhatsApp" width={18} height={18} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">WhatsApp</p>
                                    </button>
                                </div>
                                <div className="">
                                    <Image src={client1} alt="client" width={80} height={50} className="w-[80px] h-[50px] object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

