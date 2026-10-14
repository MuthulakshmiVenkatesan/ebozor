import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from 'next/image'
import { useSelector } from "react-redux";
import toast from 'react-hot-toast'
import { PlusIcon, LocationIcon } from '@/components/CustomFile/icons';
import { loadGoogleMaps } from '@/utils';
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { getUserAddressApi, userAddressChangesApi } from "@/utils/api";
import LocationDetailModal from '../components/LocationDetailModal';
import WorkAddressModal from '../components/WorkAddressModal';
import locationaddress from '../../../../../public/assets/img/locationaddress.svg'

const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-[#e8eaec] ${className}`} aria-hidden />
)

const MyAddress = () => {
  const userData = useSelector(userSignUpData)
  const { isLoaded } = loadGoogleMaps()
  const mapRef = useRef(null)
  const [mapZoom, setMapZoom] = useState(12)
  const [position, setPosition] = useState({ lat: 25.2048, lng: 55.2708 })
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [locationModalMode, setLocationModalMode] = useState('new')
  const [workModalMode, setWorkModalMode] = useState('')
  const [defaultAddressType, setDefaultAddressType] = useState('home')
  const [locationLabel, setLocationLabel] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [streetQuery, setStreetQuery] = useState('')
  const [apartmentQuery, setApartmentQuery] = useState('')
  const [homeAddress, setHomeAddress] = useState(null)
  const [customAddresses, setCustomAddresses] = useState([])
  const [workAddress, setWorkAddress] = useState(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [editingCustomKey, setEditingCustomKey] = useState(null)
  const [editingAddressId, setEditingAddressId] = useState(null)

  const parseApiPayload = (payload) => {
    if (typeof payload !== "string") return payload || {}
    const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
    const scriptIndex = payload.indexOf("<script")
    const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
      return JSON.parse(jsonText)
    } catch (error) {
      console.error("get-user-address parse error:", error)
      return {}
    }
  }

  const mapAddressItem = (item = {}, index = 0) => {
    const apartmentNumber = String(item?.apartment_number || '').trim()
    const streetName = String(item?.street_name || '').trim()
    const neighbourhood = String(item?.neighbourhood || '').trim()
    const normalizedLabel = String(item?.label || '').trim().toLowerCase()
    return {
      id: item?.id ?? null,
      key: item?.id != null ? `id-${item.id}` : `idx-${index}`,
      label: normalizedLabel,
      apartmentNumber,
      streetName,
      neighbourhood,
      locationQuery: neighbourhood,
      streetQuery: [apartmentNumber, streetName].filter(Boolean).join(', '),
      isDefault: Number(item?.default) === 1,
    }
  }

  const getCustomDefaultKey = (address) => `custom:${address?.key || address?.id || address?.label || 'new'}`

  useEffect(() => {
    const userId = userData?.id
    if (!userId) {
      setAddressLoading(false)
      setHomeAddress(null)
      setWorkAddress(null)
      setCustomAddresses([])
      setDefaultAddressType('home')
      return
    }
    let cancelled = false
    const loadAddresses = async () => {
      setAddressLoading(true)
      try {
        const response = await getUserAddressApi.getUserAddress({ user_id: userId })
        const parsed = parseApiPayload(response?.data)
        const rows = Array.isArray(parsed?.data) ? parsed.data : []
        const mappedRows = rows.map((row, index) => mapAddressItem(row, index))

        const home = mappedRows.find((row) => row.label === 'home') || null
        const work = mappedRows.find((row) => row.label === 'work') || null
        const customs = mappedRows.filter((row) => row.label !== 'home' && row.label !== 'work')
        const defaultRow = mappedRows.find((row) => row.isDefault)

        if (cancelled) return
        setHomeAddress(home)
        setWorkAddress(work)
        setCustomAddresses(customs)
        if (defaultRow) {
          if (defaultRow.label === 'work') setDefaultAddressType('work')
          else if (defaultRow.label === 'home') setDefaultAddressType('home')
          else setDefaultAddressType(getCustomDefaultKey(defaultRow))
        } else if (home) {
          setDefaultAddressType('home')
        } else if (work) {
          setDefaultAddressType('work')
        } else if (customs.length) {
          setDefaultAddressType(getCustomDefaultKey(customs[0]))
        } else {
          setDefaultAddressType('home')
        }
      } catch (error) {
        if (cancelled) return
        console.error("get-user-address error:", error)
        setHomeAddress(null)
        setWorkAddress(null)
        setCustomAddresses([])
        setDefaultAddressType('home')
      } finally {
        if (!cancelled) setAddressLoading(false)
      }
    }
    loadAddresses()
    return () => {
      cancelled = true
    }
  }, [userData?.id])

  const hasAnyAddress = useMemo(
    () => Boolean(homeAddress || workAddress || customAddresses.length),
    [homeAddress, workAddress, customAddresses]
  )

  const handleOpenLocationModal = (mode = 'new', label = 'new') => {
    setEditingAddressId(null)
    setLocationModalMode(mode)
    setLocationLabel(label)
    setLocationQuery('')
    setStreetQuery('')
    setApartmentQuery('')
    setShowLocationModal(true)
  }

  const handleOpenHomeModal = () => {
    handleOpenLocationModal('new', 'home')
  }

  const handleOpenWorkModal = () => {
    setEditingAddressId(null)
    setWorkModalMode('new')
    setLocationLabel('work')
    setLocationQuery('')
    setStreetQuery('')
    setApartmentQuery('')
    setShowWorkModal(true)
  }



  const handleEditLocationModal = () => {
    if (!homeAddress) return
    setEditingAddressId(homeAddress.id || null)
    setLocationModalMode('edit')
    setLocationLabel('home')
    setLocationQuery(homeAddress.locationQuery || '')
    setStreetQuery(homeAddress.streetQuery || '')
    setApartmentQuery(homeAddress.apartmentNumber || '')
    setShowLocationModal(true)
  }

  const handleEditWorkLocationModal = () => {
    if (!workAddress) return
    setEditingAddressId(workAddress.id || null)
    setWorkModalMode('edit')
    setLocationLabel('work')
    setLocationQuery(workAddress.locationQuery || '')
    setStreetQuery(workAddress.streetQuery || '')
    setApartmentQuery(workAddress.apartmentNumber || '')
    setShowWorkModal(true)
  }

  const handleSaveWorkModal = (payload = {}) => {
    const nextLocation = payload.locationQuery || locationQuery || ''
    const nextStreet = payload.streetQuery || streetQuery || ''
    const nextApartment = payload.apartmentQuery || ''
    const nextIsDefault = Boolean(payload.setDefault)

    setWorkAddress({
      label: 'work',
      locationQuery: nextLocation,
      streetQuery: nextStreet,
      apartmentNumber: nextApartment,
    })
    if (nextIsDefault) setDefaultAddressType('work')
    else if (!homeAddress && !customAddresses.length) setDefaultAddressType('work')
    setShowWorkModal(false)
    setEditingAddressId(null)
  }

  const handleEditCustomLocationModal = (customAddress) => {
    if (!customAddress) return
    setEditingAddressId(customAddress.id || null)
    setEditingCustomKey(customAddress.key)
    setLocationModalMode('edit')
    setLocationLabel(customAddress.label || 'new')
    setLocationQuery(customAddress.locationQuery || '')
    setStreetQuery(customAddress.streetQuery || '')
    setApartmentQuery(customAddress.apartmentNumber || '')
    setShowLocationModal(true)
  }

  const reportAddressApiResult = (parsed, { successFallback, errorFallback } = {}) => {
    if (parsed?.error === false) {
      toast.success(parsed?.message || successFallback)
      return true
    }
    toast.error(parsed?.message || errorFallback)
    return false
  }

  const callAddressChangesApi = async (payload = {}, { successFallback, errorFallback } = {}) => {
    const userId = userData?.id
    if (!userId) return false
    try {
      const response = await userAddressChangesApi.userAddressChanges({
        user_id: userId,
        ...payload,
      })
      const parsed = parseApiPayload(response?.data)
      return reportAddressApiResult(parsed, {
        successFallback: successFallback || 'Address updated successfully.',
        errorFallback: errorFallback || 'Failed to update address.',
      })
    } catch (error) {
      console.error('user-address-changes action error:', error)
      toast.error('Failed to update address. Please try again.')
      return false
    }
  }

  const handleSetDefault = (type, address = null) => {
    setDefaultAddressType(type)
    const addressId = address?.id || null
    if (!addressId) return
    callAddressChangesApi(
      {
        address_id: addressId,
        default: 1,
      },
      { successFallback: 'Default address updated.', errorFallback: 'Failed to set default address.' }
    )
  }

  const handleDeleteAddress = (address, type) => {
    const addressId = address?.id || null
    if (type === 'home') {
      setHomeAddress(null)
      if (defaultAddressType === 'home') {
        if (workAddress) setDefaultAddressType('work')
        else if (customAddresses.length) setDefaultAddressType(getCustomDefaultKey(customAddresses[0]))
        else setDefaultAddressType('home')
      }
    } else if (type === 'work') {
      setWorkAddress(null)
      if (defaultAddressType === 'work') {
        if (homeAddress) setDefaultAddressType('home')
        else if (customAddresses.length) setDefaultAddressType(getCustomDefaultKey(customAddresses[0]))
        else setDefaultAddressType('home')
      }
    } else if (type === 'custom') {
      setCustomAddresses((prev) => prev.filter((item) => item.key !== address?.key))
      if (defaultAddressType === getCustomDefaultKey(address)) {
        if (homeAddress) setDefaultAddressType('home')
        else if (workAddress) setDefaultAddressType('work')
        else {
          const remaining = customAddresses.filter((item) => item.key !== address?.key)
          setDefaultAddressType(remaining.length ? getCustomDefaultKey(remaining[0]) : 'home')
        }
      }
    }
    if (!addressId) return
    callAddressChangesApi(
      {
        address_id: addressId,
        type: 'delete',
      },
      { successFallback: 'Address deleted successfully.', errorFallback: 'Failed to delete address.' }
    )
  }

  const handleSaveLocationModal = (payload = {}) => {
    const nextLabel = payload.locationLabel || locationLabel
    const nextLocation = payload.locationQuery || locationQuery || ''
    const nextStreet = payload.streetQuery || streetQuery || ''
    const nextApartment = payload.apartmentQuery || ''
    const nextCustomLabel = payload.customLabelName || ''
    const nextIsDefault = Boolean(payload.setDefault)

    if (locationModalMode === 'work') {
      setWorkAddress({
        label: 'work',
        locationQuery: nextLocation,
        streetQuery: nextStreet,
      })
      if (nextIsDefault) setDefaultAddressType('work')
    } else if (nextLabel === 'home' || locationLabel === 'home') {
      setHomeAddress({
        locationQuery: nextLocation,
        streetQuery: nextStreet,
        apartmentNumber: nextApartment,
      })
      if (nextIsDefault) setDefaultAddressType('home')
      else if (!workAddress && !customAddresses.length) setDefaultAddressType('home')
    } else if (locationModalMode === 'edit' && locationLabel !== 'home' && editingCustomKey) {
      setCustomAddresses((prev) =>
        prev.map((item) =>
          item.key === editingCustomKey
            ? {
                ...item,
                label: nextCustomLabel ? String(nextCustomLabel).toLowerCase() : item.label,
                locationQuery: nextLocation,
                streetQuery: nextStreet,
                apartmentNumber: nextApartment,
              }
            : item
        )
      )
      if (nextIsDefault) {
        const edited = customAddresses.find((item) => item.key === editingCustomKey)
        if (edited) setDefaultAddressType(getCustomDefaultKey(edited))
      }
    } else if (locationModalMode === 'new') {
      const labelText = nextLabel === 'new' ? (nextCustomLabel || 'new') : nextLabel
      const newCustom = {
        key: `local-${Date.now()}`,
        label: String(labelText || 'new').toLowerCase(),
        locationQuery: nextLocation,
        streetQuery: nextStreet,
        apartmentNumber: nextApartment,
      }
      setCustomAddresses((prev) => [...prev, newCustom])
      if (nextIsDefault) setDefaultAddressType(getCustomDefaultKey(newCustom))
    }
    setEditingCustomKey(null)
    setEditingAddressId(null)
    setShowLocationModal(false)
  }

  const zoomIn = () => {
    setMapZoom((z) => Math.min(20, z + 1))
    if (mapRef.current) mapRef.current.setZoom(Math.min(20, mapRef.current.getZoom() + 1))
  }

  const zoomOut = () => {
    setMapZoom((z) => Math.max(3, z - 1))
    if (mapRef.current) mapRef.current.setZoom(Math.max(3, mapRef.current.getZoom() - 1))
  }

  const locateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(next)
        if (mapRef.current) {
          mapRef.current.panTo(next)
          mapRef.current.setZoom(14)
        }
      },
      () => { },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="w-full">
      <div className="mb-[24px] flex-wrap flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-[4px] text-[22px] font-[Inter-Bold] leading-none text-[#23262A]">Addresses</h2>
          <p className="text-[14px] font-[Inter-Regular] text-[#4B5563]">Manage your saved addresses</p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenLocationModal('new', 'new')}
          className="inline-flex cursor-pointer items-center gap-[10px] rounded-[8px] bg-[#23262A] p-[8px_14px] text-[14px] font-[Inter-SemiBold] text-white"
        >
          <PlusIcon className="w-[13px] h-[13px]" />
          Add a Location
        </button>
      </div>

      {addressLoading ? (
        <div className="mt-[20px]">
          <div className="space-y-[16px] rounded-[6px] border border-[#f0f0f0] bg-[#464c550a] p-[16px]">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBlock className="h-[16px] w-[120px]" />
              <SkeletonBlock className="h-[22px] w-[64px] rounded-full" />
            </div>
            <SkeletonBlock className="h-[14px] w-[85%]" />
            <div className="flex items-center gap-[16px]">
              <SkeletonBlock className="h-[30px] w-[74px] rounded-[6px]" />
              <SkeletonBlock className="h-[30px] w-[74px] rounded-[6px]" />
            </div>
          </div>
          <div className="mt-[26px] space-y-[16px] rounded-[6px] border border-[#f0f0f0] bg-[#464c550a] p-[16px]">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBlock className="h-[16px] w-[140px]" />
              <SkeletonBlock className="h-[22px] w-[64px] rounded-full" />
            </div>
            <SkeletonBlock className="h-[14px] w-[78%]" />
            <div className="flex items-center gap-[16px]">
              <SkeletonBlock className="h-[30px] w-[74px] rounded-[6px]" />
              <SkeletonBlock className="h-[30px] w-[74px] rounded-[6px]" />
            </div>
          </div>
        </div>
      ) : !hasAnyAddress ? (
        <div className="flex flex-col items-center bg-white mt-[20px]">
          <h3 className="text-center mb-[14px] text-[14px] font-[Inter-Bold] text-[#23262A]">You have no saved addresses</h3>
          <p className="mx-auto max-w-[400px] text-center text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
            Saved addresses helps us improve your selling and buying experience
          </p>
          <div className="mt-[28px] flex justify-center">
            <Image
              src={locationaddress}
              alt=""
              width={210}
              height={180}
              className="h-auto max-w-full"
            />
          </div>
          <div className="mt-[32px] flex w-full max-w-[520px] flex-col gap-[12px]">
            <button
              type="button"
              onClick={() => handleOpenWorkModal()}
              className="flex w-full cursor-pointer items-center gap-[12px] rounded-[8px] border border-[#e0e1e3] bg-white p-[16px_18px] text-left transition-colors hover:bg-[#fafafa]"
            >
              <PlusIcon className="h-[18px] w-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
              <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Work Address</span>
            </button>
            <button
              type="button"
              onClick={handleOpenHomeModal}
              className="flex w-full cursor-pointer items-center gap-[12px] rounded-[8px] border border-[#e0e1e3] bg-white p-[16px_18px] text-left transition-colors hover:bg-[#fafafa]"
            >
              <PlusIcon className="h-[18px] w-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
              <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Home Address</span>
            </button>
          </div>
        </div>
      ) : (
        <>
      {homeAddress ? (
      <div className="flex flex-col gap-[16px] rounded-[6px] border border-[#f0f0f0] bg-[#464c550a] p-[16px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-[8px]">
            <LocationIcon className="w-[18px] h-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
            <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Home</h3>
          </div>
          {defaultAddressType === 'home' ? (
            <span className="rounded-full bg-[#23262A] p-[6px_14px] text-[10px] font-[Inter-SemiBold] leading-none text-white">
              Default
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSetDefault('home', homeAddress)}
              className="flex cursor-pointer items-center gap-[8px]"
            >
              <p className="text-[10px] font-[Inter-SemiBold] text-[#23262A]">Set as default</p>
              <div className="relative h-[10px] w-[30px] rounded-full bg-[rgba(0,0,0,0.4)] transition-colors">
                <span className="absolute left-[0px] top-[-3px] h-[16px] w-[16px] rounded-full bg-white transition-all" />
              </div>
            </button>
          )}
        </div>

        <p className=" text-[14px] font-[Inter-Regular] text-[#23262A]">
          {[
            homeAddress.apartmentNumber && `Apartment ${homeAddress.apartmentNumber}`,
            homeAddress.streetName || homeAddress.streetQuery,
            homeAddress.neighbourhood || homeAddress.locationQuery
          ].filter(Boolean).join(', ') || 'Home address'}
        </p>

        <div className="flex items-center gap-[16px]">
          <button
            type="button"
            onClick={handleEditLocationModal}
            className="p-[3px_18px] cursor-pointer rounded-[6px] border border-[#8f8f8f] bg-transparent text-[14px] font-[Inter-SemiBold] text-[#23262A]"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={defaultAddressType === 'home'}
            onClick={() => handleDeleteAddress(homeAddress, 'home')}
            className={`p-[3px_10px] rounded-[6px] border text-[14px] font-[Inter-SemiBold] ${defaultAddressType === 'home'
              ? 'cursor-not-allowed border-[rgba(143,143,143,0.22)] text-[rgba(0,0,0,0.1)]'
              : 'cursor-pointer border-[#8f8f8f] text-[#23262A]'
              }`}
          >
            Delete
          </button>
        </div>
      </div>
      ) : null}

      {customAddresses.map((customAddress, index) => (
        <div key={customAddress.key || customAddress.id || index} className={`flex flex-col gap-[16px] rounded-[6px] border border-[#f0f0f0] bg-[#464c550a] p-[16px] ${homeAddress || index > 0 ? 'mt-[26px]' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-[8px]">
              <LocationIcon className="h-[18px] w-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
              <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{customAddress.label}</h3>
            </div>
            {defaultAddressType === getCustomDefaultKey(customAddress) ? (
              <span className="rounded-full bg-[#23262A] p-[6px_14px] text-[10px] font-[Inter-SemiBold] leading-none text-white">
                Default
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetDefault(getCustomDefaultKey(customAddress), customAddress)}
                className="flex cursor-pointer items-center gap-[8px]"
              >
                <p className="text-[10px] font-[Inter-SemiBold] text-[#23262A]">Set as default</p>
                <div className="relative h-[10px] w-[30px] rounded-full bg-[rgba(0,0,0,0.4)] transition-colors">
                  <span className="absolute left-[0px] top-[-3px] h-[16px] w-[16px] rounded-full bg-white transition-all" />
                </div>
              </button>
            )}
          </div>
          <p className=" text-[14px] font-[Inter-Regular] text-[#23262A]">
            {[
              customAddress.apartmentNumber && `Apartment ${customAddress.apartmentNumber}`,
              customAddress.streetName || customAddress.streetQuery,
              customAddress.neighbourhood || customAddress.locationQuery
            ].filter(Boolean).join(', ') || 'Address'}
          </p>
          <div className="flex items-center gap-[16px]">
            <button
              type="button"
              onClick={() => handleEditCustomLocationModal(customAddress)}
              className="p-[3px_18px] cursor-pointer rounded-[6px] border border-[#8f8f8f] bg-transparent text-[14px] font-[Inter-SemiBold] text-[#23262A]"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={defaultAddressType === getCustomDefaultKey(customAddress)}
              onClick={() => handleDeleteAddress(customAddress, 'custom')}
              className={`p-[3px_10px] rounded-[6px] border text-[14px] font-[Inter-SemiBold] ${defaultAddressType === getCustomDefaultKey(customAddress)
                ? 'cursor-not-allowed border-[rgba(143,143,143,0.22)] text-[rgba(0,0,0,0.1)]'
                : 'cursor-pointer border-[#8f8f8f] text-[#23262A]'
                }`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {workAddress ? (
        <div
          className={`flex flex-col gap-[16px] rounded-[6px] border border-[#f0f0f0] bg-[#464c550a] p-[16px] ${
            homeAddress || customAddresses.length ? 'mt-[26px]' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-[8px]">
              <LocationIcon className="h-[18px] w-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
              <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">work</h3>
            </div>
            {defaultAddressType === 'work' ? (
              <span className="rounded-full bg-[#23262A] p-[6px_14px] text-[10px] font-[Inter-SemiBold] leading-none text-white">
                Default
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetDefault('work', workAddress)}
                className="flex cursor-pointer items-center gap-[8px]"
              >
                <p className="text-[10px] font-[Inter-SemiBold] text-[#23262A]">Set as default</p>
                <div className="relative h-[10px] w-[30px] rounded-full bg-[rgba(0,0,0,0.4)] transition-colors">
                  <span className="absolute left-[0px] top-[-3px] h-[16px] w-[16px] rounded-full bg-white transition-all" />
                </div>
              </button>
            )}
          </div>
          <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
            {[
              workAddress.apartmentNumber && `Apartment ${workAddress.apartmentNumber}`,
              workAddress.streetName || workAddress.streetQuery,
              workAddress.neighbourhood || workAddress.locationQuery
            ].filter(Boolean).join(', ') || 'Work address'}
          </p>
          <div className="flex items-center gap-[16px]">
            <button
              type="button"
              onClick={handleEditWorkLocationModal}
              className="p-[3px_18px] cursor-pointer rounded-[6px] border border-[#8f8f8f] bg-transparent text-[14px] font-[Inter-SemiBold] text-[#23262A]"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={defaultAddressType === 'work'}
              onClick={() => handleDeleteAddress(workAddress, 'work')}
              className={`p-[3px_18px] rounded-[6px] border text-[14px] font-[Inter-SemiBold] ${defaultAddressType === 'work'
                ? 'cursor-not-allowed border-[rgba(143,143,143,0.22)] text-[rgba(0,0,0,0.1)]'
                : 'cursor-pointer border-[#8f8f8f] text-[#23262A]'
                }`}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleOpenWorkModal()}
          className="mt-[26px] flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border border-[#e0e1e3] bg-white p-[16px_16px] text-left"
        >
          <PlusIcon className="w-[18px] h-[18px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
          <p className="text-[14px] font-[Inter-SemiBold] leading-none text-[#23262A]">Work Address</p>
        </button>
      )}
        </>
      )}

      <LocationDetailModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={handleSaveLocationModal}
        isLoaded={isLoaded}
        mapRef={mapRef}
        position={position}
        mapZoom={mapZoom}
        setPosition={setPosition}
        setMapZoom={setMapZoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        locateMe={locateMe}
        locationLabel={locationLabel}
        setLocationLabel={setLocationLabel}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
        streetQuery={streetQuery}
        setStreetQuery={setStreetQuery}
        initialApartmentQuery={apartmentQuery}
        addressId={editingAddressId}
        modalMode={locationModalMode}
        parseAddressApiResponse={parseApiPayload}
        reportAddressApiResult={reportAddressApiResult}
      />
      <WorkAddressModal
        open={showWorkModal}
        onClose={() => setShowWorkModal(false)}
        onSave={handleSaveWorkModal}
        isLoaded={isLoaded}
        mapRef={mapRef}
        position={position}
        mapZoom={mapZoom}
        setPosition={setPosition}
        setMapZoom={setMapZoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        locateMe={locateMe}
        locationLabel={locationLabel}
        setLocationLabel={setLocationLabel}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
        streetQuery={streetQuery}
        setStreetQuery={setStreetQuery}
        initialApartmentQuery={apartmentQuery}
        addressId={editingAddressId}
        modalMode={workModalMode}
        parseAddressApiResponse={parseApiPayload}
        reportAddressApiResult={reportAddressApiResult}
      />
    </div>
  );
};

export default MyAddress;
