import SingleCategory from "@/components/PagesComponent/SingleCategory/SingleCategory"
import {
    buildMetadataFromCategory,
    fetchCategorySeoBySlug,
} from '@/utils/categorySeoMetadata'
import { finalizeSeoMetadata } from '@/utils/seoBranding'

export const generateMetadata = async ({ params }) => {
    try {
        const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug
        const selfCategory = await fetchCategorySeoBySlug(slug)
        const slugSegments = Array.isArray(params?.slug)
            ? params.slug.filter(Boolean)
            : []
        const canonicalPath = slugSegments.length
            ? `/category/${slugSegments.join('/')}`
            : (selfCategory?.slug ? `/category/${selfCategory.slug}` : undefined)

        return (
            (await buildMetadataFromCategory(selfCategory, { canonicalPath })) ||
            (await finalizeSeoMetadata({
                title: '',
                description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
                openGraph: { images: [] },
            }))
        )
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};


const SingleCategoryPage = ({ params }) => {
    return (
        <>
            {/* <SEO /> */}
            <SingleCategory slug={params.slug} />
        </>
    )
}

export default SingleCategoryPage
