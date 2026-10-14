/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PaginationNextIcon, PaginationPrevIcon, GalleryIcon, FavouriteIcon, SliderShareIcon, PaginationDoublePrevIcon, PaginationDoubleNextIcon, PaginationSinglePrevIcon, PaginationSingleNextIcon } from '@/components/CustomFile/icons'
import { allItemApi } from '@/utils/api'
import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'
import { formatPriceAbbreviated, placeholderImage } from '@/utils'
import { getProductPromotionBadge, promotionBadgePillAppearance } from '@/utils/productPromotionBadge'
import Link from 'next/link'
import Newprojectcard from './Newprojectcard'
import SharePopup from './SharePopup'
import map from '../../../../../public/assets/img/icons/map.svg'
import chat from '../../../../../public/assets/img/icons/chaticon.svg'

const VISIBLE_PAGE_BUTTONS = 5

// Fallback/static demo data for when API returns empty.
// The backend fields here are matched to what this UI reads (image(s), price, year, km, steering, specs, tags).
const DEMO_MOTORS_ITEMS = Array.from({ length: 30 }).map((_, i) => {
    const idx = i + 1
    const title = `Community ${idx}`
    const agencyName = ['Regolith Autotrade', 'Bashma Motors', 'Perfect Motors', 'Dubai Auto House'][i % 4]
    const location = ['Ras Al Khor, Dubai', 'Jebel Ali, Dubai', 'Al Quoz, Dubai', 'Dubai Marina'][i % 4]

    return {
        id: idx,
        slug: `demo-community-${idx}`,
        name: title,
        title,
        location,
        agency_name: agencyName,
        listed_by: agencyName,
        imageCount: 16 - (i % 7),
        images: ['/assets/img/anothercar.png', '/assets/img/sellcar.png', '/assets/img/anothercar.png', '/assets/img/car.png'],
    }
})


function getFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function getItemImages(item) {
    const imgs =
        item?.images ||
        item?.gallery_images ||
        item?.image_gallery ||
        item?.photos ||
        item?.image_urls ||
        []
    if (Array.isArray(imgs) && imgs.length) return imgs
    if (item?.image) return [item.image]
    return []
}



