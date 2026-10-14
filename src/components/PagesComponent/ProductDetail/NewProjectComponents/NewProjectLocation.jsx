/* eslint-disable react/prop-types */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Homepin from '../../../../../public/assets/img/icons/homepin.svg'
import mapicon from '../../../../../public/assets/img/map.jpg'
import NewProjectLocationModal from './NewProjectLocationModal'

const DEFAULT_CENTER = { lat: 25.0657, lng: 55.2117 }

function parseCoordinate(v) {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}

function pickString(...vals) {
    for (const x of vals) {
        if (x != null && String(x).trim() !== '') return String(x).trim()
    }
    return ''
}

function getCenterFromProduct(productData) {
    const lat = parseCoordinate(
        productData?.latitude ?? productData?.lat ?? productData?.location_lat
    )
    const lng = parseCoordinate(
        productData?.longitude ?? productData?.lng ?? productData?.long ?? productData?.location_lng
    )
    if (lat != null && lng != null) return { lat, lng }
    return { ...DEFAULT_CENTER }
}



export default function NewProjectLocation({ productData = {} }) {
    const [modalOpen, setModalOpen] = useState(false)
    const center = useMemo(() => getCenterFromProduct(productData), [productData])
    const locationLabel = pickString(
        productData.location,
        productData.address,
        productData.area,
        productData.title,
        productData.name
    )

    return (
        <>
            <div className="w-full border-b border-[rgba(143,143,143,0.35)] bg-white py-[40px]">
                <div className="mb-[24px]">
                    <h2 className="text-[24px] font-[Inter-Bold] text-[#23262A]">
                        Location
                    </h2>
                </div>
                <div className="relative overflow-hidden rounded-[16px]">
                    <div className="relative h-[384px] w-full ">
                        <Image src={mapicon} alt="Map" width={800} height={360} className="w-full h-[384px] object-cover" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(255,255,255,0.08)]" />

                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="pointer-events-auto cursor-pointer inline-flex items-center gap-[8px] rounded-full bg-white p-[6px_20px] shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
                            >
                                <Image src={Homepin} alt="" width={24} height={24} />
                                <span className="text-[14px] font-[Inter-Medium] text-[#3A88EF]]">
                                    View Location
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <NewProjectLocationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                center={center}
                locationLabel={locationLabel}
            />
        </>
    )
}
