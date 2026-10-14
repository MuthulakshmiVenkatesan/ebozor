/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { allItemApi } from '@/utils/api'
import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'
import { formatPriceAbbreviated, placeholderImage } from '@/utils'
import { getProductPromotionBadge, promotionBadgePillAppearance } from '@/utils/productPromotionBadge'
import { absoluteUrl } from '@/utils/siteUrl'
import { SliderShareIcon, VerifiedBadge, FavouriteIcon, GalleryIcon, LocationIcon, PaginationNextIcon, PaginationPrevIcon, ShareIcon, TickIcon, PaginationDoublePrevIcon, PaginationDoubleNextIcon, PaginationSinglePrevIcon, PaginationSingleNextIcon } from '@/components/CustomFile/icons'
import chat from '../../../../../public/assets/img/icons/chaticon.svg'
import verifiedbusiness from '../../../../../public/assets/img/icons/verifiedbusiness.svg'
import CommonProjectCard from './CommonProjectCard'
import SaveAdsModal from './SaveAds'
import SharePopup from './SharePopup'
import VerifiedMain from '../../GetVerified/VerifiedMain'

const VISIBLE_PAGE_BUTTONS = 5
const SAVE_ADS_LISTS = [
    { name: 'All Favorites', count: 154, isDefault: true },
    { name: 'Cars Wishlist', count: 12 },
    { name: 'Home Picks', count: 8 },
    { name: 'Weekend Deals', count: 5 },
]