function CommunityCardRow({ item, detailHref }) {
    const images = useMemo(() => getItemImages(item), [item])
    const displayImages = images.length ? images : ['/assets/img/car.png']
    const photoCount = item?.imageCount ?? item?.images_count ?? images.length
    const [imgIndex, setImgIndex] = useState(0)
    const [isShareOpen, setIsShareOpen] = useState(false)
    useEffect(() => {
        setImgIndex(0)
    }, [item?.id])
    const safeLen = displayImages.length
    const location = getFirstTruthy(item?.location, item?.city, item?.state, item?.country)
    const title = item?.name || item?.title || ''
    const subtitle = title.includes('•') ? title : item?.make ? `${item?.make} • ${item?.model}` : title
    const description = item?.description || item?.short_description || title
    const promotionBadge = useMemo(() => getProductPromotionBadge(item), [item])


    return (
        <div className="border-b border-[rgba(143,143,143,0.18)] py-[18px]">
            <div className="flex items-start gap-[22px]">
                <div className="w-[282px] max-w-[282px] flex-shrink-0">
                    <div className="relative overflow-hidden rounded-[12px]">
                        <Image
                            src={displayImages[imgIndex] || '/assets/img/car.png'}
                            alt={title}
                            width={360}
                            height={190}
                            className="h-[190px] w-full object-cover"
                            onErrorCapture={placeholderImage}
                        />

                        <div className='absolute right-[12px] top-[6px] flex items-center gap-[4px]'>
                            <button
                                type="button"
                                className="cursor-pointer"
                                aria-label="Share listing"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsShareOpen(true)
                                }}
                            >
                                <SliderShareIcon className=" text-white" />
                            </button>
                            <button
                                type="button"
                                className="cursor-pointer"
                                aria-label="Favourite"
                            >
                                <FavouriteIcon className="w-[24px] h-[24px] text-white" fill="#fff" fillOpacity="0.9" stroke="#fff" />
                            </button>
                        </div>

                        {photoCount ? (
                            <div className="flex items-center gap-[4px] justify-center absolute bottom-[10px] left-[10px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[2px_5px]">
                                <GalleryIcon className="w-[16px] h-[16px] text-white" />
                                <p className="text-[10px] font-[Inter-SemiBold] text-white">{photoCount}</p>
                            </div>
                        ) : null}

                        {safeLen > 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => (p - 1 + safeLen) % safeLen)
                                    }}
                                    className="cursor-pointer absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Previous image"
                                >
                                    <PaginationPrevIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => (p + 1) % safeLen)
                                    }}
                                    className="cursor-pointer absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Next image"
                                >
                                    <PaginationNextIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <div className="absolute bottom-[12px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                    {Array.from({ length: 5 }).map((_, idx) => {
                                        const activeDot =
                                            safeLen <= 1 ? 0 : Math.round((imgIndex / (safeLen - 1)) * 4)
                                        return (
                                            <span
                                                key={idx}
                                                className={`h-[7px] w-[7px] rounded-full transition-colors ${idx === activeDot ? 'bg-[#000]' : 'bg-[rgba(255,255,255,0.9)]'
                                                    }`}
                                            />
                                        )
                                    })}
                                </div>
                            </>
                        ) : null}
                    </div>


                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-[12px]">
                        <div className="flex flex-col gap-[4px]">
                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#2b2d2e] truncate">{subtitle}</h4>
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e] leading-[20px] max-h-[40px] overflow-hidden">
                                {description}
                            </p>
                        </div>
                        <div className="shrink-0">
                            {promotionBadge.label ? (
                                <p {...promotionBadgePillAppearance(promotionBadge)}>{promotionBadge.label}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className='flex flex-col mt-[70px] gap-[8px]'>
                        <div className="flex items-center gap-[6px]">
                            <Image src={map} alt="location" width={12} height={12} />
                            <p className="text-[16px] font-[Inter-Regular] text-[#2b2d2e] truncate">{location}</p>
                        </div>
                        <div>
                            <button className='flex items-center gap-[12px] bg-[#3a88ef14] rounded-[12px] p-[10px_18px] cursor-pointer'>
                                <Image src={chat} />
                                <p className='text-[#000] font-[Inter-Regular] text-[14px]'>Chat</p>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <SharePopup
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                shareUrl={detailHref || `/product-details/${item?.slug || ''}`}
                title={title || 'Listing'}
            />
        </div>
    )
}

