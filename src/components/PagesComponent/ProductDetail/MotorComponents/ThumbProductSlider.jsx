/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { FavouriteIcon, ShareIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'
import ProductSliderLightbox from '../components/ProductSliderLightbox'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import first from '../../../../../public/assets/img/motors/1.png'
import second from '../../../../../public/assets/img/motors/2.png'
import third from '../../../../../public/assets/img/motors/3.png'
import fourth from '../../../../../public/assets/img/motors/4.png'
import fifth from '../../../../../public/assets/img/motors/5.png'

const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Motors Watchlist', count: 12 },
]

/** Demo / empty-state galleries when API has no images (per motors vertical). */
const MOTORCYCLE_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1600&q=80',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1600&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1600&q=80',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1600&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1600&q=80',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1600&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80',
]

const ACCESSORIES_FALLBACK_IMAGES = [
    first,
    second,
]
const HEAVY_VEHICLES_FALLBACK_IMAGES = [
    fifth,
]
const BOATS_FALLBACK_IMAGES = [
   third,
]
const PLATES_FALLBACK_IMAGES = [
    fourth,
]

const CARS_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&q=80',
]

function fallbackForVertical(verticalHint) {
    switch (verticalHint) {
        case 'cars':
            return CARS_FALLBACK_IMAGES
        case 'accessories':
            return ACCESSORIES_FALLBACK_IMAGES
        case 'heavy':
            return HEAVY_VEHICLES_FALLBACK_IMAGES
        case 'boats':
            return BOATS_FALLBACK_IMAGES
        case 'plates':
            return PLATES_FALLBACK_IMAGES
        case 'motorcycles':
        default:
            return MOTORCYCLE_FALLBACK_IMAGES
    }
}

function normalizeMotorImages(item, verticalHint) {
    const imgs = item?.images || item?.gallery_images || item?.image_gallery || item?.photos || item?.image_urls || []
    const arr = Array.isArray(imgs) ? imgs : []
    const normalized = arr
        .map((v) => {
            if (!v) return ''
            if (typeof v === 'string') return v.trim()
            if (typeof v === 'object') {
                const guess = v?.url || v?.image || v?.src || v?.path || v?.photo || v?.image_url || v?.imageUrl || ''
                return typeof guess === 'string' ? guess.trim() : ''
            }
            return ''
        })
        .filter(Boolean)

    if (normalized.length > 0) return normalized

    if (typeof item?.image === 'string' && item.image.trim()) {
        return [item.image.trim()]
    }

    return fallbackForVertical(verticalHint)
}