function normalizeBoolean(...vals) {
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

function getFirstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function getFirstText(...vals) {
    for (const v of vals) {
        if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
}

function getItemImages(item) {
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

    const single = item?.image
    if (typeof single === 'string' && single.trim()) return [single.trim()]
    return []
}

function parsePrice(item) {
    const p = getFirstTruthy(item?.price, item?.amount, item?.price_value, item?.amount_value)
    if (p === '' || p === null || p === undefined) return ''
    return p
}

function getCustomFieldDisplayValue(item, fieldName) {
    const fields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const target = String(fieldName || '').trim().toLowerCase()
    if (!target) return ''
    const match = fields.find((f) => String(f?.name || '').trim().toLowerCase() === target)
    if (!match) return ''

    const raw = match?.value
    if (Array.isArray(raw)) {
        const clean = raw
            .map((v) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim()))
            .filter(Boolean)
        return clean.join(', ')
    }
    if (typeof raw === 'string') return raw.trim()
    if (raw != null) return String(raw).trim()
    return ''
}

function formatDateDMY(createdAt) {
    if (!createdAt) return ''
    const d = new Date(createdAt)
    if (Number.isNaN(d.getTime())) return ''
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function ClassifiedCardRow({ item, showVerifiedBusiness = false, variant = 'classified' }) {
    const images = useMemo(() => getItemImages(item), [item])
    const fallbackImage =
        variant === 'furniture'
            ? '/assets/img/furniture/1.png'
            : variant === 'mobile'
                ? '/assets/img/mobile/1.png'
                : '/assets/img/classified/1.png'
    const displayImages = images.length ? images : [fallbackImage]
    const variantParam = variant === 'mobile' || variant === 'furniture' ? `&variant=${variant}` : ''
    const [imgIndex, setImgIndex] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)

    useEffect(() => {
        setImgIndex(0)
    }, [item?.id, item?.slug])

    const safeLen = displayImages.length
    const canPrev = imgIndex > 0
    const canNext = imgIndex < safeLen - 1
    // Always show count of usable images in the slider (not API-reported count)
    const galleryCount = images.length

    const isVerifiedUser = normalizeBoolean(item?.verified_user, item?.is_verified_user, item?.verified, item?.is_verified, item?.user_verified, item?.user?.is_verified)
    const isVerifiedBusiness = normalizeBoolean(
        item?.verified_business,
        item?.is_verified_business,
        item?.business_verified,
        item?.user?.verified_business,
        item?.user?.is_verified_business,
        item?.user?.is_business_verified,
        showVerifiedBusiness
    )
    const promotionBadge = useMemo(() => getProductPromotionBadge(item), [item])

    const categoryMain = getFirstText(
        item?.category_name,
        item?.category?.translated_name,
        item?.category?.name,
        item?.main_category_name
    )
    const categorySub = getFirstText(
        item?.sub_category_name,
        item?.subCategory?.translated_name,
        item?.subCategory?.name,
        item?.subcategory?.translated_name,
        item?.subcategory?.name,
        item?.subcategory_name
    )
    const categoryLine = categorySub ? `${categoryMain} • ${categorySub}` : categoryMain

    const title = getFirstTruthy(item?.name, item?.title, item?.listing_title)
    const priceVal = parsePrice(item)
    const priceText = priceVal === '' ? '' : `AED ${formatPriceAbbreviated(priceVal)}`

    const location = getFirstTruthy(item?.location, item?.city, item?.state, item?.country)
    const createdLabel = formatDateDMY(item?.created_at)

    const customFields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const fixedFieldNames = ['Age', 'Condition', 'Usage', 'Warranty']
    const fixedBoxes = fixedFieldNames
        .map((name) => ({
            label: name,
            value: getCustomFieldDisplayValue(item, name),
        }))
        .filter((box) => box.value)
    const extraBoxes = customFields
        .map((f) => {
            const name = typeof f?.name === 'string' ? f.name.trim() : ''
            const value = getCustomFieldDisplayValue({ custom_fields: [f] }, name)
            return { label: name, value }
        })
        .filter((box) => box.label && box.value && !fixedFieldNames.some((n) => n.toLowerCase() === box.label.toLowerCase()))
    const infoBoxes = [...fixedBoxes, ...extraBoxes]

    return (
        <div className="py-[20px] max-sm:flex-col max-sm:items-start flex w-full min-w-0 gap-[18px] items-stretch overflow-hidden border-b border-[rgba(143,143,143,0.18)]">
            <div className="relative w-[282px] max-w-[282px] flex-shrink-0 max-sm:w-full">
                <Link href={`/productdetail?slug=${encodeURIComponent(String(item?.slug || item?.id || ''))}&mode=classified${variantParam}`} prefetch={false}>
                    <div className="relative overflow-hidden rounded-[12px] bg-[#F5F5F5]">
                        <Image
                            src={displayImages[imgIndex] ?? '/assets/img/classified/1.png'}
                            alt={title}
                            width={282}
                            height={236}
                            className="h-[236px] w-full object-cover"
                            onErrorCapture={placeholderImage}
                        />

                        {isVerifiedBusiness ? (
                            <div className="absolute top-[12px] left-[12px] rounded-[6px] flex items-center gap-[4px] bg-[#f1f8f1] border border-[#dcedc8] p-[3px_5px]">
                                <Image src={verifiedbusiness} alt="verifiedbusiness" className="h-[18px] w-[18px]" />
                                <p className="text-[10px] font-[Inter-Bold] text-[#059f01] uppercase">VERIFIED BUSINESS</p>
                            </div>
                        ) : isVerifiedUser ? (
                            <div className="absolute top-[12px] left-[12px] rounded-[6px] flex items-center gap-[4px] bg-[#F5F9FE] border border-[#B0D0F9] p-[3px_5px]">
                                <div className="w-[18px] h-[18px]">
                                    <VerifiedBadge className="w-[18px] h-[18px]" fill="#3A88EF" />
                                </div>
                                <p className='text-[10px] font-[Inter-Bold] text-[#3A88EF] uppercase'>VERIFIED USER</p>
                            </div>
                        ) : null}


                        <div className='absolute right-[12px] top-[6px] flex items-center gap-[4px]'>
                            <button
                                type="button"
                                className="cursor-pointer"
                                aria-label="Favourite"
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
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsSaved((prev) => !prev)
                                    setIsSaveAdsOpen(true)
                                }}
                            >
                                <FavouriteIcon
                                    className={`w-[24px] h-[24px] ${isSaved ? 'text-[#DC0000]' : 'text-white'}`}
                                    fill={isSaved ? '#DC0000' : '#fff'}
                                    fillOpacity={isSaved ? '1' : '0.9'}
                                    stroke={isSaved ? '#DC0000' : '#fff'}
                                />
                            </button>
                        </div>



                        {galleryCount ? (
                            <div className="flex items-center gap-[4px] justify-center absolute bottom-[10px] left-[10px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[2px_5px]">
                                <GalleryIcon className="w-[16px] h-[16px] text-white" />
                                <p className="text-[10px] font-[Inter-SemiBold] text-white">{galleryCount}</p>
                            </div>
                        ) : null}

                        {safeLen > 1 ? (
                            <>
                                <button
                                    type="button"
                                    disabled={!canPrev}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => Math.max(0, p - 1))
                                    }}
                                    className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Previous image"
                                >
                                    <PaginationPrevIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <button
                                    type="button"
                                    disabled={!canNext}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setImgIndex((p) => Math.min(safeLen - 1, p + 1))
                                    }}
                                    className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.35)]"
                                    aria-label="Next image"
                                >
                                    <PaginationNextIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                                </button>

                                <div className="absolute bottom-[14px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                    {Array.from({ length: safeLen }).map((_, idx) => (
                                        <span
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={idx}
                                            className={`h-[7px] w-[7px] rounded-full ${idx === imgIndex ? 'bg-[#000]' : 'bg-[rgba(255,255,255,0.9)]'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </Link>
            </div>

            <div className="flex-1 min-w-0 w-full flex flex-col gap-[10px] items-start justify-start overflow-hidden">
                <div className="w-full min-w-0 flex items-start justify-between gap-[14px] overflow-hidden">
                    <div className="min-w-0 w-full flex flex-col gap-[8px] items-start justify-start overflow-hidden">
                        <div className="w-full min-w-0 flex items-center justify-between gap-[8px] overflow-hidden">
                            <h4 className="block min-w-0 flex-1 truncate text-[16px] font-[Inter-SemiBold] text-[#2b2d2e] leading-[22px]">
                                {title}
                            </h4>
                            {promotionBadge.label ? (
                                <p {...promotionBadgePillAppearance(promotionBadge)}>{promotionBadge.label}</p>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-[4px] max-sm:flex-wrap">
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e] truncate">{categoryLine}</p>
                            <div className="p-[2px] bg-[#2b2d2e] rounded-full"></div>
                            <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e] truncate">{categoryLine}</p>
                        </div>
                        <p className="text-[16px] font-[Inter-SemiBold] text-[#2b2d2e]">{priceText}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-[10px]">
                    {infoBoxes.map((box) => (
                        <div
                            key={box.label}
                            className="flex flex-col gap-[2px] rounded-[6px] bg-[#F7F7F8] border border-[#F6F6F6] p-[10px_12px]"
                        >
                            <p className="text-[10px] font-[Inter-Regular] text-[#6b6d70] uppercase">{box.label}</p>
                            <p className="text-[14px] font-[Inter-Medium] text-[#17191C]">{box.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-[10px] min-w-0">
                    <LocationIcon className="w-[16px] h-[16px]" />
                    <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e] truncate">
                        {location}
                    </p>
                    <div className="p-[2px] bg-[#6b6d70] rounded-full"></div>
                    {createdLabel ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#666] whitespace-nowrap">
                            {createdLabel}
                        </p>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="cursor-pointer flex items-center gap-[10px] bg-[#3A88EF14] rounded-[8px] px-[16px] py-[10px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                >
                    <Image src={chat} alt="chat" width={16} height={16} />
                    <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">Chat</p>
                </button>
            </div>
            <SaveAdsModal
                open={isSaveAdsOpen}
                onClose={() => setIsSaveAdsOpen(false)}
                onConfirm={() => {}}
                onNewList={() => {}}
                lists={SAVE_ADS_LISTS}
                currentListIndex={0}
            />
            <SharePopup
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                shareUrl={absoluteUrl(
                    `/productdetail?slug=${encodeURIComponent(String(item?.slug || item?.id || ''))}&mode=classified${variantParam}`
                )}
                title={title || 'Listing'}
            />
        </div>
    )
}

export default function ClassifiedCard({ perPage = 15, showVerifiedBusiness = false, onItemsTotalChange }) {
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const cityData = useSelector((state) => state?.Location?.cityData)
    const sourceMode = (searchParams?.get('mode') || '').toLowerCase() || 'classified'
    const subSlug = (
        searchParams?.get('category_slug') ||
        searchParams?.get('slug') ||
        ''
    ).toLowerCase()
    const cardVariant = useMemo(() => {
        const source = `${sourceMode} ${subSlug}`
        if (source.includes('furniture')) return 'furniture'
        if (source.includes('mobile') || source.includes('tablet')) return 'mobile'
        return 'classified'
    }, [sourceMode, subSlug])

    const [items, setItems] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setCurrentPage(1)
    }, [sourceMode, subSlug, searchParamsKey, cityData?.city, cityData?.country])

    const fetchPage = async (page) => {
        if (!sourceMode) return
        setIsLoading(true)
        try {
            const city =
                searchParams?.get('city')?.trim() ||
                String(cityData?.city || '').trim() ||
                undefined
            const area = searchParams?.get('area')?.trim() || undefined
            const country =
                searchParams?.get('country')?.trim() ||
                String(cityData?.country || '').trim() ||
                undefined
            const minPrice = searchParams?.get('minPrice')?.trim() || undefined
            const maxPrice = searchParams?.get('maxPrice')?.trim() || undefined
            const filterQuery = collectFilterParamsFromSearchParams(searchParams)
            const searchText =
                searchParams?.get('search')?.trim() ||
                searchParams?.get('keyword')?.trim() ||
                undefined
            const sortBy = searchParams?.get('sort_by')?.trim() || 'new-to-old'
            const sellerAccountType = searchParams?.get('seller_account_type')?.trim() || undefined
            const resolvedCategorySlug = subSlug || sourceMode
            const params = {
                page,
                sort_by: sortBy,
                category_slug: resolvedCategorySlug,
                per_page: perPage,
                limit: perPage,
                city,
                area,
                country,
                min_price: minPrice,
                max_price: maxPrice,
                search: searchText,
                seller_account_type: sellerAccountType,
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
            const list = Array.isArray(first.list) ? first.list : []
            const inner = first.inner || {}

            setItems(list)
            setCurrentPage(inner?.current_page || page)
            setLastPage(Math.max(1, inner?.last_page || 1))
            const total = inner?.total
            if (typeof total === 'number' && Number.isFinite(total)) {
                onItemsTotalChange?.(total)
            } else {
                onItemsTotalChange?.(list.length)
            }
        } catch (e) {
            console.error(e)
            setItems([])
            setCurrentPage(1)
            setLastPage(1)
            onItemsTotalChange?.(0)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!sourceMode) return
        fetchPage(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sourceMode, subSlug, searchParamsKey, cityData?.city, cityData?.country])

    const totalPages = Math.max(1, lastPage)
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(totalPages - (VISIBLE_PAGE_BUTTONS - 1), currentPage))
        const end = Math.min(totalPages, start + VISIBLE_PAGE_BUTTONS - 1)
        const arr = []
        for (let p = start; p <= end; p++) arr.push(p)
        return arr
    }, [currentPage, totalPages])

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="p-[18px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading...</div>
            ) : items.length ? (
                <div>
                    {items.map((item, index) => (
                        <div key={item?.id || item?.slug}>
                            <ClassifiedCardRow item={item} showVerifiedBusiness={showVerifiedBusiness} variant={cardVariant} />
                            {index === 1 ? (
                                <div className="flex flex-col gap-[14px] py-[12px]">
                                    {/* <CommonProjectCard /> */}
                                    <VerifiedMain showTickBadge={false} />
                                </div>
                            ) : null}
                        </div>
                    ))}
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
    )
}
