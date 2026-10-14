'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import anothercar from '../../../../public/assets/img/anothercar.png'
import user from '../../../../public/assets/img/user.jpeg'
import bannertick from '../../../../public/assets/img/icons/bannertick.svg'
import bannerlocation from '../../../../public/assets/img/icons/bannerlocation.svg'
import bannercalendar from '../../../../public/assets/img/icons/bannercalendar.svg'
import motorsbg from '../../../../public/assets/img/motorsbg.png'
import { SearchIcon, CloseIcon } from '@/components/CustomFile/icons'
import { bannerSuggestionApi, categoryHomeApi, FeaturedSectionApi } from '@/utils/api'
import { useCategoryBanner } from '@/hooks/useCategoryBanner'
import { buildCategorySearchHref } from '@/utils/productDetailBreadcrumb'
import { resolveMotorsListingItemLabel } from '@/utils/motorsListingPaths'

const parseApiPayload = (payload) => {
    if (typeof payload === 'string') {
        const scriptIndex = payload.indexOf('<script')
        const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim()
        if (!jsonText) return {}
        try {
            return JSON.parse(jsonText)
        } catch (e) {
            console.error('Motors parse failed:', e)
            return {}
        }
    }
    return payload || {}
}

const formatAdsCountText = (value) => {
    if (value == null || value === '') return '— Ads'
    const n = Number(value)
    if (Number.isNaN(n)) return '— Ads'
    return `${n.toLocaleString()} Ads`
}

const slugifyLabel = (value = '') =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

const MOTORS_PARENT_CATEGORY_ID = 1

