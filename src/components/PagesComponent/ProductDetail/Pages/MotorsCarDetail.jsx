/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import client from '../../../../../public/assets/img/client.png'
import Homepin from '../../../../../public/assets/img/icons/homepin.svg'
import tick from '../../../../../public/assets/img/icons/tick.svg'
import calendarIc from '../../../../../public/assets/img/icons/calendar.svg'
import speedometerIc from '../../../../../public/assets/img/icons/speedometer.svg'
import regionalSpecsIc from '../../../../../public/assets/img/icons/regional-specs.svg'
import infoIc from '../../../../../public/assets/img/icons/info.svg'
import MapComponent from '../ClassifiedComponents/MapComponent'
import { FavouriteIcon, ReportAdFlagIcon, ShareIcon } from '@/components/CustomFile/icons'
import ReportListingModal from '../components/ReportListingModal'
import SimilarProducts from '../components/SimilarProducts'
import PropertyBanner from '../components/PropetyBanner'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import CarFinanceCalculator from '../MotorComponents/CarFinanceCalculator'
import MotorsCarFeaturesSection from '../MotorComponents/MotorsCarFeaturesSection'
import MotorCarProfile from '../MotorComponents/MotorCarProfile'
import MotorContactPhoneModal from '../MotorComponents/MotorContactPhoneModal'
import MotorTradeInModal from '../MotorComponents/MotorTradeInModal'
import MotorsFloatingListingBar from '../MotorComponents/MotorsFloatingListingBar'
import MotorsRentalPricingSection from '../MotorComponents/MotorsRentalPricingSection'
import MotorsRentalTermsSection from '../MotorComponents/MotorsRentalTermsSection'
import MotorsRentalDocumentsSection from '../MotorComponents/MotorsRentalDocumentsSection'
import { isMotorsCarOfTheWeekItem, isMotorsRentalCarsListingContext } from '@/utils/motorsListingPaths'
import { manageFavouriteApi } from '@/utils/api'
import { useLoginModalGuard } from '@/hooks/useLoginModalGuard'
import secondmapbg from '../../../../../public/assets/img/secondmapbg.png'
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

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => n.toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    const v = row?.custom_field_value?.value ?? row?.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
    return v != null && v !== '' ? String(v) : ''
}

function toPlainDescription(raw) {
    if (!raw) return ''
    const str = String(raw)
    return str
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<li>/gi, '')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function looksLikeHtml(str) {
    return typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str)
}

function ordinalDay(n) {
    const d = Number(n)
    if (d % 100 >= 11 && d % 100 <= 13) return `${d}th`
    switch (d % 10) {
        case 1:
            return `${d}st`
        case 2:
            return `${d}nd`
        case 3:
            return `${d}rd`
        default:
            return `${d}th`
    }
}

function formatPostedDate(raw) {
    if (raw === undefined || raw === null || raw === '') return ''
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return ''
    const day = ordinalDay(d.getDate())
    const month = d.toLocaleString('en-GB', { month: 'long' })
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
}

const DESCRIPTION_PREVIEW_LINES = 3
const DESCRIPTION_PREVIEW_CHARS = 200

function truncatePlainToPreview(text) {
    const t = String(text || '').trim()
    if (!t) return ''
    const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    if (lines.length > DESCRIPTION_PREVIEW_LINES) {
        return lines.slice(0, DESCRIPTION_PREVIEW_LINES).join('\n') + '…'
    }
    const joined = lines.join('\n')
    if (joined.length > DESCRIPTION_PREVIEW_CHARS) {
        return `${joined.slice(0, DESCRIPTION_PREVIEW_CHARS).trim()}…`
    }
    return joined
}

function formatWarranty(raw) {
    if (raw === true || raw === 1 || String(raw).toLowerCase() === 'yes') return 'Yes'
    if (raw === false || raw === 0 || String(raw).toLowerCase() === 'no') return 'No'
    return raw != null && raw !== '' ? String(raw) : ''
}

function formatListingPriceHeader(productData, currencySymbol) {
    const item = productData || {}
    const raw = firstTruthy(item.price, item.amount, item.selling_price, item.ask_price, item.rent)
    if (raw === '' || raw === null || raw === undefined) return '—'
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n !== 0) {
        return `${currencySymbol} ${n.toLocaleString('en-US')}`
    }
    return String(raw)
}

