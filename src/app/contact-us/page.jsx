import ContactUs from "@/components/PagesComponent/ContactUs/ContactUs"
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
  try {
    return await generateSeoSettingsMetadata('contact-us', {
      canonicalPath: '/contact-us',
      titleFallback: 'Contact Us',
    })
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const ContactUsPage = () => {
  return (
    <>
      <ContactUs />
    </>
  )
}

export default ContactUsPage
