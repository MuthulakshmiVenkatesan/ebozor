/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { CloseIcon } from '@/components/CustomFile/icons'
import { loadGoogleMaps } from '@/utils'

export default function NewProjectLocationModal({ open, onClose, center, locationLabel }) {
    const { isLoaded } = loadGoogleMaps()

    const mapStyle = useMemo(() => ({ width: '100%', height: '100%' }), [])

    const embedSrc = useMemo(() => {
        const q = `${center.lat},${center.lng}`
        return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`
    }, [center.lat, center.lng])

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[240] flex flex-col bg-[#000]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-location-modal-title"
        >
            <header className="relative flex shrink-0 items-center justify-center bg-[#ffffff1a] p-[14px_20px]">
                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer flex items-center gap-[10px]"
                >
                    <CloseIcon className="w-[12px] h-[12px]" fill="#fff" fillOpacity="1" />
                    <p className="text-[14px] font-[Inter-Regular] text-[#fff]">Close</p>
                </button>
                <h2
                    id="new-project-location-modal-title"
                    className="mx-auto text-[14px] font-[Inter-Medium] text-white "
                >
                    Location
                </h2>
            </header>

            <div className="relative min-h-0 flex-1 bg-[#e5e5e5]">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapStyle}
                        center={center}
                        zoom={14}
                        options={{
                            fullscreenControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                        }}
                    >
                        <Marker position={center} title={locationLabel || 'Project location'} />
                    </GoogleMap>
                ) : (
                    <iframe
                        title="Location map"
                        src={embedSrc}
                        className="absolute inset-0 h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                )}
            </div>
        </div>
    )
}

