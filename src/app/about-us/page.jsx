import AboutUs from '@/components/PagesComponent/AboutUs/AboutUs'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
  try {
    return await generateSeoSettingsMetadata('about-us', {
      canonicalPath: '/about-us',
      titleFallback: 'About Us',
    })
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const page = () => {
  return (
    <div>
      <AboutUs />
    </div>
  )
}

export default page
