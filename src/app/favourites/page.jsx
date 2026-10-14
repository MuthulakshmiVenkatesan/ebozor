import Favourites from "@/components/PagesComponent/Favourites/Favourites"
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('favourites', {
            canonicalPath: '/favourites',
            titleFallback: 'Favourites',
        })
    } catch (error) {
        console.error('Favourites generateMetadata:', error)
        return null
    }
}

const FavouritesPage = () => {
    return (
        <>
            <Favourites />
        </>
    )
}

export default FavouritesPage
