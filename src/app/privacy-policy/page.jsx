import PrivacyPolicy from '@/components/PagesComponent/PrivacyPolicy/PrivacyPolicy'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
  try {
    return await generateSeoSettingsMetadata('privacy-policy', {
      canonicalPath: '/privacy-policy',
      titleFallback: 'Privacy Policy',
    })
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const page = () => {
  return (
    <div>
      <PrivacyPolicy />
    </div>
  )
}

export default page