export default function CommunityCard({ perPage = 15, onItemsTotalChange }) {
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const sourceMode = (searchParams?.get('mode') || '').toLowerCase()
    const subSlug = (
        searchParams?.get('category_slug') ||
        searchParams?.get('slug') ||
        ''
    ).toLowerCase()

    const [items, setItems] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const fetchPage = async (page) => {
        if (!sourceMode) return
        setIsLoading(true)
        try {
            const demoTotalPages = Math.max(1, Math.ceil(DEMO_MOTORS_ITEMS.length / perPage))
            const setDemo = (p) => {
                const safePage = Math.max(1, Math.min(demoTotalPages, p))
                const start = (safePage - 1) * perPage
                const slice = DEMO_MOTORS_ITEMS.slice(start, start + perPage)
                setItems(slice)
                setCurrentPage(safePage)
                setLastPage(demoTotalPages)
                onItemsTotalChange?.(DEMO_MOTORS_ITEMS.length)
            }

            const city = searchParams?.get('city')?.trim() || undefined
            const minPrice = searchParams?.get('minPrice')?.trim() || undefined
            const maxPrice = searchParams?.get('maxPrice')?.trim() || undefined
            const filterQuery = collectFilterParamsFromSearchParams(searchParams)
            const searchText =
                searchParams?.get('search')?.trim() ||
                searchParams?.get('keyword')?.trim() ||
                undefined
            const sortBy = searchParams?.get('sort_by')?.trim() || 'new-to-old'
            const params = {
                page,
                sort_by: sortBy,
                category_slug: subSlug || sourceMode,
                per_page: perPage,
                limit: perPage,
                city,
                min_price: minPrice,
                max_price: maxPrice,
                search: searchText,
                filterQuery,
            }
            const run = async (nextParams) => {
                const res = await allItemApi.getItems(nextParams)
                const data = res?.data
                if (!data || data.error === true) return { list: [], inner: {} }
                const inner = data?.data || {}
                const list = inner?.data || []
                return { list: Array.isArray(list) ? list : [], inner }
            }

            const first = await run(params)
            let list = first.list
            let inner = first.inner

            if ((!list || list.length === 0) && subSlug) {
                const second = await run({
                    ...params,
                    category_slug: undefined,
                })
                list = second.list
                inner = second.inner
            }

            if (!list || list.length === 0) {
                setDemo(page)
                return
            }

            setItems(list)
            setCurrentPage(inner?.current_page || page)
            setLastPage(inner?.last_page || page)
            const t = inner?.total
            if (typeof t === 'number' && Number.isFinite(t)) {
                onItemsTotalChange?.(t)
            }
        } catch (e) {
            console.error(e)
            const demoTotalPages = Math.max(1, Math.ceil(DEMO_MOTORS_ITEMS.length / perPage))
            setItems(DEMO_MOTORS_ITEMS.slice(0, perPage))
            setCurrentPage(1)
            setLastPage(demoTotalPages)
            onItemsTotalChange?.(DEMO_MOTORS_ITEMS.length)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [sourceMode, subSlug, searchParamsKey])

    useEffect(() => {
        if (!sourceMode) return
        fetchPage(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sourceMode, subSlug, searchParamsKey])

    const totalPages = Math.max(1, lastPage)
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(totalPages - (VISIBLE_PAGE_BUTTONS - 1), currentPage - 0))
        const end = Math.min(totalPages, start + VISIBLE_PAGE_BUTTONS - 1)
        const arr = []
        for (let p = start; p <= end; p++) arr.push(p)
        return arr
    }, [currentPage, totalPages])

    return (
        <div className="w-full">
            <div className="">
                {isLoading ? (
                    <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading...</div>
                ) : items.length ? (
                    <div>
                        {items.map((item) => {
                            const detailHref = `/product-details/${item?.slug || ''}`
                            return (
                            <div key={item?.id || item?.slug}>
                                <Link href={detailHref} prefetch={false}>
                                    <CommunityCardRow item={item} detailHref={detailHref} />
                                </Link>
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">No items found</div>
                )}

                {totalPages > 1 ? (
                    <div className="mt-[20px] pb-[16px] flex items-center justify-center">
                        <div className="w-full flex justify-between items-center gap-[10px]">
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="First page"
                                >
                                    <PaginationDoublePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Previous page"
                                >
                                    <PaginationSinglePrevIcon fill={currentPage <= 1 ? '#8F8F8F' : '#000'} stroke={currentPage <= 1 ? '#8F8F8F' : '#000'} />
                                </button>
                            </div>

                            <div className="flex items-center gap-[10px]">
                                {visiblePages.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCurrentPage(p)}
                                        className={`rounded-[6px] w-[40px] h-[40px] flex items-center justify-center cursor-pointer text-[12px] font-[Inter-Medium] border ${currentPage === p
                                            ? 'bg-[#23262A] text-white border-[#23262A]'
                                            : 'bg-white text-[#23262A] border-[rgba(143,143,143,0.35)]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Next page"
                                >
                                    <PaginationSingleNextIcon fill={currentPage >= totalPages ? '#8F8F8F' : '#000'} stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'} />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
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

