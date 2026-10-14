import Help from '@/components/PagesComponent/Help/Help'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('help', {
            canonicalPath: '/help',
            titleFallback: 'Help',
        })
    } catch (error) {
        console.error('Help generateMetadata:', error)
        return null
    }
}

const HelpPage = () => {
    return (
        <>
            <Help />
        </>
    )
}

export default HelpPage
