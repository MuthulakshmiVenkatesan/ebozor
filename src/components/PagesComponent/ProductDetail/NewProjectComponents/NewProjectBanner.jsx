/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    GalleryIcon,
    LocationIcon,
    PaginationNextIcon,
    PaginationPrevIcon,
    RightArrowIcon,
} from '@/components/CustomFile/icons'
import { placeholderImage } from '@/utils'
import { buildWhatsAppMeUrl } from '@/utils/whatsapp'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'

function getProjectImages(item) {
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
    if (typeof item?.image === 'string' && item.image.trim()) return [item.image.trim()]
    return []
}

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function extractCustomFieldValue(productData, fieldName) {
    const rows = Array.isArray(productData?.custom_fields) ? productData.custom_fields : []
    const found = rows.find(
        (row) => String(row?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    const v = found?.custom_field_value?.value ?? found?.value
    if (Array.isArray(v)) {
        const first = v.find((x) => x != null && String(x).trim() !== '')
        return first != null ? String(first).trim() : ''
    }
    return v != null ? String(v).trim() : ''
}

function extractCustomFieldValues(productData, fieldName) {
    const rows = Array.isArray(productData?.custom_fields) ? productData.custom_fields : []
    const found = rows.find(
        (row) => String(row?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    const v = found?.custom_field_value?.value ?? found?.value
    if (Array.isArray(v)) {
        return v
            .map((x) => (x != null ? String(x).trim() : ''))
            .filter(Boolean)
    }
    if (v != null && String(v).trim() !== '') return [String(v).trim()]
    return []
}

function extractCustomFieldFileUrl(productData, fieldName) {
    const rows = Array.isArray(productData?.custom_fields) ? productData.custom_fields : []
    const found = rows.find(
        (row) => String(row?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    if (!found) return ''

    const topLevelValues = Array.isArray(found?.value)
        ? found.value.map((v) => (v != null ? String(v).trim() : '')).filter(Boolean)
        : found?.value != null
            ? [String(found.value).trim()]
            : []
    const customFieldValues = Array.isArray(found?.custom_field_value?.value)
        ? found.custom_field_value.value.map((v) => (v != null ? String(v).trim() : '')).filter(Boolean)
        : found?.custom_field_value?.value != null
            ? [String(found.custom_field_value.value).trim()]
            : []

    const all = [...topLevelValues, ...customFieldValues].filter(Boolean)
    const fullUrl = all.find((v) => /^https?:\/\//i.test(v))
    if (fullUrl) return fullUrl
    return all[0] || ''
}

function formatLaunchPrice(data) {
    const direct = pickString(
        extractCustomFieldValue(data, 'launch_price'),
        extractCustomFieldValue(data, 'Launch Price'),
        data?.launch_price,
        data?.launchPrice,
        data?.price_display,
        data?.price
    )
    if (direct) return direct
    const line = pickString(data?.priceLine)
    if (line) {
        const m = line.match(/AED\s*[\d.,]+\s*[KMB]?/i)
        if (m) return m[0].replace(/\s+/g, ' ')
        return line
    }
    return ''
}

function formatHandover(data) {
    const h = pickString(
        extractCustomFieldValue(data, 'Handover'),
        data?.handover,
        data?.handover_date,
        data?.handoverDate,
        data?.delivery
    )
    if (h) {
        const q = h.match(/Q[1-4]\s*\d{4}/i)
        if (q) return q[0].toUpperCase()
        return h
    }
    return ''
}

const FALLBACK_IMG = '/assets/img/property/1.png'

/** Visible “slots” when ≥3 images: two full + half of the next (fills viewport width). */
const GALLERY_VISIBLE_SLOTS = 2.5
const GALLERY_GAP_PX = 16

function galleryCardWidthForCount(viewportW, imageCount, gapPx) {
    if (viewportW <= 0) return 260
    if (imageCount <= 1) return Math.max(120, viewportW)
    if (imageCount === 2) return Math.max(120, (viewportW - gapPx) / 2)
    const gaps = 2 * gapPx
    return Math.max(120, (viewportW - gaps) / GALLERY_VISIBLE_SLOTS)
}

/** Scroll offsets: full steps + final snap to `track - viewport` so no empty strip on the right. */
function buildGalleryScrollPositions(trackW, viewportW, cardW, gapPx) {
    const maxTrans = Math.max(0, trackW - viewportW)
    if (maxTrans <= 0) return [0]
    const step = cardW + gapPx
    const positions = [0]
    let t = step
    while (t < maxTrans - 0.5) {
        positions.push(t)
        t += step
    }
    const last = positions[positions.length - 1]
    if (last < maxTrans - 0.5) positions.push(maxTrans)
    return positions
}

export default function NewProjectBanner({
    productData = {},
    viewAdsHref: viewAdsHrefProp = '',
    onViewAds,
    whatsappNumber,
    whatsappMessage,
    onWhatsAppClick,
}) {
    const viewAdsHref = pickString(
        viewAdsHrefProp,
        productData.view_ads_url,
        productData.viewAdsUrl,
        productData.property_ads_url
    )
    const images = useMemo(() => getProjectImages(productData), [productData])
    const displayImages = images.length ? images : [FALLBACK_IMG]

    const title = pickString(productData.title, productData.name, 'Project')
    const customUnitTypeValues = extractCustomFieldValues(productData, 'Unit Type')
    const unitType = pickString(
        customUnitTypeValues.length ? customUnitTypeValues.join(', ') : '',
        productData.unit_type,
        productData.unitType,
        productData.property_type,
        productData.propertyType,
        'Apartments'
    )
    const location = pickString(
        productData.location,
        productData.address,
        productData.area,
        'Dubai'
    )
    const launchPrice = formatLaunchPrice(productData) || '—'
    const completedRaw = pickString(extractCustomFieldValue(productData, 'Completed'))
    const completed = completedRaw ? `${completedRaw}%` : '—'
    const handover = formatHandover(productData) || '—'
    const developer = pickString(
        extractCustomFieldValue(productData, 'Developer'),
        extractCustomFieldValue(productData, 'company_title'),
        extractCustomFieldValue(productData, 'Company Title'),
        productData.developer,
        productData.developer_name,
        productData.developerName,
        'Developer'
    )
    const developerLogo = pickString(
        extractCustomFieldFileUrl(productData, 'Company icon'),
        extractCustomFieldValue(productData, 'company_icon'),
        extractCustomFieldValue(productData, 'Company Icon'),
        productData.developer_logo,
        productData.developerLogo,
        productData.logo
    )

    const adsCount =
        productData.ads_count ??
        productData.property_ads_count ??
        productData.total_ads ??
        productData.adsCount ??
        0

    const waUrl = buildWhatsAppMeUrl(
        whatsappNumber ?? productData.whatsapp ?? productData.whatsapp_number,
        whatsappMessage ?? productData.whatsapp_message
    )

    const galleryViewportRef = useRef(null)
    const [slideStart, setSlideStart] = useState(0)
    const [galleryCardW, setGalleryCardW] = useState(260)
    const [galleryViewportW, setGalleryViewportW] = useState(0)

    const imageCount = displayImages.length

    useEffect(() => {
        const el = galleryViewportRef.current
        if (!el) return

        const measure = () => {
            const w = el.clientWidth
            if (w <= 0) return
            setGalleryViewportW(w)
            setGalleryCardW(galleryCardWidthForCount(w, imageCount, GALLERY_GAP_PX))
        }

        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [imageCount])

    const galleryScroll = useMemo(() => {
        if (galleryViewportW <= 0) {
            return { positions: [0], maxSlideStart: 0 }
        }
        const trackW = imageCount * galleryCardW + (imageCount - 1) * GALLERY_GAP_PX
        const positions = buildGalleryScrollPositions(
            trackW,
            galleryViewportW,
            galleryCardW,
            GALLERY_GAP_PX
        )
        return {
            positions,
            maxSlideStart: Math.max(0, positions.length - 1),
        }
    }, [galleryCardW, galleryViewportW, imageCount])

    const galleryTranslatePx = galleryScroll.positions[Math.min(slideStart, galleryScroll.maxSlideStart)] ?? 0
    const maxSlideStart = galleryScroll.maxSlideStart

    useEffect(() => {
        setSlideStart((s) => Math.min(s, maxSlideStart))
    }, [maxSlideStart])

    const goPrev = useCallback(() => {
        setSlideStart((s) => Math.max(0, s - 1))
    }, [])

    const goNext = useCallback(() => {
        setSlideStart((s) => Math.min(maxSlideStart, s + 1))
    }, [maxSlideStart])

    const canPrev = slideStart > 0
    const canNext = slideStart < maxSlideStart

    const handleViewAds = useCallback(() => {
        if (onViewAds) {
            onViewAds()
            return
        }
        if (viewAdsHref) {
            window.open(viewAdsHref, '_blank', 'noopener,noreferrer')
        }
    }, [onViewAds, viewAdsHref])

    const viewAdsInner = (
        <>
            <p className="text-[16px] font-[Inter-SemiBold] text-[#fff]">  
                View {adsCount} Property {adsCount === 1 ? 'Ad' : 'Ads'}
            </p>
            <RightArrowIcon className="w-[24px] h-[24px] shrink-0 text-white" stroke="#fff" />
        </>
    )

    return (
        <section className="w-full bg-[linear-gradient(90deg,_rgb(223,238,249)_0%,_rgb(255,255,255)_135.22%)] p-[64px] max-sm:p-[20px]">
            <div className="grid grid-cols-[450px_1fr] gap-[20px] max-sm:grid-cols-1">
                <div className="min-w-0 flex-1 flex flex-col gap-[30px]">
                    <div className="flex flex-col gap-[12px]">
                        <h1 className="text-[26px] font-[Inter-SemiBold] leading-tight text-[#23262A] md:text-[30px]">
                            {title}
                        </h1>
                        <p className="text-[20px] font-[Inter-Medium] text-[#23262A]">
                            {unitType}
                        </p>
                        <div className="flex items-start gap-[6px]">
                            <LocationIcon className="w-[18px] h-[18px] shrink-0" stroke="#23262A" />
                            <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">{location}</p>
                        </div>
                    </div>

                    <div className="flex items-stretch gap-0">
                        <div className="pr-6">
                            <h4 className="mb-[6px] text-[20px] font-[Inter-SemiBold] text-[#23262A]">
                                {launchPrice}
                            </h4>
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                Launch Price
                            </p>
                        </div>
                        <div className="w-px shrink-0 bg-[rgba(35,38,42,0.15)]" aria-hidden />
                        <div className="px-6">
                            <h4 className="mb-[6px] text-[20px] font-[Inter-SemiBold] text-[#23262A] ">
                                {completed}
                            </h4>
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                Completed
                            </p>
                        </div>
                        <div className="w-px shrink-0 bg-[rgba(35,38,42,0.15)]" aria-hidden />
                        <div className="pl-6">
                            <h4 className="mb-[6px] text-[20px] font-[Inter-SemiBold] text-[#23262A] ">
                                {handover}
                            </h4>
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                Handover
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {developerLogo ? (
                            <div className="">
                                <Image
                                    src={developerLogo}
                                    alt={developer}
                                    width={50}
                                    height={50}
                                    className="object-contain w-[50px] h-[50px] rounded-[8px]"
                                    onErrorCapture={placeholderImage}
                                />
                            </div>
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                            Project by {developer}
                        </p>
                    </div>

                    {/* <div className="flex flex-wrap items-center gap-3">
                            {onWhatsAppClick ? (
                                <button
                                    type="button"
                                    onClick={onWhatsAppClick}
                                    className="inline-flex cursor-pointer items-center gap-[4px] rounded-[6px] bg-[#e9f7f0] p-[14px_24px] transition"
                                >
                                    <Image src={whatsapp} alt="" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">WhatsApp</p>
                                </button>
                            ) : waUrl ? (
                                <Link
                                    href={waUrl}
                                    className="inline-flex items-center gap-[4px] rounded-[6px] bg-[#e9f7f0] p-[14px_24px] transition"
                                >
                                    <Image src={whatsapp} alt="" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">WhatsApp</p>
                                </Link>
                            ) : null}
                        
                        {viewAdsHref || onViewAds ? (
                            <button
                                type="button"
                                onClick={handleViewAds}
                                className="inline-flex cursor-pointer items-center gap-[2px] rounded-[6px] bg-[#23262A] p-[12px_24px] transition"
                            >
                                {viewAdsInner}
                            </button>
                        ) : null}
                    </div> */}
                </div>

                <div className="min-w-0">
                    <div
                        ref={galleryViewportRef}
                        className="relative w-full min-w-0 overflow-hidden rounded-[14px]"
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out rounded-[40px]"
                            style={{
                                gap: GALLERY_GAP_PX,
                                transform: `translateX(-${galleryTranslatePx}px)`,
                            }}
                        >
                            {displayImages.map((src, idx) => (
                                <div
                                    key={`${src}-${idx}`}
                                    className="relative shrink-0 overflow-hidden "
                                    style={{
                                        width: galleryCardW,
                                        height: 360,
                                    }}
                                >
                                    <Image
                                        src={src}
                                        alt={`${title} ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 42vw, 28vw"
                                        onErrorCapture={placeholderImage}
                                    />
                                    {idx === 0 ? (
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.5)] px-2.5 py-1">
                                            <GalleryIcon className="h-3.5 w-3.5" width={14} height={14} />
                                            <span className="text-[12px] font-[Inter-Regular] text-white">
                                                {displayImages.length} Image{displayImages.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        {maxSlideStart > 0 ? (
                            <>
                                <button
                                    type="button"
                                    disabled={!canPrev}
                                    onClick={goPrev}
                                    aria-label="Previous images"
                                    className="cursor-pointer absolute left-[-10px] top-1/2 z-[2] flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] shadow-md transition disabled:pointer-events-none disabled:opacity-0 hover:bg-white"
                                >
                                    <PaginationPrevIcon className="h-3 w-3 text-[#23262A]" stroke="#23262A" />
                                </button>
                                <button
                                    type="button"
                                    disabled={!canNext}
                                    onClick={goNext}
                                    aria-label="Next images"
                                    className="cursor-pointer absolute right-[-10px] top-1/2 z-[2] flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] shadow-md transition disabled:pointer-events-none disabled:opacity-0 hover:bg-white"
                                >
                                    <PaginationNextIcon className="h-3 w-3 text-[#23262A]" stroke="#23262A" />
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    )
}
