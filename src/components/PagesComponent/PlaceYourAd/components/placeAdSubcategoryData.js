/** Motorcycle types: next step after Motors → Motorcycles (ebozor-style list). */
export const MOTORCYCLE_AD_TYPES = [
    { key: 'sport-bike', label: 'Sport Bike' },
    { key: 'adventure-touring', label: 'Adventure / Touring' },
    { key: 'cruiser-chopper', label: 'Cruiser / Chopper' },
    { key: 'off-road', label: 'Off-Road' },
    { key: 'scooter', label: 'Scooter' },
    { key: 'standard-commuter', label: 'Standard / Commuter' },
    { key: 'cafe-racer', label: 'Café racer' },
    { key: 'trike', label: 'Trike' },
    { key: 'trailer', label: 'Trailer' },
    { key: 'karting', label: 'Karting' },
    { key: 'moped', label: 'Moped' },
    { key: 'golf-cart', label: 'Golf Cart1' },
    { key: 'other', label: 'Other' },
]

/** Extra level after picking a motorcycle type (e.g. Sport Bike → Hyper sports / Super bike / Super sports). */
export const MOTORCYCLE_SUBTYPES_BY_PARENT_KEY = {
    'sport-bike': [
        { key: 'hyper-sports', label: 'Hyper sports' },
        { key: 'super-bike', label: 'Super bike' },
        { key: 'super-sports', label: 'Super sports' },
    ],
}

/** Subcategories shown after picking a main “Place your ad” category (Motors matches ebozor-style list). */
export const PLACE_AD_SUBCATEGORIES = {
    motors: [
        { key: 'cars', label: 'Cars' },
        { key: 'motorcycles', label: 'Motorcycles' },
        { key: 'auto-accessories', label: 'Auto Accessories & Parts', href: '/ad-listing' },
        { key: 'heavy-vehicles', label: 'Heavy Vehicles', href: '/ad-listing' },
        { key: 'boats', label: 'Boats', href: '/ad-listing' },
        { key: 'number-plates', label: 'Number Plates', href: '/numberplates' },
    ],
    jobs: [
        { key: 'full-time', label: 'Full-time', href: '/ad-listing' },
        { key: 'part-time', label: 'Part-time', href: '/ad-listing' },
        { key: 'internships', label: 'Internships', href: '/ad-listing' },
    ],
    'property-sale': [
        { key: 'apartments', label: 'Apartments', href: '/ad-listing' },
        { key: 'villas', label: 'Villas', href: '/ad-listing' },
        { key: 'townhouses', label: 'Townhouses', href: '/ad-listing' },
    ],
    'property-rent': [
        { key: 'apartments', label: 'Apartments', href: '/ad-listing' },
        { key: 'villas', label: 'Villas', href: '/ad-listing' },
        { key: 'commercial', label: 'Commercial', href: '/ad-listing' },
    ],
    community: [
        { key: 'auto-services', label: 'Auto Services', href: '/ad-listing' },
        { key: 'tutors', label: 'Tutors', href: '/ad-listing' },
        { key: 'events', label: 'Events', href: '/ad-listing' },
    ],
    classifieds: [
        { key: 'electronics', label: 'Electronics', href: '/ad-listing' },
        { key: 'furniture', label: 'Furniture', href: '/ad-listing' },
        { key: 'other', label: 'Other Items', href: '/ad-listing' },
    ],
}
