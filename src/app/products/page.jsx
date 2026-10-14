import Products from "@/components/PagesComponent/Products/Products"
import {
    buildMetadataFromCategory,
    resolveCategorySeo,
} from '@/utils/categorySeoMetadata'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

const looksLikeSlug = (value) => {
    const v = String(value || '').trim()
    if (!v) return false
    // Prefer slug-like values over display labels ("Used Cars").
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(v) && !/\s/.test(v)
}

export const generateMetadata = async ({ searchParams } = {}) => {
    try {
        const categorySlugCandidates = [
            searchParams?.category_slug,
            searchParams?.slug,
            looksLikeSlug(searchParams?.item) ? searchParams.item : null,
        ].filter(Boolean)

        // Category / entity context: keep existing category SEO (do not override with Admin static SEO).
        for (const slug of categorySlugCandidates) {
            const category = await resolveCategorySeo({ slug: String(slug) })
            if (category) {
                return await buildMetadataFromCategory(category, {
                    canonicalPath: category.slug ? `/category/${category.slug}` : undefined,
                })
            }
        }

        return await generateSeoSettingsMetadata('products', {
            canonicalPath: '/products',
            titleFallback: 'Products',
        })
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};


const ProductsPage = () => {

    return (
        <>
            {/* <SEO /> */}
            <Products />
        </>
    )
}

export default ProductsPage
