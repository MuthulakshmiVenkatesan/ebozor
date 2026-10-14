'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    CategoryIcon,
    FavouriteIcon,
    PaginationNextIcon,
    PaginationPrevIcon,
} from '@/components/CustomFile/icons'
import { formatPriceAbbreviated } from '@/utils'
import { FeaturedSectionApi } from '@/utils/api'

const CARD_W = 224
const IMG_H = 168
const GAP = 14

const EMPTY_AGENCY_IMAGE =
    'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

const PLACEHOLDER_PROPERTY_IMAGE =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=448&q=80'

const parseApiPayload = (payload) => {
    if (typeof payload === 'string') {
        const scriptIndex = payload.indexOf('<script')
        const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim()
        if (!jsonText) return {}
        try {
            return JSON.parse(jsonText)
        } catch (e) {
            console.error('Property featured parse failed:', e)
            return {}
        }
    }
    return payload || {}
}

const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

/**
 * API `property_type` e.g. `["sale"]` | `["rent"]` — drives productdetail `item` / `purpose`.
 */
function listingPurposeFromApiPropertyType(propertyType, fallbackPurpose) {
    const fb = fallbackPurpose === 'sale' ? 'sale' : 'rent'
    if (propertyType == null) return fb
    const parts = Array.isArray(propertyType) ? propertyType : [propertyType]
    const first = parts
        .map((x) => String(x ?? '').trim().toLowerCase())
        .find((s) => s.length > 0)
    if (!first) return fb
    if (first === 'sale' || first === 'sell') return 'sale'
    if (first === 'rent') return 'rent'
    return fb
}

function hasNewProjectPropertyType(propertyType) {
    const parts = Array.isArray(propertyType) ? propertyType : [propertyType]
    return parts
        .map((x) => String(x ?? '').trim().toLowerCase())
        .some((x) => x === 'newproject')
}

/** Matches backend filter shape `property_type: ["sale"]` | `["rent"]` on get-item. */
function appendListingPropertyTypeFilter(q, purpose) {
    const p = purpose === 'sale' ? 'sale' : 'rent'
    q.set('filters[property_type]', JSON.stringify([p]))
}

function buildPropertySeeMoreHref(purpose) {
    const p = purpose === 'sale' ? 'sale' : 'rent'
    const item = LISTING_SLUG_BY_PURPOSE[p] || 'property-for-rent'
    const q = new URLSearchParams({
        mode: 'property',
        purpose: p,
        item,
    })
    appendListingPropertyTypeFilter(q, purpose)
    return `/products?${q.toString()}`
}

/**
 * Normalizes featured-section API payloads (string JSON, { data: [] }, or { data: { data: [] } }).
 */
function extractSectionDataRows(payloadRoot) {
    const parsed = parseApiPayload(payloadRoot)
    if (Array.isArray(parsed?.data?.section_data)) {
        return parsed.data.section_data
    }
    if (Array.isArray(parsed?.section_data)) {
        return parsed.section_data
    }
    let sections = parsed?.data
    if (!Array.isArray(sections) && Array.isArray(parsed?.data?.data)) {
        sections = parsed.data.data
    }
    if (!Array.isArray(sections) && Array.isArray(payloadRoot?.data) && !payloadRoot?.section_data) {
        sections = payloadRoot.data
    }
    if (!Array.isArray(sections)) return []

    let section0 = sections[0] ?? null
    let sectionData = Array.isArray(section0?.section_data) ? section0.section_data : []

    const withData = sections.find((s) => Array.isArray(s?.section_data) && s.section_data.length > 0)
    if (withData) {
        section0 = withData
        sectionData = withData.section_data
    }

    return Array.isArray(sectionData) ? sectionData : []
}

