'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RightArrowIcon, SortArrowIcon } from '@/components/CustomFile/icons'
import saveIcon from '../../../../../public/assets/img/icons/saveIcon.svg'
import home from '../../../../../public/assets/img/icons/home.svg'
import SavedSearchModal from './SavedSearchModal'
import savedfill from '../../../../../public/assets/img/icons/savedfill.svg'
import verifiedbusiness from '../../../../../public/assets/img/icons/verifiedbusiness.svg'
import { categoryApi, categoryHomeApi, categorySubdataApi, getParentCategoriesApi, locationItemCountApi, savedSearchApi } from '@/utils/api'
import { buildCategoryBreadcrumbHref, buildCategorySearchHref, buildLocationSearchHref, getVerticalHomeHref, isVerticalRootCategory, parseCategoryPathFromResponse, resolveModeKey } from '@/utils/productDetailBreadcrumb'
import { getCityData } from '@/redux/reuducer/locationSlice'
import { useSelector } from 'react-redux'
import { buildSavedSearchGetItemApiPath } from '@/utils/savedSearchUrls'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const CLASSIFIED_MODELS_FILTER_NAME = 'Models'

function parseAncestorPathFromParentCategoriesResponse(res) {
    const data = res?.data?.data
    const rawPath = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return rawPath
        .map((node) => ({
            id: node?.category_id ?? node?.id,
            slug: String(node?.slug || '').trim(),
            name: String(node?.name || node?.translated_name || node?.category_name || '').trim(),
        }))
        .filter((node) => node.id != null)
}

function categoryBlob(node) {
    return `${String(node?.slug || '').toLowerCase()} ${String(node?.name || '').toLowerCase()}`
}

/** True when the selected category sits under Mobile Phones or Tablets (not the parent group alone). */
function isMobilePhonesOrTabletsLeafPath(ancestorPath = []) {
    if (!Array.isArray(ancestorPath) || ancestorPath.length === 0) return false
    const blob = ancestorPath.map(categoryBlob).join(' ')
    const underMobileTabletsGroup =
        (blob.includes('mobile') && blob.includes('tablet')) ||
        blob.includes('mobile-phones-and-tablets') ||
        blob.includes('mobile phones and tablets') ||
        blob.includes('classified-mobile-phones-tablets') ||
        blob.includes('mobiles-tablets')
    if (!underMobileTabletsGroup) return false

    const underMobilePhones =
        blob.includes('mobile-phone') ||
        blob.includes('mobile-phones') ||
        /\bmobile phones?\b/.test(blob)
    const underTablets = blob.includes('tablet') || /\btablets?\b/.test(blob)

    return underMobilePhones || underTablets
}

function motorsItemCount(row) {
    const countRaw = row?.item_count ?? row?.count
    const countNum = Number(countRaw)
    if (
        countRaw !== undefined &&
        countRaw !== null &&
        countRaw !== '' &&
        Number.isFinite(countNum) &&
        countNum >= 0
    ) {
        return countNum
    }
    return 0
}

function motorsModelChipLabel(row) {
    const modelName = String(row?.model_name || '').trim()
    if (modelName) return modelName
    const merged = String(row?.merged_name || '').trim()
    const makeName = String(row?.make_name || '').trim()
    if (makeName && merged.toLowerCase().startsWith(makeName.toLowerCase())) {
        return merged.slice(makeName.length).trim() || merged
    }
    return merged
}

function parseCategorySubdataListPayload(res) {
    const payload = res?.data?.data ?? res?.data
    if (!Array.isArray(payload)) return []
    return payload
        .map((row) => {
            if (typeof row === 'string') {
                const label = String(row).trim()
                return label ? { label, count: null } : null
            }
            const label = String(row?.name ?? row?.title ?? row?.label ?? '').trim()
            if (!label) return null
            const countRaw = row?.count ?? row?.items_count ?? row?.item_count
            const countNum = Number(countRaw)
            const count =
                countRaw !== undefined &&
                countRaw !== null &&
                countRaw !== '' &&
                Number.isFinite(countNum) &&
                countNum >= 0
                    ? countNum
                    : null
            return { label, count, isModel: true }
        })
        .filter(Boolean)
}

function sliceCategoryPathAfterModeRoot(categoryPath = [], modeLabel = '') {
    if (!Array.isArray(categoryPath) || categoryPath.length === 0) return []

    const normalizedModeLabel = String(modeLabel || '').trim().toLowerCase()
    let rootIndex = categoryPath.findIndex((cat) => isVerticalRootCategory(cat))

    if (rootIndex < 0 && normalizedModeLabel) {
        rootIndex = categoryPath.findIndex((cat) => {
            const name = String(cat?.name || '').trim().toLowerCase()
            const slug = String(cat?.slug || '').trim().toLowerCase()
            return name === normalizedModeLabel || slug === normalizedModeLabel.replace(/\s+/g, '-')
        })
    }

    if (rootIndex < 0) {
        return categoryPath.length > 1 ? categoryPath.slice(1) : categoryPath
    }

    return categoryPath.slice(rootIndex + 1)
}

function buildProductsNavigationBreadcrumbItems({
    modeKey,
    modeLabel,
    cityLabel,
    location,
    categoryPath,
    fallbackSubLabel,
}) {
    if (!cityLabel) return [{ label: modeLabel || 'Search' }]

    const modeRootCategory =
        categoryPath.find((cat) => isVerticalRootCategory(cat)) || { name: modeLabel }

    const items = [
        {
            label: cityLabel,
            href:
                categoryPath.length > 0
                    ? buildLocationSearchHref(modeKey, categoryPath, location)
                    : buildCategorySearchHref(modeKey, modeRootCategory, location, categoryPath),
        },
        {
            label: modeLabel,
            href:
                getVerticalHomeHref(modeRootCategory) ||
                buildCategorySearchHref(modeKey, modeRootCategory, location, categoryPath),
        },
    ]

    const subCategorySegments = sliceCategoryPathAfterModeRoot(categoryPath, modeLabel)
    subCategorySegments.forEach((cat, index) => {
        const isLast = index === subCategorySegments.length - 1
        const segmentIndex = categoryPath.findIndex(
            (node) => String(node?.category_id) === String(cat?.category_id)
        )
        items.push({
            label: String(cat?.name || '').trim() || toTitle(cat?.slug || ''),
            href: isLast
                ? undefined
                : buildCategoryBreadcrumbHref(
                      modeKey,
                      cat,
                      location,
                      categoryPath,
                      segmentIndex >= 0 ? segmentIndex : index + 1
                  ),
        })
    })

    if (
        subCategorySegments.length === 0 &&
        fallbackSubLabel &&
        String(fallbackSubLabel).trim().toLowerCase() !== String(modeLabel).trim().toLowerCase()
    ) {
        items.push({ label: fallbackSubLabel })
    }

    return items
}

