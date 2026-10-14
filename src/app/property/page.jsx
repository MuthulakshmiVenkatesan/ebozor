import Property from '@/components/PagesComponent/Property/Property'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('property', {
            canonicalPath: '/property',
            titleFallback: 'Property',
        })
    } catch (error) {
        console.error('Property generateMetadata:', error)
        return null
    }
}

const PropertyPage = () => {
    return (
        <>
            <Property />
        </>
    )
}

export default PropertyPage
