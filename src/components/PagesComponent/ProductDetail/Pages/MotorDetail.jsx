/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FavouriteIcon, LocationIcon, ShareIcon } from '@/components/CustomFile/icons'
import Km from '../../../../../public/assets/img/icons/Km.png'
import Calendar from '../../../../../public/assets/img/icons/Calendar.png'
import MapComponent from '../ClassifiedComponents/MapComponent'
import ReportListingModal from '../components/ReportListingModal'
import mapbg from '../../../../../public/assets/img/mapbg.png'
import SimilarProducts from '../components/SimilarProducts'
import ThumbProductSlider from '../MotorComponents/ThumbProductSlider'
import MotorProfile from '../MotorComponents/MotorProfile'
import {
    inferMotorsParentVerticalItemFromSlugChain,
    resolveMotorsListingItemLabel,
} from '@/utils/motorsListingPaths'
import MotorsCarDetail from './MotorsCarDetail'
import warranty from '../../../../../public/assets/img/icons/warranty.png'
import chatwhite from '../../../../../public/assets/img/icons/chatwhite.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import LoginModal from '@/components/Auth/LoginModal'
import { isLogin } from '@/utils'
import { itemOfferApi } from '@/utils/api'
import { saveOfferData } from '@/redux/reuducer/offerSlice'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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

/**
 * Show Item Overview + Additional Details only for these Motors mega-menu verticals
 * (Motorcycles, Auto Accessories & Parts, Heavy Vehicles, Boats, Number Plates).
 */
function buildMotorsVerticalContext(productData, listingItemFromUrl) {
    const parts = []
    const rawItem = String(listingItemFromUrl || '').trim()
    if (rawItem) {
        try {
            parts.push(decodeURIComponent(rawItem))
        } catch {
            parts.push(rawItem)
        }
    }
    const pd = productData || {}
    const push = (v) => {
        if (v == null || v === '') return
        parts.push(String(v))
    }
    push(pd.category?.translated_name)
    push(pd.category?.name)
    push(pd.category?.slug)
    push(pd.subcategory?.translated_name)
    push(pd.subcategory?.name)
    push(pd.subcategory?.slug)
    push(pd.category_name)
    push(pd.parent_category_name)
    push(pd.motors_vertical)
    push(pd.vertical)
    if (Array.isArray(pd.all_category)) {
        for (const c of pd.all_category) {
            push(c?.translated_name)
            push(c?.name)
            push(c?.slug)
        }
    }
    return parts.join(' ').toLowerCase()
}

/** Cars submenu from Motors mega menu — hide bike-style Item Overview for these. */
function isMotorsCarsSubVertical(contextLower) {
    const s = String(contextLower || '').toLowerCase()
    if (!s.trim()) return false
    if (s.includes('used car') || s.includes('used_cars') || s.includes('used-cars')) return true
    if (
        (s.includes('new car') || s.includes('new_cars') || s.includes('new-cars')) &&
        !s.includes('new project')
    ) {
        return true
    }
    if (s.includes('export car') || s.includes('export_cars') || s.includes('export-cars')) return true
    if (s.includes('rental car') || s.includes('rental_cars') || s.includes('rental-cars')) return true
    if (
        s.includes('economy cars') ||
        s.includes('suv rentals') ||
        s.includes('luxury rentals') ||
        s.includes('monthly rentals') ||
        s.includes('daily rentals') ||
        s.includes('chauffeur')
    ) {
        return true
    }
    return false
}

function matchesMotorSpecialVertical(contextLower) {
    const s = String(contextLower || '').toLowerCase()
    if (!s.trim()) return false

    if (s.includes('motorcycle')) return true
    if (/\b(bike|scooter|cruiser|touring|off-?road|moped)\b/.test(s) && !isMotorsCarsSubVertical(s)) return true
    const hasAccessoriesPhrase =
        s.includes('auto accessories') ||
        s.includes('auto accessory') ||
        s.includes('auto_accessories') ||
        s.includes('auto-accessories')
    const hasPartsWord = /\bparts?\b/i.test(s)
    if (hasAccessoriesPhrase || (s.includes('accessories') && hasPartsWord)) {
        return true
    }
    if (s.includes('heavy vehicle') || s.includes('heavy_vehicles') || s.includes('heavy-vehicles')) return true
    if (/\bboats?\b/i.test(s)) return true
    if (s.includes('number plate') || s.includes('number_plates') || s.includes('number-plates')) return true
    return false
}

