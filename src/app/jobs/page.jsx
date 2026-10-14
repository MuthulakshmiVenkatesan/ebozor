import Jobs from '@/components/PagesComponent/Jobs/Jobs'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('jobs', {
            canonicalPath: '/jobs',
            titleFallback: 'Jobs',
        })
    } catch (error) {
        console.error('Jobs generateMetadata:', error)
        return null
    }
}

const JobsPage = () => {
    return (
        <>
            <Jobs />
        </>
    )
}

export default JobsPage
