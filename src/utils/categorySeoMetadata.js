import axios from 'axios'
import { absoluteUrl } from '@/utils/siteUrl'
import {
    fetchSeoBranding,
    finalizeSeoMetadata,
    formatSeoBrowserTitle,
} from '@/utils/seoBranding'

const apiBase = () =>
    `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`

export function parseSeoKeywords(keywords) {
    if (!keywords) {
        return []
    }
    if (Array.isArray(keywords)) {
        return keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
    }
    return String(keywords)
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
}

/**
 * Build Next.js Metadata from a category SEO payload.
 * Browser title base: meta_title when set, otherwise translated_name / name.
 * Shared branding appends `| <siteName>` and falls OG image back to site logo.
 */
export async function buildMetadataFromCategory(category, { canonicalPath } = {}) {
    if (!category) {
        return null
    }

    const branding = await fetchSeoBranding()
    const pageName = category.translated_name || category.name
    const metaTitle =
        category.meta_title != null ? String(category.meta_title).trim() : ''
    const baseTitle = metaTitle || pageName || ''
    const description =
        category.meta_description ||
        category.description ||
        process.env.NEXT_PUBLIC_META_DESCRIPTION
    const keywords = category.meta_keywords
        ? parseSeoKeywords(category.meta_keywords)
        : undefined
    const path =
        canonicalPath ||
        (category.slug ? `/category/${category.slug}` : '')
    const canonicalUrl = path ? absoluteUrl(path) : ''

    const metadata = {
        title: baseTitle,
        description: description || process.env.NEXT_PUBLIC_META_DESCRIPTION,
        openGraph: {
            images: category.image ? [category.image] : [],
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

/** Category SEO from get-featured-section (self_category custom field). */
export async function fetchCategorySeoFromFeaturedSection({ category_id } = {}) {
    if (!category_id) {
        return null
    }
    try {
        const response = await axios.get(`${apiBase()}get-featured-section`, {
            params: { category_id },
        })
        return response?.data?.self_category || null
    } catch (error) {
        console.error('fetchCategorySeoFromFeaturedSection:', error)
        return null
    }
}

/** Category SEO from get-category-filters (self_category). */
export async function fetchCategorySeoFromCategoryFilters({ slug, category_id } = {}) {
    if (!slug && !category_id) {
        return null
    }
    try {
        const response = await axios.get(`${apiBase()}get-category-filters`, {
            params: {
                ...(slug ? { slug } : {}),
                ...(category_id ? { category_id } : {}),
            },
        })
        return response?.data?.self_category || response?.data?.data?.categories?.[0] || null
    } catch (error) {
        console.error('fetchCategorySeoFromCategoryFilters:', error)
        return null
    }
}

/** Category SEO from get-categories?slug= (self_category). */
export async function fetchCategorySeoBySlug(slug) {
    if (!slug) {
        return null
    }
    try {
        const response = await axios.get(`${apiBase()}get-categories`, {
            params: { slug },
        })
        return response?.data?.self_category || null
    } catch (error) {
        console.error('fetchCategorySeoBySlug:', error)
        return null
    }
}

/**
 * Resolve category SEO for vertical homes / search pages.
 * Prefers featured-section when category_id is known (main home API).
 */
export async function resolveCategorySeo({ category_id, slug } = {}) {
    if (category_id) {
        const fromFeatured = await fetchCategorySeoFromFeaturedSection({ category_id })
        if (fromFeatured) {
            return fromFeatured
        }
    }
    if (slug) {
        const fromFilters = await fetchCategorySeoFromCategoryFilters({ slug, category_id })
        if (fromFilters) {
            return fromFilters
        }
        return fetchCategorySeoBySlug(slug)
    }
    if (category_id) {
        return fetchCategorySeoFromCategoryFilters({ category_id })
    }
    return null
}

/** Motors listing aliases and similar vertical category pages. */
export async function buildVerticalHomeMetadata({
    slug,
    category_id,
    canonicalPath,
} = {}) {
    const category = await resolveCategorySeo({ slug, category_id })
    const metadata = await buildMetadataFromCategory(category, { canonicalPath })
    if (metadata) {
        return metadata
    }
    return finalizeSeoMetadata({
        title: '',
        description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
        openGraph: { images: [] },
    })
}

export { formatSeoBrowserTitle }