function shouldShowMotorItemOverviewSections(contextLower) {
    const s = String(contextLower || '').toLowerCase()
    if (!s.trim()) return false
    if (isMotorsCarsSubVertical(s)) return false
    return matchesMotorSpecialVertical(s)
}

function toPlainDescription(raw) {
    if (!raw) return ''
    const str = String(raw)
    return str
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function looksLikeHtml(str) {
    return typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str)
}

function parseCoordinate(v) {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}

function extractImageUrl(v) {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object') {
        return firstTruthy(v.url, v.path, v.image, v.src, v.original, v.thumbnail)
    }
    return ''
}

function formatListingPriceHeaderLine(productData, currencySymbol = 'AED') {
    const pd = productData || {}
    const raw = firstTruthy(pd.price, pd.amount, pd.selling_price, pd.ask_price, pd.rent)
    if (raw === '' || raw == null) return '—'
    const sym = String(currencySymbol || 'AED').trim() || 'AED'
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n !== 0) {
        return `${sym} ${n.toLocaleString('en-US')}`
    }
    return String(raw)
}

/** e.g. "Posted 8 days ago" — motors accessory / parts detail header. */
function formatPostedRelativeLabel(raw) {
    if (raw === undefined || raw === null || raw === '') return ''
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return ''
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diffDays < 0) return ''
    if (diffDays === 0) return 'Posted today'
    if (diffDays === 1) return 'Posted 1 day ago'
    if (diffDays < 7) return `Posted ${diffDays} days ago`
    if (diffDays < 30) {
        const w = Math.floor(diffDays / 7)
        return w === 1 ? 'Posted 1 week ago' : `Posted ${w} weeks ago`
    }
    if (diffDays < 365) {
        const m = Math.floor(diffDays / 30)
        return m === 1 ? 'Posted 1 month ago' : `Posted ${m} months ago`
    }
    const y = Math.floor(diffDays / 365)
    return y === 1 ? 'Posted 1 year ago' : `Posted ${y} years ago`
}

function formatKm(raw) {
    if (raw === undefined || raw === null || raw === '') return ''
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n >= 0) return n.toLocaleString('en-US')
    return String(raw).trim()
}

function OverviewCard({ label, value, iconSrc, iconAlt }) {
    const showIcon = Boolean(iconSrc)
    return (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-[10px] rounded-[6px] bg-white p-[16px] text-center shadow-[0_0_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)]">
            <h4 className="text-[12px] font-[Inter-SemiBold] uppercase tracking-wide text-[#2B2D2E]">{label}</h4>
            {showIcon ? (
                <Image src={iconSrc} alt={iconAlt || ''} width={30} height={30} className="h-[30px] w-[30px] object-contain" />
            ) : null}
            <p
                className={`w-full max-w-full h-full text-[14px] text-[#2B2D2E] font-[Inter-Regular] ${label === 'USAGE' ? '' : ''
                    }`}
            >
                {value || '—'}
            </p>
        </div>
    )
}

function DetailRow({ label, value }) {
    return (
        <div className="grid grid-cols-2 gap-[20px] border-b border-[rgba(143,143,143,0.22)] p-[20px_24px] last:border-b-0">
            <h4 className="min-w-0 shrink-0 text-[14px] font-[Inter-SemiBold] text-[#23262A]">{label}</h4>
            <p className="min-w-0 text-[14px] font-[Inter-Regular] text-[#23262A]">{value || '—'}</p>
        </div>
    )
}

