import Motors from '@/components/PagesComponent/Motors/Motors'
import {
    buildMetadataFromCategory,
    resolveCategorySeo,
} from '@/utils/categorySeoMetadata'
import { finalizeSeoMetadata } from '@/utils/seoBranding'

const MOTORS_CATEGORY_ID = 1
const MOTORS_CATEGORY_SLUG = 'motors'

export const generateMetadata = async () => {
    try {
        const category = await resolveCategorySeo({
            category_id: MOTORS_CATEGORY_ID,
            slug: MOTORS_CATEGORY_SLUG,
        })
        return (
            (await buildMetadataFromCategory(category, {
                canonicalPath: '/motors',
            })) ||
            (await finalizeSeoMetadata({
                title: 'Motors',
                description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
                openGraph: { images: [] },
            }))
        )
    } catch (error) {
        console.error('Motors generateMetadata:', error)
        return null
    }
}

const MotorsPage = () => {
    return (
        <>
            <Motors />
        </>
    )
}

export default MotorsPage