function pickListingImage(item) {
    const raw =
        item?.image ||
        item?.photo ||
        item?.main_image ||
        item?.thumbnail ||
        item?.thumb ||
        item?.image_url ||
        item?.imageUrl ||
        (Array.isArray(item?.images) && item.images[0]) ||
        (Array.isArray(item?.gallery) && item.gallery[0])
    if (raw && typeof raw === 'object') {
        const guess = raw?.url || raw?.src || raw?.path || raw?.image || ''
        return typeof guess === 'string' && guess.trim() ? guess.trim() : ''
    }
    return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
}

function formatSpecs(item) {
    const parts = []
    if (item.beds != null && item.beds > 0) {
        parts.push(`${item.beds} Bed`)
    } else if (item.beds === 0) {
        parts.push('Studio')
    }
    if (item.baths != null) parts.push(`${item.baths} Baths`)
    if (item.sqft != null) parts.push(`${item.sqft.toLocaleString()} SqFt`)
    return parts.length ? parts.join(' • ') : ''
}

/**
 * Featured property cards row — matches property landing carousel (image, heart, photo count, price, agency, specs, footer).
 * Pass `items` from API; map fields: slug, image, price, title, beds, baths, sqft, location, postedAgo or created_at, imageCount, agencyLogo, is_liked.
 */