function MotorShowMapCard({ onClick }) {
    return (
        <div
            onClick={onClick}
            className='cursor-pointer w-[350px] h-[96px]'
            style={{
                backgroundImage: `url(${mapbg.src})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="relative flex h-full items-center justify-start gap-[10px] px-[60px]">
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Show Map</p>
            </div>
        </div>
    )
}

/**
 * Motors listing detail: Item Overview cards + Additional Details (maps API / custom_fields + common keys).
 * Those blocks render only when the listing is under Motorcycles, Auto Accessories & Parts,
 * Heavy Vehicles, Boats, or Number Plates (from `listingItem` URL param and/or product categories).
 */
export default function MotorDetail({ productData = {}, listingItem = '', mode, slug, carOfWeekFromQuery = false }) {
    const item = productData || {}
    const categorySlugsFromProduct = useMemo(() => {
        const slugs = []
        const push = (v) => {
            const s = String(v || '').trim()
            if (s) slugs.push(s)
        }
        push(item?.category?.slug)
        push(item?.subcategory?.slug)
        if (Array.isArray(item?.all_category)) {
            for (const c of item.all_category) push(c?.slug)
        }
        return slugs
    }, [item])
    const effectiveListingItem = useMemo(() => {
        const fromProduct = inferMotorsParentVerticalItemFromSlugChain(categorySlugsFromProduct)
        return (
            resolveMotorsListingItemLabel({
                categorySlug: item?.category?.slug || item?.subcategory?.slug || '',
                itemParam: listingItem,
                categorySlugs: categorySlugsFromProduct,
            }) ||
            fromProduct ||
            listingItem
        )
    }, [categorySlugsFromProduct, item?.category?.slug, item?.subcategory?.slug, listingItem])
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [mapExpanded, setMapExpanded] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [showFloatingHeader, setShowFloatingHeader] = useState(false)
    const [isSaved, setIsSaved] = useState(Boolean(item?.is_liked))
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [isMailSentOpen, setIsMailSentOpen] = useState(false)
    const [isStartingChat, setIsStartingChat] = useState(false)
    const floatingSentinelRef = useRef(null)
    const sellerActionsRef = useRef(null)
    const router = useRouter()
    const loggedInUser = useSelector(userSignUpData)
    const loggedInUserId = firstTruthy(loggedInUser?.id, loggedInUser?.data?.id, loggedInUser?.user?.id)
    const sellerUserId = useMemo(() => {
        const user = item?.user && typeof item.user === 'object' ? item.user : null
        return firstTruthy(item?.user_id, item?.seller_id, user?.id)
    }, [item])
    const showChatWithSeller = useMemo(() => {
        if (!loggedInUserId || !sellerUserId) return true
        return Number(loggedInUserId) !== Number(sellerUserId)
    }, [loggedInUserId, sellerUserId])
    const verticalContext = useMemo(
        () => buildMotorsVerticalContext(productData, effectiveListingItem),
        [productData, effectiveListingItem]
    )
    const showOverviewSections = useMemo(() => shouldShowMotorItemOverviewSections(verticalContext), [verticalContext])
    const isCarsVertical = useMemo(() => isMotorsCarsSubVertical(verticalContext), [verticalContext])
    const isAccessoriesVertical = useMemo(() => {
        const s = String(verticalContext || '').toLowerCase()
        if (!s.trim()) return false
        const hasAccessoriesPhrase =
            s.includes('auto accessories') ||
            s.includes('auto accessory') ||
            s.includes('auto_accessories') ||
            s.includes('auto-accessories')
        const hasPartsWord = /\bparts?\b/i.test(s)
        return hasAccessoriesPhrase || (s.includes('accessories') && hasPartsWord)
    }, [verticalContext])
    const isHeavyVehicleVertical = useMemo(() => {
        const s = String(verticalContext || '').toLowerCase()
        if (!s.trim()) return false
        return (
            s.includes('heavy vehicle') ||
            s.includes('heavy_vehicles') ||
            s.includes('heavy-vehicles') ||
            s.includes('trucks') ||
            s.includes('buses')
        )
    }, [verticalContext])
    const isBoatsVertical = useMemo(() => {
        const s = String(verticalContext || '').toLowerCase()
        if (!s.trim()) return false
        return /\bboats?\b/i.test(s) || s.includes('yacht') || s.includes('jet ski') || s.includes('jet-ski')
    }, [verticalContext])
    const isNumberPlatesVertical = useMemo(() => {
        const s = String(verticalContext || '').toLowerCase()
        if (!s.trim()) return false
        return (
            s.includes('number plate') ||
            s.includes('number_plates') ||
            s.includes('number-plates') ||
            s.includes('plates')
        )
    }, [verticalContext])

    const customFieldRows = useMemo(() => {
        const rows = Array.isArray(item?.custom_fields) ? item.custom_fields : []
        return rows.map((row, idx) => {
            const rawValue = row?.custom_field_value?.value ?? row?.value
            const value = Array.isArray(rawValue)
                ? rawValue.filter((v) => v != null && String(v).trim() !== '').join(', ')
                : rawValue != null && String(rawValue).trim() !== ''
                    ? String(rawValue).trim()
                    : ''
            return {
                label: String(row?.name || '').trim() || `Field ${idx + 1}`,
                value: value || '—',
            }
        })
    }, [item])

    const overviewRows = useMemo(() => customFieldRows.slice(0, 5), [customFieldRows])
    const additionalRows = useMemo(() => customFieldRows.slice(5), [customFieldRows])

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
    const DESCRIPTION_PREVIEW_CHARS = 220
    const hasLongDescription =
        hasDescription && String(plainDescription).trim().length > DESCRIPTION_PREVIEW_CHARS

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
    const canShowMap = latitude !== null && longitude !== null
    const showLocationSection = Boolean(String(locationText || '').trim()) || canShowMap
    const showAdditionalDetailsSection =
        !isAccessoriesVertical && !isBoatsVertical && !isNumberPlatesVertical && !isCarsVertical

    const listingTitle = useMemo(
        () => String(firstTruthy(item.title, item.name, item.listing_title, 'Listing') || '').trim() || 'Listing',
        [item]
    )

    const currencySymbol = useMemo(
        () => firstTruthy(item.currency_symbol, item.currency, 'AED'),
        [item]
    )

    const headerPriceLine = useMemo(
        () => formatListingPriceHeaderLine(item, currencySymbol),
        [item, currencySymbol]
    )

    const postedRelativeLabel = useMemo(
        () =>
            formatPostedRelativeLabel(
                firstTruthy(item.created_at, item.posted_at, item.published_at, item.updated_at, item.createdAt)
            ),
        [item]
    )

    const floatingHeaderImage = useMemo(
        () =>
            firstTruthy(
                extractImageUrl(item?.featured_image),
                extractImageUrl(item?.main_image),
                extractImageUrl(item?.thumbnail),
                extractImageUrl(item?.image),
                extractImageUrl(item?.photo),
                extractImageUrl(item?.images?.[0]),
                extractImageUrl(item?.gallery?.[0]),
                extractImageUrl(item?.galleries?.[0]),
                '/assets/img/classified/1.png'
            ),
        [item]
    )

    const shareUrl = useMemo(() => {
        const detailSlug = String(firstTruthy(item.slug, item.id, slug) || '')
        const base = (process.env.NEXT_PUBLIC_WEB_URL || '').replace(/\/$/, '')
        const itemQ = effectiveListingItem
            ? `&item=${encodeURIComponent(String(effectiveListingItem))}`
            : ''
        if (!base) return `/productdetail?slug=${encodeURIComponent(detailSlug)}&mode=motors${itemQ}`
        return `${base}/productdetail?slug=${encodeURIComponent(detailSlug)}&mode=motors${itemQ}`
    }, [item, slug, effectiveListingItem])

    const scrollToSellerActions = () => {
        if (!isLogin()) {
            setIsLoginModalOpen(true)
            return
        }
        const el = sellerActionsRef.current
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleFavouriteClick = () => {
        if (isLogin()) {
            setIsSaved((v) => !v)
            return
        }
        setIsLoginModalOpen(true)
    }

    const handleChatWithSeller = async () => {
        if (!isLogin()) {
            setIsLoginModalOpen(true)
            return
        }

        if (isStartingChat) return

        try {
            setIsStartingChat(true)
            if (!item?.is_already_offered) {
                const response = await itemOfferApi.offer({
                    item_id: item?.id,
                })
                const data = response?.data?.data
                if (data) saveOfferData(data)
            } else {
                const existingOffers = Array.isArray(item?.item_offers) ? item.item_offers : []
                const offer = existingOffers.find((it) => Number(loggedInUserId) === Number(it?.buyer_id))
                const selectedChat = {
                    amount: offer?.amount,
                    id: offer?.id,
                    item: {
                        status: item?.status,
                        price: item?.price,
                        image: item?.image,
                        name: item?.name,
                        review: null,
                    },
                    user_blocked: false,
                    item_id: item?.id,
                    seller: {
                        profile: item?.user?.profile,
                        name: item?.user?.name,
                        id: item?.user?.id,
                    },
                    tab: 'buying',
                }
                saveOfferData(selectedChat)
            }
            router.push('/chat')
        } catch (error) {
            toast.error('Unable to start the chat')
            // eslint-disable-next-line no-console
            console.error(error)
        } finally {
            setIsStartingChat(false)
        }
    }

    useEffect(() => {
        const el = floatingSentinelRef.current
        if (!el) return undefined
        const io = new IntersectionObserver(
            ([entry]) => {
                const r = entry.boundingClientRect
                if (entry.isIntersecting) {
                    setShowFloatingHeader(false)
                    return
                }
                setShowFloatingHeader(r.bottom <= 0)
            },
            { root: null, rootMargin: '0px', threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    if (!showOverviewSections && !isCarsVertical) {
        return null
    }

    return (
        <div className="w-full">
            {isCarsVertical ? (

                <MotorsCarDetail
                    productData={productData}
                    listingItem={effectiveListingItem}
                    mode={mode}
                    carOfWeekFromQuery={carOfWeekFromQuery}
                />

            ) : (
                <div>
                    <div
                        className={`fixed inset-x-0 top-0 z-[40] flex justify-center bg-[#fff] p-[20px] shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] transition-[transform,opacity] duration-200 ${showFloatingHeader ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
                            }`}
                    >
                        <div className="flex w-full max-w-[1170px] items-start justify-between gap-[12px] max-sm:flex-col max-sm:items-start ">
                            <div className="flex min-w-0 items-center gap-[20px] flex-1">
                                <div className="relative h-[116px] w-[116px] shrink-0 overflow-hidden rounded-[8px]  ">
                                    <Image src={floatingHeaderImage} alt={listingTitle} width={116} height={116} className="w-[116px] h-[116px] object-cover"  />
                                </div>
                                <div className="flex flex-col gap-[12px] min-w-0">
                                    <h4 className="text-[20px] font-[Inter-SemiBold] text-[#23262A] leading-[20px] truncate">
                                    {listingTitle}</h4>
                                    <p className="text-[18px] font-[Inter-Medium] text-[#DC0000] truncate">
                                       
                                        <span className="font-[Inter-Bold] text-[20px]"> {headerPriceLine}</span>
                                    </p>
                                    <div className="flex items-center gap-[8px] max-sm:flex-wrap">
                                        <button
                                            type="button"
                                            onClick={handleFavouriteClick}
                                            className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
                                        >
                                            <FavouriteIcon
                                                className="h-[14px] w-[14px]"
                                                fill={isSaved ? '#DC0000' : '#fff'}
                                                stroke={isSaved ? '#DC0000' : '#23262A'}
                                            />
                                            <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Favorite</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsShareOpen(true)}
                                            className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
                                        >
                                            <ShareIcon className="h-[14px] w-[14px]" fill="#23262A" />
                                            <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Share</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="max-sm:w-full flex flex-col gap-[18px]">
                                {showChatWithSeller ? (
                                    <button
                                        type="button"
                                        onClick={handleChatWithSeller}
                                        disabled={isStartingChat}
                                        className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#DC0000] p-[12px_80px] text-[14px] font-[Inter-Bold] text-white transition-opacity hover:opacity-95 max-sm:p-[12px]"
                                    >
                                        <Image src={chatwhite} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
                                        Chat With Seller
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={scrollToSellerActions}
                                    className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#fff] p-[12px_80px] text-[14px] font-[Inter-Bold] text-[#23262A] border border-[#23262A] transition-opacity hover:opacity-95 max-sm:p-[12px]"
                                >
                                    <Image src={phoneOutline} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
                                    Show Number
                                </button>
                            </div>
                        </div>
                    </div>

                    <header className="flex flex-wrap items-start justify-between gap-[16px] border-t border-[rgba(143,143,143,0.22)] py-[24px]">
                        <div className="min-w-0 flex-1 pr-[8px]">
                            <h1 className="text-[20px] font-[Inter-SemiBold] uppercase leading-[1.25] tracking-[0.02em] text-[#23262A] truncate">
                                {listingTitle}
                            </h1>
                            {postedRelativeLabel ? (
                                <p className="text-[14px] font-[Inter-Regular] leading-snug text-[#23262A]">
                                    {postedRelativeLabel}
                                </p>
                            ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[20px] font-[Inter-Bold] leading-tight text-[#DC0000]">
                                {headerPriceLine}
                            </p>
                        </div>
                    </header>
                    <div className="grid grid-cols-[1fr_350px] gap-[20px] max-sm:grid-cols-1 products_grid">
                        <div className="min-w-0">


                            <ThumbProductSlider
                                productData={productData}
                                slug={slug}
                                verticalHint={
                                    isCarsVertical
                                        ? 'cars'
                                        : isNumberPlatesVertical
                                            ? 'plates'
                                            : isBoatsVertical
                                                ? 'boats'
                                                : isHeavyVehicleVertical
                                                    ? 'heavy'
                                                    : isAccessoriesVertical
                                                        ? 'accessories'
                                                        : 'motorcycles'
                                }
                            />


                            <div ref={floatingSentinelRef} className="pointer-events-none h-[1px] w-full shrink-0" aria-hidden />

                            <div className="mb-[32px]">
                                <h2 className="mb-[18px] text-[18px] font-[Inter-Bold] text-[#23262a]">Item Overview</h2>
                                <div className="grid grid-cols-5 gap-[12px] max-sm:grid-cols-1">
                                    {overviewRows.length > 0 ? (
                                        overviewRows.map((row) => {
                                            const lowerLabel = String(row.label || '').toLowerCase()
                                            const showKmIcon =
                                                lowerLabel === 'kilometers' ||
                                                lowerLabel === 'kilometer' ||
                                                lowerLabel === 'km' ||
                                                lowerLabel === 'mileage'
                                            const showCalendarIcon =
                                                lowerLabel === 'year' ||
                                                lowerLabel === 'model year'

                                            return (
                                                <OverviewCard
                                                    key={row.label}
                                                    label={row.label}
                                                    value={row.value}
                                                    iconSrc={showKmIcon ? Km : showCalendarIcon ? Calendar : undefined}
                                                    iconAlt=""
                                                />
                                            )
                                        })
                                    ) : (
                                        <OverviewCard label="Field 1" value="—" />
                                    )}
                                </div>
                            </div>


                            {showAdditionalDetailsSection ? (
                                <div className="border-b border-[rgba(143,143,143,0.22)] pb-[40px]">
                                    <h2 className="mb-[18px] text-[18px] font-[Inter-Bold] text-[#23262a]">Additional Details</h2>
                                    <div className="">
                                        {additionalRows.length > 0 ? (
                                            additionalRows.map((row) => (
                                                <DetailRow key={row.label} label={row.label} value={row.value} />
                                            ))
                                        ) : (
                                            <DetailRow label="—" value="—" />
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {hasDescription ? (
                                <div className="border-b border-[rgba(143,143,143,0.22)] py-[30px]">
                                    <h2 className="mb-[18px] text-[18px] font-[Inter-Bold] text-[#23262A]">Description</h2>
                                    {isDescriptionExpanded && descriptionIsHtml ? (
                                        <div
                                            className="motor-detail-description text-[14px] font-[Inter-Regular] text-[#23262A] [&_p]:mb-[12px] [&_ul]:mb-[12px] [&_ul]:list-disc [&_ul]:pl-[22px] [&_ul]:space-y-[6px] [&_strong]:font-[Inter-SemiBold]"
                                            dangerouslySetInnerHTML={{ __html: String(rawDescription) }}
                                        />
                                    ) : (
                                        <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            {hasLongDescription && !isDescriptionExpanded
                                                ? `${String(plainDescription).slice(0, DESCRIPTION_PREVIEW_CHARS).trim()}…`
                                                : plainDescription}
                                        </p>
                                    )}
                                    {hasLongDescription ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsDescriptionExpanded((v) => !v)}
                                            className="mt-[6px] cursor-pointer rounded-full bg-[#FFECEC] p-[2px_10px] text-[14px] font-[Inter-SemiBold] text-[#E00000] transition-colors hover:bg-[#E00000] hover:text-white"
                                        >
                                            {isDescriptionExpanded ? 'Hide full description' : 'See full description'}
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}

                            {showLocationSection ? (
                                <div
                                    className={`border-b border-[rgba(143,143,143,0.22)] py-[30px] ${mapExpanded ? '' : 'flex flex-col gap-[20px] sm:flex-row sm:items-start sm:justify-between'}`}
                                >
                                    <div className="min-w-0">
                                        <h2 className="mb-[18px] text-[18px] font-[Inter-Bold] text-[#23262A]">Location</h2>
                                        <div className="flex items-start gap-[4px]">
                                            <LocationIcon
                                                className="mt-[2px] h-[18px] w-[18px] shrink-0"
                                                width={18}
                                                height={18}
                                                stroke="#23262A"
                                            />
                                            <p className="min-w-0 text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                {String(locationText || '').trim() || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    {canShowMap && !mapExpanded ? (
                                        <MotorShowMapCard onClick={() => setMapExpanded(true)} />
                                    ) : null}
                                    {canShowMap && mapExpanded ? (
                                        <div className="mt-[40px] w-full">
                                            <div className="relative h-[360px] w-full overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.25)]">
                                                <MapComponent
                                                    latitude={latitude}
                                                    longitude={longitude}
                                                    initialExpanded
                                                    suppressToggleButton
                                                    fullWidth
                                                    height="360px"
                                                    previewHeight="360px"
                                                    onToggleShowMap={(open) => {
                                                        if (!open) setMapExpanded(false)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="py-[30px] text-left rtl:text-right">
                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Is there an issue?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsReportOpen(true)}
                                        className="cursor-pointer text-[16px] font-[Inter-SemiBold] text-[#E00000] hover:underline"
                                    >
                                        Report this ad
                                    </button>
                                </p>
                            </div>

                            <SimilarProducts productData={productData} mode={mode} />

                        </div>
                        <div ref={sellerActionsRef}>
                            <MotorProfile
                                productData={productData}
                                onChat={handleChatWithSeller}
                                onShowPhone={scrollToSellerActions}
                                showChatWithSeller={showChatWithSeller}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ReportListingModal
                open={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                brandName="ebozor"
                mode={mode}
                onSubmitReport={() => { }}
                productData={productData}
            />
            <SharePopup
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                shareUrl={shareUrl}
                title={listingTitle || 'Listing'}
            />
            <LoginModal
                IsLoginModalOpen={isLoginModalOpen}
                setIsLoginModalOpen={setIsLoginModalOpen}
                IsRegisterModalOpen={isRegisterModalOpen}
                setIsRegisterModalOpen={setIsRegisterModalOpen}
                IsMailSentOpen={isMailSentOpen}
                setIsMailSentOpen={setIsMailSentOpen}
                openSentMailModal={() => {
                    setIsLoginModalOpen(false)
                    setIsMailSentOpen(true)
                }}
            />
        </div>
    )
}
