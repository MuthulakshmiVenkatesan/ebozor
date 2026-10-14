/* eslint-disable react/prop-types */
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { GalleryIcon, FavouriteIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import { allItemApi, similarProductApi } from '@/utils/api'

const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Cars Wishlist', count: 12 },
]

const GAP = 18
const FETCH_PER_PAGE = 12

const LAYOUT_DEFAULT = { cardW: 230, visibleSlots: 3.5, imageH: 150 }
const LAYOUT_MOTOR = { cardW: 252, visibleSlots: 3.35, imageH: 168 }
const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

/** Motors listings: map API `property_type` tokens to `item` query (same as FeaturedSections). */
const MOTOR_ITEM_LABEL_BY_TYPE = {
    usedcar: 'Used Cars',
    newcar: 'New Cars',
    exportcar: 'Export Cars',
    rentalcar: 'Rental Cars',
}

const MOTOR_SUBTYPE_KEYS = Object.keys(MOTOR_ITEM_LABEL_BY_TYPE)

function motorItemFromPropertyTypes(propertyTypes) {
    for (const key of MOTOR_SUBTYPE_KEYS) {
        if (propertyTypes.includes(key)) return MOTOR_ITEM_LABEL_BY_TYPE[key]
    }
    return ''
}

function isMotorSectionPropertyTypes(propertyTypes) {
    return (
        propertyTypes.includes('motor') ||
        propertyTypes.includes('motors') ||
        MOTOR_SUBTYPE_KEYS.some((k) => propertyTypes.includes(k))
    )
}

function parseItemsList(response) {
    const payload = response?.data
    if (!payload || payload.error === true) return []
    const block = payload.data?.data
    return Array.isArray(block) ? block : []
}

function parseSimilarItemsList(response) {
    let payload = response?.data
    if (!payload) return []

    if (typeof payload === 'string') {
        try {
            const clean = payload.split('<script')[0].split('<link')[0].trim()
            if (!clean) return []
            payload = JSON.parse(clean)
        } catch {
            return []
        }
    }

    if (payload.error === true) return []
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items
    if (Array.isArray(payload?.data?.data)) return payload.data.data
    return []
}

function getCategoryId(productData) {
    if (!productData) return null
    const id = productData.category_id ?? productData.category?.id ?? productData.parent_category_id
    if (id === undefined || id === null || id === '') return null
    return id
}

function normalizeListingMode(mode) {
    const m = String(mode || '').trim().toLowerCase()
    if (m === 'property') return 'property'
    if (m === 'furniture' || m === 'mobile') return m
    if (m === 'motors' || m === 'motor') return 'motors'
    return 'classified'
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

/** Same URL rules as Home/FeaturedSections `buildItemDetailHref`. */
function toQueryString(params) {
    return params.toString().replace(/\+/g, '%20')
}

function buildItemDetailHref(slug, propertyTypeRaw, itemCategory = '') {
    const detailSlug = String(slug ?? '').trim()
    if (!detailSlug) return null

    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    const hasNewProject = propertyTypes.includes('newproject')
    const hasPropertyListing = propertyTypes.includes('sale') || propertyTypes.includes('sell') || propertyTypes.includes('rent')
    const hasClassifiedListing =
        propertyTypes.includes('classified') ||
        propertyTypes.includes('furnituregarden') ||
        propertyTypes.includes('mobilestablets')
    const hasMotorListing = isMotorSectionPropertyTypes(propertyTypes)

    const q = new URLSearchParams()
    q.set('slug', detailSlug)

    if (hasNewProject) {
        q.set('mode', 'new-project')
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasMotorListing) {
        q.set('mode', 'motors')
        const fromSubtype = motorItemFromPropertyTypes(propertyTypes)
        const fromCategory = String(itemCategory || '').trim()
        const item = fromSubtype || fromCategory
        if (item) q.set('item', item)
        q.set('carOfWeek', '1')
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasPropertyListing) {
        const purpose = listingPurposeFromApiPropertyType(propertyTypes)
        q.set('mode', 'property')
        q.set('purpose', purpose)
        q.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || LISTING_SLUG_BY_PURPOSE.rent)
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasClassifiedListing) {
        q.set('mode', 'classified')
        const variant = resolveClassifiedVariant(propertyTypes)
        if (variant) q.set('variant', variant)
        return `/productdetail?${toQueryString(q)}`
    }

    return `/productdetail?${toQueryString(q)}`
}

