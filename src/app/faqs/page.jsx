import FAQS from '@/components/PagesComponent/FAQS/FAQS'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('faqs', {
            canonicalPath: '/faqs',
            titleFallback: 'FAQs',
        })
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
  };

const page = () => {
    return (
        <div>
            <FAQS />
        </div>
    )
}

export default page