function formatKmDisplay(raw) {
    if (raw === undefined || raw === null || raw === '') return '—'
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n >= 0) {
        return `${n.toLocaleString('en-US')} km`
    }
    const s = String(raw).trim()
    return /\bkm\b/i.test(s) ? s : `${s} km`
}

function parsePositiveInt(raw) {
    if (raw === undefined || raw === null || raw === '') return null
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw > 0) return raw
    const n = Number(String(raw).replace(/[^\d.]/g, ''))
    return !Number.isNaN(n) && n > 0 ? n : null
}



function parseCoordinate(v) {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}

function SpecItem({ label, value }) {
    const display = value != null && String(value).trim() !== '' ? String(value) : '—'
    return (
        <div className="grid grid-cols-2 gap-[12px]">
            <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">{label}</p>
            <p className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{display}</p>
        </div>
    )
}

function dealerDisplayName(productData) {
    const item = productData || {}
    return firstTruthy(
        item.dealer_name,
        item.company_name,
        item.store_name,
        item.business_name,
        item.user?.company_name,
        item.user?.name,
        item.seller_name,
        item.user_name,
        customFieldValue(item, 'Dealer', 'Company', 'Seller Name')
    )
}

function slugifyLabel(value = '') {
    return String(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '')
}

function buildWhatsAppUrl(phone, message) {
    const raw = digitsOnly(phone)
    if (!raw) return ''
    const base = `https://wa.me/${raw}`
    if (message) return `${base}?text=${encodeURIComponent(message)}`
    return base
}

function formatSellerTypeLabel(raw) {
    const s = String(raw || '').trim()
    if (!s) return 'Seller'
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function normalizeSellerVerified(...vals) {
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

/** Fallback rows matching the reference UI when the API has no structured features. */
const DEFAULT_FEATURE_GROUPS = [
    {
        id: 'driver_assistance_safety',
        title: 'Driver Assistance & Safety',
        items: [
            'Cruise Control',
            'Parking Sensors - Rear',
            'Child Seat Anchors (ISOFIX)',
            'Parking Sensors - Front',
            'Rear View Camera',
        ],
    },
    {
        id: 'entertainment_technology',
        title: 'Entertainment & Technology',
        items: ['Bluetooth System', 'Touchscreen Display', 'Apple CarPlay'],
    },
    {
        id: 'comfort_convenience',
        title: 'Comfort & Convenience',
        items: ['Dual Zone Climate Control', 'Keyless Entry'],
    },
]

function normalizeFeatureLabel(entry) {
    if (entry == null) return ''
    if (typeof entry === 'string') return entry.trim()
    if (typeof entry === 'object') {
        return firstTruthy(entry.name, entry.label, entry.title, entry.value).trim()
    }
    return String(entry).trim()
}

/**
 * Accepts e.g. `[{ title, items: ['…'] }]` or `{ categories: [...] }` from the listing payload.
 */
function coalesceFeatureGroups(item) {
    const raw =
        item?.car_features ??
        item?.vehicle_features ??
        item?.feature_categories ??
        item?.features_by_category ??
        item?.motors_features ??
        item?.metadata?.car_features

    let list = raw
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.categories)) {
        list = raw.categories
    }
    if (!Array.isArray(list) || list.length === 0) return null

    const groups = list
        .map((g, i) => {
            const title = firstTruthy(g?.title, g?.name, g?.category, g?.label, `Category ${i + 1}`)
            let items = []
            if (Array.isArray(g?.items)) items = g.items
            else if (Array.isArray(g?.features)) items = g.features
            else if (Array.isArray(g?.values)) items = g.values
            const labels = items.map(normalizeFeatureLabel).filter(Boolean)
            return {
                id: String(firstTruthy(g?.id, g?.slug, title, i)),
                title: String(title),
                items: labels,
            }
        })
        .filter((g) => g.items.length > 0)

    return groups.length > 0 ? groups : null
}

/**
 * Car listing overview (Used / New / Export / Rental) — two-column specs + trade-in CTA.
 */
