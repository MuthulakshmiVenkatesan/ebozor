import { Suspense } from 'react'
import axios from 'axios'
import ProductDetail from '@/components/PagesComponent/ProductDetail/ProductDetail'
import Loader from '@/components/Loader/Loader'
import { finalizeSeoMetadata } from '@/utils/seoBranding'
import { absoluteUrl } from '@/utils/siteUrl'
import { parseSeoKeywords } from '@/utils/categorySeoMetadata'

const apiBase = () =>
    `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`

function parseItemFromGetItemResponse(payload) {
    if (!payload || payload.error === true) return null
    const inner = payload.data
    if (!inner) return null
    const block = inner.data
    if (Array.isArray(block)) return block[0] ?? null
    if (block && typeof block === 'object' && (block.id != null || block.slug != null)) {
        return block
    }
    return null
}

function resolveListingTitle(item) {
    const candidates = [item?.name, item?.title, item?.listing_title]
    for (const value of candidates) {
        const text = value != null ? String(value).trim() : ''
        if (text) return text
    }

    // Motors: vehicle label often comes from make/model/trim API fields (same as list/detail UI).
    const make = [
        item?.car_make_name,
        item?.make,
        item?.brand,
        item?.manufacturer,
    ]
        .map((v) => (v != null ? String(v).trim() : ''))
        .find(Boolean)
    const model = [item?.car_model_name, item?.model, item?.variant]
        .map((v) => (v != null ? String(v).trim() : ''))
        .find(Boolean)
    const trim = [item?.car_trim_name, item?.trim]
        .map((v) => (v != null ? String(v).trim() : ''))
        .find(Boolean)

    return [make, model, trim].filter(Boolean).join(' ')
}

function resolveListingImage(item) {
    const image = item?.image
    if (image == null) return ''
    if (typeof image === 'string') return image.trim()
    if (typeof image === 'object' && image?.url) return String(image.url).trim()
    return ''
}

function buildProductDetailCanonicalPath(searchParams) {
    const params = new URLSearchParams()
    const keys = [
        'slug',
        'mode',
        'item',
        'purpose',
        'variant',
        'category_slug',
        'carOfWeek',
        'recruiter',
    ]
    for (const key of keys) {
        const raw = searchParams?.[key]
        const value = Array.isArray(raw) ? raw[0] : raw
        const normalized = value != null ? String(value).trim() : ''
        if (normalized) params.set(key, normalized)
    }
    const qs = params.toString()
    return qs ? `/productdetail?${qs}` : '/productdetail'
}

export const generateMetadata = async ({ searchParams } = {}) => {
    try {
        const slugRaw = searchParams?.slug
        const slug = String(Array.isArray(slugRaw) ? slugRaw[0] : slugRaw || '').trim()

        let item = null
        if (slug) {
            const response = await axios.get(`${apiBase()}get-item`, {
                params: { slug },
            })
            item = parseItemFromGetItemResponse(response?.data)

            if (!item && /^\d+$/.test(slug)) {
                const byId = await axios.get(`${apiBase()}get-item`, {
                    params: { id: slug },
                })
                item = parseItemFromGetItemResponse(byId?.data)
            }
        }

        const listingTitle = resolveListingTitle(item)
        const description =
            (item?.description != null && String(item.description).trim()) ||
            process.env.NEXT_PUBLIC_META_DESCRIPTION
        const image = resolveListingImage(item)
        const explicitKeywords =
            item?.meta_keywords ?? item?.keywords ?? item?.seo_keywords ?? null
        const keywords = explicitKeywords
            ? parseSeoKeywords(explicitKeywords)
            : undefined

        const metadata = {
            title: listingTitle,
            description,
            openGraph: {
                images: image ? [image] : [],
            },
            alternates: {
                canonical: absoluteUrl(buildProductDetailCanonicalPath(searchParams)),
            },
        }

        if (keywords?.length) {
            metadata.keywords = keywords
        }

        return finalizeSeoMetadata(metadata)
    } catch (error) {
        console.error('productdetail generateMetadata:', error)
        return null
    }
}

const ProductDetailPage = () => {
    return (
        <Suspense fallback={<Loader />}>
            <ProductDetail />
        </Suspense>
    )
}

export default ProductDetailPage
