import Classifieds from '@/components/PagesComponent/Classifieds/Classified'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('classifieds', {
            canonicalPath: '/classifieds',
            titleFallback: 'Classifieds',
        })
    } catch (error) {
        console.error('Classifieds generateMetadata:', error)
        return null
    }
}

const ClassifiedsPage = ({ searchParams }) => {
    const parentCategoryId = searchParams?.parent_category_id ?? null
    return (
        <>
            <Classifieds parentCategoryId={parentCategoryId} />
        </>
    )
}

export default ClassifiedsPage
