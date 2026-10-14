import dynamic from 'next/dynamic'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

const AdListing = dynamic(() => import('@/components/PagesComponent/AdListing/AdListing'), { ssr: false })

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('ad-listing', {
            canonicalPath: '/ad-listing',
            titleFallback: 'Ad Listing',
        })
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};

const AdListingPage = () => {
    return (
        <AdListing />
    )
}

export default AdListingPage
