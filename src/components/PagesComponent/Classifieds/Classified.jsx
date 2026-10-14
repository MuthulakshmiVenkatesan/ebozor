'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import anothercar from '../../../../public/assets/img/anothercar.png'
import verifiedbadge from '../../../../public/assets/img/icons/verifiedbadge.svg'
import classifiedbg from '../../../../public/assets/img/classifiedbg.png'
import { SearchIcon, CloseIcon } from '@/components/CustomFile/icons'
import { categoryHomeApi, FeaturedSectionApi, searchItemsApi } from '@/utils/api'
import { useCategoryBanner } from '@/hooks/useCategoryBanner'
import { placeholderImage } from '@/utils'
import VerifiedMain from '../GetVerified/VerifiedMain'

const parseApiPayload = (payload) => {
    if (typeof payload === 'string') {
        const scriptIndex = payload.indexOf('<script')
        const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim()
        if (!jsonText) return {}
        try {
            return JSON.parse(jsonText)
        } catch (e) {
            console.error('Classified categoryhome parse failed:', e)
            return {}
        }
    }
    return payload || {}
}

const buildSuggestionMatchHaystack = (item) => {
    const parts = [
        item?.name,
        item?.translated_name,
        item?.category?.name,
        item?.category?.translated_name,
    ]
    return parts.map((p) => String(p || '').toLowerCase()).join(' ')
}

const filterSuggestionsByVisibleText = (rows, searchRaw) => {
    const q = String(searchRaw || '').trim().toLowerCase()
    if (!q || !Array.isArray(rows)) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    if (!tokens.length) return rows
    return rows.filter((item) => {
        const hay = buildSuggestionMatchHaystack(item)
        return tokens.every((t) => hay.includes(t))
    })
}

const slugifyLabel = (value = '') =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

const buildProductsFilterHref = (mode, itemLabel, slugOverride) => {
    const m = String(mode || 'classifieds').trim() || 'classifieds'
    const label = String(itemLabel || '').trim()
    const slug = slugOverride ? String(slugOverride).trim() : slugifyLabel(label)
    const q = new URLSearchParams()
    q.set('mode', m)
    q.set('item', label)
    q.set('slug', slug)
    return `/products?${q.toString()}`
}

const formatAdsCountText = (value) => {
    if (value == null || value === '') return '— Ads'
    const n = Number(value)
    if (Number.isNaN(n)) return '— Ads'
    return `${n.toLocaleString()} Ads`
}

const resolveItemSlug = (item) =>
    item?.slug ||
    item?.item_slug ||
    item?.seo_slug ||
    item?.slug_name ||
    item?.permalink ||
    ''

const resolveClassifiedVariant = (propertyTypeRaw) => {
    const first = Array.isArray(propertyTypeRaw) ? propertyTypeRaw[0] : propertyTypeRaw
    const normalized = String(first || '').trim().toLowerCase()
    if (normalized === 'furnituregarden') return 'furniture'
    if (normalized === 'mobilestablets') return 'mobile'
    return ''
}

