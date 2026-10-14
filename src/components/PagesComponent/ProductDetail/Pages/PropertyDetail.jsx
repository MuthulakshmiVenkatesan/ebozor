/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MapComponent from '../ClassifiedComponents/MapComponent'
import Image from 'next/image'
import info from '../../../../../public/assets/img/icons/info.svg'
import bed from '../../../../../public/assets/img/icons/bed.svg'
import bath from '../../../../../public/assets/img/icons/bath.svg'
import size from '../../../../../public/assets/img/icons/size.svg'
import { FavouriteIcon, ShareIcon, LocationIcon, ReportAdFlagIcon, RightArrowIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import PropertyBanner from '../components/PropetyBanner'
import PropertyProfile from '../PropertyComponents/PropertyProfile'
import AmentiesSection from '../PropertyComponents/AmentiesSection'
import MortgageCalculator from '../PropertyComponents/MortgageCalculator'
import Link from 'next/link'
import validatecheck from '../../../../../public/assets/img/icons/validatecheck.svg'
import SimilarProducts from '../components/SimilarProducts'
import ReportListingModal from '../components/ReportListingModal'
import mailOutline from '../../../../../public/assets/img/icons/mailOutline.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import Email from '@/components/PagesComponent/CommonComponents/Email'
import Call from '@/components/PagesComponent/CommonComponents/Call'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup' 
import { manageFavouriteApi } from '@/utils/api'
import LoginModal from '@/components/Auth/LoginModal'
import { isLogin } from '@/utils'
import { buildWhatsAppMeUrl } from '@/utils/whatsapp'

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

function extractCustomFieldDisplay(row) {
    const nested = row?.custom_field_value?.value
    if (nested !== undefined && nested !== null) {
        if (Array.isArray(nested)) return nested.filter(Boolean).join(', ') || ''
        return String(nested)
    }
    const v = row?.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
    return v != null && v !== '' ? String(v) : ''
}

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => String(n).toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    return extractCustomFieldDisplay(row)
}

function formatDisplayDate(value) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toPlainDescription(raw) {
    if (!raw) return ''
    const str = String(raw)
    return str
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function normalizePurposeLabel(value) {
    const v = String(value || '').trim().toLowerCase()
    if (!v) return ''
    if (v.includes('rent')) return 'For Rent'
    if (v.includes('sale') || v.includes('sell')) return 'For Sale'
    return String(value)
}

function parseCoordinate(v) {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}

function formatMoney(val) {
    if (val === '' || val === null || val === undefined) return ''
    const n = typeof val === 'number' ? val : Number(String(val).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n !== 0) return n.toLocaleString('en-US')
    return String(val)
}

function calcMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 12
    const months = years * 12
    if (monthlyRate <= 0 || months <= 0) return principal / Math.max(months, 1)
    const top = principal * monthlyRate * Math.pow(1 + monthlyRate, months)
    const bottom = Math.pow(1 + monthlyRate, months) - 1
    return bottom === 0 ? 0 : top / bottom
}

function formatCompactPayment(value) {
    const n = Number(value || 0)
    if (n >= 1000) return `${Math.round(n / 1000)}K`
    return Math.round(n).toLocaleString('en-US')
}

function DetailRow({ label, value }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-x-[24px] gap-y-[4px]">
            <h4 className="min-w-0 shrink-0 text-[16px] font-[Inter-Regular] text-[#23262A]">{label}</h4>
            <h3 className="min-w-0 text-right text-[16px] font-[Inter-SemiBold] text-[#23262A]">{value}</h3>
        </div>
    )
}


function PropertyValidatedPair({ label, value }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-x-[24px] gap-y-[4px">
            <span className="min-w-0 shrink-0 text-[16px] font-[Inter-Regular] text-[#23262A]">{label}</span>
            <span className="min-w-0 text-right text-[16px] font-[Inter-SemiBold] text-[#23262A]">{value}</span>
        </div>
    )
}

function PropertyInfoSection({ title, children }) {
    return (
        <div className="">
            <div className="mb-[24px] flex items-center gap-[12px]">
                <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A]">{title}</h2>
                <Image src={validatecheck} alt="validatecheck" width={24} height={24} />
            </div>
            {children}
        </div>
    )
}