function toTitle(value = '') {
    return value
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase())
}

const PROPERTY_RENT_PARENT_SLUG = 'property-for-rent'
const PROPERTY_SALE_PARENT_SLUG = 'property-for-sale'

/** Walk selected category ancestors (get-parent-categories) to find Rent vs Sale parent. */
function detectPropertyPurposeFromCategoryPath(categoryPath = []) {
    if (!Array.isArray(categoryPath) || categoryPath.length === 0) return null
    for (const node of categoryPath) {
        const slug = String(node?.slug || '').trim().toLowerCase()
        if (slug === PROPERTY_SALE_PARENT_SLUG) return 'sale'
        if (slug === PROPERTY_RENT_PARENT_SLUG) return 'rent'
    }
    return null
}

function propertyListingTypeLabel(rawName = '') {
    let name = String(rawName || '').trim()
    if (!name) return 'Properties'
    const allInMatch = name.match(/^all(?:\s+in)?\s+(.+)$/i)
    if (allInMatch?.[1]) name = allInMatch[1].trim()
    name = name.replace(/\s+for\s+(rent|sale)\s*$/i, '').trim() || name
    const lower = name.toLowerCase()
    if (!name || lower === 'property' || lower === 'property for rent' || lower === 'property for sale') {
        return 'Properties'
    }
    if (lower === 'office') return 'Office Spaces'
    return name
}

function buildPropertyListingHeading({ categoryPath, displayName, fallbackLabel, cityLabel }) {
    const leafName = categoryPath.length
        ? String(categoryPath[categoryPath.length - 1]?.name || '').trim()
        : ''
    const categoryPhrase = propertyListingTypeLabel(displayName || leafName || fallbackLabel)
    const locationLabel = String(cityLabel || '').trim() || 'UAE'
    const purpose = detectPropertyPurposeFromCategoryPath(categoryPath)
    if (purpose === 'sale') return `${categoryPhrase} for sale in ${locationLabel}`
    if (purpose === 'rent') return `${categoryPhrase} for Rent in ${locationLabel}`
    return `${categoryPhrase} in ${locationLabel}`
}

const DEFAULT_COUNTRY = 'United Arab Emirates'

function normalizeCountryName(value) {
    const name = String(value || '').trim()
    if (!name) return DEFAULT_COUNTRY
    const key = name.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
    if (key === 'uae' || key === 'u a e' || key === 'united arab emirates') {
        return DEFAULT_COUNTRY
    }
    return name
}

function parseApiPayload(payload) {
    if (typeof payload === 'string') {
        const scriptIndex = payload.indexOf('<script')
        const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim()
        if (!jsonText) return {}
        try {
            return JSON.parse(jsonText)
        } catch {
            return {}
        }
    }
    return payload || {}
}

const MODE_LABELS = {
    motors: 'Motors',
    property: 'Property',
    jobs: 'Jobs',
    community: 'Community',
    classified: 'Classifieds',
    furniture: 'Furniture & Garden',
    mobile: 'Mobiles & Tablets',
}

const MODE_CHIPS = {
    motors: ['Mercedes-Benz', 'Toyota', 'BMW', 'Nissan', 'Land Rover', 'Ford', 'Audi', 'Porsche'],
    property: ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Hotel Apartment', 'Land'],
    jobs: ['Accounting', 'IT', 'Sales', 'Engineering', 'Customer Service', 'Part Time', 'Driver'],
    community: ['Auto Services', 'Tutors', 'Home Maintenance', 'Event Services', 'Domestic'],
    classified: ['Electronics', 'Computers', 'Business', 'Pets', 'Gaming', 'Baby Items'],
    furniture: ['Sofas', 'Beds', 'Dining', 'Office Furniture', 'Outdoor', 'Lighting'],
    mobile: ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Huawei', 'Accessories'],
}

const SORT_OPTIONS = [
    'Popular',
    'Newest to Oldest',
    'Oldest to Newest',
    'Price Highest to Lowest',
    'Price Lowest to Highest',
    // 'Kilometers Highest to Lowest',
    // 'Kilometers Lowest to Highest',
    // 'Year Highest to Lowest',
    // 'Year Lowest to Highest',
]

const JOBS_SORT_OPTIONS = ['Newest to Oldest', 'Oldest to Newest']

const NEW_PROJECT_SORT_OPTIONS = [
    'Popular',
    'Newest',
    'Nearest Handover',
    'Lowest Starting Price',
    'Highest Starting Price',
    'Lowest Downpayment',
]

const SELLER_SEGMENTS = ['All Sellers', 'Individuals', 'Businesses']

function sellerSegmentFromParam(value) {
    const v = String(value || '').trim().toLowerCase()
    if (v === 'vb' || v === 'business' || v === 'businesses') return 'Businesses'
    if (v === 'ind' || v === 'individual' || v === 'individuals') return 'Individuals'
    return 'All Sellers'
}

function sellerParamFromSegment(segment) {
    if (segment === 'Businesses') return 'VB'
    if (segment === 'Individuals') return 'individuals'
    return ''
}

const SORT_TO_API = {
    Popular: 'popular_items',
    'Newest to Oldest': 'new-to-old',
    'Oldest to Newest': 'old-to-new',
    'Price Highest to Lowest': 'price-high-to-low',
    'Price Lowest to Highest': 'price-low-to-high',
}

const NEW_PROJECT_SORT_TO_API = {
    Popular: 'popular_items',
    Newest: 'new-to-old',
    'Nearest Handover': 'nearest-handover',
    'Lowest Starting Price': 'price-low-to-high',
    'Highest Starting Price': 'price-high-to-low',
    'Lowest Downpayment': 'lowest-downpayment',
}

const API_TO_SORT = {
    popular_items: 'Popular',
    'new-to-old': 'Newest to Oldest',
    'old-to-new': 'Oldest to Newest',
    'price-high-to-low': 'Price Highest to Lowest',
    'price-low-to-high': 'Price Lowest to Highest',
}

const API_TO_NEW_PROJECT_SORT = {
    popular_items: 'Popular',
    'new-to-old': 'Newest',
    'nearest-handover': 'Nearest Handover',
    'price-low-to-high': 'Lowest Starting Price',
    'price-high-to-low': 'Highest Starting Price',
    'lowest-downpayment': 'Lowest Downpayment',
}

