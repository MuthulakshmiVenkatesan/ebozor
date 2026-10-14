'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import Image from 'next/image'
import { CloseIcon, LocationIcon } from '@/components/CustomFile/icons'
import plus from '../../../../../public/assets/img/icons/plus.svg'
import minus from '../../../../../public/assets/img/icons/minus.svg'
import HomeAddressAlertModal from './HomeAddressAlertModal'
import { fieldsFromPlaceSelection, fillLocationFieldsFromMapCoords } from '@/utils/listingLocation'

const FALLBACK_LOCATION_SUGGESTIONS = [
    'Jumeirah Village Circle (JVC) ( Dubai )',
    'Al Helio ( Ajman )',
    'Business Bay ( Dubai )',
    'Al Helio 2 ( Al Helio, Ajman )',
    'Al Yasmeen ( Ajman )',
]

function FloatingInput({ id, label, value, onChange, optional, required, suggestions = [], onSuggestionPick }) {
    const [focused, setFocused] = useState(false)
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused || open
    const query = String(value ?? '').trim().toLowerCase()
    const normalizedSuggestions = useMemo(
        () =>
            suggestions.map((item) =>
                typeof item === 'string'
                    ? { key: item, label: item, raw: item }
                    : {
                          key: item.place_id || item.description || item.label || 'suggestion-item',
                          label: item.description || item.label || '',
                          raw: item,
                      }
            ),
        [suggestions]
    )
    const filtered = normalizedSuggestions.filter((item) => (query ? item.label.toLowerCase().includes(query) : true))

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    return (
        <div ref={rootRef} className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : 'left-[14px] top-1/2 max-w-[calc(100%-88px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
            </label>
            <div className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'}`}>
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        setFocused(true)
                        if (suggestions.length) setOpen(true)
                    }}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                <span className="shrink-0 pr-[14px] rtl:pl-[14px] rtl:pr-0 text-[12px] font-[Inter-Regular] text-[#9CA3AF]">
                    {required ? 'Required*' : optional ? 'Optional' : ''}
                </span>
            </div>
            {open && suggestions.length ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
                    <ul className="max-h-[190px] overflow-y-auto py-[6px]">
                        {filtered.map((item) => (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        onChange(item.label)
                                        onSuggestionPick?.(item.raw)
                                        setOpen(false)
                                    }}
                                    className="w-full px-[14px] py-[8px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F3F4F6]"
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}

export default function LocationDetailsModal({
    open,
    onClose,
    onSave,
    isLoaded,
    mapRef,
    position,
    mapZoom,
    setPosition,
    setMapZoom,
    zoomIn,
    zoomOut,
    locateMe,
    locationLabel,
    setLocationLabel,
    locationQuery,
    setLocationQuery,
    streetQuery,
    setStreetQuery,
    modalMode = 'new',
}) {
    const [apartmentQuery, setApartmentQuery] = useState('')
    const [setDefault, setSetDefault] = useState(false)
    const [customLabelName, setCustomLabelName] = useState('')
    const [showHomeAlert, setShowHomeAlert] = useState(false)
    const isEditMode = modalMode === 'edit'
    const [locationSuggestions, setLocationSuggestions] = useState(FALLBACK_LOCATION_SUGGESTIONS)
    const [streetSuggestions, setStreetSuggestions] = useState([])

    const getPredictions = async (inputValue, setter) => {
        const text = String(inputValue || '').trim()
        if (!text || typeof window === 'undefined' || !window.google?.maps?.places?.AutocompleteService) {
            setter([])
            return
        }
        const service = new window.google.maps.places.AutocompleteService()
        service.getPlacePredictions(
            {
                input: text,
                componentRestrictions: { country: 'ae' },
            },
            (predictions = [], status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(predictions)) {
                    setter([])
                    return
                }
                setter(predictions)
            }
        )
    }

    useEffect(() => {
        const t = setTimeout(() => {
            if (!String(locationQuery || '').trim()) {
                setLocationSuggestions(FALLBACK_LOCATION_SUGGESTIONS)
                return
            }
            getPredictions(locationQuery, setLocationSuggestions)
        }, 180)
        return () => clearTimeout(t)
    }, [locationQuery])

    useEffect(() => {
        const t = setTimeout(() => {
            getPredictions(streetQuery, setStreetSuggestions)
        }, 180)
        return () => clearTimeout(t)
    }, [streetQuery])

    const handleMapCoordsSelect = (lat, lng) => {
        void fillLocationFieldsFromMapCoords({
            lat,
            lng,
            setPosition,
            setLocationQuery,
            setStreetQuery,
        })
    }

    const applyPlaceSelection = (prediction, assignText) => {
        if (!prediction || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return
        const geocoder = new window.google.maps.Geocoder()
        const placeId = prediction?.place_id
        if (!placeId) return
        geocoder.geocode({ placeId }, (results = [], status) => {
            if (status !== 'OK' || !results.length) return
            const top = results[0]
            const parts = fieldsFromPlaceSelection(top, prediction)
            const mainText = String(prediction?.structured_formatting?.main_text || '').trim()
            if (assignText === setLocationQuery) {
                setLocationQuery(parts.area || mainText)
                if (parts.building) setStreetQuery(parts.building)
            } else if (assignText === setStreetQuery) {
                setStreetQuery(parts.building || mainText)
                if (parts.area) setLocationQuery(parts.area)
            }
            setApartmentQuery('')
            const lat = top?.geometry?.location?.lat?.()
            const lng = top?.geometry?.location?.lng?.()
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setPosition?.({ lat, lng })
                if (mapRef?.current) {
                    mapRef.current.panTo({ lat, lng })
                    mapRef.current.setZoom(14)
                }
            }
        })
    }

    const handleHomeClick = () => {
        if (locationLabel === 'home') {
            setLocationLabel('')
            return
        }
        if (!isEditMode) {
            setShowHomeAlert(true)
            return
        }
        setLocationLabel('home')
    }

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[200] bg-black/45 p-[24px] max-sm:p-[14px]">
            <div className="mx-auto flex h-full max-sm:w-full w-[600px] flex-col overflow-hidden rounded-[8px] bg-white">
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.35)] px-[24px] py-[18px]">
                    <h3 className="text-[20px] font-[Inter-SemiBold] text-[#23262A]">{isEditMode ? 'Edit Default Address' : 'Location Details'}</h3>
                    <button type="button" onClick={onClose} className="cursor-pointer">
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" fillOpacity="1" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-[24px] max-sm:p-[14px]">
                    <div className="space-y-[16px]">
                        <FloatingInput
                            id="loc-neighbourhood"
                            label="Neighbourhood"
                            value={locationQuery}
                            onChange={setLocationQuery}
                            required
                            suggestions={locationSuggestions}
                            onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setLocationQuery)}
                        />
                        <FloatingInput
                            id="loc-street"
                            label="Building or Street name"
                            value={streetQuery}
                            onChange={setStreetQuery}
                            optional
                            suggestions={streetSuggestions}
                            onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setStreetQuery)}
                        />
                        <FloatingInput id="loc-apartment" label="Apartment or Villa number" value={apartmentQuery} onChange={setApartmentQuery} optional />
                    </div>

                    <p className="mt-[20px] mb-[10px] text-[14px] font-[Inter-Medium] text-[#23262A]">
                        Choose how you want to label your location* <span className="font-[Inter-Regular] text-[#8f8f8f]">(Required)</span>
                    </p>
                    <div className="mb-[20px] flex flex-wrap gap-[8px]">
                        <button
                            type="button"
                            onClick={() => setLocationLabel((prev) => (prev === 'new' ? '' : 'new'))}
                            className={`rounded-[8px] border p-[8px_12px] text-[14px] font-[Inter-Medium] cursor-pointer border-[#23262A] text-[#23262A] ${locationLabel === 'new' ? 'bg-[#00000014] ' : 'bg-white '}`}
                        >
                            + Add Custom Label
                        </button>
                        <button
                            type="button"
                            onClick={handleHomeClick}
                            className={`rounded-[8px] border p-[8px_12px] text-[14px] font-[Inter-Medium] cursor-pointer border-[#23262A]  ${locationLabel === 'home' ? 'bg-[#00000014] ' : 'bg-white '}`}
                        >
                            Home
                        </button>
                    </div>
                    {locationLabel === 'new' ? (
                        <div className="mb-[20px]">
                            <FloatingInput
                                id="loc-custom-label"
                                label="Add a name for your location"
                                value={customLabelName}
                                onChange={setCustomLabelName}
                                optional
                            />
                        </div>
                    ) : null}
                    {!isEditMode ? (
                        <div className="mb-[20px] flex items-center gap-[10px]">
                            <button
                                type="button"
                                onClick={() => setSetDefault((v) => !v)}
                                className={`cursor-pointer relative h-[14px] w-[36px] rounded-full transition-colors ${setDefault ? 'bg-[#23262A]' : 'bg-[#8f8f8f]'}`}
                                aria-label="Set as default"
                            >
                                <span className={`absolute top-[-3px] h-[20px] w-[20px] rounded-full bg-[#fff] transition-all ${setDefault ? 'left-[19px]' : 'left-[-2px]'}`} />
                            </button>
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Set as default</p>
                        </div>
                    ) : null}

                    <div className="rounded-[6px] border border-[#23262A] p-[14px]">
                        <p className="mb-[4px] text-center text-[14px] font-[Inter-SemiBold] text-[#23262A]">Is the pin in the right location?</p>
                        <p className="mb-[12px] text-center text-[12px] font-[Inter-Regular] text-[#666]">
                            Click and drag the pin to the exact spot. Users are more likely to respond to ads that are correctly shown on the map.
                        </p>
                        <div className="relative h-[380px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)]">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={position}
                                    zoom={mapZoom}
                                    onLoad={(map) => {
                                        mapRef.current = map
                                    }}
                                    onUnmount={() => {
                                        mapRef.current = null
                                    }}
                                    onClick={(e) => {
                                        if (!e.latLng) return
                                        handleMapCoordsSelect(e.latLng.lat(), e.latLng.lng())
                                    }}
                                    onZoomChanged={() => {
                                        if (!mapRef.current) return
                                        setMapZoom(mapRef.current.getZoom())
                                    }}
                                    options={{
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                        fullscreenControl: false,
                                        clickableIcons: false,
                                    }}
                                >
                                    <Marker
                                        position={position}
                                        draggable
                                        onDragEnd={(e) => {
                                            if (!e.latLng) return
                                            handleMapCoordsSelect(e.latLng.lat(), e.latLng.lng())
                                        }}
                                    />
                                </GoogleMap>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#6B7280]">Loading map...</div>
                            )}

                            <div className="absolute left-[12px] top-[12px] overflow-hidden rounded-[6px] bg-white shadow-[0_0px_0px_2px_rgba(0,0,0,0.1)]">
                                <button
                                    type="button"
                                    onClick={zoomIn}
                                    className="block h-[30px] w-[30px] cursor-pointer border-b border-[rgba(35,38,42,0.2)] flex items-center justify-center"
                                    aria-label="Zoom in"
                                >
                                    <Image src={plus} alt="plus" width={26} height={26} />
                                </button>
                                <button
                                    type="button"
                                    onClick={zoomOut}
                                    className="block h-[30px] w-[30px] cursor-pointer flex items-center justify-center"
                                    aria-label="Zoom out"
                                >
                                    <Image src={minus} alt="minus" width={26} height={26} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={locateMe}
                                className="absolute bottom-[12px] right-[12px] cursor-pointer rounded-[8px] border border-[#23262A] bg-white p-[6px_12px] flex items-center gap-[8px]"
                            >
                                <LocationIcon className="h-[16px] w-[16px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Locate Me</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[rgba(143,143,143,0.35)] px-[24px] py-[14px]">
                    <button
                        type="button"
                        onClick={onSave}
                        className="p-[8px_12px] w-full cursor-pointer rounded-[8px] bg-[#23262A] text-[14px] font-[Inter-SemiBold] text-white"
                    >
                        Save Address
                    </button>
                </div>
            </div>
            <HomeAddressAlertModal
                open={showHomeAlert}
                onChangeLabel={() => {
                    setShowHomeAlert(false)
                    setLocationLabel('new')
                }}
                onProceed={() => {
                    setLocationLabel('home')
                    setShowHomeAlert(false)
                }}
            />
        </div>
    )
}
