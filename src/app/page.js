import HomePage from '@/components/Home';
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
  try {
    return await generateSeoSettingsMetadata('home', {
      canonicalPath: '/',
      titleFallback: 'Home',
    })
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};


const index = () => {

  return (
    <>
      {/* <SEO /> */}
      <HomePage />
    </>
  )
}

export default index
