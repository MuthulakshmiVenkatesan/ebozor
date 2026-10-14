import Community from '@/components/PagesComponent/Community/Community'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('community', {
            canonicalPath: '/community',
            titleFallback: 'Community',
        })
    } catch (error) {
        console.error('Community generateMetadata:', error)
        return null
    }
}

const CommunityPage = () => {
    return (
        <>
        <Community />
        </>
    )
}

export default CommunityPage
