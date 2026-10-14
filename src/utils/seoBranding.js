import axios from 'axios'

const apiBase = () =>
    `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`

/** Site / brand name used in `<title> | <siteName>` and the generic fallback. */
export function resolveSeoSiteName(explicitName) {
    const explicit = explicitName != null ? String(explicitName).trim() : ''
    if (explicit) {
        return explicit
    }

    const metaTitle = String(process.env.NEXT_PUBLIC_META_TITLE || '').trim()
    if (metaTitle) {
        const marketplaceMatch = metaTitle.match(
            /^(.+?)\s+-\s+Buy & Sell Marketplace\b/i
        )
        if (marketplaceMatch?.[1]?.trim()) {
            return marketplaceMatch[1].trim()
        }
        if (metaTitle.includes(' - ')) {
            return metaTitle.split(' - ')[0].trim()
        }
        return metaTitle
    }

    return 'eBozor'
}

/**
 * Last-resort title when neither meta_title nor a page/entity name exists.
 * Example: "eBozor - Buy & Sell Marketplace | Find Everything You Need"
 */
export function getGenericMarketplaceTitle(siteName) {
    return `${resolveSeoSiteName(siteName)} - Buy & Sell Marketplace | Find Everything You Need`
}

/**
 * Final browser title: `<base> | <siteName>`, or the generic marketplace title.
 */
export function formatSeoBrowserTitle(baseTitle, siteName) {
    const site = resolveSeoSiteName(siteName)
    const generic = getGenericMarketplaceTitle(site)
    const base = baseTitle != null ? String(baseTitle).trim() : ''

    if (!base) {
        return generic
    }

    const envDefault = String(process.env.NEXT_PUBLIC_META_TITLE || '').trim()
    if (base === generic || (envDefault && base === envDefault)) {
        return generic
    }

    const suffix = ` | ${site}`
    if (base.endsWith(suffix)) {
        return base
    }

    return `${base}${suffix}`
}

/** Prefer configured SEO/entity image; otherwise the site header/company logo. */
export function resolveSeoOgImages(configuredImage, siteLogo) {
    const primary =
        configuredImage != null ? String(configuredImage).trim() : ''
    if (primary) {
        return [primary]
    }
    const logo = siteLogo != null ? String(siteLogo).trim() : ''
    if (logo) {
        return [logo]
    }
    return []
}

export function pickSiteLogoFromSettings(settings = {}) {
    const headerLogo =
        settings.header_logo != null ? String(settings.header_logo).trim() : ''
    if (headerLogo) {
        return headerLogo
    }
    const companyLogo =
        settings.company_logo != null ? String(settings.company_logo).trim() : ''
    return companyLogo || ''
}

let brandingCache = null
let brandingPromise = null

/** company_name + site logo from existing system settings (header_logo → company_logo). */
export async function fetchSeoBranding() {
    if (brandingCache) {
        return brandingCache
    }
    if (brandingPromise) {
        return brandingPromise
    }

    brandingPromise = (async () => {
        try {
            const response = await axios.get(`${apiBase()}get-system-settings`)
            const data = response?.data?.data || {}
            const companyName =
                data.company_name != null ? String(data.company_name).trim() : ''
            brandingCache = {
                siteName: companyName || resolveSeoSiteName(),
                siteLogo: pickSiteLogoFromSettings(data),
            }
            return brandingCache
        } catch (error) {
            console.error('fetchSeoBranding:', error)
            return {
                siteName: resolveSeoSiteName(),
                siteLogo: '',
            }
        } finally {
            brandingPromise = null
        }
    })()

    return brandingPromise
}

/**
 * Apply shared title (`| siteName`) and OG image (logo fallback) rules
 * to any page metadata object. Single place used by category, static, and entity SEO.
 */
export async function finalizeSeoMetadata(metadata, options = {}) {
    if (!metadata) {
        return metadata
    }

    const branding =
        options.siteName != null || options.siteLogo != null
            ? {
                  siteName: resolveSeoSiteName(options.siteName),
                  siteLogo:
                      options.siteLogo != null
                          ? String(options.siteLogo).trim()
                          : '',
              }
            : await fetchSeoBranding()

    const title = formatSeoBrowserTitle(metadata.title, branding.siteName)
    const existingImages = metadata.openGraph?.images
    const firstImage = Array.isArray(existingImages)
        ? existingImages[0]
        : existingImages
    const images = resolveSeoOgImages(firstImage, branding.siteLogo)

    return {
        ...metadata,
        title,
        openGraph: {
            ...(metadata.openGraph || {}),
            title: formatSeoBrowserTitle(
                metadata.openGraph?.title || metadata.title,
                branding.siteName
            ),
            description:
                metadata.openGraph?.description ?? metadata.description,
            images,
        },
    }
}
