import TermsAndCondition from '@/components/PagesComponent/TermsAndCondition/TermsAndCondition'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('terms-and-condition', {
            canonicalPath: '/terms-and-condition',
            titleFallback: 'Terms & Conditions',
        })
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};

const page = () => {
    return (
        <div>
            <TermsAndCondition />
        </div>
    )
}

export default page