const PropertyFeaturedProperties = ({
    items: itemsProp,
    purpose = 'rent',
    seeMoreHref: seeMoreHrefProp,
}) => {
    const seeMoreHref = seeMoreHrefProp ?? buildPropertySeeMoreHref(purpose)
    const isRent = purpose === 'rent'
    const [apiItems, setApiItems] = useState([])
    const items = apiItems.length > 0
        ? apiItems
        : (Array.isArray(itemsProp) && itemsProp.length > 0 ? itemsProp : [])
    const scrollRef = useRef(null)
    const [canPrev, setCanPrev] = useState(false)
    const [canNext, setCanNext] = useState(true)
    const [favouriteById, setFavouriteById] = useState({})

    const systemSettingsData = useSelector((state) => state?.Settings)
    const selectedCity = useSelector((state) => state?.Location?.cityData?.city || '')
    const currencySymbol = systemSettingsData?.data?.data?.currency_symbol ?? 'AED'

    const timeAgo = useCallback((iso) => {
        if (!iso) return ''
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return ''
        const diffMs = Date.now() - d.getTime()
        const minutes = Math.floor(diffMs / 60000)
        if (minutes <= 0) return 'Just now'
        if (minutes < 60) return `${minutes} minutes ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} hours ago`
        const days = Math.floor(hours / 24)
        return `${days} days ago`
    }, [])

    useEffect(() => {
        const fetchFeaturedProperties = async () => {
            try {
                const slug = isRent ? 'property-for-rent' : 'property-for-sale'
                const tryFetch = (params) => FeaturedSectionApi.getFeaturedSections(params)

                let sectionData = extractSectionDataRows(
                    (await tryFetch({ category_id: 3, slug }))?.data
                )
                if (!sectionData.length) {
                    sectionData = extractSectionDataRows((await tryFetch({ category_id: 3 }))?.data)
                }
                if (!sectionData.length) {
                    sectionData = extractSectionDataRows(
                        (await tryFetch({ category_id: 3, filter: 'category_criteria' }))?.data
                    )
                }

                if (!sectionData.length) {
                    setApiItems([])
                    return
                }

                const mapped = sectionData.map((item, idx) => {
                    const customFields = Array.isArray(item?.item_custom_field_values)
                        ? item.item_custom_field_values
                        : []

                    const getCustomValueByName = (fieldName) => {
                        const found = customFields.find(
                            (cf) => (cf?.custom_field?.name || '').toLowerCase() === fieldName.toLowerCase()
                        )
                        const v = found?.value
                        if (Array.isArray(v)) return v[0]
                        return v
                    }

                    const beds = Number(getCustomValueByName('Bedrooms'))
                    const baths = Number(getCustomValueByName('Bathrooms'))
                    const sqft = Number(getCustomValueByName('Size(Sqft)'))

                    const img = pickListingImage(item)
                    const galleryLen = Array.isArray(item?.images)
                        ? item.images.length
                        : Array.isArray(item?.gallery)
                          ? item.gallery.length
                          : null

                    return {
                        id: item?.id ?? item?.slug ?? `featured-${idx}`,
                        slug: item?.slug,
                        property_type: item?.property_type,
                        image: img || PLACEHOLDER_PROPERTY_IMAGE,
                        price: item?.price,
                        title: item?.name || '',
                        titleFull: item?.name || '',
                        beds: Number.isFinite(beds) ? beds : undefined,
                        baths: Number.isFinite(baths) ? baths : undefined,
                        sqft: Number.isFinite(sqft) ? sqft : undefined,
                        location: item?.city || item?.state || item?.country || '',
                        postedAgo: timeAgo(item?.created_at),
                        imageCount: galleryLen != null && galleryLen > 0 ? galleryLen : 1,
                        agencyLogo: item?.agencyLogo || item?.agency_image || '',
                        is_liked: item?.is_liked,
                        listingPurpose: listingPurposeFromApiPropertyType(item?.property_type, purpose),
                    }
                })

                setApiItems(mapped)
            } catch (e) {
                setApiItems([])
            }
        }

        fetchFeaturedProperties()
    }, [timeAgo, selectedCity, isRent])

    const updateArrows = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        const max = scrollWidth - clientWidth
        setCanPrev(scrollLeft > 2)
        setCanNext(scrollLeft < max - 2)
    }, [])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateArrows()
        el.addEventListener('scroll', updateArrows, { passive: true })
        el.addEventListener('scrollend', updateArrows)
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null
        if (ro) ro.observe(el)
        return () => {
            el.removeEventListener('scroll', updateArrows)
            el.removeEventListener('scrollend', updateArrows)
            ro?.disconnect()
        }
    }, [updateArrows, items.length])

    const scrollStep = useCallback((dir) => {
        const el = scrollRef.current
        if (!el) return
        el.scrollBy({ left: (CARD_W + GAP) * dir, behavior: 'smooth' })
    }, [])

    const resolveHref = (item) => {
        if (item.href) return item.href
        const raw = item.slug ?? item.id
        if (raw == null || String(raw).trim() === '') return seeMoreHref || '/products'
        const q = new URLSearchParams()
        q.set('slug', String(raw).trim())
        if (hasNewProjectPropertyType(item?.property_type)) {
            q.set('mode', 'new-project')
            return `/productdetail?${q.toString()}`
        }
        q.set('mode', 'property')
        const p = listingPurposeFromApiPropertyType(item?.property_type ?? item?.listingPurpose, purpose)
        q.set('purpose', p)
        q.set('item', LISTING_SLUG_BY_PURPOSE[p] || LISTING_SLUG_BY_PURPOSE.rent)
        return `/productdetail?${q.toString()}`
    }

    return (
        <section className="w-full mb-[50px]">
            <div className="flex items-center justify-between mb-[30px]">
                <h2 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                    Featured Properties
                </h2>
                <Link
                    href={seeMoreHref}
                    prefetch={false}
                    className="inline-flex items-center gap-[6px] text-[13px] font-[Inter-Medium] text-[#DC0000] hover:underline"
                >
                    <span className="text-right">
                        See more Property for {isRent ? 'Rent' : 'Sale'} listings
                    </span>
                    <CategoryIcon className="h-[14px] w-[14px] shrink-0 [&_path]:fill-[#DC0000]" />
                </Link>
            </div>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => scrollStep(-1)}
                    disabled={!canPrev}
                    className="cursor-pointer absolute left-[2px] top-[84px] z-[5] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    aria-label="Previous listings"
                >
                    <PaginationPrevIcon className="h-[16px] w-[16px]" stroke="#000" />
                </button>
                <button
                    type="button"
                    onClick={() => scrollStep(1)}
                    disabled={!canNext}
                    className="cursor-pointer absolute right-[2px] top-[84px] z-[5] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    aria-label="Next listings"
                >
                    <PaginationNextIcon className="h-[16px] w-[16px]" stroke="#000" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{
                        gap: GAP,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {items.map((item, idx) => {
                        const displayTitle = item.title || item.name || ''
                        const fullTitle = item.titleFull || displayTitle
                        const imageCount = item.imageCount ?? item.images?.length ?? 1
                        const rowKey = String(item.id ?? item.slug ?? `row-${idx}`)
                        const isLiked = Object.prototype.hasOwnProperty.call(favouriteById, rowKey)
                            ? favouriteById[rowKey]
                            : Boolean(item.is_liked)
                        const specs = formatSpecs(item)
                        const priceVal = item.price ?? item.amount
                        const priceStr =
                            priceVal != null && priceVal !== ''
                                ? `${currencySymbol} ${formatPriceAbbreviated(priceVal)}`
                                : item.priceLabel || ''
                        const cardImage = item.image || item.photo || PLACEHOLDER_PROPERTY_IMAGE

                        return (
                            <Link
                                key={rowKey}
                                href={resolveHref(item)}
                                prefetch={false}
                                className="group shrink-0 "
                                style={{ width: CARD_W }}
                            >
                                <div
                                    className="relative w-full overflow-hidden"
                                    style={{ height: IMG_H }}
                                >
                                    <Image
                                        src={cardImage}
                                        alt=""
                                        width={CARD_W}
                                        height={IMG_H}
                                        className="h-full w-full object-cover rounded-[6px]"
                                        sizes={`${CARD_W}px`}
                                    />

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setFavouriteById((prev) => ({
                                                ...prev,
                                                [rowKey]: !(
                                                    Object.prototype.hasOwnProperty.call(prev, rowKey)
                                                        ? prev[rowKey]
                                                        : Boolean(item.is_liked)
                                                ),
                                            }))
                                        }}
                                        className="cursor-pointer absolute right-[10px] top-[10px] z-[2] flex items-center justify-center rounded-full p-[4px]"
                                        aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
                                        aria-pressed={isLiked}
                                    >
                                        <FavouriteIcon
                                            className="h-[22px] w-[22px]"
                                            fill={isLiked ? '#DC0000' : '#ffffff'}
                                            fillOpacity={isLiked ? 1 : 0.95}
                                            stroke={isLiked ? '#DC0000' : 'transparent'}
                                        />
                                    </button>

                                    <div className="absolute bottom-[10px] right-[10px] z-[2] flex items-center gap-[5px] rounded-[4px] bg-[rgba(43,45,46,0.6)] p-[4px_6px]">
                                        <p className="text-[10px] font-[Inter-Regular] text-white">
                                            {imageCount} photos
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-[10px]">
                                    <div className="flex items-start justify-between gap-[4px]">
                                        <div className="flex-col flex items-start gap-[4px] truncate">
                                            <h4 className="text-[16px] font-[Inter-SemiBold] text-[#DC0000] ">
                                                {priceStr}
                                            </h4>
                                            <p className="text-[14px] font-[Inter-Medium] text-[#000000]  truncate">
                                                {displayTitle}
                                            </p>
                                            {specs ? (
                                                <p className="text-[14px] font-[Inter-Regular] text-[#666] ">
                                                    {specs}
                                                </p>
                                            ) : null}

                                        </div>
                                        <Image
                                            src={item.agencyLogo || item.agency_image || EMPTY_AGENCY_IMAGE}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="h-[40px] w-[40px] shrink-0 rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-[30px] ">
                                        <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">{item.location || item.city || ''}</p>
                                        <p className="text-[12px] font-[Inter-Regular] text-[#666] shrink-0">{item.postedAgo || item.timeAgo || ''}</p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section >
    )
}

export default PropertyFeaturedProperties
