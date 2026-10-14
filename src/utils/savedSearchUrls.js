/**
 * Build listing API path + query for saved-search payloads (no scheme/host).
 * Keeps params aligned with {@link PropertyCard} / category cards where possible.
 * Path must match {@link GET_ITEM} in api.js (`get-item`).
 */

import { collectFilterParamsFromSearchParams } from '@/utils/getItemFilterParams'

const GET_ITEM_PATH = 'get-item'

/**
 * Flatten get-item params (including `filterQuery` keys) into a query string.
 */
export function flattenGetItemParamsToQueryString(params) {
    if (!params || typeof params !== 'object') return ''
    const u = new URLSearchParams()
    const { filterQuery, ...rest } = params
    Object.entries(rest).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        u.set(k, String(v))
    })
    if (filterQuery && typeof filterQuery === 'object') {
        Object.entries(filterQuery).forEach(([k, v]) => {
            if (v == null || v === '') return
            u.set(k, String(v))
        })
    }
    return u.toString()
}

/**
 * Params object matching the active products listing mode (page 1 snapshot).
 * @param {string} mode motors | property | jobs | …
 * @param {import('next/navigation').ReadonlyURLSearchParams | URLSearchParams | null} searchParams
 */
export function buildSavedSearchGetItemParams(mode, searchParams, { page = 1, perPage = 15 } = {}) {
    if (!searchParams || typeof searchParams.get !== 'function') return null

    const sp = searchParams
    const base = {
        page,
        sort_by: 'new-to-old',
        per_page: perPage,
        limit: perPage,
    }

    if (mode === 'property') {
        const sourceMode = (sp.get('mode') || '').toLowerCase() || 'property'
        const subSlug = (sp.get('slug') || '').toLowerCase()
        const selectedCategorySlug = (sp.get('category_slug') || '').toLowerCase()
        const purpose = (sp.get('purpose') || '').toLowerCase()
        const filterQuery = collectFilterParamsFromSearchParams(sp)
        const searchText =
            sp.get('search')?.trim() || sp.get('keyword')?.trim() || undefined
        return {
            ...base,
            category_slug: selectedCategorySlug || sourceMode,
            slug: subSlug || undefined,
            purpose: purpose || undefined,
            city: sp.get('city')?.trim() || undefined,
            area: sp.get('area') || undefined,
            property_type: sp.get('propertyType') || undefined,
            min_price: sp.get('minPrice') || undefined,
            max_price: sp.get('maxPrice') || undefined,
            agency: sp.get('agency') || undefined,
            category_id: sp.get('category_id') || undefined,
            search: searchText,
            filterQuery,
        }
    }

    const sourceMode = (sp.get('mode') || '').toLowerCase()
    const subSlug = (sp.get('slug') || '').toLowerCase()
    if (!sourceMode) return { ...base, filterQuery: collectFilterParamsFromSearchParams(sp) }

    return {
        ...base,
        category_slug: sourceMode,
        slug: subSlug || undefined,
        city: sp.get('city')?.trim() || undefined,
        filterQuery: collectFilterParamsFromSearchParams(sp),
    }
}

/**
 * API path and query for GET get-item only, e.g. `get-item?page=1&...` (snapshot at page 1).
 */
export function buildSavedSearchGetItemApiPath(mode, searchParams, options) {
    const params = buildSavedSearchGetItemParams(mode, searchParams, options)
    if (!params) return ''
    const qs = flattenGetItemParamsToQueryString(params)
    const path = GET_ITEM_PATH.replace(/^\//, '')
    return qs ? `${path}?${qs}` : path
}