export default function PropertyDetail({ productData, slug }) {
    const item = productData || {}
    const searchParams = useSearchParams()
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isLocationMapOpen, setIsLocationMapOpen] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [showFloatingHeader, setShowFloatingHeader] = useState(false)
    const mortgageSectionRef = useRef(null)
    const [isEmailOpen, setIsEmailOpen] = useState(false)
    const [isCallOpen, setIsCallOpen] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [isMailSentOpen, setIsMailSentOpen] = useState(false)
    const openSentMailModal = () => {
        setIsLoginModalOpen(false)
        setIsMailSentOpen(true)
    }
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
    const handleOpenSaveAdsWithLoginCheck = () => {
        if (isLogin()) {
            handleOpenSaveAds()
            return
        }
        setIsLoginModalOpen(true)
    }

    const title = useMemo(
        () => firstTruthy(item?.title, item?.name, item?.listing_title, 'Property listing'),
        [item]
    )

    const fields = useMemo(() => {
        const rawQueryItem = firstTruthy(searchParams?.get('item'))
        const queryPurpose = firstTruthy(searchParams?.get('purpose'))
        const queryPropertyType = firstTruthy(searchParams?.get('propertyType'))
        /** Listing filters use `item=property-for-sale` / `property-for-rent` — not a property type label. */
        const listingNavSlugs = new Set(['property-for-sale', 'property-for-rent'])
        const queryItemForType =
            rawQueryItem && !listingNavSlugs.has(String(rawQueryItem).toLowerCase().trim())
                ? rawQueryItem
                : ''
        const inferredPurposeFromItem = normalizePurposeLabel(rawQueryItem)
        const queryPurposeLabel = normalizePurposeLabel(queryPurpose)

        const type = firstTruthy(
            item?.category?.name,
            item?.property_type,
            item?.propertyType,
            item?.type,
            queryPropertyType,
            queryItemForType,
            customFieldValue(item, 'Type', 'Property Type')
        )
        const furnishing = firstTruthy(
            customFieldValue(item, 'Is it furnished?'),
            item?.furnishing,
            item?.furnishing_status,
            customFieldValue(item, 'Furnishing')
        )
        const purpose = firstTruthy(
            queryPurposeLabel,
            item?.purpose,
            item?.listing_purpose,
            item?.transaction_type,
            inferredPurposeFromItem,
            customFieldValue(item, 'Purpose')
        )
        const updatedRaw = firstTruthy(item?.updated_at, item?.updatedAt, item?.modified_at)
        const updated = formatDisplayDate(updatedRaw)
        const postedOn = formatDisplayDate(item?.created_at)

        return { type, furnishing, purpose, updated, postedOn }
    }, [item, searchParams])

    const fullDescription = useMemo(() => {
        return toPlainDescription(
            firstTruthy(
                item?.description,
                item?.details,
                item?.content,
                item?.body,
                customFieldValue(item, 'Description')
            )
        )
    }, [item])

    const fallbackDescription = `Discover a well-located property that combines comfort, convenience, and value.

This unit offers a practical layout with bright living spaces, quality finishing, and easy access to key city destinations including schools, retail, and transport links.

Perfect for both end-users and investors looking for strong long-term potential in a high-demand area.`

    const effectiveDescription = fullDescription || fallbackDescription
    const hasLongDescription = effectiveDescription.length > 200
    const visibleDescription =
        hasLongDescription && !isDescriptionExpanded
            ? `${effectiveDescription.slice(0, 200).trim()}...`
            : effectiveDescription
    const locationText = useMemo(() => {
        const addr = firstTruthy(item?.address, customFieldValue(item, 'Address', 'Location'))
        const city = item?.city
        const state = item?.state
        const country = item?.country
        const parts = [addr, city, state, country].filter((p) => p != null && String(p).trim() !== '')
        if (parts.length) return parts.join(', ')
        return firstTruthy(item?.location, item?.full_address)
    }, [item])

    const latitude = parseCoordinate(firstTruthy(item?.latitude, item?.lat, item?.location_lat))
    const longitude = parseCoordinate(firstTruthy(item?.longitude, item?.long, item?.lng, item?.location_lng))

    const beds = firstTruthy(
        customFieldValue(item, 'Bedrooms'),
        item?.beds,
        item?.bedrooms,
        item?.bed_rooms,
        item?.bedroom
    )
    const baths = firstTruthy(
        customFieldValue(item, 'Bathrooms'),
        item?.baths,
        item?.bathrooms,
        item?.bath_rooms,
        item?.bathroom
    )
    const sqftRaw = firstTruthy(
        customFieldValue(item, 'Size(Sqft)'),
        item?.sqft,
        item?.area_sqft,
        item?.size_sqft,
        item?.area,
        item?.size
    )
    const sqft = sqftRaw ? formatMoney(sqftRaw) : ''

    const rentIsPaid = customFieldValue(item, 'Rent is paid')
    const listedBy = customFieldValue(item, 'Listed By')

    const rawPrice = firstTruthy(item?.price, item?.amount, item?.rent, item?.yearly_rent)
    const priceText = formatMoney(rawPrice)
    const priceUnit = firstTruthy(item?.price_unit, item?.rent_unit, item?.billing_period, 'Yearly')
    const moreInfoRows = [
        {
            label: 'Permit Number',
            value: firstTruthy(
                item?.permit_number,
                customFieldValue(item, 'Property permit number', 'Permit Number')
            ) || '-',
            withInfoIcon: true,
        },
        {
            label: 'Zone Name',
            value: firstTruthy(item?.zone_name, customFieldValue(item, 'Zone Name')) || '-',
            withInfoIcon: true,
        },
        {
            label: 'Registered Agency',
            value: firstTruthy(
                item?.registered_agency,
                item?.agency_name,
                customFieldValue(item, 'Registered Agency')
            ) || '-',
            withInfoIcon: true,
        },
        {
            label: 'RERA',
            value: firstTruthy(item?.rera_number, item?.rera, customFieldValue(item, 'RERA')) || '-',
            withInfoIcon: true,
        },
        {
            label: 'Reference ID',
            value: firstTruthy(item?.reference_id, customFieldValue(item, 'Reference ID')) || '-',
            withInfoIcon: false,
        },
        {
            label: 'BRN (DLD)',
            value: firstTruthy(item?.brn_dld, item?.brn, customFieldValue(item, 'BRN (DLD)', 'BRN')) || '-',
            withInfoIcon: true,
        },
    ]
    const nearbyLinks = [
        'DAMAC Hills 2 (Akoya by DAMAC)',
        'DAMAC Lagoons',
        'The Valley by Emaar',
        'Mudon',
        'Arabian Ranches 3',
        'Tilal Al Ghaf',
        'DAMAC Hills',
        'Al Furjan',
        'Town Square',
        'Dubai South',
    ]
    const popularSearchLinks = [
        '3 Bedroom Townhouses for rent in La Rosa 2',
        'Townhouses for rent in La Rosa 2',
        'Villas for rent in La Rosa 2',
        'Properties for rent in La Rosa 2',
    ]
    const isForSale = String(fields.purpose || '').toLowerCase().includes('sale')
    const estimatedMonthlyPayment = useMemo(() => {
        const propertyPrice = Number(String(rawPrice || 0).replace(/[^\d.]/g, '')) || 0
        const principal = propertyPrice * 0.7
        const monthly = calcMonthlyPayment(principal, 0.0375, 25)
        return Math.max(0, Math.round(monthly))
    }, [rawPrice])

    const scrollToMortgageCalculator = () => {
        if (!mortgageSectionRef.current) return
        mortgageSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const agentName = firstTruthy(
        item?.user?.name,
        item?.agent_name,
        item?.agent?.name,
        item?.owner_name,
        'Benjamin Larrad'
    )
    const agentImage = firstTruthy(
        item?.user?.profile,
        item?.agent_image,
        item?.agent?.image,
        item?.agent?.avatar,
        item?.owner_image
    )
    const waLink = buildWhatsAppMeUrl(
        firstTruthy(item?.whatsapp, item?.whatsapp_number, item?.user?.mobile, item?.user?.phone),
        firstTruthy(item?.whatsapp_message, `Hi, I'm interested in ${title || 'this listing'}`)
    )

    useEffect(() => {
        const onScroll = () => {
            setShowFloatingHeader(window.scrollY > 300)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const validatedBuilding = useMemo(() => {
        const ownership = firstTruthy(
            item?.ownership,
            item?.title_deed,
            customFieldValue(item, 'Ownership')
        ) || 'Freehold'
        const parking = firstTruthy(
            item?.parking_available,
            item?.parking,
            customFieldValue(item, 'Parking Availability', 'Parking')
        ) || 'No'
        const balconySize = firstTruthy(
            item?.balcony_size,
            item?.balcony_sqft,
            customFieldValue(item, 'Balcony Size')
        ) || '342 sqft'
        const usage = firstTruthy(item?.usage, item?.property_usage, customFieldValue(item, 'Usage')) || 'Residential'
        const buildingName = firstTruthy(
            item?.building_name,
            item?.tower_name,
            customFieldValue(item, 'Building Name')
        ) || 'HALA RESIDENCE'
        const buildingArea = firstTruthy(
            item?.building_area,
            item?.building_area_sqft,
            customFieldValue(item, 'Building Area')
        ) || '104,497 sqft'
        const floors = firstTruthy(item?.floors, item?.total_floors, item?.number_of_floors, customFieldValue(item, 'Floors')) || '5'
        return { ownership, parking, balconySize, usage, buildingName, buildingArea, floors }
    }, [item])

    const detailSlug = slug || item?.slug || item?.id || ''
    const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
    const shareUrl = `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}`


    return (
        <>
            <div className="w-full">
                <PropertyBanner productData={productData} />

                <div className="grid grid-cols-[1fr_350px] gap-[20px] max-sm:grid-cols-1 products_grid">
                    <div className="min-w-0">
                        <div className="border-b border-[rgba(143,143,143,0.35)] pb-[20px]">
                            <div className="flex items-start justify-between gap-[16px] max-sm:flex-col">
                                <div className="min-w-0 flex flex-col gap-[10px]">
                                    <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">
                                        AED <span className="font-[Inter-Bold] text-[22px]">{priceText || '—'}</span>{' '}
                                        <span className="font-[Inter-Medium] tetx-[#3A3F47]">{priceUnit}</span>
                                    </h3>
                                    {isForSale ? (
                                        <div className="inline-flex w-fit items-center overflow-hidden gap-[10px]">
                                            <button
                                                type="button"
                                                onClick={scrollToMortgageCalculator}
                                                className="cursor-pointer inline-flex items-center gap-[2px] "
                                            >
                                                <h5 className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    Est. Payment AED <span className="font-[Inter-SemiBold]">{formatCompactPayment(estimatedMonthlyPayment)}/mo</span>
                                                </h5>
                                                <DownArrowIcon className="w-[18px] h-[18px] text-[#23262A]" stroke="#23262A" />
                                            </button>
                                            <button type="button" className="cursor-pointer inline-flex items-center gap-[6px] bg-[#eff5fe] rounded-[24px] p-[4px]">
                                                <h5 className="text-[16px] font-[Inter-SemiBold] text-[#1D6FE8]">Get Pre-Approved</h5>
                                                <RightArrowIcon className="w-[18px] h-[18px] text-[#1D6FE8]" stroke="#1D6FE8" />
                                            </button>
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap items-center gap-[22px]">
                                        <div className="flex items-center gap-[6px]">
                                            <Image src={bed} alt="beds" width={16} height={16} />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{beds || '—'} beds</p>
                                        </div>
                                        <div className="flex items-center gap-[6px]">
                                            <Image src={bath} alt="baths" width={16} height={16} />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{baths || '—'} baths</p>
                                        </div>
                                        <div className="flex items-center gap-[6px]">
                                            <Image src={size} alt="sqft" width={16} height={16} />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{sqft || '—'} sqft</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[8px] min-w-0">
                                        <LocationIcon className="w-[16px] h-[16px]" stroke="#23262A" />
                                        <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            {locationText || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-[8px] max-sm:w-full">
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex items-center gap-[8px] rounded-[8px] border border-[rgba(35,38,42,0.4)] bg-white p-[4px_12px]" 
                                        onClick={handleOpenSaveAdsWithLoginCheck}
                                    >
                                        <FavouriteIcon className="h-[16px] w-[16px] text-[#23262A]" fill="#fff" stroke="#23262A" />
                                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Favorite</p>
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex items-center gap-[8px] rounded-[8px] border border-[rgba(35,38,42,0.4)] bg-white p-[4px_12px]"
                                        onClick={() => setIsShareOpen(true)}
                                    >
                                        <ShareIcon className="h-[16px] w-[16px]" fill="#23262A" />
                                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Share</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='py-[40px] border-b border-[rgba(143,143,143,0.35)]'>
                            <div className='mb-[24px]'>
                                <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A]">
                                    {title}
                                </h2>
                            </div>
                            <div className="mb-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-0">
                                <div className="flex flex-col gap-[18px] md:border-r md:border-[rgba(143,143,143,0.35)] md:pr-[28px]">
                                    <DetailRow label="Type" value={fields.type || '—'} />
                                    <DetailRow label="Furnishing" value={fields.furnishing || '—'} />
                                </div>
                                <div className="flex flex-col gap-[18px] md:pl-[28px]">
                                    <DetailRow label="Purpose" value={fields.purpose || '—'} />
                                    <DetailRow label="Updated" value={fields.updated || '—'} />
                                </div>
                            </div>
                            <div className="mb-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-0">
                                <div className="flex flex-col gap-[18px] md:border-r md:border-[rgba(143,143,143,0.35)] md:pr-[28px]">
                                    <DetailRow label="Rent is paid" value={rentIsPaid || '—'} />
                                </div>
                                <div className="flex flex-col gap-[18px] md:pl-[28px]">
                                    <DetailRow label="Listed By" value={listedBy || '—'} />
                                </div>
                            </div>
                            <div className="">
                                <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] leading-[1.65] text-[#23262A]">
                                    {visibleDescription}
                                </p>
                                {hasLongDescription ? (
                                    <div className='mt-[6px] mb-[26px]'>
                                        <button
                                            type="button"
                                            onClick={() => setIsDescriptionExpanded((p) => !p)}
                                            className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                        >
                                            {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <p className="text-[14px] font-[Inter-Bold] text-[#23262A]">
                                Posted on: <span className="font-[Inter-Regular]">{fields.postedOn || '—'}</span>
                            </p>

                        </div>
                        <AmentiesSection productData={productData} />
                        <div className="py-[40px] border-b border-[rgba(143,143,143,0.35)]">
                            <PropertyInfoSection title="Validated Information">
                                <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 md:gap-0">
                                    <div className="flex flex-col gap-[22px] md:border-r md:border-[rgba(143,143,143,0.35)] md:pr-[28px]">
                                        <PropertyValidatedPair label="Ownership" value={validatedBuilding.ownership} />
                                        <PropertyValidatedPair label="Parking Availability" value={validatedBuilding.parking} />
                                    </div>
                                    <div className="flex flex-col gap-[22px] md:pl-[28px]">
                                        <PropertyValidatedPair label="Balcony Size" value={validatedBuilding.balconySize} />
                                        <PropertyValidatedPair label="Usage" value={validatedBuilding.usage} />
                                    </div>
                                </div>
                            </PropertyInfoSection>
                        </div>
                        <div className="py-[40px] border-b border-[rgba(143,143,143,0.35)]">
                            <PropertyInfoSection title="Building Information">
                                <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 md:gap-0">
                                    <div className="flex flex-col gap-[22px] md:border-r md:border-[rgba(143,143,143,0.35)] md:pr-[28px]">
                                        <PropertyValidatedPair label="Building Name" value={validatedBuilding.buildingName} />
                                        <PropertyValidatedPair label="Building Area" value={validatedBuilding.buildingArea} />
                                    </div>
                                    <div className="flex flex-col gap-[22px] md:pl-[28px]">
                                        <PropertyValidatedPair label="Floors" value={validatedBuilding.floors} />
                                    </div>
                                </div>
                            </PropertyInfoSection>
                        </div>
                        {isForSale ? (
                            <div ref={mortgageSectionRef}>
                                <MortgageCalculator productData={productData} />
                            </div>
                        ) : null}
                        <div className={`py-[40px] border-b border-[rgba(143,143,143,0.35)] ${isLocationMapOpen ? '' : ''}`}>
                            <div className='mb-[24px]'>
                                <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[10px]">
                                    Map View
                                </h2>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                    {locationText || '—'}
                                </p>
                            </div>
                            <MapComponent
                                latitude={latitude}
                                longitude={longitude}
                                onToggleShowMap={setIsLocationMapOpen}
                                previewHeight="300px"
                                height="300px"
                                fullWidth
                                toggleButtonClassName="cursor-pointer absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-center items-center w-full"
                                toggleButtonInnerClassName="inline-flex items-center gap-[8px] rounded-full bg-white p-[6px_20px] shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
                                toggleButtonTextClassName="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                            />
                        </div>
                        <div className="py-[40px] border-b border-[rgba(143,143,143,0.35)]">
                            <div className="mb-[24px] flex items-start justify-between gap-[24px] max-sm:flex-col">
                                <div className="min-w-0 flex-1">
                                    <div className='mb-[24px]'>
                                        <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A]">
                                            More Info
                                        </h2>
                                    </div>
                                    <div className="flex flex-col gap-[18px]">
                                        {moreInfoRows.map((row) => (
                                            <div key={row.label} className="grid grid-cols-[170px_20px_1fr] items-center gap-[14px] max-sm:grid-cols-[1fr] max-sm:gap-[6px]">
                                                <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">{row.label}</h4>
                                                {row.withInfoIcon ? (
                                                    <Image src={info} alt="info" width={18} height={18} />
                                                ) : (
                                                    <div className="h-[18px] w-[18px]"></div>
                                                )}
                                                <h3 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{row.value}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* <div className="w-[170px] shrink-0 rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-[#fff] p-[8px]">
                                <div className="flex h-[150px] items-center justify-center rounded-[4px] border border-[rgba(143,143,143,0.2)] bg-[repeating-linear-gradient(90deg,#000_0px,#000_4px,#fff_4px,#fff_8px),repeating-linear-gradient(0deg,#000_0px,#000_4px,#fff_4px,#fff_8px)] bg-[length:24px_24px] bg-blend-normal">
                                    <span className="rounded-full bg-white px-[10px] py-[4px] text-[12px] font-[Inter-SemiBold] text-[#23262A]">QR</span>
                                </div>
                                <p className="pt-[8px] text-center text-[16px] leading-[16px] font-[Inter-SemiBold] text-[#23262A]">Permit</p>
                            </div> */}
                            </div>
                            {/* <div className="flex items-center gap-[10px] rounded-[10px] bg-[#EEF2F8] p-[12px_16px]">
                            <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#E54545] bg-white text-[11px] font-[Inter-SemiBold] text-[#0C8B43]">DLD</span>
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                To know more about the rules and regulations visit the{' '}
                                <a href="#" className="font-[Inter-SemiBold] text-[#2F80ED]">Land Department Website.</a>
                            </p>
                        </div> */}
                        </div>
                        <div className='my-[50px] text-center w-full'>
                            <button
                                type="button"
                                onClick={() => setIsReportOpen(true)}
                                className="flex w-full justify-center cursor-pointer items-center gap-[8px]"
                            >
                                <ReportAdFlagIcon className="w-[18px] h-[18px]" />
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262a]">Report This Ad</p>
                            </button>
                        </div>
                        <SimilarProducts productData={productData} mode="property" />
                    </div>
                        <div className="w-[350px] max-sm:w-full shrink-0">
                        <PropertyProfile
                            productData={productData}
                            contactBeds={beds}
                            contactBaths={baths}
                            contactSqft={sqftRaw}
                            contactLocation={locationText}
                        />
                    </div>
                </div>
                <div className="py-[26px]">
                    <div className="grid grid-cols-2 gap-[36px] max-sm:grid-cols-1">
                        <div>
                            <h3 className="mb-[10px] border-b border-[#f7f7f8] py-[16px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                Rent Townhouses Near Dubailand
                            </h3>
                            <div className="flex flex-col">
                                {nearbyLinks.map((txt) => (
                                    <Link key={txt} href="#" className="w-fit text-[14px] font-[Inter-Regular] text-[#0F5DC4] py-[8px] hover:underline">
                                        {txt}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-[10px] border-b border-[#f7f7f8] py-[16px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                Popular Searches
                            </h3>
                            <div className="flex flex-col">
                                {popularSearchLinks.map((txt) => (
                                    <Link key={txt} href="#" className="w-fit text-[14px] font-[Inter-Regular] text-[#0F5DC4] py-[8px] hover:underline">
                                        {txt}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showFloatingHeader ? (
                <div className="fixed inset-x-0 top-[0px] bg-[#fff]  p-[20px]  z-[40] flex justify-center shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] ">
                    <div className="flex w-full max-w-[1170px] items-start justify-between gap-[12px] max-sm:flex-col max-sm:items-start ">
                        <div className="min-w-0 flex-1 flex flex-col gap-[10px]">
                            <h3 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                                AED <span className="font-[Inter-Bold] text-[22px]">{priceText || '—'}</span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-[22px]">
                                <div className="flex items-center gap-[6px]">
                                    <Image src={bed} alt="beds" width={16} height={16} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{beds || '—'} beds</p>
                                </div>
                                <div className="flex items-center gap-[6px]">
                                    <Image src={bath} alt="baths" width={16} height={16} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{baths || '—'} baths</p>
                                </div>
                                <div className="flex items-center gap-[6px]">
                                    <Image src={size} alt="sqft" width={16} height={16} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{sqft || '—'} sqft</p>
                                </div>
                            </div>
                            <div className="flex min-w-0 items-center gap-[8px]">
                                <LocationIcon className="h-[20px] w-[20px] shrink-0" stroke="#23262A" />
                                <p className="truncate text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    {locationText || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="w-full max-w-[430px] rounded-[8px] bg-white max-md:max-w-full">
                            <div className="mb-[10px] flex items-center gap-[16px]">
                                {agentImage ? (
                                    <Image
                                        src={agentImage}
                                        alt={agentName}
                                        width={42}
                                        height={42}
                                        className="h-[48px] w-[48px] rounded-[6px] object-cover"
                                    />
                                ) : (
                                    <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[6px] bg-[#EEF2F7] text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                                        {String(agentName).charAt(0)}
                                    </div>
                                )}
                                <div className="flex flex-col gap-[4px]">
                                    <h4 className="text-[20px] font-[Inter-Medium] text-[#23262A]">{agentName}</h4>
                                    <Link href="#" className="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]">View All Properties</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF3FE] w-[25%] py-[12px]" onClick={() => { if (!isLogin()) { setIsLoginModalOpen(true); return }; setIsEmailOpen(true) }}>
                                    <Image src={mailOutline} alt="email" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Email</p>
                                </button>
                                <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#FFEFEF] w-[25%] py-[12px]" onClick={() => { if (!isLogin()) { setIsLoginModalOpen(true); return }; setIsCallOpen(true) }}>
                                    <Image src={phoneOutline} alt="call" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Call</p>
                                </button>
                                {waLink ? (
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] w-[25%] py-[12px]"
                                        onClick={(e) => {
                                            if (!isLogin()) {
                                                e.preventDefault()
                                                setIsLoginModalOpen(true)
                                            }
                                        }}
                                    >
                                        <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                                    </a>
                                ) : (
                                    <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] w-[25%] py-[12px] opacity-50">
                                        <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
            <ReportListingModal
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                productData={productData}
            />
            <Call
                open={isCallOpen}
                onClose={() => setIsCallOpen(false)}
                agentName={agentName || '-'}
                agencyName={firstTruthy(item?.agency_name, item?.company_name, item?.category?.name, '-')}
                agentImage={agentImage || ''}
                referenceCode={firstTruthy(item?.reference_code, '-')}
                phoneNumber={firstTruthy(item?.phone, item?.mobile, item?.user?.mobile, item?.user?.phone, '-')}
            />
            <Email
                open={isEmailOpen}
                onClose={() => setIsEmailOpen(false)}
                itemId={item?.id}
                image={item?.image}
                price={item?.price}
                beds={beds}
                baths={baths}
                sqft={sqftRaw}
                location={locationText}
                referenceCode={item?.reference_code}
                userName={firstTruthy(item?.user?.name, '-')}
                userEmail={firstTruthy(item?.user?.email, '-')}
                userPhone={firstTruthy(item?.user?.mobile, item?.user?.phone, '-')}
            />
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
            <LoginModal
                IsLoginModalOpen={isLoginModalOpen}
                setIsLoginModalOpen={setIsLoginModalOpen}
                IsRegisterModalOpen={isRegisterModalOpen}
                setIsRegisterModalOpen={setIsRegisterModalOpen}
                IsMailSentOpen={isMailSentOpen}
                setIsMailSentOpen={setIsMailSentOpen}
                openSentMailModal={openSentMailModal}
            />
            
        </>
    )
}
