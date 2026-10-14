'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'

const CARD_W = 210
const GAP = 28

function productsHref(purpose, extra = {}) {
    const p = purpose === 'sale' ? 'sale' : 'rent'
    const item = p === 'sale' ? 'property-for-sale' : 'property-for-rent'
    const q = new URLSearchParams({ mode: 'property', purpose: p, item, ...extra })
    return `/products?${q.toString()}`
}

const RENT_ITEMS = [
    {
        id: 'commercial',
        title: 'Commercial for Rent',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    },
    {
        id: 'short-term',
        title: 'Daily Short Term for Rent',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    },
    {
        id: 'apartment',
        title: 'Apartment for Rent',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    },
    {
        id: 'villa',
        title: 'Villa for Rent',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    },
    {
        id: 'rooms',
        title: 'Rooms for Rent',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    },
    {
        id: 'office',
        title: 'Office Space',
        href: productsHref('rent'),
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    },
]

const SALE_ITEMS = [
    {
        id: 'apartment-sale',
        title: 'Apartment for Sale',
        href: productsHref('sale'),
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    },
    {
        id: 'villa-sale',
        title: 'Villa for Sale',
        href: productsHref('sale'),
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    },
    {
        id: 'commercial-sale',
        title: 'Commercial for Sale',
        href: productsHref('sale'),
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    },
    {
        id: 'multiple-sale',
        title: 'Multiple Units for Sale',
        href: productsHref('sale'),
        image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80',
    },
    {
        id: 'land-sale',
        title: 'Land for Sale',
        href: productsHref('sale'),
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
    },
]

/**
 * Horizontal “Popular Categories” strip — image cards, bottom label, prev/next circles (property page).
 * Pass `items` from API when available; each item: { id, title, image, href }.
 */
const PropertyPopularCategories = ({ items: itemsProp, purpose = 'rent' }) => {
    const fallback = purpose === 'sale' ? SALE_ITEMS : RENT_ITEMS
    const items = Array.isArray(itemsProp) && itemsProp.length > 0 ? itemsProp : fallback
    const scrollRef = useRef(null)
    const [canPrev, setCanPrev] = useState(false)
    const [canNext, setCanNext] = useState(true)

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
        const delta = (CARD_W + GAP) * dir
        el.scrollBy({ left: delta, behavior: 'smooth' })
    }, [])

    return (
        <section className="w-full mb-[50px]">
            <div className="flex items-center justify-between mb-[30px]">
                <h2 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                    Popular Categories
                </h2>
            </div>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => scrollStep(-1)}
                    disabled={!canPrev}
                    className="absolute cursor-pointer left-[12px] rtl:right-[12px] rtl:left-auto top-1/2 z-[99] -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    aria-label="Previous categories"
                >
                    <PaginationPrevIcon className="w-[16px] h-[16px] rtl:rotate-180" stroke="#000" />
                </button>
                <button
                    type="button"
                    onClick={() => scrollStep(1)}
                    disabled={!canNext}
                    className="absolute cursor-pointer right-[12px] rtl:left-[12px] rtl:right-auto top-1/2 z-[99] -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    aria-label="Next categories"
                >
                    <PaginationNextIcon className="w-[16px] h-[16px] rtl:rotate-180" stroke="#000" />
                </button>

                <div
                    ref={scrollRef}
                    dir="ltr"
                    className="flex overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{
                        gap: GAP,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {items.map((cat) => (
                        <Link
                            key={cat.id}
                            href={cat.href || '/products'}
                            prefetch={false}
                            aria-label={cat.title}
                            className="property_card h-[220px] group relative shrink-0 rounded-[4px]"
                            style={{
                                width: CARD_W,
                                aspectRatio: '4 / 5',
                            }}
                        >
                            <Image
                                src={cat.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes={`${CARD_W}px`}
                            />

                            <div className='absolute top-0 left-0 w-full h-full propertycard_border'>
                                <svg viewBox="0 0 300 300" class="line-svg mui-style-11cyq32"><path d="M20.5,20.5h260v260h-260V20.5z"></path></svg>
                            </div>

                            <h4 dir="auto" className="absolute bottom-3 start-3 end-2 z-[1] text-start text-[18px] font-[Inter-SemiBold] leading-snug text-white text-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                                {cat.title}
                            </h4>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default PropertyPopularCategories
