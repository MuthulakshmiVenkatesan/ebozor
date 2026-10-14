/** Shared helpers for product-detail breadcrumb → vertical home or /products search links. */

import {
    MOTORS_LISTING_PATH_TO_QUERY,
    resolveMotorsListingItemLabel,
} from './motorsListingPaths'

/** Same roots as HeaderCategories `TOP_NAV_HREF_BY_SLUG`. */
const VERTICAL_HOME_BY_SLUG = {
    motors: '/motors',
    motor: '/motors',
    property: '/property',
    jobs: '/jobs',
    job: '/jobs',
    classified: '/classifieds',
    classifieds: '/classifieds',
    'furniture-garden': '/classifieds',
    'mobiles-tablets': '/classifieds',
    furniture: '/classifieds',
    mobile: '/classifieds',
    community: '/community',
}

const VERTICAL_HOME_BY_LABEL = {
    motors: '/motors',
    motor: '/motors',
    property: '/property',
    jobs: '/jobs',
    job: '/jobs',
    classified: '/classifieds',
    classifieds: '/classifieds',
    'classifieds & furniture': '/classifieds',
    'furniture & garden': '/classifieds',
    'mobiles & tablets': '/classifieds',
    community: '/community',
}

export function slugifyLabel(value = '') {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export function normalizeCategoryNode(node) {
    if (!node || typeof node !== 'object') return null
    const categoryId = node.category_id ?? node.id ?? node.categoryId
    if (categoryId == null) return null
    return {
        category_id: categoryId,
        name: node.name || node.translated_name || node.category_name || 'Category',
        slug: String(node.slug || '').trim(),
    }
}

export function parseCategoryPathFromResponse(response) {
    const data = response?.data?.data
    const rawPath = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return rawPath.map(normalizeCategoryNode).filter(Boolean)
}

export function listingTitle(pd) {
    return pd?.name || pd?.title || pd?.job_title || pd?.role || 'Listing'
}

export function locationParts(pd) {
    const city = pd?.city ? String(pd.city).trim() : ''
    const state = pd?.state ? String(pd.state).trim() : ''
    const country = pd?.country ? String(pd.country).trim() : ''
    let label = city
    if (!label && state) label = state
    if (!label && country) label = country
    if (!label) {
        const loc = pd?.location
        if (typeof loc === 'string' && loc.trim()) {
            const parts = loc.split(',').map((s) => s.trim()).filter(Boolean)
            label = parts.length > 1 ? parts[parts.length - 1] : parts[0]
        }
    }
    if (!label) label = 'Dubai'
    return { label, city, state, country }
}

/** Root → leaf (from get-parent-categories). Breadcrumb shows ancestors only, not leaf category name. */
export function breadcrumbCategorySegments(categoryPath) {
    if (!Array.isArray(categoryPath) || categoryPath.length === 0) return []
    if (categoryPath.length === 1) return [categoryPath[0]]
    return categoryPath.slice(0, -1)
}

export function resolveModeKey(mode) {
    const normalizedMode = String(mode || '').toLowerCase()
    if (normalizedMode === 'new-project' || normalizedMode === 'newproject') return 'new-project'
    if (
        normalizedMode === 'classified' ||
        normalizedMode === 'furniture' ||
        normalizedMode === 'mobile' ||
        normalizedMode === 'property' ||
        normalizedMode === 'motors' ||
        normalizedMode === 'motor'
    ) {
        return normalizedMode === 'motor' ? 'motors' : normalizedMode
    }
    return 'jobs'
}

function inferPropertyPurpose(allSlugs) {
    for (const raw of allSlugs) {
        const s = String(raw || '').toLowerCase()
        if (s.includes('for-sale') || s.includes('for_sale')) return 'sale'
    }
    return 'rent'
}

/**
 * Top-level vertical (Property, Motors, Jobs, Classifieds, …) → section home, not /products.
 */
export function getVerticalHomeHref(category, modeKey = '') {
    const slug = String(category?.slug || '')
        .trim()
        .toLowerCase()
    if (slug && VERTICAL_HOME_BY_SLUG[slug]) {
        return VERTICAL_HOME_BY_SLUG[slug]
    }

    const nameKey = String(category?.name || '')
        .trim()
        .toLowerCase()
    if (nameKey && VERTICAL_HOME_BY_LABEL[nameKey]) {
        return VERTICAL_HOME_BY_LABEL[nameKey]
    }

    return null
}

export function isVerticalRootCategory(category) {
    return getVerticalHomeHref(category) != null
}

/** Motors sub-vertical listing paths (e.g. /motorcycles) — same as HeaderCategories mega menu. */
function findMotorsListingPath(category) {
    const slug = String(category?.slug || '')
        .trim()
        .toLowerCase()
    const name = String(category?.name || '')
        .trim()
        .toLowerCase()
    for (const [path, meta] of Object.entries(MOTORS_LISTING_PATH_TO_QUERY)) {
        const metaSlug = String(meta?.slug || '').toLowerCase()
        const metaItem = String(meta?.item || '')
            .trim()
            .toLowerCase()
        if (slug && metaSlug && slug === metaSlug) return { path, meta }
        if (name && metaItem && name === metaItem) return { path, meta }
    }
    return null
}

function buildMotorsCategorySearchHref(category, location) {
    const cat = category || {}
    const slug = String(cat.slug || '').trim()
    const name = String(cat.name || '').trim()
    const match = findMotorsListingPath(cat)
    const qs = new URLSearchParams()

    const motorsItem = resolveMotorsListingItemLabel({
        categorySlug: slug,
        itemParam: match?.meta?.item || name,
    })
    if (motorsItem) qs.set('item', motorsItem)

    if (slug) qs.set('category_slug', slug)
    else if (match?.meta?.slug) qs.set('category_slug', match.meta.slug)

    appendLocationParams(qs, location)

    const base = match?.path || '/products'
    if (!match?.path) {
        qs.set('mode', 'motors')
    }

    const q = qs.toString()
    return q ? `${base}?${q}` : base
}

function appendLocationParams(qs, { city, state, country }) {
    if (city) {
        qs.set('city', city)
        return
    }
    if (state) {
        qs.set('state', state)
        return
    }
    if (country) qs.set('country', country)
}

/**
 * Breadcrumb link for a category segment: first segment may be vertical home; children → search.
 * @param {object} category - { name, slug }
 * @param {number} segmentIndex - 0 = top ancestor in breadcrumb (Property, Motors, …)
 */
export function buildCategoryBreadcrumbHref(modeKey, category, location, categoryPath = [], segmentIndex = 0) {
    if (segmentIndex === 0) {
        const home = getVerticalHomeHref(category)
        if (home) return home
    }
    return buildCategorySearchHref(modeKey, category, location, categoryPath)
}

/**
 * Search URL for a category level + listing location.
 * @param {object} category - { name, slug }
 */
export function buildCategorySearchHref(modeKey, category, location, categoryPath = []) {
    const cat = category || {}
    const slug = String(cat.slug || '').trim()
    const name = String(cat.name || '').trim()
    const allSlugs = (categoryPath || []).map((c) => c?.slug).filter(Boolean)
    const { city, state, country } = location || {}

    if (modeKey === 'new-project') {
        const qs = new URLSearchParams({
            mode: 'property',
            segment: 'new_projects',
            purpose: 'sale',
            item: 'All New Projects',
            category_slug: slug || 'all-new-projects',
            slug: slug || 'all-new-projects',
        })
        appendLocationParams(qs, { city, state, country })
        return `/products?${qs.toString()}`
    }

    if (modeKey === 'property') {
        const purpose = inferPropertyPurpose(allSlugs.length ? allSlugs : [slug])
        const qs = new URLSearchParams()
        qs.set('mode', 'property')
        qs.set('item', purpose === 'sale' ? 'property-for-sale' : 'property-for-rent')
        qs.set('purpose', purpose)
        if (name) qs.set('propertyType', name)
        if (slug) qs.set('category_slug', slug)
        appendLocationParams(qs, { city, state, country })
        return `/products?${qs.toString()}`
    }

    if (modeKey === 'motors') {
        return buildMotorsCategorySearchHref(cat, { city, state, country })
    }

    const qs = new URLSearchParams()
    qs.set('mode', modeKey)
    if (name) qs.set('item', name)
    if (slug) {
        qs.set('category_slug', slug)
        qs.set('slug', slug)
    }
    appendLocationParams(qs, { city, state, country })
    return `/products?${qs.toString()}`
}

/**
 * Location crumb: parent of leaf category + selected city/country.
 */
export function buildLocationSearchHref(modeKey, categoryPath, location) {
    const path = Array.isArray(categoryPath) ? categoryPath : []
    const leaf = path[path.length - 1] || null
    const parent = path.length >= 2 ? path[path.length - 2] : leaf
    const target = parent || leaf
    if (!target) {
        const qs = new URLSearchParams({ mode: modeKey === 'new-project' ? 'property' : modeKey })
        appendLocationParams(qs, location || {})
        return `/products?${qs.toString()}`
    }
    return buildCategorySearchHref(modeKey, target, location, path)
}

export function buildTrailItems(productData, mode, categoryPath) {
    const pd = productData || {}
    const title = listingTitle(pd)
    const location = locationParts(pd)
    const modeKey = resolveModeKey(mode)
    const segments = breadcrumbCategorySegments(categoryPath)

    const trail = [
        {
            label: location.label,
            href: buildLocationSearchHref(modeKey, categoryPath, location),
        },
    ]

    segments.forEach((cat, segmentIndex) => {
        trail.push({
            label: cat.name,
            href: buildCategoryBreadcrumbHref(modeKey, cat, location, categoryPath, segmentIndex),
        })
    })

    trail.push({ label: title, href: null })
    return trail
}
