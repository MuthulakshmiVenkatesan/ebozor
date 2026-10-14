const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

/** Motors listings: map API `property_type` tokens to `item` query (see productdetail motors mode). */
const MOTOR_ITEM_LABEL_BY_TYPE = {
    usedcar: 'Used Cars',
    newcar: 'New Cars',
    exportcar: 'Export Cars',
    rentalcar: 'Rental Cars',
}

const MOTOR_SUBTYPE_KEYS = Object.keys(MOTOR_ITEM_LABEL_BY_TYPE)

function motorItemFromPropertyTypes(propertyTypes) {
    for (const key of MOTOR_SUBTYPE_KEYS) {
        if (propertyTypes.includes(key)) return MOTOR_ITEM_LABEL_BY_TYPE[key]
    }
    return ''
}

function isMotorSectionPropertyTypes(propertyTypes) {
    return (
        propertyTypes.includes('motor') ||
        propertyTypes.includes('motors') ||
        MOTOR_SUBTYPE_KEYS.some((k) => propertyTypes.includes(k))
    )
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

function inferModeFromCategorySlug(categorySlug) {
    const s = String(categorySlug || '').trim().toLowerCase()
    if (!s) return ''
    if (s.includes('job')) return 'jobs'
    if (
        s.includes('motor') ||
        s.includes('car') ||
        s.includes('bike') ||
        s.includes('motorcycle') ||
        s.includes('boat') ||
        s.includes('plate') ||
        s.includes('vehicle')
    ) {
        return 'motors'
    }
    if (s.includes('new-project') || s.includes('newproject')) return 'new-project'
    if (
        s.includes('property') ||
        s.includes('rent') ||
        s.includes('sale') ||
        s.includes('apartment') ||
        s.includes('villa')
    ) {
        return 'property'
    }
    if (
        s.includes('classified') ||
        s.includes('furniture') ||
        s.includes('mobile') ||
        s.includes('tablet')
    ) {
        return 'classified'
    }
    return ''
}

/** URLSearchParams uses `+` for spaces; search page uses `%20` — normalize so links match. */
function toQueryString(params) {
    return params.toString().replace(/\+/g, '%20')
}

function applyModeToQuery(q, mode, propertyTypes, itemCategory = '') {
    const normalized = String(mode || '').trim().toLowerCase()
    if (!normalized) return false

    if (normalized === 'new-project' || normalized === 'newproject') {
        q.set('mode', 'new-project')
        return true
    }

    if (normalized === 'motors' || normalized === 'motor') {
        q.set('mode', 'motors')
        const fromSubtype = motorItemFromPropertyTypes(propertyTypes)
        const fromCategory = String(itemCategory || '').trim()
        const item = fromSubtype || fromCategory
        if (item) q.set('item', item)
        q.set('carOfWeek', '1')
        return true
    }

    if (normalized === 'property') {
        const purpose = listingPurposeFromApiPropertyType(propertyTypes)
        q.set('mode', 'property')
        q.set('purpose', purpose)
        q.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || LISTING_SLUG_BY_PURPOSE.rent)
        return true
    }

    if (normalized === 'classified' || normalized === 'furniture' || normalized === 'mobile') {
        q.set('mode', 'classified')
        const variant =
            normalized === 'furniture' || normalized === 'mobile'
                ? normalized
                : resolveClassifiedVariant(propertyTypes)
        if (variant) q.set('variant', variant)
        return true
    }

    if (normalized === 'jobs' || normalized === 'job') {
        q.set('mode', 'jobs')
        return true
    }

    return false
}

/**
 * Infer product-detail mode from API `property_type` and/or category slug.
 */
export function inferModeFromListing(propertyTypeRaw, categorySlug = '', itemCategory = '') {
    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    if (propertyTypes.includes('newproject')) return 'new-project'
    if (isMotorSectionPropertyTypes(propertyTypes)) return 'motors'
    if (
        propertyTypes.includes('sale') ||
        propertyTypes.includes('sell') ||
        propertyTypes.includes('rent')
    ) {
        return 'property'
    }
    if (
        propertyTypes.includes('classified') ||
        propertyTypes.includes('furnituregarden') ||
        propertyTypes.includes('mobilestablets')
    ) {
        return 'classified'
    }
    return (
        inferModeFromCategorySlug(categorySlug) ||
        inferModeFromCategorySlug(itemCategory) ||
        ''
    )
}

/**
 * Build `/productdetail` URL for a listing from slug + API `property_type`.
 * Same rules as Home/FeaturedSections and Public Profile ad links.
 */
export function buildItemDetailHref(
    slug,
    propertyTypeRaw,
    itemCategory = '',
    categorySlug = '',
) {
    const detailSlug = String(slug || '').trim()
    if (!detailSlug) return null

    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    const inferredMode = inferModeFromListing(propertyTypeRaw, categorySlug, itemCategory)

    const q = new URLSearchParams()
    q.set('slug', detailSlug)

    if (applyModeToQuery(q, inferredMode, propertyTypes, itemCategory)) {
        return `/productdetail?${toQueryString(q)}`
    }

    return `/productdetail?${toQueryString(q)}`
}
