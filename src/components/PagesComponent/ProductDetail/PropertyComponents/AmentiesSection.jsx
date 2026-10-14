/* eslint-disable react/prop-types */
'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import SecurityIcon from '../../../../../public/assets/img/amenties/security.svg'
import WindowsIcon from '../../../../../public/assets/img/amenties/doublewindows.svg'
import ElevatorIcon from '../../../../../public/assets/img/amenties/serviceelevators.svg'
import IntercomIcon from '../../../../../public/assets/img/amenties/intercom.svg'
import CctvIcon from '../../../../../public/assets/img/amenties/cctvsecurity.svg'
import CafeteriaIcon from '../../../../../public/assets/img/amenties/cafeteria.svg'
import DisabledIcon from '../../../../../public/assets/img/amenties/facilities.svg'
import StorageIcon from '../../../../../public/assets/img/amenties/storagareas.svg'
import LobbyIcon from '../../../../../public/assets/img/amenties/lobbybuilding.svg'
import WasteIcon from '../../../../../public/assets/img/amenties/wastedisposal.svg'

const DEFAULT_AMENITIES = [
  { id: 'security', label: 'Security', Icon: SecurityIcon },
  { id: 'windows', label: 'Double Glazed Windows', Icon: WindowsIcon },
  { id: 'elevator', label: 'Service Elevators', Icon: ElevatorIcon },
  { id: 'intercom', label: 'Intercom', Icon: IntercomIcon },
  { id: 'cctv', label: 'CCTV Security', Icon: CctvIcon },
  { id: 'cafeteria', label: 'Cafeteria or Canteen', Icon: CafeteriaIcon },
  { id: 'disabled', label: 'Facilities for Disabled', Icon: DisabledIcon },
  { id: 'storage', label: 'Storage Areas', Icon: StorageIcon },
  { id: 'lobby', label: 'Lobby in Building', Icon: LobbyIcon },
  { id: 'waste', label: 'Waste Disposal', Icon: WasteIcon },
]

const PREVIEW_COUNT = 4

function extractCustomFieldValue(row) {
  const nested = row?.custom_field_value?.value
  if (nested !== undefined && nested !== null) {
    if (Array.isArray(nested)) return nested.map((x) => String(x).trim()).filter(Boolean)
    return nested !== '' ? [String(nested).trim()] : []
  }
  const v = row?.value
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  return v != null && v !== '' ? [String(v).trim()] : []
}

function amenitiesFromCustomFields(productData) {
  const fields = productData?.custom_fields
  if (!Array.isArray(fields)) return null
  const row = fields.find((f) => String(f?.name || '').toLowerCase() === 'amenities')
  if (!row) return null
  const labels = extractCustomFieldValue(row)
  return labels.length ? labels : null
}

function normalizeAmenitiesFromProduct(productData) {
  const fromFields = amenitiesFromCustomFields(productData)
  if (fromFields && fromFields.length) return fromFields

  const raw =
    productData?.amenities ||
    productData?.amenity_list ||
    productData?.features_list ||
    productData?.facilities
  if (!Array.isArray(raw) || raw.length === 0) return null
  return raw
    .map((x) => {
      if (typeof x === 'string') return x.trim()
      if (x && typeof x === 'object') return String(x.name || x.label || x.title || '').trim()
      return ''
    })
    .filter(Boolean)
}

function AmenityCard({ label, Icon }) {
  return (
    <div className="flex min-h-[130px] flex-col items-center justify-center gap-[4px] rounded-[16px] bg-[#f7f7f8] p-[8px] text-center">
      {Icon ? <Image src={Icon} alt={label} width={40} height={40} className="w-[40px] h-[40px]" /> : null}
      <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">{label}</p>
    </div>
  )
}

export default function AmentiesSection({ productData }) {
  const [expanded, setExpanded] = useState(false)

  const amenities = useMemo(() => {
    const labels = normalizeAmenitiesFromProduct(productData)
    if (labels && labels.length) {
      return labels.map((label, i) => ({
        id: `custom-${i}`,
        label,
        Icon: null,
      }))
    }
    return DEFAULT_AMENITIES
  }, [productData])

  const total = amenities.length
  const hiddenCount = Math.max(0, total - PREVIEW_COUNT)

  const visibleItems = expanded ? amenities : amenities.slice(0, PREVIEW_COUNT)
  const showToggleCard = hiddenCount > 0

  return (
    <div className="w-full border-b border-[rgba(143,143,143,0.35)] py-[40px]">
      <h2 className="mb-[24px] text-[22px] font-[Inter-Bold] text-[#23262A]">Amenities</h2>
      <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3 md:grid-cols-5 ">
        {visibleItems.map((a) => (
          <AmenityCard key={a.id} label={a.label} Icon={a.Icon} />
        ))}
        {showToggleCard ? (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="cursor-pointer flex min-h-[130px] flex-col items-center justify-center rounded-[16px] bg-[#f7f7f8] p-[8px] text-center transition-opacity hover:opacity-90"
          >
            {expanded ? (
              <p className="text-[14px] font-[Inter-SemiBold] text-[#1270ec]">See less</p>
            ) : (
              <p className="text-[14px] font-[Inter-Bold] text-[#1270ec]">+{hiddenCount} More</p>
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}