function SellerSegmentIcon({ type, active }) {
    const stroke = active ? '#4338CA' : '#4B5563'

    if (type === 'Businesses') {
        return (
            <Image src={verifiedbusiness} alt="verifiedbusiness" className="h-[18px] w-[18px]" />
        )
    }

    if (type === 'All Sellers') {
        return (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="6" cy="6" r="2.2" stroke={stroke} strokeWidth="1.5" />
                <circle cx="11.8" cy="6.4" r="1.8" stroke={stroke} strokeWidth="1.5" />
                <path d="M2.8 12.8C2.8 11.2 4.1 9.9 5.7 9.9H6.3C7.9 9.9 9.2 11.2 9.2 12.8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 12.2C10.1 11 11.1 10.1 12.3 10.1H12.6C13.8 10.1 14.8 11 14.9 12.2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    }

    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="2.4" stroke={stroke} strokeWidth="1.5" />
            <path d="M4.5 13.2C4.5 11.4 5.9 10 7.7 10H10.3C12.1 10 13.5 11.4 13.5 13.2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export default function ProductsBreadcrumb({
    mode = 'motors',
    sourceMode = '',
    itemParam = '',
    slugParam = '',
    segmentParam = '',
    onSellerSegmentChange,
    itemsTotal = null,
}) {
    const router = useRouter()
    const [showAllChips, setShowAllChips] = useState(false)
    const chipsScrollRef = useRef(null)
    const [chipScrollLeft, setChipScrollLeft] = useState(false)
    const [chipScrollRight, setChipScrollRight] = useState(false)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [selectedSort, setSelectedSort] = useState('Newest to Oldest')
    const [isSavedSearchModalOpen, setIsSavedSearchModalOpen] = useState(false)
    const [isSearchSaved, setIsSearchSaved] = useState(false)
    const [selectedSellerSegment, setSelectedSellerSegment] = useState('All Sellers')
    const [apiChips, setApiChips] = useState([])
    const [categorySlugDisplayName, setCategorySlugDisplayName] = useState('')
    const [categoryPath, setCategoryPath] = useState([])
    const sortDropdownRef = useRef(null)
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const cityData = useSelector(getCityData)
    const urlCity = String(searchParams?.get('city') || '').trim()
    const urlCountry = String(searchParams?.get('country') || '').trim()
    const urlState = String(searchParams?.get('state') || '').trim()
    const urlArea = String(searchParams?.get('area') || '').trim()
    const urlAreaId = String(searchParams?.get('area_id') || '').trim()
    const reduxCountry = String(cityData?.country || '').trim()
    const reduxState = String(cityData?.state || '').trim()
    const reduxCity = String(cityData?.city || '').trim()
    const headerCountry = normalizeCountryName(urlCountry || reduxCountry)
    const cityLabel = urlCity || reduxCity || 'UAE'
    const modeLabel = MODE_LABELS[mode] || 'Motors'
    const lowerItem = itemParam.toLowerCase()
    const lowerSlug = slugParam.toLowerCase()
    const lowerSegment = String(segmentParam || '').toLowerCase()
    const isPropertyNewProject =
        mode === 'property' &&
        (lowerSegment === 'new_projects' ||
            lowerSlug.includes('new-project') ||
            lowerItem.includes('new project') ||
            lowerItem.includes('new projects'))
    const categorySlugLabel = String(searchParams?.get('category_slug') || '').trim()
    const subLabel = categorySlugLabel
        ? (categorySlugDisplayName || toTitle(categorySlugLabel))
        : itemParam
            ? toTitle(itemParam)
            : slugParam
                ? toTitle(slugParam)
                : modeLabel
    const heading = isPropertyNewProject
        ? `Latest New Projects in ${cityLabel}`
        : mode === 'property'
            ? buildPropertyListingHeading({
                  categoryPath,
                  displayName: categorySlugDisplayName,
                  fallbackLabel: subLabel,
                  cityLabel,
              })
            : `${subLabel} in ${cityLabel}`
    const adsCountFormatted =
        itemsTotal != null && Number.isFinite(Number(itemsTotal))
            ? Number(itemsTotal).toLocaleString('en-US')
            : '—'
    const currentSortOptions = isPropertyNewProject
        ? NEW_PROJECT_SORT_OPTIONS
        : mode === 'jobs' || mode === 'recruiter'
          ? JOBS_SORT_OPTIONS
          : SORT_OPTIONS
    const showSellerSegments =
        mode === 'classified' ||
        ['classified', 'mobile', 'furniture'].includes(String(sourceMode || '').toLowerCase())

    const chips = useMemo(() => {
        if (mode === 'motors' && lowerItem.includes('scooter')) {
            return [
                'Land Cruiser (313)',
                'Prado (218)',
                'Hilux (197)',
                'Rav 4 (193)',
                'Camry (144)',
                'Yaris (142)',
                'Corolla (139)',
                'Fortuner (117)',
                'Hiace (97)',
                'FJ Cruiser (58)',
                'Corolla Cross (48)',
                'Highlander (36)',
                'Supra (34)',
                'Tundra (32)',
                'C-HR (29)',
                'Raize (25)',
                'Land Cruiser 79 series (22)',
                'Rush (22)',
                'Urban Cruiser (20)',
                'Coaster (18)',
                'Avanza (13)',
                'Innova (13)',
                'Veloz (13)',
                'Frontlander (12)',
                'Land Cruiser 70 (12)',
                'Sienna (12)',
                'Tacoma (11)',
                'Crown (10)',
                'Granvia (10)',
                'Land Cruiser 76 (10)',
                '4Runner (9)',
                'Levin (9)',
                'Sequoia (9)',
                'Land Cruiser 76 series (8)',
                'Alphard (6)',
                'Avalon (6)',
                'Land Cruiser 78 series (5)',
                'Previa (5)',
                'Prius (5)',
                '86 (4)',
                'BZ4X (4)',
                'Land Cruiser 70 Series (4)',
                'Lite Ace (4)',
                'GR86 (3)',
                'Pickup (3)',
                'bZ3 (2)',
                'XA (2)',
                'Aurion (1)',
                'Century (1)',
                'IQ (1)',
                'MR2 (1)',
                'Venza (1)',
                'Vios (1)',
            ]
        }
        return MODE_CHIPS[mode] || MODE_CHIPS.motors
    }, [mode, lowerItem])
    const resolvedCategorySlug = useMemo(
        () =>
            String(
                searchParams?.get('category_slug') ||
                searchParams?.get('slug') ||
                slugParam ||
                ''
            ).trim(),
        [searchParams, slugParam]
    )
    const motorsMakeModelQ = useMemo(
        () => String(searchParams?.get('make_model') || '').trim(),
        [searchParams]
    )
    const motorsMakeId = useMemo(
        () => String(searchParams?.get('make_id') || '').trim(),
        [searchParams]
    )
    const motorsModelId = useMemo(
        () => String(searchParams?.get('model_id') || '').trim(),
        [searchParams]
    )
    const motorsHasSelectedMake = Boolean(motorsMakeId) || Boolean(motorsMakeModelQ)
    const classifiedModelsFilterQ = useMemo(() => {
        if (!searchParams?.forEach) return ''
        let value = ''
        searchParams.forEach((v, k) => {
            if (k === `filters[${CLASSIFIED_MODELS_FILTER_NAME}]`) value = String(v || '').trim()
        })
        return value
    }, [searchParams])
    const isMotorsMakeModelChips = mode === 'motors' && !isPropertyNewProject && !!resolvedCategorySlug
    const isJobsCategoryChildrenChips =
        (mode === 'jobs' || mode === 'recruiter') && !isPropertyNewProject && !!resolvedCategorySlug
    const isClassifiedSubcategoryChips =
        (sourceMode === 'classified' || sourceMode === 'mobile') &&
        !isPropertyNewProject &&
        !!resolvedCategorySlug
    const isPropertyLocationChips = mode === 'property'
    const isApiDrivenChips =
        isMotorsMakeModelChips ||
        isJobsCategoryChildrenChips ||
        isClassifiedSubcategoryChips ||
        isPropertyLocationChips
    const propertyLocationApiParams = useMemo(() => {
        if (!isPropertyLocationChips) return null
        const city = urlCity || reduxCity
        const state = urlState || reduxState
        return {
            country: headerCountry,
            state: state || undefined,
            city: city || undefined,
            area: urlArea || undefined,
            area_id: urlAreaId || undefined,
            category_slug: resolvedCategorySlug || undefined,
        }
    }, [
        isPropertyLocationChips,
        headerCountry,
        urlCity,
        urlState,
        urlArea,
        urlAreaId,
        reduxCity,
        reduxState,
        resolvedCategorySlug,
    ])
    const chipsToRender = isApiDrivenChips ? apiChips : chips

    const buildMotorsChipHref = useCallback(
        (chip) => {
            const chipObj = chip && typeof chip === 'object' ? chip : null
            const label = String(chipObj?.label || chip || '').trim()
            if (!label || !resolvedCategorySlug) return pathname || '/'
            const qs = new URLSearchParams(searchParams?.toString() || '')
            qs.set('category_slug', resolvedCategorySlug)
            qs.set('page', '1')
            if (chipObj?.model_id) {
                const makeModelLabel = String(chipObj.merged_name || label).trim()
                if (makeModelLabel) qs.set('make_model', makeModelLabel)
                else qs.delete('make_model')
                if (chipObj.make_id != null && String(chipObj.make_id).trim() !== '') {
                    qs.set('make_id', String(chipObj.make_id))
                }
                qs.set('model_id', String(chipObj.model_id))
            } else {
                qs.set('make_model', label)
                if (chipObj?.make_id != null && String(chipObj.make_id).trim() !== '') {
                    qs.set('make_id', String(chipObj.make_id))
                } else {
                    qs.delete('make_id')
                }
                qs.delete('model_id')
            }
            const next = qs.toString()
            const base = pathname || '/'
            return next ? `${base}?${next}` : base
        },
        [pathname, resolvedCategorySlug, searchParams]
    )
    const buildJobsChipHref = useCallback(
        (nextCategorySlug) => {
            const slug = String(nextCategorySlug || '').trim()
            if (!slug) return pathname || '/'
            const qs = new URLSearchParams(searchParams?.toString() || '')
            qs.set('category_slug', slug)
            qs.set('page', '1')
            const next = qs.toString()
            const base = pathname || '/'
            return next ? `${base}?${next}` : base
        },
        [pathname, searchParams]
    )
    const buildClassifiedChipHref = buildJobsChipHref
    const buildClassifiedModelChipHref = useCallback(
        (modelLabel) => {
            const label = String(modelLabel || '').trim()
            if (!label) return pathname || '/'
            const qs = new URLSearchParams(searchParams?.toString() || '')
            qs.set('page', '1')
            const filterKeys = []
            qs.forEach((_, key) => {
                if (String(key).startsWith('filters[')) filterKeys.push(key)
            })
            filterKeys.forEach((key) => {
                if (key.toLowerCase() === `filters[${CLASSIFIED_MODELS_FILTER_NAME.toLowerCase()}]`) {
                    qs.delete(key)
                }
            })
            qs.set(`filters[${CLASSIFIED_MODELS_FILTER_NAME}]`, label)
            const next = qs.toString()
            const base = pathname || '/'
            return next ? `${base}?${next}` : base
        },
        [pathname, searchParams]
    )
    const buildPropertyLocationChipHref = useCallback(
        (chip) => {
            const label = String(chip?.label || '').trim()
            const type = String(chip?.type || '').trim().toLowerCase()
            const chipId = chip?.id
            if (!label) return pathname || '/'
            const qs = new URLSearchParams(searchParams?.toString() || '')
            qs.set('page', '1')
            qs.set('country', headerCountry)
            if (type === 'building') {
                qs.set('building', label)
                if (chipId != null && chipId !== '') qs.set('building_id', String(chipId))
                if (urlArea) qs.set('area', urlArea)
                if (urlAreaId) qs.set('area_id', urlAreaId)
                if (urlCity || reduxCity) qs.set('city', urlCity || reduxCity)
            } else if (type === 'area') {
                qs.set('area', label)
                if (chipId != null && chipId !== '') qs.set('area_id', String(chipId))
                qs.delete('building')
                qs.delete('building_id')
                if (urlCity || reduxCity) qs.set('city', urlCity || reduxCity)
            } else if (type === 'state') {
                qs.set('state', label)
                qs.delete('city')
                qs.delete('area')
                qs.delete('area_id')
                qs.delete('building')
                qs.delete('building_id')
            } else {
                qs.set('city', label)
                qs.delete('area')
                qs.delete('area_id')
                qs.delete('building')
                qs.delete('building_id')
            }
            const next = qs.toString()
            const base = pathname || '/'
            return next ? `${base}?${next}` : base
        },
        [pathname, searchParams, headerCountry, urlCity, reduxCity, urlArea, urlAreaId]
    )
    const collapsedChipCount = isPropertyNewProject ? 5 : 12
    const visibleChips = showAllChips ? chipsToRender : chipsToRender.slice(0, collapsedChipCount)
    const canToggleChips = chipsToRender.length > collapsedChipCount

    const updateChipScrollEdges = useCallback(() => {
        const el = chipsScrollRef.current
        if (!el) {
            setChipScrollLeft(false)
            setChipScrollRight(false)
            return
        }
        const { scrollLeft, scrollWidth, clientWidth } = el
        setChipScrollLeft(scrollLeft > 4)
        setChipScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
    }, [])

    const scrollChipsBy = useCallback((direction) => {
        const el = chipsScrollRef.current
        if (!el) return
        const step = Math.min(280, Math.round(el.clientWidth * 0.75)) * (direction === 'next' ? 1 : -1)
        el.scrollBy({ left: step, behavior: 'smooth' })
    }, [])

    useLayoutEffect(() => {
        if (!isPropertyNewProject) return
        const el = chipsScrollRef.current
        if (!el) return

        if (!showAllChips) {
            el.scrollLeft = 0
            setChipScrollLeft(false)
            setChipScrollRight(false)
            return
        }

        const measure = () => {
            updateChipScrollEdges()
        }

        const ro = new ResizeObserver(measure)
        ro.observe(el)
        requestAnimationFrame(() => {
            el.scrollTo({ left: Math.max(0, el.scrollWidth - el.clientWidth), behavior: 'smooth' })
            measure()
        })

        return () => ro.disconnect()
    }, [isPropertyNewProject, showAllChips, chipsToRender.length, updateChipScrollEdges])

    const handleToggleShowAllChips = useCallback(() => {
        setShowAllChips((prev) => !prev)
    }, [])
    const modeKey = resolveModeKey(sourceMode || mode)
    const breadcrumbLocation = useMemo(
        () => ({
            label: cityLabel,
            city: urlCity || reduxCity,
            state: urlState || reduxState,
            country: headerCountry,
        }),
        [cityLabel, urlCity, reduxCity, urlState, reduxState, headerCountry]
    )
    const breadcrumbItems = useMemo(() => {
        if (isPropertyNewProject) {
            return [{ label: `New Projects in ${cityLabel}` }]
        }

        return buildProductsNavigationBreadcrumbItems({
            modeKey,
            modeLabel,
            cityLabel,
            location: breadcrumbLocation,
            categoryPath,
            fallbackSubLabel: subLabel,
        })
    }, [
        isPropertyNewProject,
        cityLabel,
        modeKey,
        modeLabel,
        breadcrumbLocation,
        categoryPath,
        subLabel,
    ])

    useEffect(() => {
        const fromUrl = String(searchParams?.get('sort_by') || '').trim().toLowerCase()
        if (isPropertyNewProject) {
            setSelectedSort(API_TO_NEW_PROJECT_SORT[fromUrl] || currentSortOptions[0])
            return
        }
        setSelectedSort(API_TO_SORT[fromUrl] || 'Newest to Oldest')
    }, [isPropertyNewProject, currentSortOptions, searchParams])

    const searchQueryString = searchParams?.toString() ?? ''
    useEffect(() => {
        setIsSearchSaved(false)
    }, [pathname, searchQueryString])

    useEffect(() => {
        setSelectedSellerSegment(sellerSegmentFromParam(searchParams?.get('seller_account_type')))
    }, [searchQueryString, searchParams])

    const applySellerSegment = (segment) => {
        setSelectedSellerSegment(segment)
        const qs = new URLSearchParams(searchParams?.toString() || '')
        const param = sellerParamFromSegment(segment)
        if (param) qs.set('seller_account_type', param)
        else qs.delete('seller_account_type')
        qs.set('page', '1')
        const query = qs.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    useEffect(() => {
        function handleOutsideClick(event) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    useEffect(() => {
        setShowAllChips(false)
    }, [resolvedCategorySlug, motorsMakeModelQ, motorsMakeId, propertyLocationApiParams])

    useEffect(() => {
        if (!resolvedCategorySlug || isPropertyNewProject) {
            setCategoryPath([])
            return
        }
        let cancelled = false
        const run = async () => {
            try {
                const response = await getParentCategoriesApi.getPaymentCategories({
                    slug: resolvedCategorySlug,
                })
                const path = parseCategoryPathFromResponse(response)
                if (!cancelled) setCategoryPath(path)
            } catch {
                if (!cancelled) setCategoryPath([])
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [resolvedCategorySlug, isPropertyNewProject])

    useEffect(() => {
        if (!resolvedCategorySlug) {
            setCategorySlugDisplayName('')
            return
        }
        let cancelled = false
        const run = async () => {
            try {
                const response = await categoryApi.getCategoryTreeBySlug({
                    category_slug: resolvedCategorySlug,
                })
                const rows = response?.data?.data
                const first = Array.isArray(rows) ? rows[0] : null
                const label = String(first?.translated_name || first?.name || '').trim()
                if (!cancelled) setCategorySlugDisplayName(label)
            } catch {
                if (!cancelled) setCategorySlugDisplayName('')
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [resolvedCategorySlug])

    useEffect(() => {
        if (isPropertyLocationChips) {
            if (!propertyLocationApiParams) {
                setApiChips([])
                return
            }
            let cancelled = false
            const run = async () => {
                try {
                    const response = await locationItemCountApi.getLocationItemCount(propertyLocationApiParams)
                    const parsed = parseApiPayload(response?.data)
                    const rows = parsed?.data?.location_item_count
                    if (cancelled || !Array.isArray(rows)) {
                        if (!cancelled) setApiChips([])
                        return
                    }
                    const mapped = rows
                        .map((row) => {
                            const label = String(row?.name || '').trim()
                            if (!label) return null
                            const countNum = Number(row?.count ?? row?.items_count)
                            const count =
                                Number.isFinite(countNum) && countNum >= 0 ? countNum : 0
                            return {
                                label,
                                count,
                                type: String(row?.type || '').trim().toLowerCase(),
                                id: row?.id,
                            }
                        })
                        .filter(Boolean)
                    if (!cancelled) setApiChips(mapped)
                } catch {
                    if (!cancelled) setApiChips([])
                }
            }
            run()
            return () => {
                cancelled = true
            }
        }

        if (isPropertyNewProject || !resolvedCategorySlug) {
            if (!isPropertyLocationChips) {
                setApiChips([])
            }
            return
        }
        let cancelled = false
        const run = async () => {
            try {
                if (isMotorsMakeModelChips) {
                    const response = await categoryApi.searchCarMakeModel({
                        category_slug: resolvedCategorySlug,
                        ...(motorsMakeId
                            ? { make_id: motorsMakeId }
                            : motorsMakeModelQ
                                ? { q: motorsMakeModelQ }
                                : {}),
                    })
                    let list = response?.data?.data?.makes_model
                    if (cancelled) return
                    if (motorsMakeId && Array.isArray(list)) {
                        const hasModels = list.some(
                            (row) => row?.model_id != null && String(row.model_id).trim() !== ''
                        )
                        if (!hasModels && motorsMakeModelQ) {
                            const fallback = await categoryApi.searchCarMakeModel({
                                category_slug: resolvedCategorySlug,
                                q: motorsMakeModelQ,
                            })
                            if (cancelled) return
                            list = fallback?.data?.data?.makes_model
                        }
                    }
                    if (!Array.isArray(list)) {
                        if (!cancelled) setApiChips([])
                        return
                    }
                    const selectedMakeQuery = motorsMakeModelQ.toLowerCase()
                    const mapped = motorsHasSelectedMake
                        ? list
                              .filter((row) => row?.model_id != null && String(row.model_id).trim() !== '')
                              .filter((row) => {
                                  if (motorsMakeId) {
                                      return String(row?.make_id ?? '') === motorsMakeId
                                  }
                                  if (!selectedMakeQuery) return true
                                  const makeName = String(row?.make_name || '').trim().toLowerCase()
                                  return (
                                      makeName === selectedMakeQuery ||
                                      selectedMakeQuery.startsWith(`${makeName} `)
                                  )
                              })
                              .map((row) => {
                                  const label = motorsModelChipLabel(row)
                                  if (!label) return null
                                  return {
                                      label,
                                      count: motorsItemCount(row),
                                      make_id: row?.make_id,
                                      model_id: row?.model_id,
                                      make_name: row?.make_name,
                                      merged_name: row?.merged_name,
                                      isModel: true,
                                  }
                              })
                              .filter(Boolean)
                        : list
                              .filter((row) => row?.model_id == null || String(row.model_id).trim() === '')
                              .map((row) => {
                                  const label = String(row?.make_name || '').trim()
                                  if (!label) return null
                                  return {
                                      label,
                                      count: motorsItemCount(row),
                                      make_id: row?.make_id,
                                      isModel: false,
                                  }
                              })
                              .filter(Boolean)
                    if (!cancelled) setApiChips(mapped)
                    return
                }

                if (isJobsCategoryChildrenChips) {
                    const response = await categoryApi.getCategoryChildrenByParent({
                        category_slug: resolvedCategorySlug,
                    })
                    const rows = response?.data?.data
                    if (cancelled || !Array.isArray(rows)) {
                        if (!cancelled) setApiChips([])
                        return
                    }
                    const mapped = rows
                        .map((row) => {
                            const label = String(row?.name || '').trim()
                            if (!label) return null
                            const countRaw = row?.item_count ?? row?.['item-count']
                            const countNum = Number(countRaw)
                            const count =
                                countRaw !== undefined &&
                                countRaw !== null &&
                                countRaw !== '' &&
                                Number.isFinite(countNum) &&
                                countNum >= 0
                                    ? countNum
                                    : 0
                            return {
                                label,
                                count,
                                slug: String(row?.slug || '').trim(),
                            }
                        })
                        .filter(Boolean)
                    if (!cancelled) setApiChips(mapped)
                    return
                }

                if (isClassifiedSubcategoryChips) {
                    const [childrenRes, pathRes] = await Promise.all([
                        categoryApi.getCategoryChildrenByParent({ category_slug: resolvedCategorySlug }),
                        getParentCategoriesApi.getPaymentCategories({ slug: resolvedCategorySlug }),
                    ])
                    const children = childrenRes?.data?.data
                    const hasChildren = Array.isArray(children) && children.length > 0
                    const ancestorPath = parseAncestorPathFromParentCategoriesResponse(pathRes)
                    const currentCategoryId = ancestorPath.length
                        ? ancestorPath[ancestorPath.length - 1]?.id
                        : null

                    if (
                        !hasChildren &&
                        isMobilePhonesOrTabletsLeafPath(ancestorPath) &&
                        currentCategoryId != null
                    ) {
                        const modelsRes = await categorySubdataApi.getItemCountsByCategoryId({
                            category_id: currentCategoryId,
                        })
                        const modelRows = parseCategorySubdataListPayload(modelsRes)
                        if (cancelled) return
                        if (!cancelled) setApiChips(modelRows)
                        return
                    }

                    const response = await categoryHomeApi.getCategoryHome({
                        category_slug: resolvedCategorySlug,
                    })
                    const parsed = parseApiPayload(response?.data)
                    const rows = parsed?.data?.category_item_count
                    if (cancelled || !Array.isArray(rows)) {
                        if (!cancelled) setApiChips([])
                        return
                    }
                    const mapped = rows
                        .map((row) => {
                            const label = String(
                                row?.name ??
                                    row?.translated_name ??
                                    row?.title ??
                                    row?.label ??
                                    ''
                            ).trim()
                            if (!label) return null
                            const countRaw =
                                row?.count ??
                                row?.adscount ??
                                row?.ads_count ??
                                row?.items_count ??
                                row?.total
                            const countNum = Number(countRaw)
                            const count =
                                countRaw !== undefined &&
                                countRaw !== null &&
                                countRaw !== '' &&
                                Number.isFinite(countNum) &&
                                countNum >= 0
                                    ? countNum
                                    : 0
                            return {
                                label,
                                count,
                                slug: String(row?.slug || '').trim(),
                            }
                        })
                        .filter(Boolean)
                    if (!cancelled) setApiChips(mapped)
                    return
                }

                if (!cancelled) setApiChips([])
            } catch {
                if (!cancelled) setApiChips([])
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [
        resolvedCategorySlug,
        isPropertyNewProject,
        isPropertyLocationChips,
        propertyLocationApiParams,
        isMotorsMakeModelChips,
        isJobsCategoryChildrenChips,
        isClassifiedSubcategoryChips,
        motorsHasSelectedMake,
        motorsMakeId,
        motorsMakeModelQ,
    ])

    return (
        <div className="mb-[26px] flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px] flex-wrap">
                {breadcrumbItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-[4px]">

                        {isPropertyNewProject && index === 0 ? (
                            <Image src={home} alt="home" className="w-[14px] h-[14px]" />
                        ) : null}
                        {isPropertyNewProject && index === 0 ? (
                            <RightArrowIcon className="h-[14px] w-[14px]" stroke="#8F8F8F" />
                        ) : null}
                        {index > 0 ? <RightArrowIcon className="h-[14px] w-[14px]" stroke="#8F8F8F" /> : null}
                        {item.href ? (
                            <Link href={item.href} className="text-[14px] font-[Inter-Regular] text-[#1270ec]">
                                {item.label}
                            </Link>
                        ) : (
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] leading-[24px]">{item.label}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="max-sm:flex-wrap flex items-center justify-between gap-[12px]">
                <div className="flex items-center gap-[8px] flex-wrap">
                    <h2 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        {heading}
                    </h2>
                    {!isPropertyNewProject ? <div className="rounded-full bg-[#23262A] p-[2px]" /> : null}
                    {!isPropertyNewProject ? (
                        <p className="text-[18px] font-[Inter-Medium] text-[#23262A]">{adsCountFormatted} Ads</p>
                    ) : null}
                </div>

                <div className="relative flex items-center gap-[8px]">
                    <div ref={sortDropdownRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsSortOpen((prev) => !prev)}
                            className="flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white p-[6px_12px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                        >
                            <div className='flex-col flex items-center gap-[4px]'>
                                <SortArrowIcon className="rotate-180" fill="#DC0000" />
                                <SortArrowIcon className="" fill="#DC0000" />
                            </div>
                            <span>
                                Sort: <span className="font-[Inter-SemiBold]">{selectedSort}</span>
                            </span>
                        </button>

                        {isSortOpen ? (
                            <div className="absolute left-0 top-[calc(100%+10px)] p-[4px] z-20 w-[240px] rounded-[8px] border border-[rgba(143,143,143,0.16)] bg-white shadow-[0_6px_18px_rgba(17,24,39,0.12)]">
                                {currentSortOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSort(option)
                                            setIsSortOpen(false)
                                            const sortBy = isPropertyNewProject
                                                ? NEW_PROJECT_SORT_TO_API[option] || 'popular_items'
                                                : SORT_TO_API[option] || 'new-to-old'
                                            const qs = new URLSearchParams(searchParams?.toString() || '')
                                            qs.set('sort_by', sortBy)
                                            qs.set('page', '1')
                                            router.replace(`${pathname}?${qs.toString()}`, { scroll: false })
                                        }}
                                        className={`flex cursor-pointer h-[48px] w-full items-center px-[16px] text-left text-[14px] ${selectedSort === option
                                            ? 'font-[Inter-SemiBold] text-[#23262A]'
                                            : 'font-[Inter-Regular] text-[#4B5563]'
                                            } ${option !== currentSortOptions[currentSortOptions.length - 1] ? 'border-b border-[rgba(143,143,143,0.12)]' : ''}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    {!isPropertyNewProject ? (
                        <button
                            type="button"
                            onClick={() => setIsSavedSearchModalOpen(true)}
                            className="flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white p-[6px_12px]"
                        >
                            {isSearchSaved ? (
                                <Image src={savedfill} alt="savedfill" className="h-[16px] w-[16px]" />
                            ) : (
                                <Image src={saveIcon} alt="saveIcon" className="h-[16px] w-[16px]" />
                            )}
                            <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">{isSearchSaved ? 'Saved' : 'Save Search'}</p>
                        </button>
                    ) : null}
                </div>
            </div>



            <div className={`flex items-center gap-[8px] ${isPropertyNewProject ? 'justify-between' : 'flex-wrap'}`}>
                <div
                    className={`flex min-w-0 flex-1 items-center gap-[4px] ${
                        isPropertyNewProject ? '' : 'flex-wrap'
                    }`}
                >
                    {isPropertyNewProject && showAllChips && chipScrollLeft ? (
                        <button
                            type="button"
                            aria-label="Scroll area chips left"
                            onClick={() => scrollChipsBy('prev')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(143,143,143,0.28)] bg-white text-[#3A88EF] shadow-sm hover:bg-[#f2f7fe]"
                        >
                            <FaChevronLeft size={14} />
                        </button>
                    ) : null}
                    <div
                        ref={chipsScrollRef}
                        onScroll={isPropertyNewProject && showAllChips ? updateChipScrollEdges : undefined}
                        className={`flex items-center gap-[8px] ${
                            isPropertyNewProject
                                ? showAllChips
                                    ? 'min-h-[40px] min-w-0 flex-1 flex-nowrap overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                                    : 'min-w-0 flex-1 flex-nowrap overflow-hidden'
                                : 'flex-wrap'
                        }`}
                    >
                        {visibleChips.map((chip, chipIdx) => {
                        const chipText = typeof chip === 'string' ? chip : ''
                        const chipObj = chip && typeof chip === 'object' ? chip : null
                        const chipMatch = chipText.match(/^(.*)\s\((\d+)\)$/)
                        const chipLabel = chipObj
                            ? String(chipObj?.label || '').trim()
                            : chipMatch
                                ? String(chipMatch[1]).trim()
                                : String(chipText).trim()
                        const chipCountRaw = chipObj?.count
                        const chipCount =
                            chipObj && chipCountRaw != null
                                ? Number(chipCountRaw).toLocaleString('en-US')
                                : chipMatch
                                    ? chipMatch[2]
                                    : null
                        const chipSlug = chipObj ? String(chipObj?.slug || '').trim() : ''
                        const chipBody =
                            chipCount != null ? (
                                <p className="flex items-center gap-[4px] text-[14px] font-[Inter-Regular] text-[#1270ec]">
                                    {chipLabel}{' '}
                                    <span className="text-[#8F8F8F]">({chipCount})</span>
                                </p>
                            ) : (
                                <p className="text-[14px] font-[Inter-Regular] text-[#1270ec]">{chipLabel}</p>
                            )
                        const chipShellClass = `inline-flex shrink-0 items-center rounded-[20px] border px-[14px] py-[6px] ${
                            isMotorsMakeModelChips &&
                            chipLabel &&
                            (
                                (chipObj?.isModel &&
                                    motorsModelId &&
                                    String(chipObj?.model_id) === motorsModelId) ||
                                (chipObj?.isModel &&
                                    !motorsModelId &&
                                    motorsMakeModelQ &&
                                    (chipLabel.toLowerCase() === motorsMakeModelQ.toLowerCase() ||
                                        String(chipObj?.merged_name || '').toLowerCase() ===
                                            motorsMakeModelQ.toLowerCase())) ||
                                (!chipObj?.isModel &&
                                    motorsMakeId &&
                                    String(chipObj?.make_id || '') === motorsMakeId) ||
                                (!chipObj?.isModel &&
                                    !motorsMakeId &&
                                    motorsMakeModelQ &&
                                    chipLabel.toLowerCase() === motorsMakeModelQ.toLowerCase())
                            )
                                ? 'border-[#3A88EF] bg-[#f2f7fe]'
                                : isClassifiedSubcategoryChips &&
                                    chipObj?.isModel &&
                                    classifiedModelsFilterQ &&
                                    chipLabel &&
                                    chipLabel.toLowerCase() === classifiedModelsFilterQ.toLowerCase()
                                  ? 'border-[#3A88EF] bg-[#f2f7fe]'
                                  : 'border-[rgba(143,143,143,0.28)]'
                        } ${isPropertyNewProject ? 'bg-[#FAFAFA]' : ''} cursor-pointer no-underline`

                        if (isMotorsMakeModelChips && chipLabel) {
                            return (
                                <Link
                                    key={`breadcrumb-chip-${chipIdx}-${chipObj?.model_id || chipObj?.make_id || chipLabel}`}
                                    href={buildMotorsChipHref(chipObj || chipLabel)}
                                    prefetch={false}
                                    className={chipShellClass}
                                >
                                    {chipBody}
                                </Link>
                            )
                        }

                        if (isJobsCategoryChildrenChips && chipSlug) {
                            return (
                                <Link
                                    key={`breadcrumb-chip-${chipIdx}-${chipLabel}-${chipSlug}`}
                                    href={buildJobsChipHref(chipSlug)}
                                    prefetch={false}
                                    className={chipShellClass}
                                >
                                    {chipBody}
                                </Link>
                            )
                        }

                        if (isClassifiedSubcategoryChips && chipObj?.isModel && chipLabel) {
                            return (
                                <Link
                                    key={`breadcrumb-chip-${chipIdx}-${chipLabel}-model`}
                                    href={buildClassifiedModelChipHref(chipLabel)}
                                    prefetch={false}
                                    className={chipShellClass}
                                >
                                    {chipBody}
                                </Link>
                            )
                        }

                        if (isClassifiedSubcategoryChips && chipSlug) {
                            return (
                                <Link
                                    key={`breadcrumb-chip-${chipIdx}-${chipLabel}-${chipSlug}`}
                                    href={buildClassifiedChipHref(chipSlug)}
                                    prefetch={false}
                                    className={chipShellClass}
                                >
                                    {chipBody}
                                </Link>
                            )
                        }

                        if (isPropertyLocationChips && chipLabel) {
                            const chipType = chipObj ? String(chipObj?.type || '').trim().toLowerCase() : ''
                            const chipId = chipObj?.id
                            return (
                                <Link
                                    key={`breadcrumb-chip-${chipIdx}-${chipLabel}-${chipType}`}
                                    href={buildPropertyLocationChipHref({
                                        label: chipLabel,
                                        type: chipType,
                                        id: chipId,
                                    })}
                                    prefetch={false}
                                    className={chipShellClass}
                                >
                                    {chipBody}
                                </Link>
                            )
                        }

                        return (
                            <button
                                key={`breadcrumb-chip-${chipIdx}-${chipLabel}`}
                                type="button"
                                className={`shrink-0 rounded-[20px] border border-[rgba(143,143,143,0.28)] px-[14px] py-[6px] cursor-pointer ${isPropertyNewProject ? 'bg-[#FAFAFA]' : ''
                                    }`}
                            >
                                {chipBody}
                            </button>
                        )
                    })}
                    </div>
                    {isPropertyNewProject && showAllChips && chipScrollRight ? (
                        <button
                            type="button"
                            aria-label="Scroll area chips right"
                            onClick={() => scrollChipsBy('next')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(143,143,143,0.28)] bg-white text-[#3A88EF] shadow-sm hover:bg-[#f2f7fe]"
                        >
                            <FaChevronRight size={14} />
                        </button>
                    ) : null}
                </div>
                {canToggleChips ? (
                    <button
                        type="button"
                        onClick={handleToggleShowAllChips}
                        className="cursor-pointer shrink-0 rounded-[20px] border border-[rgba(143,143,143,0.28)] bg-white px-[14px] py-[6px] text-[14px] font-[Inter-Bold] text-[#3A88EF]"
                    >
                        {showAllChips ? 'View Less' : 'View More'}
                    </button>
                ) : null}
            </div>

            {showSellerSegments ? (
                <div className="mt-[30px] flex flex-wrap items-center gap-[10px]">
                    {SELLER_SEGMENTS.map((segment) => {
                        const isActive = selectedSellerSegment === segment
                        return (
                            <button
                                key={segment}
                                type="button"
                                onClick={() => applySellerSegment(segment)}
                                className={`cursor-pointer flex p-[6px_14px] items-center gap-[8px] rounded-[8px] border text-[14px] ${isActive
                                        ? 'border-[#62a0f2] bg-[#3a88ef14] font-[Inter-SemiBold] text-[#0f5dc4]'
                                        : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#464c55]'
                                    }`}
                            >
                                <SellerSegmentIcon type={segment} active={isActive} />
                                <span>{segment}</span>
                            </button>
                        )
                    })}
                </div>
            ) : null}

            <SavedSearchModal
                isOpen={isSavedSearchModalOpen}
                onClose={() => setIsSavedSearchModalOpen(false)}
                onDone={async ({ name, emailWhenMatched }) => {
                    try {
                        const paramsString = searchParams?.toString() || ''
                        const search_url = `${pathname || ''}${paramsString ? `?${paramsString}` : ''}`
                        const api_search_url = buildSavedSearchGetItemApiPath(mode, searchParams) || ''
                        const category_slug = slugParam || itemParam || ''
                        const location = cityLabel

                        await savedSearchApi.createSavedSearch({
                            title: name,
                            category_slug,
                            search_url,
                            api_search_url: api_search_url || undefined,
                            subscribe_email: !!emailWhenMatched,
                            notification: !!emailWhenMatched,
                            location,
                        })

                        setIsSearchSaved(true)
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('Failed to save search', error)
                    } finally {
                        setIsSavedSearchModalOpen(false)
                    }
                }}
                onDelete={() => {
                    setIsSearchSaved(false)
                    setIsSavedSearchModalOpen(false)
                }}
                initialName={subLabel ? `My ${subLabel} Search` : 'My Search'}
                isAlreadySaved={isSearchSaved}
            />
        </div>
    )
}
