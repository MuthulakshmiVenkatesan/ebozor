/* eslint-disable react/prop-types */
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { GalleryIcon, FavouriteIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'

const CARD_W = 210
/** Must match the flex row gap below (px). */
const GAP = 18
/** How many card “slots” fit in the viewport (can be fractional, e.g. 3.5). */
const VISIBLE_SLOTS = 3.5
const VISIBLE_FULL = Math.max(1, Math.floor(VISIBLE_SLOTS))

/**
 * Horizontal "Similar Cars" slider — scroll-snap + header dots (like design).
 * Pass `items` from API when ready; otherwise uses demo data.
 */
const SimilarCarsSlider = ({ title = 'Similar Cars', items: itemsProp }) => {
    const demoItems = [
        {
            id: 1,
            images: ['/assets/img/data.png', '/assets/img/favourites.png', '/assets/img/emptydata.png'],
            title: 'Microsoft Surface Pro 9 - I...',
            subtitle: 'Microsoft Surface Pro 9 - I...',
            price: 'AED 3,700',
            imageCount: 3,
            featured: true,
        },
        {
            id: 2,
            images: ['/assets/img/data.png', '/assets/img/data.png', '/assets/img/emptydata.png', '/assets/img/favourites.png', '/assets/img/car.png', '/assets/img/data.png', '/assets/img/emptydata.png', '/assets/img/favourites.png'],
            title: 'Asus tuff F15 gaming lapt...',
            subtitle: 'Asus tuff F15 gaming lapt...',
            price: 'AED 3,700',
            imageCount: 8,
            featured: true,
        },
        {
            id: 3,
            images: ['/assets/img/data.png', '/assets/img/data.png', '/assets/img/emptydata.png', '/assets/img/favourites.png', '/assets/img/car.png', '/assets/img/data.png', '/assets/img/emptydata.png', '/assets/img/favourites.png', '/assets/img/car.png', '/assets/img/data.png'],
            title: 'Razer Blade 14 rtx 3080',
            subtitle: 'Razer Blade 14 rtx 3080',
            price: 'AED 3,800',
            imageCount: 10,
            featured: true,
        },
        {
            id: 4,
            images: ['/assets/img/data.png', '/assets/img/favourites.png', '/assets/img/emptydata.png', '/assets/img/data.png', '/assets/img/car.png', '/assets/img/favourites.png', '/assets/img/emptydata.png', '/assets/img/data.png', '/assets/img/car.png', '/assets/img/favourites.png'],
            title: 'MAC AIR M4',
            subtitle: 'MAC AIR M4',
            price: 'AED 3,600',
            imageCount: 10,
            featured: false,
        },
    ]

    const items = Array.isArray(itemsProp) && itemsProp.length > 0 ? itemsProp : demoItems
    const scrollRef = useRef(null)
    /** Which page of cards is showing (0 = first 3, 1 = next 3, …). Dots use this. */
    const [activePage, setActivePage] = useState(0)
    const [cardSlideById, setCardSlideById] = useState({})
    /** Per-ad favourite toggle: id -> boolean (overrides item.is_liked when set) */
    const [favouriteById, setFavouriteById] = useState({})

    /** Pages = sliding window: e.g. 4 cards, 3 visible → 2 positions (0 and “show rest”). */
    const totalPages = useMemo(() => {
        if (items.length <= VISIBLE_FULL) return 1
        return items.length - VISIBLE_FULL + 1
    }, [items.length])

    const getMaxScrollLeft = useCallback(() => {
        const el = scrollRef.current
        if (!el) return 0
        return Math.max(0, el.scrollWidth - el.clientWidth)
    }, [])

    const getScrollLeftForPage = useCallback(
        (page) => {
            const maxScroll = getMaxScrollLeft()
            const last = totalPages - 1
            if (last <= 0 || maxScroll <= 0) return 0
            const p = Math.min(last, Math.max(0, page))
            return Math.round((p / last) * maxScroll)
        },
        [getMaxScrollLeft, totalPages]
    )

    const getCardImages = useCallback((it) => {
        const imgs = it?.images || it?.image_gallery || it?.gallery || it?.photos || it?.image_urls || []
        if (Array.isArray(imgs) && imgs.length > 0) return imgs
        return it?.image ? [it.image] : ['/assets/img/car.png']
    }, [])

    const getCardSlideIndex = useCallback((id) => cardSlideById?.[id] || 0, [cardSlideById])

    const setCardSlideIndex = useCallback((id, next) => {
        setCardSlideById((prev) => ({ ...prev, [id]: next }))
    }, [])

    const updateActiveFromScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el || items.length === 0) return
        const maxScroll = getMaxScrollLeft()
        const last = totalPages - 1
        if (last <= 0 || maxScroll <= 0) {
            setActivePage(0)
            return
        }
        const ratio = el.scrollLeft / maxScroll
        const page = Math.round(ratio * last)
        setActivePage(Math.min(last, Math.max(0, page)))
    }, [items.length, totalPages, getMaxScrollLeft])

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
        if (el) el.scrollTo({ left: 0, behavior: 'auto' })
    }, [items.length])

    const scrollToPage = useCallback(
        (page) => {
            const el = scrollRef.current
            if (!el) return
            const maxPage = totalPages - 1
            const p = Math.min(maxPage, Math.max(0, page))
            setActivePage(p)
            el.scrollTo({
                left: getScrollLeftForPage(p),
                behavior: 'smooth',
            })
        },
        [totalPages, getScrollLeftForPage]
    )

    const canGoPrev = activePage > 0
    const canGoNext = activePage < totalPages - 1

    const onPrev = () => scrollToPage(activePage - 1)
    const onNext = () => scrollToPage(activePage + 1)

    const headerDotsCount = totalPages

    return (
        <div className="my-[24px] w-full">
            <div className="flex items-center justify-between mb-[14px] px-[2px]">
                <h3 className="text-[16px] font-[Inter-SemiBold] text-[#000]">{title}</h3>
                <div className="flex items-center gap-[8px]">
                    {Array.from({ length: headerDotsCount }).map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => scrollToPage(idx)}
                            className={`w-[8px] h-[8px] rounded-full transition-colors cursor-pointer ${
                                idx === activePage ? 'bg-[#000]' : 'bg-[#D9D9D9]'
                            }`}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            <div
                className="relative"
                style={{
                    maxWidth:
                        Math.floor(VISIBLE_SLOTS) * CARD_W +
                        Math.max(0, Math.floor(VISIBLE_SLOTS) - 1) * GAP +
                        (VISIBLE_SLOTS % 1) * CARD_W,
                }}
            >
                {/* Left / Right arrows (like screenshot) */}
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={!canGoPrev}
                    className="absolute left-[-10px] top-[56px] z-[5] w-[34px] h-[34px] rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous"
                >
                    <PaginationPrevIcon className="w-[12px] h-[12px]" stroke="#000" />
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="absolute right-[-10px] top-[56px] z-[5] w-[34px] h-[34px] rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next"
                >
                    <PaginationNextIcon className="w-[12px] h-[12px]" stroke="#000" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto overflow-y-hidden pb-[8px] scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{
                        gap: GAP,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {items.map((ad) => {
                        const images = getCardImages(ad)
                        const idx = Math.min(getCardSlideIndex(ad.id), Math.max(images.length - 1, 0))
                        const imageSrc = images[idx]
                        const dotCount = Math.min(images.length, 5)
                        const imageCount = ad?.imageCount ?? images.length
                        const isLiked =
                            Object.prototype.hasOwnProperty.call(favouriteById, ad.id)
                                ? favouriteById[ad.id]
                                : Boolean(ad?.is_liked)

                        return (
                            <div
                                key={ad.id ?? ad.title + ad.price}
                                className="flex-shrink-0 bg-white rounded-[12px] overflow-hidden cursor-pointer"
                                style={{
                                    width: CARD_W,
                                    scrollSnapAlign: 'start',
                                }}
                            >
                                <div className="relative w-full h-[150px] bg-[#F5F5F5] rounded-[14px] overflow-hidden">
                                    <Image
                                        src={imageSrc}
                                        alt={ad.title || ''}
                                        width={CARD_W}
                                        height={150}
                                        className="w-full h-[150px] object-cover"
                                    />

                                 

                                    {/* Heart */}
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
                                        }}
                                        className={`cursor-pointer absolute top-[10px] right-[10px] flex items-center justify-center rounded-full p-[4px] transition-colors ${
                                            isLiked ? '' : ''
                                        }`}
                                        aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
                                        aria-pressed={isLiked}
                                    >
                                        <FavouriteIcon
                                            className="w-[24px] h-[24px]"
                                            fill={isLiked ? '#DC0000' : '#ffffff'}
                                            fillOpacity={isLiked ? 1 : 0.95}
                                            stroke={isLiked ? '#DC0000' : 'transparent'}
                                        />
                                    </button>

                                    {/* Image count badge */}
                                    <div className="absolute bottom-[10px] left-[10px] flex items-center gap-[4px] bg-[rgba(35,38,42,0.75)] p-[3px_5px] rounded-[4px]">
                                        <GalleryIcon className="w-[14px] h-[14px]" />
                                        <p className=' text-white text-[12px] font-[Inter-Medium] '>{imageCount}</p>
                                    </div>

                                    {/* Dots inside image */}
                                    {dotCount > 1 ? (
                                        <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center gap-[6px]">
                                            {Array.from({ length: dotCount }).map((_, d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setCardSlideIndex(ad.id, d)}
                                                    className={`w-[7px] h-[7px] rounded-full ${
                                                        d === idx ? 'bg-white' : 'bg-white/40'
                                                    }`}
                                                    aria-label={`Image ${d + 1}`}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="pt-[10px]">
                                    <h4 className="text-[20px] font-[Inter-SemiBold] text-[#000] mb-[4px]">
                                        {ad.price}
                                    </h4>
                                    <p className="text-[16px] font-[Inter-Medium] text-[#000000B2] truncate">
                                        {ad.title}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default SimilarCarsSlider
