import axios from 'axios'
import { absoluteUrl } from '@/utils/siteUrl'
import { parseSeoKeywords } from '@/utils/categorySeoMetadata'
import {
    fetchSeoBranding,
    finalizeSeoMetadata,
    resolveSeoSiteName,
} from '@/utils/seoBranding'

const apiBase = () =>
    `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`

/**
 * Admin SEO Settings `page` keys ↔ public frontend routes.
 * Keep in sync with admin config/seo_pages.php.
 */
export const SEO_PAGE_ROUTE_MAP = {
    home: '/',
    property: '/property',
    motors: '/motors',
    jobs: '/jobs',
    classifieds: '/classifieds',
    community: '/community',
    products: '/products',
    'ad-listing': '/ad-listing',
    subscription: '/subscription',
    blogs: '/blogs',
    faqs: '/faqs',
    'about-us': '/about-us',
    'contact-us': '/contact-us',
    'privacy-policy': '/privacy-policy',
    'terms-and-condition': '/terms-and-condition',
    favourites: '/favourites',
    chat: '/chat',
    sellmycar: '/sellmycar',
    help: '/help',
}

export async function fetchSeoSetting(pageKey) {
    if (!pageKey) {
        return null
    }
    try {
        const response = await axios.get(`${apiBase()}seo-settings`, {
            params: { page: pageKey },
        })
        const rows = response?.data?.data
        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0]
        }
        return null
    } catch (error) {
        console.error('fetchSeoSetting:', pageKey, error)
        return null
    }
}

/**
 * Build Next.js metadata from an Admin SEO Settings row (static pages).
 * Base title: Admin SEO `title`, else page name (`titleFallback`), else empty
 * (generic marketplace title via finalizeSeoMetadata).
 */
export async function buildMetadataFromSeoSetting(
    setting,
    { canonicalPath, siteName, siteLogo, titleFallback, pageTitle } = {}
) {
    const branding =
        siteName != null || siteLogo != null
            ? {
                  siteName: resolveSeoSiteName(siteName),
                  siteLogo: siteLogo || '',
              }
            : await fetchSeoBranding()

    const configuredTitle =
        setting?.title != null ? String(setting.title).trim() : ''
    const namedPage =
        pageTitle != null
            ? String(pageTitle).trim()
            : titleFallback != null
              ? String(titleFallback).trim()
              : ''
    const baseTitle = configuredTitle || namedPage || ''
    const description =
        setting?.description ||
        process.env.NEXT_PUBLIC_META_DESCRIPTION
    const keywords = setting?.keywords
        ? parseSeoKeywords(setting.keywords)
        : undefined
    const path = canonicalPath || SEO_PAGE_ROUTE_MAP[setting?.page] || ''
    const canonicalUrl = path ? absoluteUrl(path) : ''

    const metadata = {
        title: baseTitle,
        description,
        openGraph: {
            images: setting?.image ? [setting.image] : [],
        },
    }

    if (keywords?.length) {
        metadata.keywords = keywords
    }

    if (canonicalUrl) {
        metadata.alternates = {
            canonical: canonicalUrl,
        }
    }

    return finalizeSeoMetadata(metadata, branding)
}

/**
 * Static / non-entity page metadata from Admin SEO Settings.
 */
export async function generateSeoSettingsMetadata(pageKey, options = {}) {
    const [setting, branding] = await Promise.all([
        fetchSeoSetting(pageKey),
        options.siteName != null || options.siteLogo != null
            ? Promise.resolve({
                  siteName: resolveSeoSiteName(options.siteName),
                  siteLogo: options.siteLogo || '',
              })
            : fetchSeoBranding(),
    ])
    const canonicalPath =
        options.canonicalPath || SEO_PAGE_ROUTE_MAP[pageKey] || undefined
    return buildMetadataFromSeoSetting(setting, {
        ...options,
        ...branding,
        canonicalPath,
    })
}

export { resolveSeoSiteName, fetchSeoBranding }
