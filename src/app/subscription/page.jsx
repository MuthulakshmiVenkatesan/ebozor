import Subscription from "@/components/PagesComponent/Subscription/Subscription"
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('subscription', {
            canonicalPath: '/subscription',
            titleFallback: 'Subscription',
        })
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};
const SubscriptionPage = () => {
    return (
        <>
            {/* <SEO /> */}
            <Subscription />
        </>
    )
}

export default SubscriptionPage
