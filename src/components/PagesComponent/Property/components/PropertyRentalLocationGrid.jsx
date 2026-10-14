'use client'

import Link from 'next/link'

const RENT_COLUMNS = [
    {
        title: 'Apartments for rent',
        links: [
            'Dubai Marina',
            'Downtown Dubai',
            'The Palm Jumeirah',
            'Business Bay',
            'Dubai Silicon Oasis',
            'Jebel Ali',
            'JLT Jumeirah Lake Towers',
            'International City',
            'Dubai Hills Estate',
            'JBR Jumeirah Beach Residence',
        ],
    },
    {
        title: 'Villas for rent',
        links: [
            'Dubai Marina',
            'Downtown Dubai',
            'The Palm Jumeirah',
            'Business Bay',
            'Dubai Silicon Oasis',
            'Jebel Ali',
            'JLT Jumeirah Lake Towers',
            'International City',
            'Dubai Hills Estate',
            'JBR Jumeirah Beach Residence',
        ],
    },
    {
        title: 'Commercial buildings for rent',
        links: [
            'Business Bay',
            'JLT Jumeirah Lake Towers',
            'Barsha Heights (Tecom)',
            'Dubai Silicon Oasis',
            'Downtown Dubai',
            'DIFC',
            'Motor City',
            'Dubai Marina',
            'The Greens',
            'Dubai Investment Park',
        ],
    },
    {
        title: 'Rooms for rent',
        links: [
            'Bur Dubai',
            'Deira',
            'Dubai Marina',
            'Al Barsha',
            'Karama',
            'International City',
            'Al Qusais',
            'Al Nahda (Dubai)',
            'Jebel Ali',
            'Al Quoz',
        ],
    },
]

const SALE_COLUMNS = [
    {
        title: 'Apartments for sale',
        links: RENT_COLUMNS[0].links,
    },
    {
        title: 'Villas for sale',
        links: RENT_COLUMNS[1].links,
    },
    {
        title: 'Commercial buildings for sale',
        links: RENT_COLUMNS[2].links,
    },
    {
        title: 'Land for sale',
        links: [
            'Dubai Hills Estate',
            'Dubai Silicon Oasis',
            'Jebel Ali',
            'Dubai Investment Park',
            'Al Barsha',
            'Motor City',
            'The Greens',
            'International City',
            'Business Bay',
            'Downtown Dubai',
        ],
    },
]

function areaHref(label, purpose) {
    const p = purpose === 'sale' ? 'sale' : 'rent'
    const item = p === 'sale' ? 'property-for-sale' : 'property-for-rent'
    const q = new URLSearchParams({
        mode: 'property',
        purpose: p,
        item,
        area: label,
    })
    return `/products?${q.toString()}`
}

const PropertyRentalLocationGrid = ({ purpose = 'rent' }) => {
    const columns = purpose === 'sale' ? SALE_COLUMNS : RENT_COLUMNS
    return (
        <section className="mb-[50px] w-full">
            <div className="grid grid-cols-1 gap-x-[40px] gap-y-[28px] sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-[48px]">
                {columns.map((col) => (
                    <div key={col.title} className="min-w-0">
                        <h3 className="mb-[14px] text-[16px] font-[Inter-SemiBold] leading-tight text-[#00000CC]">
                            {col.title}
                        </h3>
                        <ul className="flex flex-col gap-[4px]">
                            {col.links.map((label) => (
                                <li key={`${col.title}-${label}`}>
                                    <Link
                                        href={areaHref(label, purpose)}
                                        prefetch={false}
                                        className="text-[14px] font-[Inter-Regular] !text-[rgba(0,0,0,0.6)] transition-colors"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default PropertyRentalLocationGrid