function formatCardPrice(row, currencySymbol) {
    const raw = row?.price ?? row?.amount ?? row?.rent ?? row?.yearly_rent
    if (raw === '' || raw === null || raw === undefined) return '—'
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
    if (!Number.isNaN(n) && n !== 0) {
        return `${currencySymbol} ${n.toLocaleString('en-US')}`
    }
    return String(raw)
}

function cardTitle(row) {
    return String(row?.title || row?.name || row?.listing_title || '').trim() || 'Listing'
}

function cardMakeModelLine(row) {
    const make = String(row?.make ?? row?.manufacturer ?? row?.brand ?? '').trim()
    const model = String(row?.model ?? '').trim()
    if (make && model) return `${make} • ${model}`
    if (make) return make
    if (model) return model
    return ''
}

export default function SimilarProducts({
    productData,
    title,
    items: itemsProp,
    /** `'property'` | `'classified'` | `'furniture'` | `'mobile'` | `'motors'` — drives API filters and detail links */
    mode = 'classified',
    /** Preserved on motor detail links (`?item=`) when `mode` is motors */
    listingItem = '',
    /** `'motor'` — wider cards, title / make • model / price stack (car listings) */
    layout = 'default',
}) {
    const listingMode = normalizeListingMode(mode)
    const isMotorLayout = layout === 'motor'
    const { cardW: CARD_W, visibleSlots: VISIBLE_SLOTS, imageH: IMAGE_H } = isMotorLayout ? LAYOUT_MOTOR : LAYOUT_DEFAULT
    const VISIBLE_FULL = Math.max(1, Math.floor(VISIBLE_SLOTS))

    const defaultTitle =
        listingMode === 'property' ? 'Similar Properties' : listingMode === 'motors' ? 'Similar Cars' : 'Similar Listings'
    const sectionTitle = title ?? defaultTitle

    const router = useRouter()
    const currencySymbol = useSelector((state) => state?.Settings?.data?.data?.currency_symbol ?? 'AED')

    const [fetchedRows, setFetchedRows] = useState([])
    const [loading, setLoading] = useState(true)

    const hasPropItems = Array.isArray(itemsProp) && itemsProp.length > 0

    useEffect(() => {
        if (hasPropItems) {
            setFetchedRows([])
            setLoading(false)
            return
        }

        const catId = getCategoryId(productData)
        const currentId = productData?.id
        if (catId == null || catId === '') {
            setFetchedRows([])
            setLoading(false)
            return
        }
        if (currentId == null || currentId === '') {
            setFetchedRows([])
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)

        const params = {
            category_id: catId,
            page: 1,
            per_page: FETCH_PER_PAGE,
        }
        if (listingMode === 'property') {
            const purpose = productData?.purpose ?? productData?.listing_purpose ?? productData?.transaction_type
            if (purpose) params.purpose = purpose
        }

        ;(async () => {
            try {
                const res = await similarProductApi.getSimilarProducts({
                    category_id: catId,
                    item_id: currentId,
                })
                if (cancelled) return
                let list = parseSimilarItemsList(res)
                if (!Array.isArray(list) || list.length === 0) {
                    // Fallback for environments where similar-product endpoint is unavailable.
                    const fallbackRes = await allItemApi.getItems(params)
                    if (cancelled) return
                    list = parseItemsList(fallbackRes)
                }
                const filtered = list.filter((it) => it?.id != null && it.id !== currentId)
                setFetchedRows(filtered.slice(0, FETCH_PER_PAGE))
            } catch {
                if (!cancelled) setFetchedRows([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [
        hasPropItems,
        productData?.id,
        productData?.category_id,
        productData?.category?.id,
        productData?.purpose,
        productData?.listing_purpose,
        productData?.transaction_type,
        listingMode,
    ])

    const items = useMemo(() => {
        const mapRow = (row) => {
            // Pass row.item_category from the API response — same as FeaturedSections data.item_category.
            // listingItem is kept as a fallback for callers that inject it via prop.
            const href = buildItemDetailHref(
                row?.slug ?? row?.id,
                row?.property_type,
                row?.item_category || listingItem,
            )
            if (!href) return null
            const prePrice = row?.price
            const displayPrice =
                typeof prePrice === 'string' && prePrice.trim() !== ''
                    ? prePrice
                    : formatCardPrice(row, currencySymbol)
            return {
                ...row,
                _href: href,
                _displayPrice: displayPrice,
                _displayTitle: cardTitle(row),
                _makeModel: cardMakeModelLine(row),
            }
        }
        if (hasPropItems) {
            return itemsProp.map(mapRow).filter(Boolean)
        }
        return fetchedRows.map(mapRow).filter(Boolean)
    }, [hasPropItems, itemsProp, fetchedRows, listingItem, currencySymbol])

    const awaitingFetch = !hasPropItems && loading

    const scrollRef = useRef(null)
    const [activePage, setActivePage] = useState(0)
    const [cardSlideById, setCardSlideById] = useState({})
    const [favouriteById, setFavouriteById] = useState({})
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)

    const totalPages = useMemo(() => {
        if (items.length <= VISIBLE_FULL) return 1
        return items.length - VISIBLE_FULL + 1
    }, [items.length])

    const getCardImages = useCallback((it) => {
        const raw = it?.images || it?.image_gallery || it?.gallery || it?.photos || it?.image_urls || []
        const arr = Array.isArray(raw) ? raw : []
        const urls = arr
            .map((v) => {
                if (!v) return ''
                if (typeof v === 'string') return v.trim()
                if (typeof v === 'object') {
                    const u = v.url || v.image || v.src || v.path || v.photo || v.image_url || v.imageUrl
                    return typeof u === 'string' ? u.trim() : ''
                }
                return ''
            })
            .filter(Boolean)
        if (urls.length > 0) return urls
        const one = it?.image
        if (typeof one === 'string' && one.trim()) return [one.trim()]
        return ['/assets/img/car.png']
    }, [])

    const getCardSlideIndex = useCallback((id) => cardSlideById?.[id] || 0, [cardSlideById])
    const setCardSlideIndex = useCallback((id, next) => {
        setCardSlideById((prev) => ({ ...prev, [id]: next }))
    }, [])

    const updateActiveFromScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el || el.children.length === 0) return

        const rtl = getComputedStyle(el).direction === 'rtl'
        const containerRect = el.getBoundingClientRect()
        const anchor = rtl ? containerRect.right : containerRect.left

        let bestIdx = 0
        let bestDist = Infinity
        Array.from(el.children).forEach((child, idx) => {
            const rect = child.getBoundingClientRect()
            const edge = rtl ? rect.right : rect.left
            const dist = Math.abs(edge - anchor)
            if (dist < bestDist) {
                bestDist = dist
                bestIdx = idx
            }
        })

        const last = totalPages - 1
        setActivePage(Math.min(last, Math.max(0, bestIdx)))
    }, [totalPages])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.addEventListener('scroll', updateActiveFromScroll, { passive: true })
        el.addEventListener('scrollend', updateActiveFromScroll)
        return () => {
            el.removeEventListener('scroll', updateActiveFromScroll)
            el.removeEventListener('scrollend', updateActiveFromScroll)
        }
    }, [updateActiveFromScroll])

    useEffect(() => {
        setActivePage(0)
        const el = scrollRef.current
        const first = el?.children?.[0]
        if (first) {
            first.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' })
        }
    }, [items.length])

    const scrollToPage = useCallback(
        (page) => {
            const el = scrollRef.current
            if (!el) return
            const maxPage = totalPages - 1
            const p = Math.min(maxPage, Math.max(0, page))
            const target = el.children[p]
            if (!target) return
            setActivePage(p)
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        },
        [totalPages]
    )

    const canGoPrev = activePage > 0
    const canGoNext = activePage < totalPages - 1
    const headerDotsCount = totalPages

    if (awaitingFetch) {
        return (
            <div className={`mt-[24px] w-full text-start ${isMotorLayout ? 'max-w-full' : ''}`}>
                <div className="mb-[24px] h-[30px] w-[220px] animate-pulse rounded-[8px] bg-[#ECECEC]" />
                <div className="flex gap-[18px] overflow-hidden">
                    {[0, 1, 2, 3].map((k) => (
                        <div key={k} className="shrink-0" style={{ width: CARD_W }}>
                            <div className={`w-full animate-pulse rounded-[14px] bg-[#ECECEC]`} style={{ height: IMAGE_H }} />
                            <div className="mt-[10px] h-[20px] w-[70%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                            <div className="mt-[8px] h-[16px] w-[92%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (items.length === 0) return null

    return (
        <div className={`mt-[24px] w-full text-start ${isMotorLayout ? 'max-w-full' : ''}`}>
            <div className="mb-[24px] flex items-center justify-between gap-[12px] px-[2px]">
                <h3
                    className={
                        isMotorLayout ? 'text-[24px] font-[Inter-Bold] text-[#23262A]' : 'text-[22px] font-[Inter-SemiBold] text-[#000]'
                    }
                >
                    {sectionTitle}
                </h3>
                <div className="flex items-center gap-[8px]">
                    {Array.from({ length: headerDotsCount }).map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => scrollToPage(idx)}
                            className={`h-[8px] w-[8px] cursor-pointer rounded-full transition-colors ${idx === activePage ? 'bg-[#000]' : 'bg-[#D9D9D9]'}`}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            <div
                className="relative w-full"
                style={
                    isMotorLayout
                        ? undefined
                        : {
                              maxWidth:
                                  Math.floor(VISIBLE_SLOTS) * CARD_W +
                                  Math.max(0, Math.floor(VISIBLE_SLOTS) - 1) * GAP +
                                  (VISIBLE_SLOTS % 1) * CARD_W,
                          }
                }
            >
                {canGoPrev ? (
                    <button
                        type="button"
                        onClick={() => scrollToPage(activePage - 1)}
                        className={`absolute z-[5] flex cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${isMotorLayout ? 'start-0 top-[64px] h-[40px] w-[40px]' : 'start-[-10px] top-[56px] h-[34px] w-[34px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]'}`}
                        aria-label="Previous"
                    >
                        <PaginationPrevIcon className="h-[12px] w-[12px] rtl:rotate-180" stroke="#000" />
                    </button>
                ) : null}
                {canGoNext ? (
                    <button
                        type="button"
                        onClick={() => scrollToPage(activePage + 1)}
                        className={`absolute z-[5] flex cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${isMotorLayout ? 'end-0 top-[64px] h-[40px] w-[40px]' : 'end-[-10px] top-[56px] h-[34px] w-[34px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]'}`}
                        aria-label="Next"
                    >
                        <PaginationNextIcon className="h-[12px] w-[12px] rtl:rotate-180" stroke="#000" />
                    </button>
                ) : null}

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto overflow-y-hidden pb-[8px] scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ gap: GAP, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                >
                    {items.map((ad) => {
                        const images = getCardImages(ad)
                        const idx = Math.min(getCardSlideIndex(ad.id), Math.max(images.length - 1, 0))
                        const imageSrc = images[idx]
                        const dotCount = Math.min(images.length, 5)
                        const imageCount = ad?.imageCount ?? images.length
                        const isLiked = Object.prototype.hasOwnProperty.call(favouriteById, ad.id)
                            ? favouriteById[ad.id]
                            : Boolean(ad?.is_liked)

                        return (
                            <div
                                key={ad.id ?? `${ad._displayTitle}-${ad._displayPrice}`}
                                role="link"
                                tabIndex={0}
                                className="block shrink-0 cursor-pointer overflow-hidden rounded-[12px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#3A88EF] focus-visible:ring-offset-2"
                                style={{ width: CARD_W, scrollSnapAlign: 'start' }}
                                onClick={() => router.push(ad._href)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        router.push(ad._href)
                                    }
                                }}
                            >
                                <div
                                    className={`group relative w-full overflow-hidden bg-[#F5F5F5] ${isMotorLayout ? 'rounded-[16px]' : 'rounded-[14px]'}`}
                                    style={{ height: IMAGE_H }}
                                >
                                    <Image
                                        src={imageSrc}
                                        alt={ad._displayTitle || ''}
                                        width={CARD_W}
                                        height={IMAGE_H}
                                        className="h-full w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setFavouriteById((prev) => {
                                                const cur = Object.prototype.hasOwnProperty.call(prev, ad.id)
                                                    ? prev[ad.id]
                                                    : Boolean(ad?.is_liked)
                                                return { ...prev, [ad.id]: !cur }
                                            })
                                            setIsSaveAdsOpen(true)
                                        }}
                                        className="absolute end-[10px] top-[10px] cursor-pointer rounded-full p-[4px]"
                                        aria-label={isLiked ? 'Remove from favourites' : 'Save to list'}
                                        aria-pressed={isLiked}
                                    >
                                        <FavouriteIcon
                                            className="h-[24px] w-[24px]"
                                            fill={isLiked ? '#DC0000' : '#ffffff'}
                                            fillOpacity={isLiked ? 1 : 0.95}
                                            stroke={isLiked ? '#DC0000' : 'transparent'}
                                        />
                                    </button>

                                    <div className="absolute bottom-[10px] start-[10px] flex items-center gap-[4px] rounded-[4px] bg-[rgba(35,38,42,0.75)] p-[3px_5px]">
                                        <GalleryIcon className="h-[14px] w-[14px]" />
                                        <p className="text-[12px] font-[Inter-Medium] text-white">{imageCount}</p>
                                    </div>

                                    {dotCount > 1 ? (
                                        <div className="absolute bottom-[12px] left-1/2 flex -translate-x-1/2 items-center gap-[6px]">
                                            {Array.from({ length: dotCount }).map((_, d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setCardSlideIndex(ad.id, d)}
                                                    className={`cursor-pointer h-[7px] w-[7px] rounded-full ${d === idx ? 'bg-white' : 'bg-white/40'}`}
                                                    aria-label={`Image ${d + 1}`}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                    {images.length > 1 ? (
                                        <>
                                            {idx > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        setCardSlideIndex(ad.id, idx - 1)
                                                    }}
                                                    className="cursor-pointer absolute start-[8px] top-1/2 z-[4] flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.45)] text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                    aria-label="Previous image"
                                                >
                                                    <PaginationPrevIcon className="h-[10px] w-[10px] rtl:rotate-180" stroke="#fff" />
                                                </button>
                                            ) : null}
                                            {idx < images.length - 1 ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        setCardSlideIndex(ad.id, idx + 1)
                                                    }}
                                                    className="cursor-pointer absolute end-[8px] top-1/2 z-[4] flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.45)] text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                    aria-label="Next image"
                                                >
                                                    <PaginationNextIcon className="h-[10px] w-[10px] rtl:rotate-180" stroke="#fff" />
                                                </button>
                                            ) : null}
                                        </>
                                    ) : null}
                                </div>

                                {isMotorLayout ? (
                                    <div className="pt-[12px]">
                                        <h4 className="mb-[6px] line-clamp-2 min-h-[40px] text-[14px] font-[Inter-SemiBold] leading-[20px] text-[#23262A]">
                                            {ad._displayTitle}
                                        </h4>
                                        <p className="mb-[10px] truncate text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                            {ad._makeModel || '—'}
                                        </p>
                                        <p className="text-[16px] font-[Inter-Bold] text-[#23262A]" dir="ltr rtl:dir-ltr">{ad._displayPrice}</p>
                                    </div>
                                ) : (
                                    <div className="pt-[10px]">
                                        <h4 className="mb-[4px] text-[20px] font-[Inter-SemiBold] text-[#000]" dir="ltr rtl:dir-ltr">{ad._displayPrice}</h4>
                                        <p className="truncate text-[16px] font-[Inter-Medium] text-[#000000B2]">{ad._displayTitle}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <SaveAdsModal
                open={isSaveAdsOpen}
                onClose={() => setIsSaveAdsOpen(false)}
                onConfirm={() => setIsSaveAdsOpen(false)}
                onNewList={() => {}}
                lists={SAVE_ADS_LISTS}
                currentListIndex={0}
            />
        </div>
    )
}