const Classifieds = ({ parentCategoryId }) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedCity = useSelector((state) => state?.Location?.cityData?.city || '')
    const bannerCategoryId = parentCategoryId ?? 2
    const { heroBackground, heroTitle, bannersLoading } = useCategoryBanner(
        bannerCategoryId,
        {
            fallbackImage: classifiedbg,
            fallbackTitle: 'Your favorite place for great deals on secondhand items',
        }
    )
    const searchWrapRef = useRef(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [apiSuggestions, setApiSuggestions] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [categoryItemCount, setCategoryItemCount] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [featuredCards, setFeaturedCards] = useState([])
    const [featuredLoading, setFeaturedLoading] = useState(false)
    const [featuredSectionTitle, setFeaturedSectionTitle] = useState('Featured Listings')
    const searchDebounceRef = useRef(null)
    const searchReqIdRef = useRef(0)
    const latestSearchParamsRef = useRef({
        q: '',
        categoryId: null,
    })

    const timeAgo = (iso) => {
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
    }

    const searchCategoryId = useMemo(() => {
        const fromUrl =
            searchParams?.get('category_id') ??
            searchParams?.get('categoryId') ??
            searchParams?.get('parent_category_id')
        const raw = fromUrl ?? parentCategoryId
        if (raw == null || raw === '') return null
        const n = Number(raw)
        return Number.isNaN(n) ? raw : n
    }, [searchParams, parentCategoryId])

    latestSearchParamsRef.current = {
        q: searchQuery.trim(),
        categoryId: searchCategoryId,
    }

    const categoryTitleForItem = (item) =>
        item?.category?.translated_name || item?.category?.name || ''

    const getSuggestionProductsPath = (item) => {
        const itemLabel = categoryTitleForItem(item) || item?.name || ''
        return buildProductsFilterHref('classifieds', itemLabel, item?.category?.slug)
    }

    const navigateToSuggestion = (item) => {
        const path = getSuggestionProductsPath(item)
        router.push(path)
        setSearchQuery(item?.name || '')
        setShowSearchDropdown(false)
    }

    useEffect(() => {
        const onMouseDown = (e) => {
            if (!searchWrapRef.current) return
            if (searchWrapRef.current.contains(e.target)) return
            setShowSearchDropdown(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [])

    useEffect(() => {
        const q = searchQuery.trim()
        if (!q) {
            setApiSuggestions([])
            setSearchLoading(false)
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current)
                searchDebounceRef.current = null
            }
            return
        }

        searchReqIdRef.current += 1
        const fetchGeneration = searchReqIdRef.current

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            const { q: liveQ, categoryId: liveCategoryId } = latestSearchParamsRef.current
            const trimmed = String(liveQ || '').trim()
            if (!trimmed) {
                if (fetchGeneration === searchReqIdRef.current) {
                    setApiSuggestions([])
                    setSearchLoading(false)
                }
                return
            }
            try {
                const response = await searchItemsApi.searchItems({
                    search: trimmed,
                    page: 1,
                    ...(liveCategoryId != null ? { category_id: liveCategoryId } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.data
                if (fetchGeneration !== searchReqIdRef.current) return
                const raw = Array.isArray(rows) ? rows : []
                setApiSuggestions(filterSuggestionsByVisibleText(raw, trimmed))
            } catch (e) {
                console.error('classified search failed:', e)
                if (fetchGeneration === searchReqIdRef.current) setApiSuggestions([])
            } finally {
                if (fetchGeneration === searchReqIdRef.current) setSearchLoading(false)
            }
        }, 320)

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current)
                searchDebounceRef.current = null
            }
        }
    }, [searchQuery, searchCategoryId, selectedCity])

    useEffect(() => {
        if (parentCategoryId == null || parentCategoryId === '') {
            setCategoryItemCount([])
            return
        }
        let cancelled = false
        const run = async () => {
            setCategoriesLoading(true)
            try {
                const response = await categoryHomeApi.getCategoryHome({
                    parent_category_id: parentCategoryId,
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data?.category_item_count
                if (!cancelled && Array.isArray(rows)) {
                    setCategoryItemCount(rows)
                }
            } catch (e) {
                console.error('categoryhome fetch failed:', e)
                if (!cancelled) setCategoryItemCount([])
            } finally {
                if (!cancelled) setCategoriesLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [parentCategoryId])

    useEffect(() => {
        if (parentCategoryId == null || parentCategoryId === '') {
            setFeaturedCards([])
            setFeaturedSectionTitle('Featured Listings')
            return
        }
        let cancelled = false
        const run = async () => {
            setFeaturedLoading(true)
            setFeaturedSectionTitle('Featured Listings')
            try {
                const response = await FeaturedSectionApi.getFeaturedSections({
                    category_id: parentCategoryId,
                })
                const parsed = parseApiPayload(response?.data)
                const sections = parsed?.data
                let section0 = Array.isArray(sections) ? sections[0] : null
                let items = Array.isArray(section0?.section_data) ? section0.section_data : []

                if (Array.isArray(sections)) {
                    const withData = sections.find(
                        (s) => Array.isArray(s?.section_data) && s.section_data.length > 0
                    )
                    if (withData) {
                        section0 = withData
                        items = withData.section_data
                    }
                }

                if (!cancelled && section0) {
                    setFeaturedSectionTitle(
                        section0?.translated_name || section0?.title || 'Featured Listings'
                    )
                }

                if (!Array.isArray(items) || items.length === 0) {
                    if (!cancelled) setFeaturedCards([])
                    return
                }

                const mapped = items.slice(0, 5).map((item, idx) => {
                    const city = item?.city
                    const state = item?.state
                    const country = item?.country
                    const location = [city, state, country].filter(Boolean).join(', ') || '-'
                    const priceValue = item?.price
                    const price =
                        priceValue != null ? `AED ${Number(priceValue).toLocaleString('en-US')}` : 'AED -'

                    return {
                        id: item?.id ?? idx + 1,
                        slug: resolveItemSlug(item) || (item?.id != null ? String(item.id) : ''),
                        variant: resolveClassifiedVariant(item?.property_type),
                        image: item?.image || null,
                        price,
                        title: item?.name ?? '-',
                        location,
                        time: timeAgo(item?.created_at) || '-',
                    }
                })
                if (!cancelled) setFeaturedCards(mapped)
            } catch (e) {
                console.error('featured section fetch failed:', e)
                if (!cancelled) setFeaturedCards([])
            } finally {
                if (!cancelled) setFeaturedLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [parentCategoryId, selectedCity])

    const featuredRows =
        featuredLoading
            ? Array.from({ length: 5 }, (_, i) => ({ id: `sk-${i}`, skeleton: true }))
            : featuredCards
    const shouldShowFeaturedSection = featuredLoading || featuredCards.length > 0

    return (
        <>
            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    {/* Hero Banner */}
                    <div className="w-full h-[320px] rounded-[10px] overflow-visible" style={{
                        ...(heroBackground && !bannersLoading ? {
                            backgroundImage: `url(${heroBackground})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        } : {}),
                    }}>
                        {/* Background layers (placeholder composition using existing assets) */}
                        <div className="relative h-full px-[18px] flex flex-col items-center justify-center gap-[8px] text-center">
                            {bannersLoading ? (
                                <span className="mb-[8px] h-[36px] w-[min(100%,600px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.35)]" />
                            ) : (
                                <h2 className="w-[600px] max-sm:w-full text-center text-[30px] font-[Inter-Bold] text-[#fff]">
                                    {heroTitle}
                                </h2>
                            )}

                            <div ref={searchWrapRef} className="relative max-sm:w-full w-[600px] flex items-center justify-between bg-[#FFF] rounded-[6px] p-[10px_16px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.1)]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setShowSearchDropdown(Boolean(e.target.value.trim()))
                                    }}
                                    placeholder="Search for community"
                                    className="outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                                    onFocus={() => setShowSearchDropdown(Boolean(searchQuery.trim()))}
                                />
                                <button
                                    type="button"
                                    aria-label={showSearchDropdown ? 'Close' : 'Search'}
                                    onClick={() => setShowSearchDropdown(false)}
                                    className="cursor-pointer flex items-center justify-center"
                                >
                                    {showSearchDropdown ? (
                                        <CloseIcon className="w-[10px] h-[10px]" />
                                    ) : (
                                        <SearchIcon stroke="#8F8F8F" />
                                    )}
                                </button>

                                {showSearchDropdown ? (
                                    <div className="absolute left-0 right-0 top-[56px] bg-white rounded-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.14)] border border-[rgba(143,143,143,0.18)] overflow-hidden z-[999]">
                                        <div className="p-[12px_14px] border-b border-[rgba(143,143,143,0.18)]">
                                            <p className="text-left text-[14px] font-[Inter-Regular] text-[#000] truncate">
                                                {searchQuery.trim()}
                                            </p>
                                        </div>

                                        {searchLoading && !apiSuggestions.length ? (
                                            <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Searching...
                                            </div>
                                        ) : apiSuggestions.length ? (
                                            <div className="max-h-[260px] overflow-y-auto">
                                                {apiSuggestions.map((item) => {
                                                    const title = item?.name || ''
                                                    return (
                                                        <button
                                                            key={item?.id ?? title}
                                                            type="button"
                                                            className="w-full flex items-center justify-between gap-[12px] px-[14px] py-[12px] hover:bg-[#F5F5F5] cursor-pointer"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                navigateToSuggestion(item)
                                                            }}
                                                        >
                                                            <span className="flex items-start flex-col gap-[4px] min-w-0">
                                                                <span className="text-[14px] font-[Inter-Regular] text-[#000] truncate block w-full text-left">
                                                                    {title}
                                                                </span>
                                                                {categoryTitleForItem(item) ? (
                                                                    <span className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] whitespace-nowrap text-left">
                                                                        {categoryTitleForItem(item)}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                            <p className="text-[14px] font-[Inter-Regular] text-[#3A88EF] whitespace-nowrap">
                                                                {formatAdsCountText(item?.category?.adscount ?? item?.adscount)}
                                                            </p>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No results
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>



                    {/* Top category counters — from categoryhome API */}
                    {parentCategoryId != null && parentCategoryId !== '' ? (
                        <div className="flex items-stretch gap-[10px] overflow-x-auto whitespace-nowrap hide_scrollbar py-[18px]">
                            {categoriesLoading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={`sk-${i}`}
                                        className="flex items-center justify-center gap-[12px] flex-col flex-shrink-0 bg-white rounded-[8px] shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.1),0px_5px_8px_rgba(0,0,0,0.07),0px_1px_14px_rgba(0,0,0,0.06)] min-w-[169px] p-[14px] animate-pulse"
                                    >
                                        <div className="h-3 w-[120px] rounded bg-[#eee]" />
                                        <div className="h-6 w-[48px] rounded bg-[#eee]" />
                                    </div>
                                ))
                                : categoryItemCount.map((item, idx) => {
                                    const label = item?.name ?? ''
                                    const count = item?.count
                                    const value =
                                        count === '' || count == null
                                            ? '—'
                                            : Number(count).toLocaleString()
                                    const productsHref = buildProductsFilterHref(
                                        'classifieds',
                                        label,
                                        item?.slug
                                    )
                                    return (
                                        <Link href={productsHref} key={`${label}-${idx}`}>
                                            <div className="flex items-center justify-center gap-[12px] flex-col flex-shrink-0 bg-white rounded-[8px] shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.1),0px_5px_8px_rgba(0,0,0,0.07),0px_1px_14px_rgba(0,0,0,0.06)] min-w-[169px] p-[14px] cursor-pointer">
                                                <p className="text-[12px] font-[Inter-SemiBold] text-[rgba(0,0,0,0.6)] tracking-[0.2px] uppercase">
                                                    {label}
                                                </p>
                                                <h3 className="text-[20px] font-[Inter-Medium] text-[#000] opacity-60 ">
                                                    {value}
                                                </h3>
                                            </div>
                                        </Link>
                                    )
                                })}
                        </div>
                    ) : null}

                    <VerifiedMain showTickBadge={false} />

                    {/* Featured Listings — FeaturedSectionApi (same params pattern as Motors) */}
                    {shouldShowFeaturedSection ? (
                        <div className="mb-[30px]">
                            <div className="mb-[14px]">
                                <h3 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                                    {featuredSectionTitle}
                                </h3>
                            </div>

                            <div className="grid grid-cols-5 gap-[8px] max-sm:grid-cols-2">
                                {featuredRows.map((card) =>
                                    card.skeleton ? (
                                        <div
                                            key={card.id}
                                            className="flex-shrink-0 bg-white overflow-hidden p-[6px] rounded-[6px] animate-pulse"
                                        >
                                            <div className="relative w-full h-[150px] mb-[6px] rounded-[6px] bg-[#eee] max-sm:h-[130px]" />
                                            <div className="h-4 w-24 rounded bg-[#eee] mb-[8px]" />
                                            <div className="h-3 w-full rounded bg-[#eee] mb-[6px]" />
                                            <div className="flex justify-between gap-[8px]">
                                                <div className="h-3 flex-1 rounded bg-[#eee]" />
                                                <div className="h-3 w-16 rounded bg-[#eee]" />
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/productdetail?slug=${encodeURIComponent(card.slug || String(card.id))}&mode=classified${card?.variant ? `&variant=${encodeURIComponent(card.variant)}` : ''
                                                }`}
                                        >
                                            <div
                                                key={card.id}
                                                className="flex-shrink-0 bg-white overflow-hidden cursor-pointer hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] p-[6px] rounded-[6px] transition-all duration-300"
                                            >
                                                <div className="relative w-full h-[150px] mb-[6px]">
                                                    <Image
                                                        src={card.image || anothercar}
                                                        alt={card.title || ''}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, 20vw"
                                                        className="object-cover rounded-[6px] max-sm:h-[130px] product_card_img"
                                                        onErrorCapture={placeholderImage}
                                                    />
                                                </div>

                                                <div className="">
                                                    <h4 className="text-[16px] font-[Inter-SemiBold] text-[#DC0000] mb-[4px]">
                                                        {card.price}
                                                    </h4>
                                                    <p className="text-[14px] font-[Inter-Medium] text-[#000000] mb-[4px] truncate">
                                                        {card.title}
                                                    </p>
                                                    <div className="flex items-center justify-between gap-[8px] mt-[6px]">
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">
                                                            {card.location}
                                                        </p>
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">
                                                            {card.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    ) : null}

                </div>
            </div>
        </>
    )
}

export default Classifieds