export default function ThumbProductSlider({ productData, isSaved, onToggleSave, onShare, slug, verticalHint = 'motorcycles' }) {
    const images = useMemo(() => normalizeMotorImages(productData || {}, verticalHint), [productData, verticalHint])
    const [activeIndex, setActiveIndex] = useState(0)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [touchStartX, setTouchStartX] = useState(null)
    const [touchEndX, setTouchEndX] = useState(null)
    const thumbRowRef = useRef(null)
    const [thumbScrollState, setThumbScrollState] = useState({ canLeft: false, canRight: false })

    useEffect(() => {
        setActiveIndex(0)
    }, [images.length])

    const canSlide = images.length > 1
    const activeImage = images[activeIndex] || images[0]
    const total = images.length

    const canPrev = canSlide && activeIndex > 0
    const canNext = canSlide && activeIndex < images.length - 1
    const detailSlug = slug || productData?.slug || productData?.id || ''
    const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
    const shareUrl = detailSlug
        ? `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}&mode=motors`
        : typeof window !== 'undefined'
            ? window.location.href
            : ''

    const goPrev = useCallback(() => {
        if (!canPrev) return
        setActiveIndex((prev) => Math.max(0, prev - 1))
    }, [canPrev])

    const goNext = useCallback(() => {
        if (!canNext) return
        setActiveIndex((prev) => Math.min(images.length - 1, prev + 1))
    }, [canNext, images.length])

    const updateThumbScroll = useCallback(() => {
        const el = thumbRowRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        setThumbScrollState({
            canLeft: scrollLeft > 4,
            canRight: scrollLeft + clientWidth < scrollWidth - 4,
        })
    }, [])

    useEffect(() => {
        const el = thumbRowRef.current
        if (!el) return
        updateThumbScroll()
        el.addEventListener('scroll', updateThumbScroll, { passive: true })
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateThumbScroll) : null
        ro?.observe(el)
        return () => {
            el.removeEventListener('scroll', updateThumbScroll)
            ro?.disconnect()
        }
    }, [images.length, updateThumbScroll])

    useEffect(() => {
        const row = thumbRowRef.current
        if (!row || total <= 1) return
        const thumb = row.children[activeIndex]
        thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }, [activeIndex, total])

    const scrollThumbs = useCallback((delta) => {
        thumbRowRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
    }, [])

    const onTouchStart = (event) => {
        setTouchEndX(null)
        setTouchStartX(event?.targetTouches?.[0]?.clientX ?? null)
    }

    const onTouchMove = (event) => {
        setTouchEndX(event?.targetTouches?.[0]?.clientX ?? null)
    }

    const onTouchEnd = () => {
        if (!canSlide || touchStartX === null || touchEndX === null) return
        const distance = touchStartX - touchEndX
        const minSwipeDistance = 50
        if (distance > minSwipeDistance) goNext()
        if (distance < -minSwipeDistance) goPrev()
    }

    const title = productData?.title || productData?.name || 'Listing'

    return (
        <div className="mb-[40px] w-full">
            <div className="relative overflow-hidden rounded-[12px] bg-[#eef0f1]">
                <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    className="relative block h-[min(52vw,420px)] w-full cursor-pointer h-[460px]"
                >
                    <Image
                        src={activeImage}
                        alt={title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 760px"
                    />
                </button>

                <div className="absolute right-[20px] top-[20px] flex items-center gap-[8px]">
                    <button
                        type="button"
                        onClick={() => {
                            onToggleSave?.()
                            setIsSaveAdsOpen(true)
                        }}
                        aria-label="Favorite"
                        className="inline-flex cursor-pointer items-center gap-[8px] rounded-[6px] border border-[#C8C8C8] bg-white px-[12px] py-[6px]"
                    >
                        <FavouriteIcon
                            className={`h-[16px] w-[16px] ${isSaved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
                            fill={isSaved ? '#DC0000' : '#fff'}
                            stroke={isSaved ? '#DC0000' : '#000'}
                        />
                        <span className="text-[13px] font-[Inter-Medium] text-[#23262A]">Favorite</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onShare?.()
                            setIsShareOpen(true)
                        }}
                        aria-label="Share"
                        className="inline-flex cursor-pointer items-center gap-[8px] rounded-[6px] border border-[#C8C8C8] bg-white px-[12px] py-[6px]"
                    >
                        <ShareIcon className="h-[16px] w-[16px]" fill="#000" />
                        <span className="text-[13px] font-[Inter-Medium] text-[#23262A]">Share</span>
                    </button>
                </div>

                <div className="pointer-events-none absolute bottom-[14px] right-[14px] rounded-full bg-[#000000a3] p-[6px_10px]">
                    <p className="text-[12px] font-[Inter-Medium] text-white">
                        {activeIndex + 1} of {total} Photos
                    </p>
                </div>

                {canSlide ? (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                goPrev()
                            }}
                            disabled={!canPrev}
                            aria-label="Previous image"
                            className={`cursor-pointer absolute left-[12px] top-1/2 z-[1] inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#5A5A5A] shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-opacity ${canPrev ? 'cursor-pointer opacity-100' : 'cursor-default opacity-0'
                                }`}
                        >
                            <PaginationPrevIcon className="h-[16px] w-[16px]" stroke="#23262A" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                goNext()
                            }}
                            disabled={!canNext}
                            aria-label="Next image"
                            className={`cursor-pointer absolute right-[12px] top-1/2 z-[1] inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#5A5A5A] shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-opacity ${canNext ? 'cursor-pointer opacity-100' : 'cursor-default opacity-0'
                                }`}
                        >
                            <PaginationNextIcon className="h-[16px] w-[16px]" stroke="#23262A" />
                        </button>
                    </>
                ) : null}
            </div>

            {total >= 1 ? (
                <div className="relative mt-[12px] flex items-center gap-[8px]">
                    <button
                        type="button"
                        aria-label="Scroll thumbnails left"
                        disabled={!thumbScrollState.canLeft}
                        onClick={() => scrollThumbs(-220)}
                        className={`z-[1] inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white text-[#23262A] shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-sm:h-[28px] max-sm:w-[28px] ${thumbScrollState.canLeft ? 'cursor-pointer opacity-100' : 'cursor-default opacity-0'
                            }`}
                    >
                        <PaginationPrevIcon className="h-[12px] w-[12px]" stroke="#23262A" />
                    </button>

                    <div
                        ref={thumbRowRef}
                        className="flex min-w-0 flex-1 items-center gap-[10px] overflow-x-auto pb-[4px] hide_scrollbar"
                    >
                        {images.map((img, idx) => {
                            const active = idx === activeIndex
                            return (
                                <button
                                    key={`${img}-${idx}`}
                                    type="button"
                                    aria-label={`Image ${idx + 1}`}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`cursor-pointer relative h-[82px] w-[110px] shrink-0 overflow-hidden rounded-[8px] border transition-colors  ${active ? 'border-[#000000]' : 'border-transparent opacity-[0.72] hover:opacity-100'
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt=""
                                        width={110}
                                        height={82}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            )
                        })}
                    </div>

                    <button
                        type="button"
                        aria-label="Scroll thumbnails right"
                        disabled={!thumbScrollState.canRight}
                        onClick={() => scrollThumbs(220)}
                        className={`z-[1] inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white text-[#23262A] shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-sm:h-[28px] max-sm:w-[28px] ${thumbScrollState.canRight ? 'cursor-pointer opacity-100' : 'cursor-default opacity-0'
                            }`}
                    >
                        <PaginationNextIcon className="h-[12px] w-[12px]" stroke="#23262A" />
                    </button>
                </div>
            ) : null}

            <ProductSliderLightbox
                images={images}
                activeIndex={activeIndex}
                canPrev={canPrev}
                canNext={canNext}
                onPrev={goPrev}
                onNext={goNext}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
                onShare={onShare}
                shareUrl={shareUrl}
                title={title}
            />
            <SaveAdsModal
                open={isSaveAdsOpen}
                onClose={() => setIsSaveAdsOpen(false)}
                onConfirm={() => setIsSaveAdsOpen(false)}
                onNewList={() => { }}
                lists={SAVE_ADS_LISTS}
                currentListIndex={0}
            />
            <SharePopup
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                shareUrl={shareUrl}
                title={title}
            />
        </div>
    )
}