export default function MotorsCarDetail({
    productData = {},
    listingItem = '',
    mode = 'motors',
    carOfWeekFromQuery = false,
}) {
    const item = productData || {}
    const [descriptionExpanded, setDescriptionExpanded] = useState(false)
    const [locationMapOpen, setLocationMapOpen] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [isSaved, setIsSaved] = useState(!!item.is_liked)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
    const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false)
    const [showFloatingBar, setShowFloatingBar] = useState(false)
    const floatingSentinelRef = useRef(null)
    const { requireLogin, loginModal } = useLoginModalGuard()
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

    const currencySymbol = useSelector((state) => state?.Settings?.data?.data?.currency_symbol ?? 'AED')

    const engineCc = firstTruthy(
        item.engine_cc,
        item.engine_capacity,
        item.engineCapacity,
        customFieldValue(item, 'Engine Capacity (cc)', 'Engine Capacity', 'Engine CC', 'Engine Size')
    )
    const targetMarket = firstTruthy(
        item.target_market,
        item.targetMarket,
        item.export_region,
        customFieldValue(item, 'Target Market', 'Regional Specs', 'Export')
    )
    const fuelType = firstTruthy(item.fuel_type, item.fuelType, customFieldValue(item, 'Fuel Type', 'Fuel'))
    const doors = firstTruthy(item.doors, item.number_of_doors, customFieldValue(item, 'Doors', 'No. of Doors'))
    const sellerType = firstTruthy(
        item.seller_type,
        item.sellerType,
        item.listed_by_type,
        customFieldValue(item, 'Seller type', 'Seller Type', 'Listed by')
    )
    const horsepower = firstTruthy(
        item.horsepower,
        item.hp,
        customFieldValue(item, 'Horsepower', 'HP', 'Power')
    )

    const trim = firstTruthy(item.trim, item.variant, customFieldValue(item, 'Trim', 'Variant'))
    const seating = firstTruthy(
        item.seating_capacity,
        item.seats,
        customFieldValue(item, 'Seating Capacity', 'Seats', 'No. of Seats')
    )
    const interiorColor = firstTruthy(
        item.interior_color,
        item.interiorColor,
        customFieldValue(item, 'Interior Color', 'Interior')
    )
    const bodyType = firstTruthy(item.body_type, item.bodyType, customFieldValue(item, 'Body Type', 'Body'))
    const warrantyRaw = firstTruthy(item.warranty, item.has_warranty, customFieldValue(item, 'Warranty'))
    const cylinders = firstTruthy(
        item.cylinders,
        item.no_of_cylinders,
        item.number_of_cylinders,
        customFieldValue(item, 'No. of Cylinders', 'Cylinders', 'Number of Cylinders')
    )

    const dealerName = dealerDisplayName(item) || 'Dealer'

    const user = item?.user && typeof item.user === 'object' ? item.user : null

    const sellerLogo = useMemo(
        () =>
            firstTruthy(
                item.dealer_logo,
                item.company_logo,
                item.store_logo,
                item.seller_image,
                item.logo,
                user?.company_logo,
                user?.profile,
                user?.image,
                user?.profile_image,
                '/assets/img/user.jpeg'
            ),
        [item, user]
    )

    const sellerTypeLabel = useMemo(
        () =>
            formatSellerTypeLabel(
                firstTruthy(
                    item.seller_type,
                    item.sellerType,
                    item.listed_by_type,
                    customFieldValue(item, 'Seller type', 'Seller Type', 'Listed by')
                )
            ),
        [item]
    )

    const phoneNumber = useMemo(
        () =>
            firstTruthy(
                item.phone,
                item.mobile,
                item.contact_phone,
                item.seller_phone,
                item.phone_number,
                user?.phone,
                user?.mobile
            ),
        [item, user]
    )

    const whatsappNumber = useMemo(
        () =>
            firstTruthy(
                item.whatsapp,
                item.whatsapp_number,
                item.whats_app,
                item.wa_number,
                user?.whatsapp,
                user?.whatsapp_number,
                phoneNumber
            ),
        [item, user, phoneNumber]
    )

    const whatsappUrl = useMemo(() => {
        const msg = firstTruthy(item.whatsapp_message, item.whatsappMessage, '')
        return buildWhatsAppUrl(whatsappNumber, msg)
    }, [item, whatsappNumber])

    const openPhoneProtected = () => requireLogin(() => setIsPhoneModalOpen(true))
    const openWhatsAppProtected = () =>
        requireLogin(() => {
            if (whatsappUrl) window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        })

    const viewAllCarsHref = useMemo(() => {
        const label = String(listingItem || 'Used Cars').trim()
        const q = new URLSearchParams()
        q.set('mode', 'motors')
        q.set('item', label)
        q.set('slug', slugifyLabel(label))
        return `/products?${q.toString()}`
    }, [listingItem])

    useEffect(() => {
        const el = floatingSentinelRef.current
        if (!el) return undefined
        const io = new IntersectionObserver(
            ([entry]) => {
                const r = entry.boundingClientRect
                if (entry.isIntersecting) {
                    setShowFloatingBar(false)
                    return
                }
                setShowFloatingBar(r.bottom <= 0)
            },
            { root: null, rootMargin: '0px', threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const rawDescription = useMemo(
        () =>
            firstTruthy(
                item.description,
                item.details,
                item.content,
                item.body,
                item.short_description,
                item.long_description,
                item.desc,
                item.ad_description,
                customFieldValue(item, 'Description', 'Ad Description')
            ),
        [item]
    )

    const plainDescription = useMemo(() => toPlainDescription(rawDescription), [rawDescription])
    const descriptionIsHtml = useMemo(() => looksLikeHtml(rawDescription), [rawDescription])
    const hasDescription = Boolean(String(plainDescription || '').trim())

    const descriptionPreview = useMemo(
        () => truncatePlainToPreview(plainDescription),
        [plainDescription]
    )

    const needsReadMore = useMemo(() => {
        if (!hasDescription) return false
        if (descriptionIsHtml) return String(rawDescription).length > 80
        return descriptionPreview !== plainDescription
    }, [hasDescription, descriptionIsHtml, rawDescription, descriptionPreview, plainDescription])

    const postedOnLabel = useMemo(
        () =>
            formatPostedDate(
                firstTruthy(item.created_at, item.posted_at, item.published_at, item.updated_at, item.createdAt)
            ),
        [item]
    )

    const showDescriptionSection = hasDescription || Boolean(postedOnLabel)

    const featureGroups = useMemo(() => coalesceFeatureGroups(item) || DEFAULT_FEATURE_GROUPS, [item])

    const locationText = useMemo(
        () =>
            firstTruthy(
                item.address,
                item.location,
                item.full_address,
                customFieldValue(item, 'Address', 'Location')
            ),
        [item]
    )
    const latitude = useMemo(
        () => parseCoordinate(firstTruthy(item.latitude, item.lat, item.location_lat)),
        [item]
    )
    const longitude = useMemo(
        () => parseCoordinate(firstTruthy(item.longitude, item.long, item.lng, item.location_lng)),
        [item]
    )
    const canShowEmbeddedMap = latitude !== null && longitude !== null
    const showLocationSection = Boolean(String(locationText || '').trim()) || canShowEmbeddedMap
    const mapsSearchHref =
        String(locationText || '').trim() !== ''
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(locationText).trim())}`
            : ''

    const handleShowMapClick = () => {
        if (canShowEmbeddedMap) {
            setLocationMapOpen(true)
            return
        }
        if (mapsSearchHref) {
            window.open(mapsSearchHref, '_blank', 'noopener,noreferrer')
        }
    }

    const displayPrice = useMemo(() => formatListingPriceHeader(item, currencySymbol), [item, currencySymbol])

    const headlineTitle = useMemo(() => {
        const make = firstTruthy(
            item.make,
            item.brand,
            item.manufacturer,
            customFieldValue(item, 'Make', 'Brand', 'Manufacturer')
        )
        const model = firstTruthy(item.model, item.variant, customFieldValue(item, 'Model', 'Variant'))
        const t = firstTruthy(item.title, item.name, item.listing_title)
        const combined = `${make} ${model}`.trim()
        return String(t || combined || 'Car listing').trim()
    }, [item])

    const yearDisplay = useMemo(
        () =>
            firstTruthy(
                item.year,
                item.model_year,
                item.modelYear,
                customFieldValue(item, 'Year', 'Model Year')
            ),
        [item]
    )

    const mileageDisplay = useMemo(
        () =>
            formatKmDisplay(
                firstTruthy(
                    item.km,
                    item.mileage,
                    item.kilometers,
                    item.odometer,
                    customFieldValue(item, 'Kilometers', 'Mileage', 'KM', 'Odometer')
                )
            ),
        [item]
    )

    const specsRowLabel = useMemo(() => {
        const tm = String(targetMarket || '').trim()
        if (!tm) return '—'
        if (/spec/i.test(tm)) return tm
        return `${tm} Specs`
    }, [targetMarket])

    const highlightBadges = useMemo(() => {
        const out = []
        const st = String(sellerType || '').toLowerCase()
        const owner = String(
            firstTruthy(item.owner_type, item.ownership, customFieldValue(item, 'Owner', 'Owner Type', 'Ownership'))
        ).toLowerCase()
        if (item.first_owner === true || item.is_first_owner === true || owner.includes('first')) {
            out.push('First Owner')
        }
        if (formatWarranty(warrantyRaw) === 'Yes' && st.includes('dealer')) {
            out.push('Dealer Warranty')
        }
        if (item.service_contract === true || item.has_service_contract === true) {
            out.push('Service Contract')
        }
        const fin = firstTruthy(item.finance_available, item.car_finance, item.finance)
        if (fin === true || fin === 1 || String(fin).toLowerCase() === 'yes') {
            out.push('Car Finance')
        }
        return out
    }, [item, warrantyRaw, sellerType])

    const shareUrl = useMemo(() => {
        const detailSlug = String(firstTruthy(item.slug, item.id) || '')
        const shareBase = (process.env.NEXT_PUBLIC_WEB_URL || '').replace(/\/$/, '')
        const itemQ = listingItem ? `&item=${encodeURIComponent(String(listingItem))}` : ''
        if (!shareBase) return `/productdetail?slug=${encodeURIComponent(detailSlug)}&mode=motors${itemQ}`
        return `${shareBase}/productdetail?slug=${encodeURIComponent(detailSlug)}&mode=motors${itemQ}`
    }, [item, listingItem])

    const showRentalTermsSection = useMemo(
        () => isMotorsRentalCarsListingContext(item, listingItem),
        [item, listingItem]
    )

    /** Car of the Week (API flags or `carOfWeek=1` from listing link); hidden for rental verticals. */
    const showCarOfWeekMotorsExtras = useMemo(
        () =>
            (isMotorsCarOfTheWeekItem(item) || carOfWeekFromQuery) && !showRentalTermsSection,
        [item, showRentalTermsSection, carOfWeekFromQuery]
    )

    const rentalFloatingTagline = useMemo(() => {
        if (!showRentalTermsSection) return ''
        const override = firstTruthy(
            item.rental_floating_subtitle,
            item.rental_bar_subtitle,
            customFieldValue(item, 'Rental floating subtitle', 'Rental bar line', 'Rental promo line')
        )
        if (String(override).trim()) return String(override).trim()
        const deliveryLine =
            firstTruthy(
                item.rental_delivery_promo,
                customFieldValue(item, 'Free delivery note', 'Delivery promo', 'Delivery')
            ) || 'Free delivery for monthly rental'
        const monthlyKm =
            parsePositiveInt(
                firstTruthy(
                    item.monthly_km_limit,
                    item.km_per_month,
                    customFieldValue(item, 'Monthly km limit')
                )
            ) ?? 6000
        const kmLine = `Enjoy ${monthlyKm.toLocaleString('en-US')} KM Per Month/-`
        return `${deliveryLine}, ${kmLine}`
    }, [item, showRentalTermsSection])

    const baggageFloatingDisplay = useMemo(() => {
        const baggage = firstTruthy(
            item.baggage,
            item.baggage_capacity,
            item.luggage_capacity,
            customFieldValue(item, 'Baggage capacity', 'Luggage', 'Bags')
        )
        if (baggage === '' || baggage == null) return '—'
        const s = String(baggage).replace(/\s*kg\s*$/i, '').trim()
        return s || '—'
    }, [item])

    const seatingFloatingDisplay = String(seating || '').trim() || '—'
    const doorsFloatingDisplay = String(doors || '').trim() || '—'

    const sellerVerifiedDealer = useMemo(
        () =>
            normalizeSellerVerified(
                item.verified_user,
                item.is_verified_user,
                item.verified,
                item.is_verified,
                user?.verified,
                user?.is_verified
            ),
        [item, user]
    )

    return (
        <div className="w-full">
            <PropertyBanner productData={item} variant="motors" />
            <div className="products_grid grid grid-cols-1 gap-[20px] lg:grid-cols-[1fr_350px]">
                <div className="min-w-0">


                    <div className="border-b border-[rgba(143,143,143,0.4)] pb-[26px] flex flex-col gap-[12px] ">
                        <div className="flex flex-wrap items-start justify-between gap-[16px]">
                            {!showRentalTermsSection ? (
                                <h4 className="min-w-0 text-[18px] font-[Inter-Medium] leading-tight text-[#23262A]">
                                    AED <span className="font-[Inter-Bold] text-[28px]">{displayPrice}</span>
                                </h4>
                            ) : (
                                <div />
                            )}
                            <div className="flex flex-wrap gap-[10px]">
                                <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[#23262A] bg-white p-[4px_10px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                                    onClick={() => {
                                        setIsSaved((p) => !p)
                                        handleOpenSaveAds()
                                    }}
                                >
                                    <FavouriteIcon
                                        className={`h-[16px] w-[16px] shrink-0 ${isSaved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
                                        fill={isSaved ? '#DC0000' : '#fff'}
                                        stroke={isSaved ? '#DC0000' : '#000'}
                                    />
                                    Favorite
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[#23262A] bg-white p-[4px_10px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                                    onClick={() => setIsShareOpen(true)}
                                >
                                    <ShareIcon className="h-[16px] w-[16px] shrink-0" fill="#000" />
                                    Share
                                </button>
                            </div>
                        </div>
                        <h1 className="text-[18px] font-[Inter-Regular] text-[#23262A]">{headlineTitle}</h1>

                        {!showRentalTermsSection ? (
                            <div className="flex flex-wrap items-center gap-x-[28px] gap-y-[12px] text-[15px] font-[Inter-Regular] text-[#23262A]">
                                <div className="inline-flex items-center gap-[8px]">
                                    <Image
                                        src={calendarIc}
                                        alt=""
                                        width={22}
                                        height={22}
                                        className="h-[22px] w-[22px] shrink-0 object-contain"
                                    />
                                    {yearDisplay || '—'}
                                </div>
                                <div className="inline-flex items-center gap-[8px]">
                                    <Image
                                        src={speedometerIc}
                                        alt=""
                                        width={22}
                                        height={22}
                                        className="h-[22px] w-[22px] shrink-0 object-contain"
                                    />
                                    {mileageDisplay}
                                </div>
                                <div className="inline-flex items-center gap-[8px]">
                                    <Image
                                        src={regionalSpecsIc}
                                        alt=""
                                        width={22}
                                        height={22}
                                        className="h-[22px] w-[22px] shrink-0 object-contain"
                                    />
                                    {specsRowLabel}
                                </div>
                            </div>
                        ) : null}
                        {showRentalTermsSection ? <MotorsRentalPricingSection productData={item} /> : null}
                        {showCarOfWeekMotorsExtras ? (
                            <div className='flex flex-wrap  gap-[12px]'>
                                <div className='flex gap-[4px] border border-[rgba(143,143,143,0.24)] rounded-[8px] p-[4px_10px] items-center'>
                                    <Image src={tick} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0 object-contain" />
                                    <p className='text-[14px] font-[Inter-SemiBold] text-[#23262A]'>First Owner</p>
                                </div>
                                <div className='flex gap-[4px] border border-[rgba(143,143,143,0.24)] rounded-[8px] p-[4px_10px] items-center'>
                                    <Image src={tick} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0 object-contain" />
                                    <p className='text-[14px] font-[Inter-SemiBold] text-[#23262A]'>Dealer Warranty</p>
                                </div>
                                <div className='flex gap-[4px] border border-[rgba(143,143,143,0.24)] rounded-[8px] p-[4px_10px] items-center'>
                                    <Image src={tick} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0 object-contain" />
                                    <p className='text-[14px] font-[Inter-SemiBold] text-[#23262A]'>Service Contract</p>
                                </div>
                                <div className='flex gap-[4px] items-center'>
                                    <div className='flex gap-[4px] border border-[rgba(143,143,143,0.24)] rounded-[8px] p-[4px_10px] items-center'>
                                        <Image src={tick} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0 object-contain" />
                                        <p className='text-[14px] font-[Inter-SemiBold] text-[#23262A]'>Car Finance</p>
                                    </div>
                                    <div>
                                        <Image src={infoIc} alt="" width={16} height={16} className="h-[16px] w-[16px] shrink-0 object-contain" />
                                    </div>
                                </div>
                            </div>
                        ) : null}

                    </div>

                    <div ref={floatingSentinelRef} className="pointer-events-none h-[1px] w-full shrink-0" aria-hidden />

                    <div className="border-b border-[rgba(143,143,143,0.4)] py-[30px]">
                        <h2 className="mb-[16px] text-[24px] font-[Inter-Bold] text-[#23262a]">Car Overview</h2>
                        <div className="grid grid-cols-2 max-sm:grid-cols-1 mb-[20px]">
                            <div className="flex flex-col gap-[16px] min-w-0 sm:border-r sm:border-[rgba(0,0,0,0.08)] sm:pr-[28px]">
                                <SpecItem label="Engine Capacity (cc)" value={engineCc} />
                                <SpecItem label="Target Market" value={targetMarket} />
                                <SpecItem label="Fuel Type" value={fuelType} />
                                <SpecItem label="Doors" value={doors} />
                                <SpecItem label="Seller type" value={sellerType} />
                                <SpecItem label="Horsepower" value={horsepower} />
                            </div>
                            <div className="flex flex-col gap-[16px] min-w-0 sm:pl-[28px]">
                                <SpecItem label="Trim" value={trim} />
                                <SpecItem label="Seating Capacity" value={seating} />
                                <SpecItem label="Interior Color" value={interiorColor} />
                                <SpecItem label="Body Type" value={bodyType} />
                                <SpecItem label="Warranty" value={formatWarranty(warrantyRaw)} />
                                <SpecItem label="No. of Cylinders" value={cylinders} />
                            </div>
                        </div>
                        {showCarOfWeekMotorsExtras ? (
                            <div className="flex max-sm:flex-col max-sm:items-start gap-[16px] items-center rounded-[12px] border border-[#fad5d5] bg-[linear-gradient(90deg,_rgb(255,237,234)_0%,_rgb(255,255,255)_100%)] p-[16px_24px] ">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[14px] font-[Inter-Medium] text-[#212223] mb-[4px]">
                                        Trade In Your Car. Upgrade Your Drive.
                                    </p>
                                    <p className="w-[400px] max-sm:w-full text-[14px] font-[Inter-Regular] text-[#212223]">
                                        For a newer model with better features, improved performance, and great value.
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-center justify-center gap-[12px]">
                                    <div className="flex items-center gap-[14px]">
                                        <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            Dealer: <span className="font-[Inter-Bold]">{dealerName}</span>
                                        </h4>
                                        <Image src={client} alt="client" width={24} height={24} className="w-[24px] h-[24px] object-contain" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsTradeInModalOpen(true)}
                                        className="w-full cursor-pointer rounded-[8px] bg-[#DC0000] p-[8px_30px] text-center text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95"
                                    >
                                        Start Your Trade-In
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {showDescriptionSection ? (
                        <div className="border-b border-[rgba(143,143,143,0.35)] py-[30px]">
                            <h2 className="mb-[16px] text-[24px] font-[Inter-Bold] text-[#23262a]">Description</h2>

                            {hasDescription ? (
                                <>
                                    {descriptionExpanded && descriptionIsHtml ? (
                                        <div
                                            className="motor-car-detail-description text-[14px] font-[Inter-Regular] leading-[22px] text-[#23262A] [&_p]:mb-[10px] [&_ul]:mb-[10px] [&_ul]:list-disc [&_ul]:pl-[20px] [&_ul]:space-y-[6px] [&_strong]:font-[Inter-SemiBold]"
                                            dangerouslySetInnerHTML={{ __html: String(rawDescription) }}
                                        />
                                    ) : (
                                        <p
                                            className={`whitespace-pre-line text-[14px] font-[Inter-Regular] leading-[22px] text-[#23262A] ${!descriptionExpanded && needsReadMore ? 'line-clamp-3' : ''
                                                }`}
                                        >
                                            {descriptionExpanded || !needsReadMore
                                                ? plainDescription
                                                : descriptionPreview}
                                        </p>
                                    )}

                                    {needsReadMore ? (
                                        <div className="mt-[16px] flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setDescriptionExpanded((v) => !v)}
                                                className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                            >
                                                {descriptionExpanded ? 'Read Less' : 'Read More'}
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            ) : null}

                            {postedOnLabel ? (
                                <p
                                    className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${hasDescription ? 'mt-[24px]' : ''}`}
                                >
                                    <span className="font-[Inter-SemiBold]">Posted on:</span>{' '}
                                    {postedOnLabel}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    <MotorsCarFeaturesSection
                        key={String(firstTruthy(item.id, item.slug, 'features'))}
                        groups={featureGroups}
                    />

                    {showCarOfWeekMotorsExtras ? (
                        <CarFinanceCalculator
                            productData={item}
                            financeProviderName={dealerName}
                            carDisplayTitle={headlineTitle}
                            carDisplayYear={yearDisplay}
                        />
                    ) : null}

                    {showRentalTermsSection ?

                        <>
                            <MotorsRentalTermsSection productData={item} />
                            <MotorsRentalDocumentsSection productData={item} />
                        </>
                        : null}




                    {showLocationSection ? (
                        <div className="border-b border-[rgba(143,143,143,0.35)] py-[30px]">
                            <h2 className="mb-[12px] text-[24px] font-[Inter-Bold] text-[#23262a]">Location</h2>
                            <p className="mb-[20px] text-[16px] font-[Inter-Regular] text-[#23262a]">
                                {String(locationText || '').trim() || '—'}
                            </p>

                            {locationMapOpen && canShowEmbeddedMap ? (
                                <div>
                                    <div className="relative h-[360px] w-full overflow-hidden rounded-[12px] border border-[rgba(143,143,143,0.25)]">
                                        <MapComponent
                                            latitude={latitude}
                                            longitude={longitude}
                                            initialExpanded
                                            suppressToggleButton
                                            fullWidth
                                            height="360px"
                                            previewHeight="360px"
                                            onToggleShowMap={(open) => {
                                                if (!open) setLocationMapOpen(false)
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-[min(320px,56vw)] min-h-[220px] w-full overflow-hidden rounded-[12px]">
                                    <div
                                        className="absolute inset-0 scale-110 bg-[length:120%_120%] bg-center opacity-70 blur-[3px]"
                                        style={{ backgroundImage: `url(${secondmapbg.src})` }}
                                        aria-hidden
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center p-[16px]">
                                        <button
                                            type="button"
                                            onClick={handleShowMapClick}
                                            disabled={!canShowEmbeddedMap && !mapsSearchHref}
                                            className="inline-flex cursor-pointer items-center gap-[10px] rounded-full bg-white px-[22px] py-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition hover:shadow-[0_6px_28px_rgba(0,0,0,0.14)] disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <Image src={Homepin} alt="" width={24} height={24} className="h-[24px] w-[24px]" aria-hidden />
                                            <span className="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]">Show Map</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}


                    <div className="py-[28px] text-center">
                        <button
                            type="button"
                            onClick={() => setIsReportOpen(true)}
                            className="inline-flex cursor-pointer items-center justify-center gap-[8px]"
                        >
                            <ReportAdFlagIcon className="h-[18px] w-[18px] shrink-0" />
                            <span className="text-[14px] font-[Inter-Medium] text-[#23262A]">Report This Ad</span>
                        </button>
                    </div>

                    <SimilarProducts
                        productData={item}
                        title="Similar Cars"
                        mode="motors"
                        listingItem={listingItem}
                        layout="motor"
                    />

                    <ReportListingModal
                        open={isReportOpen}
                        onClose={() => setIsReportOpen(false)}
                        brandName="ebozor"
                        mode={mode}
                        onSubmitReport={() => { }}
                        productData={productData}
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
                    <SharePopup
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        shareUrl={shareUrl}
                        title={headlineTitle || 'Listing'}
                    />
                </div>

                <aside
                    className={`w-full lg:sticky lg:self-start ${showFloatingBar ? 'lg:top-[76px]' : 'lg:top-[20px]'}`}
                >
                    <MotorCarProfile
                        productData={item}
                        listingItem={listingItem}
                        onShowPhone={openPhoneProtected}
                        onOpenWhatsApp={whatsappUrl ? openWhatsAppProtected : undefined}
                    />
                </aside>
            </div>

            <MotorsFloatingListingBar
                visible={showFloatingBar}
                isRental={showRentalTermsSection}
                displayPrice={displayPrice}
                currencySymbol={currencySymbol}
                headlineTitle={headlineTitle}
                rentalTagline={rentalFloatingTagline}
                yearDisplay={yearDisplay}
                mileageDisplay={mileageDisplay}
                specsRowLabel={specsRowLabel}
                seatingDisplay={seatingFloatingDisplay}
                doorsDisplay={doorsFloatingDisplay}
                baggageDisplay={baggageFloatingDisplay}
                sellerLogo={sellerLogo}
                dealerName={dealerName}
                sellerTypeLabel={sellerTypeLabel}
                verifiedDealer={sellerVerifiedDealer}
                viewAllHref={viewAllCarsHref}
                whatsappUrl={whatsappUrl}
                onOpenPhone={openPhoneProtected}
                onOpenWhatsApp={whatsappUrl ? openWhatsAppProtected : undefined}
            />

            <MotorContactPhoneModal
                open={isPhoneModalOpen}
                onClose={() => setIsPhoneModalOpen(false)}
                sellerName={dealerName}
                sellerLogo={sellerLogo}
                phoneNumber={phoneNumber}
            />

            <MotorTradeInModal
                open={isTradeInModalOpen}
                onClose={() => setIsTradeInModalOpen(false)}
                dealerName={dealerName}
                defaultCarSearch={headlineTitle}
            />
            {loginModal}
        </div>
    )
}
