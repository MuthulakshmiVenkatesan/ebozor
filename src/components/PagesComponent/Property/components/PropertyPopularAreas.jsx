'use client'

import Image from 'next/image'
import Link from 'next/link'

const AREAS = [
    {
        id: 'downtown',
        title: 'Downtown Dubai',
        description: "Home to the world's tallest tower and biggest mall",
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
        lgClass: 'lg:col-start-1 lg:row-start-1 lg:row-span-2',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 65,000 / year',
        hoverPriceSale: 'Starting from AED 1,250,000',
    },
    {
        id: 'palm',
        title: 'The Palm Jumeirah',
        description: 'Live on the 8th wonder of the world. Enough said!',
        image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80',
        lgClass: 'lg:col-start-2 lg:row-start-1',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 95,000 / year',
        hoverPriceSale: 'Starting from AED 3,200,000',
    },
    {
        id: 'business-bay',
        title: 'Business Bay',
        description: 'A centrally-located district adorning the Dubai creek',
        image: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800&q=80',
        lgClass: 'lg:col-start-3 lg:row-start-1',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 25,000 / year',
        hoverPriceSale: 'Starting from AED 574,999',
    },
    {
        id: 'dso',
        title: 'Dubai Silicon Oasis',
        description: 'A family-friendly suburb bursting with amenities',
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        lgClass: 'lg:col-start-4 lg:row-start-1',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 32,000 / year',
        hoverPriceSale: 'Starting from AED 485,000',
    },
    {
        id: 'jlt',
        title: 'JLT Jumeirah Lake Towers',
        description: 'Walk freely among high rises overlooking lakes',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        lgClass: 'lg:col-start-5 lg:row-start-1',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 38,000 / year',
        hoverPriceSale: 'Starting from AED 620,000',
    },
    {
        id: 'marina',
        title: 'Dubai Marina',
        description: 'Vibrant waterfront community with amazing views',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        lgClass: 'lg:col-start-2 lg:row-start-2 lg:col-span-2',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 42,000 / year',
        hoverPriceSale: 'Starting from AED 890,000',
    },
    {
        id: 'intl-city',
        title: 'International City',
        description: 'An 800-hectare residential area inspired by countries',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        lgClass: 'lg:col-start-4 lg:row-start-2',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments and Villas',
        hoverPriceRent: 'Starting from AED 22,000 / year',
        hoverPriceSale: 'Starting from AED 295,000',
    },
    {
        id: 'jbr',
        title: 'Jumeirah Beach Residence',
        description: 'Live by the beach with stunning waterfront views',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        lgClass: 'lg:col-start-5 lg:row-start-2',
        hoverTypes: 'Studio, 1 and 2+ Bedroom Apartments',
        hoverPriceRent: 'Starting from AED 55,000 / year',
        hoverPriceSale: 'Starting from AED 1,050,000',
    },
]

function areaHref(title, purpose) {
    const p = purpose === 'sale' ? 'sale' : 'rent'
    const item = p === 'sale' ? 'property-for-sale' : 'property-for-rent'
    const q = new URLSearchParams({
        mode: 'property',
        item,
        purpose: p,
        propertyType: 'Residential',
        category_slug: 'residential',
        area: title,
    })
    return `/products?${q.toString()}`
}

const PropertyPopularAreas = ({ purpose = 'rent' }) => {
    const isRent = purpose === 'rent'
    return (
        <section className="w-full mb-[50px]">
            <div className="flex items-center justify-between mb-[30px]">
                <h2 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                    Popular Areas in Dubai
                </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:grid-rows-[minmax(240px,1fr)_minmax(240px,1fr)] lg:gap-4 lg:min-h-[500px]">
                {AREAS.map((area) => (
                    <Link
                        key={area.id}
                        href={areaHref(area.title, purpose)}
                        prefetch={false}
                        aria-label={area.title}
                        className={`group property_areacard relative block min-h-[200px] overflow-hidden rounded-[4px] bg-[#e8e8e8] shadow-[0_1px_8px_rgba(0,0,0,0.06)] outline-none ring-1 ring-black/[0.06] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-[#DC0000] focus-visible:ring-offset-2 lg:min-h-0 lg:h-full ${area.lgClass}`}
                    >
                        <Image
                            src={area.image}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 20vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 z-[5] p-4 pt-10 sm:pt-12">
                            <h3 className="text-[18px] font-[Inter-Regular] text-white mb-[2px]">
                                {area.title}
                            </h3>
                            <p className="text-[12px] font-[Inter-SemiBold] text-[#FFFFFF]">
                                {area.description}
                            </p>
                            <div className="border-t border-[#FFFFFF] pt-[14px] mt-[14px] grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                                <div className="min-h-0 overflow-hidden">
                                    <p className="mb-[8px] inline-block rounded-[4px] bg-[rgba(0,0,0,0.55)] px-[8px] py-[4px] text-[11px] font-[Inter-SemiBold] text-white">
                                        Properties for {isRent ? 'Rent' : 'Sale'} in {area.title}
                                    </p>
                                    <p className="text-[12px] font-[Inter-Regular] text-white text-shadow-[0_2px_2px_rgba(0,0,0,0.5)] mb-[2px] leading-[20px]">
                                        {area.hoverTypes}
                                    </p>
                                    <p className="text-[12px] font-[Inter-Regular] text-white text-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                                        {isRent ? area.hoverPriceRent : area.hoverPriceSale}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default PropertyPopularAreas
