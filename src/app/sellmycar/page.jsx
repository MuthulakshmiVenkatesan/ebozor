import SellMyCar from '@/components/PagesComponent/SellMyCar/SellMyCar'
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('sellmycar', {
            canonicalPath: '/sellmycar',
            titleFallback: 'Sell My Car',
        })
    } catch (error) {
        console.error('SellMyCar generateMetadata:', error)
        return null
    }
}

const SellMyCarPage = () => {
    return (
        <>
            <SellMyCar />
        </>
    )
}

export default SellMyCarPage
