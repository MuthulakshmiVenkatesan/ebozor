'use client'

import { useState } from 'react'
import PropertyFeaturedProperties from './components/PropertyFeaturedProperties'
import PropertyHeroSearch from './components/PropertyHeroSearch'
import PropertyPopularAreas from './components/PropertyPopularAreas'
import PropertyPopularCategories from './components/PropertyPopularCategories'
import PropertyRentalLocationGrid from './components/PropertyRentalLocationGrid'

const PropertyPage = () => {
    const [propertyPurpose, setPropertyPurpose] = useState('rent')

    /** Sale vs rent for sections below the hero (offplan / new projects use sale-style listings). */
    const listingsPurpose = propertyPurpose === 'rent' ? 'rent' : 'sale'

    return (
        <div className="w-full mx-auto bg-white">
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                <PropertyHeroSearch purpose={propertyPurpose} onPurposeChange={setPropertyPurpose} />
                <PropertyPopularCategories purpose={listingsPurpose} />
                <PropertyPopularAreas purpose={listingsPurpose} />
                <PropertyFeaturedProperties purpose={listingsPurpose} />
                <PropertyRentalLocationGrid purpose={listingsPurpose} />
            </div>
        </div>
    )
}

export default PropertyPage