function appendSearchParamsToHref(href, { search, city } = {}) {
    const raw = String(href || '').trim()
    if (!raw) return '/products'
    const hashIdx = raw.indexOf('#')
    const base = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw
    const hash = hashIdx >= 0 ? raw.slice(hashIdx) : ''
    const qIdx = base.indexOf('?')
    const pathname = qIdx >= 0 ? base.slice(0, qIdx) : base
    const params = new URLSearchParams(qIdx >= 0 ? base.slice(qIdx + 1) : '')
    const searchText = String(search || '').trim()
    if (searchText) {
        params.set('search', searchText)
        params.set('keyword', searchText)
    }
    const cityName = String(city || '').trim()
    if (cityName) params.set('city', cityName)
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}${hash}`
}

const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
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

function buildItemDetailHref(slug, propertyTypeRaw, itemCategory = '') {
    const detailSlug = String(slug || '').trim()
    if (!detailSlug) return '/ads'

    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    const hasNewProject = propertyTypes.includes('newproject')
    const hasPropertyListing = propertyTypes.includes('sale') || propertyTypes.includes('sell') || propertyTypes.includes('rent')
    const hasClassifiedListing =
        propertyTypes.includes('classified') ||
        propertyTypes.includes('furnituregarden') ||
        propertyTypes.includes('mobilestablets')
    const hasMotorListing = propertyTypes.includes('motor') || propertyTypes.includes('motors')

    const q = new URLSearchParams()
    q.set('slug', detailSlug)

    if (hasNewProject) {
        q.set('mode', 'new-project')
        return `/productdetail?${q.toString()}`
    }

    if (hasMotorListing) {
        q.set('mode', 'motors')
        const item = String(itemCategory || '').trim()
        if (item) q.set('item', item)
        q.set('carOfWeek', '1')
        return `/productdetail?${q.toString()}`
    }

    if (hasPropertyListing) {
        const purpose = listingPurposeFromApiPropertyType(propertyTypes)
        q.set('mode', 'property')
        q.set('purpose', purpose)
        q.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || LISTING_SLUG_BY_PURPOSE.rent)
        return `/productdetail?${q.toString()}`
    }

    if (hasClassifiedListing) {
        q.set('mode', 'classified')
        const variant = resolveClassifiedVariant(propertyTypes)
        if (variant) q.set('variant', variant)
        return `/productdetail?${q.toString()}`
    }

    return `/productdetail?${q.toString()}`
}


const Motors = () => {
    const router = useRouter()
    const selectedCity = useSelector((state) => state?.Location?.cityData?.city || '')
    const { heroBackground, heroTitle, bannersLoading } = useCategoryBanner(
        MOTORS_PARENT_CATEGORY_ID,
        {
            fallbackImage: motorsbg,
            fallbackTitle: 'Everyone is on Ebozor! Are you?',
        }
    )
    const searchWrapRef = useRef(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [apiSuggestions, setApiSuggestions] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const searchDebounceRef = useRef(null)
    const searchReqIdRef = useRef(0)
    const latestSearchQueryRef = useRef('')
    const latestSelectedCityRef = useRef('')
    const [topCategoryCounters, setTopCategoryCounters] = useState([
        { label: 'USED CARS', value: '26,702' },
        { label: 'NUMBER PLATES', value: '5,298' },
        { label: 'RENTAL CARS', value: '2,356' },
        { label: 'MOTORCYCLES', value: '494' },
        { label: 'AUTO ACCESSORIES & PARTS', value: '439' },
        { label: 'BOATS', value: '141' },
        { label: 'HEAVY VEHICLES', value: '129' },
    ])
    const [featuredCards, setFeaturedCards] = useState([])

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

    latestSearchQueryRef.current = searchQuery.trim()
    latestSelectedCityRef.current = String(selectedCity || '').trim()

    const categoryTitleForItem = (item) =>
        item?.category?.translated_name || item?.category?.name || ''

    const getMotorsListingHref = (item, searchText) => {
        const trimmedSearch = String(searchText || '').trim()
        const route = item?.route
        if (route && typeof route === 'object') {
            const params = new URLSearchParams()
            Object.entries(route).forEach(([key, val]) => {
                const normalized = String(val ?? '').trim()
                if (!normalized) return
                params.set(key, normalized)
            })
            if (String(params.get('mode') || '').toLowerCase() === 'motors') {
                const motorsItem = resolveMotorsListingItemLabel({
                    categorySlug: params.get('category_slug') || '',
                    itemParam: params.get('item') || '',
                })
                if (motorsItem) params.set('item', motorsItem)
            }
            if (trimmedSearch) {
                params.set('search', trimmedSearch)
                params.set('keyword', trimmedSearch)
            }
            if (selectedCity) params.set('city', selectedCity)
            const qs = params.toString()
            return qs ? `/products?${qs}` : '/products'
        }

        const categorySlug = String(
            item?.category_slug ||
                item?.category?.slug ||
                item?.slug ||
                slugifyLabel(categoryTitleForItem(item) || item?.name || '')
        ).trim()
        const categoryName = categoryTitleForItem(item) || item?.name || ''
        const location = selectedCity ? { city: selectedCity } : {}
        const baseHref = buildCategorySearchHref(
            'motors',
            { name: categoryName, slug: categorySlug },
            location
        )
        const params = new URLSearchParams()
        const qIdx = baseHref.indexOf('?')
        if (qIdx >= 0) {
            new URLSearchParams(baseHref.slice(qIdx + 1)).forEach((val, key) => {
                params.set(key, val)
            })
        }
        if (trimmedSearch) {
            params.set('search', trimmedSearch)
            params.set('keyword', trimmedSearch)
        }
        if (categorySlug) params.set('category_slug', categorySlug)
        if (!params.get('mode')) params.set('mode', 'motors')
        if (selectedCity) params.set('city', selectedCity)
        const pathname = qIdx >= 0 ? baseHref.slice(0, qIdx) : baseHref
        const qs = params.toString()
        return qs ? `${pathname}?${qs}` : pathname
    }

    const navigateToSuggestion = (item) => {
        const path = getMotorsListingHref(item, searchQuery)
        router.push(path)
        setSearchQuery(item?.name || searchQuery)
        setShowSearchDropdown(false)
    }

    const navigateWithCurrentSearch = () => {
        const q = searchQuery.trim()
        if (!q) return
        const first = apiSuggestions[0]
        if (first) {
            navigateToSuggestion(first)
            return
        }
        router.push(
            appendSearchParamsToHref('/products?mode=motors', {
                search: q,
                city: selectedCity,
            })
        )
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
            const trimmed = String(latestSearchQueryRef.current || '').trim()
            if (!trimmed) {
                if (fetchGeneration === searchReqIdRef.current) {
                    setApiSuggestions([])
                    setSearchLoading(false)
                }
                return
            }
            try {
                const cityForApi = String(latestSelectedCityRef.current || '').trim()
                const response = await bannerSuggestionApi.getSuggestions({
                    search: trimmed,
                    category_id: MOTORS_PARENT_CATEGORY_ID,
                    limit: 12,
                    ...(cityForApi ? { city: cityForApi } : {}),
                })
                const parsed = parseApiPayload(response?.data)
                const rows = parsed?.data
                if (fetchGeneration !== searchReqIdRef.current) return
                const raw = Array.isArray(rows) ? rows : []
                setApiSuggestions(raw)
            } catch (e) {
                console.error('motors search failed:', e)
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
    }, [searchQuery, selectedCity])

    useEffect(() => {
        const fetchCategoryHome = async () => {
            try {
                const response = await categoryHomeApi.getCategoryHome({ parent_category_id: 1 })
                const payload = response?.data
                console.log("payload", payload)
                // Exact response shape:
                // data: { category_item_count: [{ name, count }] }
                const categoriesArray = payload?.data?.category_item_count ?? []

                if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) return

                console.log("categoriesArray", categoriesArray)
                if (categoriesArray.length > 0) {
                    setTopCategoryCounters(categoriesArray.slice(0, 7))
                }
            } catch (e) {
                // Keep fallback UI if API fails
            }
        }

        fetchCategoryHome()
    }, [])

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await FeaturedSectionApi.getFeaturedSections({
                    category_id: 1,
                    filter: 'category_criteria',
                })

                const sections = response?.data
                const section0 = Array.isArray(sections.data) ? sections.data[0] : null
                const items = section0?.section_data

                if (!Array.isArray(items) || items.length === 0) {
                    setFeaturedCards([])
                    return
                }

                const getItemCustomFieldValue = (row, fieldName) => {
                    const list = Array.isArray(row?.item_custom_field_values) ? row.item_custom_field_values : []
                    const target = String(fieldName || '').trim().toLowerCase()
                    if (!target) return ''
                    const hit = list.find(
                        (x) => String(x?.custom_field?.name || '').trim().toLowerCase() === target
                    )
                    const v = hit?.value
                    if (Array.isArray(v)) return v[0] ?? ''
                    return v ?? ''
                }

                const mapped = items.slice(0, 5).map((item, idx) => {
                    const apiYear =
                        item?.year ??
                        item?.model_year ??
                        item?.manufacturing_year ??
                        item?.make_year ??
                        getItemCustomFieldValue(item, 'Year')

                    const apiKm =
                        item?.km ??
                        item?.kms ??
                        item?.mileage ??
                        item?.odometer ??
                        getItemCustomFieldValue(item, 'Kilometers')

                    const year = apiYear != null && apiYear !== '' ? String(apiYear) : '-'
                    const km =
                        apiKm != null && apiKm !== ''
                            ? `${Number(String(apiKm).replace(/[^\d.]/g, '') || apiKm).toLocaleString('en-US')} km`
                            : '-'

                    const city = item?.city
                    const state = item?.state
                    const address = item?.address

                    const location = address
                        ? String(address).split(',')[0]
                        : ([city, state].filter(Boolean).join(' ') || '-')

                    const isRentalCarsCategory =
                        Number(item?.category_id) === 9 ||
                        String(item?.all_category_ids || '').split(',').map((s) => s.trim()).includes('9')

                    const dailyRent = getItemCustomFieldValue(item, 'Daily Rent')
                    const weeklyRent = getItemCustomFieldValue(item, 'Weekly Rent')
                    const monthlyRent = getItemCustomFieldValue(item, 'Monthly Rent')

                    const formatRentalPrice = (raw, suffix) => {
                        if (raw === '' || raw == null) return ''
                        const n = Number(String(raw).replace(/[^\d.]/g, ''))
                        if (!Number.isFinite(n) || n <= 0) return ''
                        return `AED ${n.toLocaleString('en-US')} / ${suffix}`
                    }

                    let price = 'AED -'
                    if (isRentalCarsCategory) {
                        price =
                            formatRentalPrice(dailyRent, 'day') ||
                            formatRentalPrice(weeklyRent, 'week') ||
                            formatRentalPrice(monthlyRent, 'month') ||
                            'AED -'
                    } else {
                        const priceValue = item?.price
                        price = priceValue != null ? `AED ${Number(priceValue).toLocaleString('en-US')}` : 'AED -'
                    }

                    return {
                        id: item?.id ?? idx + 1,
                        slug: item?.slug || '',
                        propertyType: item?.property_type,
                        itemCategory: item?.item_category || '',
                        image: item?.image,
                        price,
                        title: item?.name,
                        year,
                        km,
                        location,
                        time: timeAgo(item?.created_at) || '-',
                    }
                })
                console.log("mapped", mapped);

                // Replace fallback only when we have real items
                if (mapped.length > 0) setFeaturedCards(mapped)
            } catch (e) {
                // Keep fallback if API fails
                setFeaturedCards([])
            }
        }

        fetchFeatured()
    }, [selectedCity])

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
                                <span className="mb-[8px] h-[36px] w-[min(100%,520px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.35)]" />
                            ) : (
                                <h2 className="text-center text-[30px] font-[Inter-Bold] text-[#fff]">
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            navigateWithCurrentSearch()
                                        }
                                    }}
                                    placeholder="Search for motors"
                                    className="outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                                    onFocus={() => setShowSearchDropdown(Boolean(searchQuery.trim()))}
                                />
                                <button
                                    type="button"
                                    aria-label={showSearchDropdown ? 'Close' : 'Search'}
                                    onClick={() => {
                                        if (showSearchDropdown && searchQuery.trim()) {
                                            navigateWithCurrentSearch()
                                            return
                                        }
                                        setShowSearchDropdown(false)
                                    }}
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
                                        <button
                                            type="button"
                                            className="w-full p-[12px_14px] border-b border-[rgba(143,143,143,0.18)] text-left hover:bg-[#F5F5F5] cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                navigateWithCurrentSearch()
                                            }}
                                        >
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] truncate">
                                                {searchQuery.trim()}
                                            </p>
                                        </button>

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
                                                )})}
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

                    {/* Top category counters */}
                    <div className="mb-[20px] flex items-stretch gap-[10px] overflow-x-auto whitespace-nowrap hide_scrollbar py-[18px]">
                        {topCategoryCounters.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center justify-center gap-[12px] flex-col flex-shrink-0 bg-white rounded-[8px] shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.1),0px_5px_8px_rgba(0,0,0,0.07),0px_1px_14px_rgba(0,0,0,0.06)] min-w-[150px] p-[14px]"
                            >
                                <p className="text-[12px] font-[Inter-SemiBold] text-[rgba(0,0,0,0.6)] tracking-[0.2px] uppercase">
                                    {item.name}
                                </p>
                                <h3 className="text-[20px] font-[Inter-Medium] text-[#000] opacity-60 ">
                                    {item.count}
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* Featured Listings */}
                    {featuredCards.length > 0 ? (
                    <div className="mb-[30px]">
                        <div className="mb-[14px]">
                            <h3 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                                Featured Listings
                            </h3>
                        </div>

                        <div className="grid grid-cols-5 gap-[8px] max-sm:grid-cols-2">
                            {featuredCards.map((card) => (

                                <div
                                    key={card.id}
                                    onClick={() => router.push(buildItemDetailHref(card.slug, card.propertyType, card.itemCategory))}
                                    className="flex-shrink-0 bg-white overflow-hidden cursor-pointer hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] p-[6px] rounded-[6px] transition-all duration-300"
                                >
                                    <div className="relative w-full h-[150px] mb-[6px]">
                                        <Image
                                            src={card.image || anothercar}
                                            alt={card.title}
                                            fill
                                            sizes="(max-width: 640px) 50vw, 20vw"
                                            className="object-cover rounded-[6px] max-sm:h-[130px] product_card_img"
                                        />
                                    </div>

                                    <div className="">
                                        <h4 className="text-[16px] font-[Inter-SemiBold] text-[#DC0000] mb-[4px]">
                                            {card.price}
                                        </h4>
                                        <p className="text-[14px] font-[Inter-Medium] text-[#000000] mb-[4px] truncate">
                                            {card.title}
                                        </p>
                                        <div className="flex items-center gap-[8px] mt-[4px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#666] truncate">
                                                {card.year}
                                            </p>
                                            <div className="p-[2px] rounded-full bg-[#666]"></div>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#666] truncate">
                                                {card.km}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-[8px] mt-[6px]">
                                            <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">{card.location}</p>
                                            <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">{card.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    ) : null}

                    {/* Request Ebozor Car Inspection */}
                    <div className="mb-[30px] rounded-[10px] border border-[#FAD5D5] bg-[linear-gradient(90deg,#FFEDEA_0%,#FFFFFF_100%)] p-[20px]">
                        <div className="flex items-center justify-between gap-[16px] flex-wrap">
                            <div className="flex flex-col gap-[14px]">
                                <h4 className="text-[18px] font-[Inter-Medium] text-[#000]">
                                    Request Ebozor <span className='bg-[linear-gradient(90deg,#E00000_0%,#5A3333_100%)] bg-clip-text text-transparent'>Car Inspection</span>
                                </h4>
                                <p className="text-[16px] font-[Inter-Regular] text-[#000000CC] ">
                                    Trusted by 10K+ car buyers, Ebozor is the UAE's go-to platform
                                </p>

                                <div className="flex items-center gap-[22px] flex-wrap">
                                    <div className="flex items-center gap-[10px] border-e border-[#F5AAAA] pe-[20px]">
                                        <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                            <Image src={bannertick} alt="bannertick" width={18} height={18} />
                                        </div>
                                        <div className="flex flex-col gap-[4px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                120 - 240
                                            </p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                Points Covered
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-[10px] border-e border-[#F5AAAA] pe-[20px]">
                                        <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                            <Image src={bannerlocation} alt="bannertick" width={18} height={18} />
                                        </div>
                                        <div className="flex flex-col gap-[4px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                Inspect
                                            </p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                Anywhere!
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-[10px]">
                                        <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                            <Image src={bannercalendar} alt="bannerlocation" width={18} height={18} />
                                        </div>
                                        <div className="flex flex-col gap-[4px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                Same Day
                                            </p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                                Inspection
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link href="/inception"
                               
                                className="w-[30%] flex items-center justify-center p-[8px_20px] rounded-[8px] bg-[#DC0000] text-white font-[Inter-SemiBold] text-[14px] cursor-pointer whitespace-nowrap"
                            >
                                Book Inspection
                            </Link>

                            
                        </div>
                    </div>

                    {/* Testimonials */}
                    <div className="">
                        <div className="mb-[14px]">
                            <h3 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">Testimonials</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-[8px] max-sm:grid-cols-1">
                            {[
                                {
                                    id: 1,
                                    quote:
                                        "I’ve been using Ebozor now for 10 years. I’ve literally lost count of the number I’ve bought and sold from it. Its become so addictive, I tend to log-on most days - planning the next car is both fast & fun.",
                                    name: 'Sean Cain',
                                    avatar: user,
                                },
                                {
                                    id: 2,
                                    quote:
                                        'CarReport recently saved me a trip to Oman for a car I was seriously looking at where the friendly seller claimed "no accidents". However for 99 dirhams and 2 minutes online, CarReport revealed 4 accidents on the car’s history.',
                                    name: 'Ed Surgeon',
                                    avatar: user,
                                },
                                {
                                    id: 3,
                                    quote:
                                        'Put my Hyundai Coupe up for sale on @Ebozor. Got a call within an hour and sold within the same day.',
                                    name: 'Hitesh Uchil',
                                    avatar: user,
                                },
                            ].map((t) => (
                                <div
                                    key={t.id}
                                    className="flex-shrink-0 bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.10)] p-[18px] border border-[rgba(143,143,143,0.10)]"
                                >

                                    <p className="h-[124px] mb-[24px] testimonial relative text-[14px] font-[Inter-Regular] text-[#000] leading-[22px]">
                                        {t.quote}
                                    </p>

                                    <div className="flex items-center gap-[12px]">
                                        <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-[#f5f5f5] flex items-center justify-center">
                                            <Image
                                                src={t.avatar}
                                                alt={t.name}
                                                width={44}
                                                height={44}
                                                className="w-[44px] h-[44px] object-cover filter grayscale"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]">{t.name}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>
            </div>
        </>
    )
}

export default Motors