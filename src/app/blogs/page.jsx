import Blogs from '@/components/PagesComponent/Blogs/Blogs'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
  try {
      return await generateSeoSettingsMetadata('blogs', {
          canonicalPath: '/blogs',
          titleFallback: 'Blogs',
      })
  } catch (error) {
      console.error("Error fetching MetaData:", error);
      return null;
  }
};


const page = () => {
  return (
    <div>
      <Blogs />
    </div>
  )
}

export default page
