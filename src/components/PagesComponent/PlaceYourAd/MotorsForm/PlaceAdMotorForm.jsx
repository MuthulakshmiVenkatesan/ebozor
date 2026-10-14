'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { useSelector } from 'react-redux'
import { FormDownArrowIcon, CloseIcon, RightArrowIcon, CameraIcon, TermsInfoIcon, TickIcon, LocationIcon } from '@/components/CustomFile/icons'
import { generateSlug, loadGoogleMaps, t } from '@/utils'
import {
    isTextualCustomFieldType,
    normalizeCustomFieldLength,
    normalizeCustomFieldRequired,
    validateCustomFieldTextLength,
} from '@/utils/placeAdCustomFields'
import { fieldsFromPlaceSelection, fillLocationFieldsFromMapCoords, resolveAreaAndBuilding } from '@/utils/listingLocation'
import LocationDetailsModal from '../components/LocationDetailsModal'
import SelectPackageOrder from '../Payment/SelectPackageOrder'
import PostAdPaymentSuccessPage from '../Payment/PostAdPaymentSuccessPage'
import { addItemApi, editItemApi, getCustomFieldsApi } from '@/utils/api'
import { shouldShowPlanPaymentAfterEdit } from '@/utils/productPromotionBadge'
import PlaceAdPhoneField from '../components/PlaceAdPhoneField'
import { isPhoneBareCountryCode, sanitizeDecimalInput } from '@/utils/placeAdNumericInput'
import toast from 'react-hot-toast'
import { settingsData } from '@/redux/reuducer/settingSlice'
import infoIcon from '../../../../../public/assets/img/icons/info.svg'
import plusicon from '../../../../../public/assets/img/icons/plusicon.svg'
import plus from '../../../../../public/assets/img/icons/plus.svg'
import minus from '../../../../../public/assets/img/icons/minus.svg'
import edit from '../../../../../public/assets/img/icons/edit.svg'

const PHONE_PREFIX = '+971'
const DESC_MAX = 16000
const DEFAULT_MAP_CENTER = { lat: 25.2048, lng: 55.2708 }

const LOCATION_SUGGESTIONS = [
    'Jumeirah Village Circle (JVC) ( Dubai )',
    'Business Bay ( Dubai )',
    'Dubai Marina ( Dubai )',
    'Al Helio ( Ajman )',
    'Al Helio 2 ( Al Helio, Ajman )',
    'Al Yasmeen ( Ajman )',
    'Ajman One Phase 2 ( Al Rashidiya 3, Ajman )',
    'Gulfa Towers ( Al Rashidiya 1, Ajman )',
    'Al Jurf 3 ( Al Jurf, Ajman )',
]

function AutocompleteField({
    id,
    label,
    optional = true,
    value,
    onChange,
    suggestions = [],
    onSuggestionPick,
}) {
    const [focused, setFocused] = useState(false)
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    const query = String(value ?? '').trim()
    const hasValue = query.length > 0
    const isFloating = hasValue || focused || open
    const suggestionLabel = (s) => {
        if (typeof s === 'string') return s
        if (s && typeof s === 'object') {
            return String(s.description || s.label || s.structured_formatting?.main_text || '').trim()
        }
        return ''
    }
    const filtered = (Array.isArray(suggestions) ? suggestions : []).filter((s) => {
        if (!query) return true
        const labelText = suggestionLabel(s)
        if (!labelText) return false
        return labelText.toLowerCase().includes(query.toLowerCase())
    })

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    const showMenu = open && focused

    return (
        <div ref={rootRef} className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : optional
                        ? 'left-[14px] top-1/2 max-w-[calc(100%-88px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-28px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused || open ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'}`}
            >
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        setFocused(true)
                        setOpen(true)
                    }}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {optional ? <span className="shrink-0 pr-[14px] text-[12px] font-[Inter-Regular] text-[#8f8f8f]">Optional</span> : null}
            </div>

            {showMenu ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[8px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.14),0_2px_10px_rgba(0,0,0,0.08)]">
                    <ul className="max-h-[220px] overflow-y-auto py-[6px]">
                        {filtered.length === 0 ? (
                            <li className="px-[14px] py-[10px] text-[14px] font-[Inter-Regular] text-[#8f8f8f]">No results</li>
                        ) : (
                            filtered.map((item) => {
                                const text = suggestionLabel(item)
                                const key = typeof item === 'string' ? item : item.place_id || text
                                return (
                                    <li key={key} role="presentation">
                                        <button
                                            type="button"
                                            className="flex w-full cursor-pointer px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors hover:bg-[#F3F4F6] focus:bg-[#F3F4F6] focus:outline-none"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                onChange(text)
                                                onSuggestionPick?.(item)
                                                setOpen(false)
                                            }}
                                        >
                                            {text}
                                        </button>
                                    </li>
                                )
                            })
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}

function parseGeocodeResults(results) {
    let city = ''
    let state = ''
    let country = ''
    let formattedAddress = ''
    for (const result of results || []) {
        const addressComponents = result.address_components || []
        const getComponent = (type) => {
            const comp = addressComponents.find((c) => c.types.includes(type))
            return comp ? comp.long_name : ''
        }
        if (!city) {
            city =
                getComponent('locality') ||
                getComponent('postal_town') ||
                getComponent('sublocality_level_1') ||
                getComponent('neighborhood') ||
                getComponent('administrative_area_level_2')
        }
        if (!state) state = getComponent('administrative_area_level_1')
        if (!country) country = getComponent('country')
        if (!formattedAddress) formattedAddress = result.formatted_address || ''
    }
    return { city, state, country, formattedAddress }
}

async function resolveListingLocation({ lat, lng, addressLine, placeApiKey }) {
    const out = {
        country: '',
        state: '',
        city: '',
        address: String(addressLine || '').trim(),
    }
    if (!placeApiKey) return out
    try {
        const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: { latlng: `${lat},${lng}`, key: placeApiKey },
        })
        if (data?.status === 'OK' && data?.results?.length) {
            const p = parseGeocodeResults(data.results)
            out.country = p.country
            out.state = p.state
            out.city = p.city
            if (!out.address && p.formattedAddress) out.address = p.formattedAddress
        }
    } catch (error) {
        console.error(error)
    }
    return out
}

/** Map API custom field row → internal shape (same rules as PlaceAdMotorsCarForm / PlaceAdUniversalListingForm). */
function mapApiCustomFieldToInternal(raw) {
    const id = raw.custom_field_id
    const required = normalizeCustomFieldRequired(raw)
    const multi = Number(raw.is_field_multiselect) === 1
    const fieldType = String(raw.field_type || '').toLowerCase()
    const values = Array.isArray(raw.field_values) ? raw.field_values : raw.field_values ? [raw.field_values] : []
    const min_length = normalizeCustomFieldLength(raw.min_length)
    const max_length = normalizeCustomFieldLength(raw.max_length)

    if (fieldType === 'dropdown_api') {
        const opts = values.filter((v) => typeof v === 'string')
        return {
            id,
            name: raw.label_name,
            type: 'dropdown',
            values: opts,
            required,
            min_length,
            max_length,
        }
    }

    if (fieldType === 'dropdown' && multi) {
        return {
            id,
            name: raw.label_name,
            type: 'multiselect_dropdown',
            values,
            required,
            min_length,
            max_length,
        }
    }
    if (fieldType === 'dropdown' && !multi) {
        return { id, name: raw.label_name, type: 'dropdown', values, required, min_length, max_length }
    }
    if (fieldType === 'button') {
        return {
            id,
            name: raw.label_name,
            type: 'button',
            values,
            required,
            min_length,
            max_length,
        }
    }
    return {
        id,
        name: raw.label_name,
        type: fieldType || 'textbox',
        values,
        required,
        min_length,
        max_length,
    }
}

function mapItemCustomFieldToInternal(raw) {
    const type = String(raw?.type || '').toLowerCase()
    return {
        id: raw?.id ?? raw?.custom_field_id,
        name: raw?.name || raw?.label_name || '',
        type: type || 'textbox',
        values: Array.isArray(raw?.values) ? raw.values : raw?.values ? [raw.values] : [],
        required: normalizeCustomFieldRequired(raw),
        min_length: normalizeCustomFieldLength(raw?.min_length),
        max_length: normalizeCustomFieldLength(raw?.max_length),
    }
}

function getEditItemCustomFields(editItemData) {
    const rows = Array.isArray(editItemData?.custom_fields) ? editItemData.custom_fields : []
    return rows.map(mapItemCustomFieldToInternal).filter((field) => field.id != null && field.name)
}

function parseCustomFieldsByCategoryResponse(res) {
    const data = res?.data?.data
    if (!data || typeof data !== 'object') return { categoryIds: [], fields: [] }
    const categoryIds = Array.isArray(data.category_ids) ? data.category_ids : []
    const rawList = Array.isArray(data.custom_fields) ? data.custom_fields : []
    const fields = rawList.map(mapApiCustomFieldToInternal)
    return { categoryIds, fields }
}

function initExtraDetailsFromFields(fields) {
    const next = {}
    fields.forEach((item) => {
        switch (item.type) {
            case 'checkbox':
            case 'multiselect_dropdown':
                next[item.id] = []
                break
            case 'button':
            case 'dropdown':
            case 'text':
            case 'textbox':
                next[item.id] = ''
                break
            case 'radio':
                next[item.id] = ''
                break
            case 'fileinput':
                next[item.id] = null
                break
            case 'number':
                next[item.id] = ''
                break
            default:
                next[item.id] = ''
                break
        }
    })
    return next
}

function extractEditCustomFieldMap(editItemData) {
    const map = {}
    const customFields = Array.isArray(editItemData?.custom_fields) ? editItemData.custom_fields : []
    customFields.forEach((row) => {
        const customFieldId = row?.id ?? row?.custom_field_id ?? row?.customFieldId
        if (customFieldId == null) return
        const rawValue =
            row?.value ?? row?.custom_field_value?.value ?? row?.custom_field_value ?? null
        if (rawValue == null) return
        map[String(customFieldId)] = rawValue
    })
    return map
}

function motorsStep1KeyFromFieldName(name) {
    const n = String(name || '')
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (n.includes('kilometer') || n.includes('kilometre') || n.includes('mileage')) return 'km'
    return null
}

function isEmptyCustomValue(type, val) {
    if (type === 'checkbox' || type === 'multiselect_dropdown') return !Array.isArray(val) || val.length === 0
    if (type === 'fileinput') return !val
    return String(val ?? '').trim() === ''
}

function isCustomFieldMarkedRequired(field) {
    return field?.required === true || field?.required === 1 || field?.required === '1'
}

function getExtraDetailValue(extraDetails, id) {
    if (!extraDetails || id == null) return undefined
    if (Object.prototype.hasOwnProperty.call(extraDetails, id)) return extraDetails[id]
    const asString = String(id)
    if (Object.prototype.hasOwnProperty.call(extraDetails, asString)) return extraDetails[asString]
    const asNumber = Number(id)
    if (Number.isFinite(asNumber) && Object.prototype.hasOwnProperty.call(extraDetails, asNumber)) {
        return extraDetails[asNumber]
    }
    return undefined
}

function validateCustomFieldsRequired(fields, extraDetails) {
    for (const f of fields) {
        const val = getExtraDetailValue(extraDetails, f.id)
        if (isCustomFieldMarkedRequired(f) && isEmptyCustomValue(f.type, val)) {
            toast.error(`${t('fillDetails') || 'Please fill the details for'} ${f.name}.`)
            return false
        }
        if (isTextualCustomFieldType(f.type)) {
            const ok = validateCustomFieldTextLength({
                name: f.name,
                value: val,
                minLength: f.min_length,
                maxLength: f.max_length,
                asDigits: f.type === 'number',
            })
            if (!ok) return false
        }
    }
    return true
}

function OutlineSelectDropdown({
    id,
    label,
    required,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    defaultLabelInside = false,
}) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const hasValue = !(value === '' || value == null)
    const displayText = options.find((o) => o.value === value)?.label ?? placeholder ?? label
    const isFloating = !defaultLabelInside || hasValue || open

    useEffect(() => {
        if (disabled) setOpen(false)
    }, [disabled])

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    let buttonInner = null
    if (!isFloating) buttonInner = null
    else if (hasValue) buttonInner = <span className="truncate text-[#23262A]">{displayText}</span>
    else if (open)
        buttonInner = (
            <span className="text-[15px] font-[Inter-Regular] text-[#9CA3AF]" aria-hidden>
                |
            </span>
        )
    else buttonInner = <span className={`truncate ${!hasValue ? 'text-[#9CA3AF]' : 'text-[#23262A]'}`}>{displayText}</span>

    return (
        <div ref={rootRef} className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[3] bg-white font-[Inter-Regular] text-[#23262A] transition-[top,transform,font-size,padding-left,padding-right] duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : 'left-[14px] top-1/2 max-w-[calc(100%-48px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <button
                id={id}
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                className={`flex h-[54px] w-full items-center rounded-[8px] bg-white p-[14px] text-left text-[14px] font-[Inter-Regular] outline-none transition-[border-color,colors] duration-200 ${open && !disabled ? 'border border-[#23262A]' : 'border border-[rgba(143,143,143,0.45)]'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
                {buttonInner}
            </button>
            <div className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2">
                <FormDownArrowIcon className={`h-[24px] w-[24px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
            {open && !disabled ? (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(320px,30vh)] overflow-y-auto rounded-[4px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]"
                >
                    {options.map((opt) => (
                        <li key={String(opt.value)} role="presentation">
                            <button
                                type="button"
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => {
                                    onChange(opt.value)
                                    setOpen(false)
                                }}
                                className={`flex w-full cursor-pointer p-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors hover:bg-[#FDF2F2] focus:bg-[#FDF2F2] focus:outline-none ${value === opt.value ? 'bg-[#FEF2F2]' : 'bg-white'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}

function FieldInput({ id, label, required, value, onChange, type = 'text', suffix, inputMode, defaultLabelInside = false, maxLength, numeric = false }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = !defaultLabelInside || hasValue || focused
    const enforceNumeric = numeric || inputMode === 'decimal' || inputMode === 'numeric'

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : suffix
                        ? 'left-[14px] top-1/2 max-w-[calc(100%-80px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-28px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                <input
                    id={id}
                    type={type}
                    inputMode={inputMode || (enforceNumeric ? 'decimal' : undefined)}
                    maxLength={maxLength || undefined}
                    value={value}
                    onChange={(e) => {
                        const next = enforceNumeric ? sanitizeDecimalInput(e.target.value) : e.target.value
                        onChange(next)
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {suffix ? <span className="shrink-0 pr-[14px] text-[12px] font-[Inter-Medium] text-[#666]">{suffix}</span> : null}
            </div>
        </div>
    )
}

function FieldTextArea({ id, label, required, value, onChange, maxLength }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    const len = String(value ?? '').length
    const cap = maxLength ?? DESC_MAX

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto '
                    : 'left-[14px] top-[24px] -translate-y-1/2 px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative rounded-[8px] border bg-white pb-[28px] pt-[18px] transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                <textarea
                    id={id}
                    value={value}
                    maxLength={cap}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={5}
                    className="min-h-[120px] w-full resize-none rounded-[8px] border-0 bg-transparent px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                <span className="pointer-events-none absolute bottom-[8px] right-[12px] text-[12px] font-[Inter-Regular] text-[#9CA3AF]">
                    {len}/{cap}
                </span>
            </div>
        </div>
    )
}

function MultiTagDropdown({ title, required, options, values, onChange }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const hasValue = values.length > 0
    const isFloating = hasValue || open

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    const toggleValue = (opt) => {
        if (values.includes(opt)) onChange(values.filter((v) => v !== opt))
        else onChange([...values, opt])
    }

    return (
        <div ref={rootRef} className="relative">
            <label
                className={`pointer-events-none absolute z-[3] bg-white font-[Inter-Regular] text-[#23262A] transition-[top,transform,font-size,padding-left,padding-right] duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : 'left-[14px] top-1/2 max-w-[calc(100%-48px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {title}
                {required ? <span> *</span> : null}
            </label>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`min-h-[54px] w-full cursor-pointer rounded-[8px] border bg-white p-[8px] pt-[18px] text-left ${open ? 'border-[#DC0000]' : 'border-[rgba(143,143,143,0.45)]'}`}
            >
                <div className="flex min-h-[24px] flex-wrap items-center gap-[8px] pr-[24px]">
                    {values.length ? (
                        values.map((v) => (
                            <div key={v} className="inline-flex items-center gap-[8px] rounded-full bg-[#edeeee] px-[10px] py-[6px]">
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{v}</p>
                                <div
                                    className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#BFC3C9] text-white"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleValue(v)
                                    }}
                                >
                                    <CloseIcon className="h-[8px] w-[8px]" fill="#fff" fillOpacity="1" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <h4 className={`text-[14px] ${open ? 'text-[#9CA3AF]' : 'text-transparent'}`}>{open ? '|' : 'Select options'}</h4>
                    )}
                </div>
                <div className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2">
                    <FormDownArrowIcon className={`h-[20px] w-[20px] ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[220px] overflow-y-auto rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                    {options.map((opt) => {
                        const active = values.includes(opt)
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => toggleValue(opt)}
                                className={`flex w-full cursor-pointer items-center gap-[12px] px-[12px] py-[10px] text-left ${active ? 'bg-[#FDF2F2]' : 'bg-white hover:bg-[#f6f7f8]'}`}
                            >
                                <div
                                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 ${active ? 'border-[#DC0000] bg-[#DC0000]' : 'border-[#8f8f8f] bg-white'}`}
                                >
                                    {active ? <TickIcon className="h-[16px] w-[16px]" fill="#fff" fillOpacity="1" /> : null}
                                </div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{opt}</p>
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

/** Comma-separated root→leaf category ids for `add-item` / `edit-item` (same pattern as other listing forms). */
function buildAllCategoryIds(pathNodes, leafCategory) {
    const nodes =
        Array.isArray(pathNodes) && pathNodes.length > 0
            ? pathNodes
            : leafCategory
              ? [leafCategory]
              : []
    const seen = new Set()
    const ids = []
    for (const n of nodes) {
        const id = n?.category_id ?? n?.id
        if (id == null || id === '') continue
        const s = String(id)
        if (seen.has(s)) continue
        seen.add(s)
        ids.push(s)
    }
    return ids.join(',')
}

/**
 * Motors listing (non-car): core listing fields + `get-customfields-by-category-id` driven extras.
 */
export default function PlaceAdMotorForm({
    parentLabel,
    subtypeLabel,
    onBack,
    leafCategory,
    pathNodes = [],
    editingItemId = null,
    editItemData = null,
}) {
    const router = useRouter()
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const fileInputRef = useRef(null)
    const uploadTimerRef = useRef(null)
    const [step, setStep] = useState(1)

    const [title, setTitle] = useState('')
    const [contact, setContact] = useState('+971521121006')
    const [phoneVisibility, setPhoneVisibility] = useState(null)

    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')
    const [mainPhotoFile, setMainPhotoFile] = useState(null)
    const [existingMainImageUrl, setExistingMainImageUrl] = useState('')
    const [mainPhotoPreview, setMainPhotoPreview] = useState('')
    const [isPhotoUploading, setIsPhotoUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [paymentItemId, setPaymentItemId] = useState(null)

    const [position, setPosition] = useState(() => ({ ...DEFAULT_MAP_CENTER }))
    const mapRef = useRef(null)
    const { isLoaded } = loadGoogleMaps()
    const [mapZoom, setMapZoom] = useState(12)
    const [locationLabel, setLocationLabel] = useState('home')
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationModalMode, setLocationModalMode] = useState('new')
    const [locationQuery, setLocationQuery] = useState('')
    const [streetQuery, setStreetQuery] = useState('')
    const [locationSuggestions, setLocationSuggestions] = useState(LOCATION_SUGGESTIONS)
    const [streetSuggestions, setStreetSuggestions] = useState(LOCATION_SUGGESTIONS)

    const [customFieldsAll, setCustomFieldsAll] = useState([])
    const [extraDetails, setExtraDetails] = useState({})
    const [customFieldsLoading, setCustomFieldsLoading] = useState(false)
    const [customFieldsError, setCustomFieldsError] = useState(null)
    const [categoryIdsFromApi, setCategoryIdsFromApi] = useState([])

    const categoryId = leafCategory?.category_id

    useEffect(() => {
        if (categoryId == null) {
            setCustomFieldsAll([])
            setCategoryIdsFromApi([])
            setExtraDetails({})
            setCustomFieldsLoading(false)
            setCustomFieldsError(null)
            return
        }
        let cancelled = false
        setCustomFieldsLoading(true)
        setCustomFieldsError(null)
        getCustomFieldsApi
            .getCustomFieldsByCategoryId({ category_id: categoryId })
            .then((res) => {
                const { fields, categoryIds } = parseCustomFieldsByCategoryResponse(res)
                if (cancelled) return
                if (fields.length > 0 || !editingItemId) {
                    setCustomFieldsAll(fields)
                }
                setCategoryIdsFromApi(categoryIds)
                if (fields.length > 0 || !editingItemId) {
                    setExtraDetails(initExtraDetailsFromFields(fields))
                }
            })
            .catch((err) => {
                if (!cancelled) setCustomFieldsError(err)
            })
            .finally(() => {
                if (!cancelled) setCustomFieldsLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [categoryId, editingItemId])

    useEffect(() => {
        if (!editingItemId || !editItemData) return
        const item = editItemData || {}
        const itemTitle = String(item?.name || item?.title || '').trim()
        const itemDescription = String(item?.description || '').trim()
        const itemPrice = item?.price != null ? String(item.price) : ''
        const itemContact = String(item?.contact || '').trim()
        const itemLat = Number(item?.latitude)
        const itemLng = Number(item?.longitude)
        const itemAddress = String(item?.address || '').trim()
        const imageUrl = String(item?.image || '').trim()

        setTitle(itemTitle)
        setPrice(itemPrice)
        setDescription(itemDescription)
        setContact(itemContact || PHONE_PREFIX)
        if (Number.isFinite(itemLat) && Number.isFinite(itemLng)) {
            setPosition({ lat: itemLat, lng: itemLng })
        } else {
            setPosition({ ...DEFAULT_MAP_CENTER })
        }
        setLocationQuery(itemAddress)
        setStreetQuery('')
        setLocationLabel(itemAddress ? 'home' : '')
        setMainPhotoFile(null)
        setExistingMainImageUrl(imageUrl)
        setMainPhotoPreview(imageUrl)

        const rawHidePhone = item?.hide_phone_number ?? item?.hide_phone ?? item?.is_phone_hidden
        if (rawHidePhone === true || rawHidePhone === 1 || rawHidePhone === '1' || String(rawHidePhone).toLowerCase() === 'true') {
            setPhoneVisibility('hide')
        } else if (rawHidePhone === false || rawHidePhone === 0 || rawHidePhone === '0' || String(rawHidePhone).toLowerCase() === 'false') {
            setPhoneVisibility('show')
        } else {
            setPhoneVisibility(null)
        }

        const itemCustomFields = getEditItemCustomFields(item)
        if (itemCustomFields.length > 0) {
            setCustomFieldsAll(itemCustomFields)
            setExtraDetails(initExtraDetailsFromFields(itemCustomFields))
        }
    }, [editingItemId, editItemData])

    useEffect(() => {
        if (!editingItemId || !editItemData || customFieldsAll.length === 0) return
        const customFieldValueMap = extractEditCustomFieldMap(editItemData)
        if (Object.keys(customFieldValueMap).length === 0) return

        setExtraDetails((prev) => {
            const next = { ...prev }
            customFieldsAll.forEach((field) => {
                const fieldKey = String(field.id)
                const incomingRaw = customFieldValueMap[fieldKey]
                if (incomingRaw == null) return
                let parsed = incomingRaw
                if (typeof incomingRaw === 'string') {
                    try {
                        parsed = JSON.parse(incomingRaw)
                    } catch {
                        parsed = incomingRaw
                    }
                }

                if (field.type === 'checkbox' || field.type === 'multiselect_dropdown') {
                    if (Array.isArray(parsed)) next[field.id] = parsed.map((v) => String(v))
                    else if (parsed !== '') next[field.id] = [String(parsed)]
                    return
                }
                if (field.type === 'radio' || field.type === 'dropdown' || field.type === 'button') {
                    if (Array.isArray(parsed)) next[field.id] = parsed[0] != null ? String(parsed[0]) : ''
                    else next[field.id] = parsed != null ? String(parsed) : ''
                    return
                }
                if (Array.isArray(parsed)) {
                    next[field.id] = parsed[0] != null ? String(parsed[0]) : ''
                    return
                }
                next[field.id] = parsed != null ? String(parsed) : ''
            })
            return next
        })
    }, [editingItemId, editItemData, customFieldsAll])

    const setCustomFieldValue = (id, value) => {
        setExtraDetails((prev) => ({ ...prev, [id]: value }))
    }

    const renderMotorCustomField = (field) => {
        const { id, name, type, required, values, min_length, max_length } = field
        const val = extraDetails[id]
        const kmSuffix = motorsStep1KeyFromFieldName(name) === 'km'

        switch (type) {
            case 'dropdown':
                return (
                    <OutlineSelectDropdown
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        value={val ?? ''}
                        onChange={(v) => setCustomFieldValue(id, v)}
                        options={(values || []).map((x) => ({ value: x, label: x }))}
                        placeholder={name}
                        defaultLabelInside
                    />
                )
            case 'button': {
                const selected = val == null ? '' : String(val)
                return (
                    <div className="relative">
                        <p className="mb-[10px] text-[14px] font-[Inter-Medium] text-[#23262A]">
                            {name}
                            {required ? <span> *</span> : null}
                        </p>
                        <div className="flex flex-wrap gap-[8px]">
                            {(values || []).map((opt) => {
                                const str = String(opt)
                                const isSel = selected === str
                                return (
                                    <button
                                        key={str}
                                        type="button"
                                        onClick={() => {
                                            if (isSel && !required) setCustomFieldValue(id, '')
                                            else if (!isSel) setCustomFieldValue(id, str)
                                        }}
                                        className={`cursor-pointer rounded-[8px] border p-[4px_10px] text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors ${isSel ? 'border-[#23262A] bg-[#edeeee]' : 'border-[rgba(143,143,143,0.45)] bg-white'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            }
            case 'text':
                return (
                    <FieldInput
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        type="text"
                        value={val ?? ''}
                        onChange={(v) => setCustomFieldValue(id, v)}
                        suffix={kmSuffix ? 'km' : undefined}
                        defaultLabelInside
                        maxLength={max_length || undefined}
                    />
                )
            case 'number':
                return (
                    <FieldInput
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        type="text"
                        inputMode="decimal"
                        value={val ?? ''}
                        onChange={(v) => setCustomFieldValue(id, v)}
                        suffix={kmSuffix ? 'km' : undefined}
                        defaultLabelInside
                        maxLength={max_length || undefined}
                    />
                )
            case 'textbox':
                return (
                    <FieldTextArea
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        value={val ?? ''}
                        maxLength={max_length || DESC_MAX}
                        onChange={(v) => setCustomFieldValue(id, v)}
                    />
                )
            case 'multiselect_dropdown': {
                const selected = Array.isArray(val) ? val : []
                return (
                    <MultiTagDropdown title={name} required={!!required} options={values || []} values={selected} onChange={(next) => setCustomFieldValue(id, next)} />
                )
            }
            case 'checkbox':
                return (
                    <div className="flex flex-col gap-[10px]">
                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">
                            {name}
                            {required ? <span> *</span> : null}
                        </p>
                        {(values || []).map((opt) => (
                            <label key={opt} className="flex cursor-pointer items-center gap-[10px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                <input
                                    type="checkbox"
                                    checked={Array.isArray(val) && val.includes(opt)}
                                    onChange={(e) => {
                                        const cur = Array.isArray(val) ? val : []
                                        if (e.target.checked) setCustomFieldValue(id, [...cur, opt])
                                        else setCustomFieldValue(id, cur.filter((x) => x !== opt))
                                    }}
                                    className="h-[16px] w-[16px] accent-[#DC0000]"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )
            case 'radio':
                return (
                    <div className="flex flex-col gap-[10px]">
                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">
                            {name}
                            {required ? <span> *</span> : null}
                        </p>
                        {(values || []).map((opt) => (
                            <label key={opt} className="flex cursor-pointer items-center gap-[10px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                <input
                                    type="radio"
                                    name={`cf-radio-${id}`}
                                    checked={String(val) === String(opt)}
                                    onChange={() => setCustomFieldValue(id, opt)}
                                    className="h-[16px] w-[16px] accent-[#DC0000]"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )
            case 'fileinput':
                return (
                    <div className="relative">
                        <p className="mb-[10px] text-[14px] font-[Inter-Medium] text-[#23262A]">
                            {name}
                            {required ? <span> *</span> : null}
                        </p>
                        <input
                            type="file"
                            className="w-full text-[14px] font-[Inter-Regular] text-[#23262A]"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) setCustomFieldValue(id, f)
                            }}
                        />
                        {val instanceof File ? <p className="mt-[6px] text-[12px] font-[Inter-Regular] text-[#6B7280]">{val.name}</p> : null}
                    </div>
                )
            default:
                return (
                    <FieldInput
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        type="text"
                        value={val ?? ''}
                        onChange={(v) => setCustomFieldValue(id, v)}
                        defaultLabelInside
                    />
                )
        }
    }

    const getPredictions = (inputValue, setter) => {
        const text = String(inputValue || '').trim()
        if (!text || typeof window === 'undefined' || !window.google?.maps?.places?.AutocompleteService) {
            setter([])
            return
        }
        const service = new window.google.maps.places.AutocompleteService()
        service.getPlacePredictions(
            { input: text, componentRestrictions: { country: 'ae' } },
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
        const timer = setTimeout(() => {
            if (!String(locationQuery || '').trim()) {
                setLocationSuggestions(LOCATION_SUGGESTIONS)
                return
            }
            getPredictions(locationQuery, setLocationSuggestions)
        }, 180)
        return () => clearTimeout(timer)
    }, [locationQuery])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!String(streetQuery || '').trim()) {
                setStreetSuggestions(LOCATION_SUGGESTIONS)
                return
            }
            getPredictions(streetQuery, setStreetSuggestions)
        }, 180)
        return () => clearTimeout(timer)
    }, [streetQuery])

    const applyPlaceSelection = (prediction, assignText) => {
        const placeId = prediction?.place_id
        if (!placeId || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return
        const geocoder = new window.google.maps.Geocoder()
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
            const lat = top?.geometry?.location?.lat?.()
            const lng = top?.geometry?.location?.lng?.()
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setPosition({ lat, lng })
                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng })
                    mapRef.current.setZoom(14)
                }
            }
        })
    }

    const zoomIn = () => {
        setMapZoom((z) => Math.min(20, z + 1))
        if (mapRef.current) mapRef.current.setZoom(Math.min(20, mapRef.current.getZoom() + 1))
    }

    const zoomOut = () => {
        setMapZoom((z) => Math.max(3, z - 1))
        if (mapRef.current) mapRef.current.setZoom(Math.max(3, mapRef.current.getZoom() - 1))
    }

    const handleMapCoordsSelect = (lat, lng) => {
        void fillLocationFieldsFromMapCoords({
            lat,
            lng,
            setPosition,
            setLocationQuery,
            setStreetQuery,
        })
    }

    const locateMe = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                handleMapCoordsSelect(next.lat, next.lng)
                if (mapRef.current) {
                    mapRef.current.panTo(next)
                    mapRef.current.setZoom(14)
                }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }

    const handleOpenLocationModal = () => {
        setLocationModalMode('new')
        setLocationLabel('new')
        setShowLocationModal(true)
    }

    const handleEditLocationModal = () => {
        setLocationModalMode('edit')
        setLocationLabel('home')
        setShowLocationModal(true)
    }

    const handleSaveLocationModal = () => {
        setShowLocationModal(false)
    }

    const goNextFrom1 = async (e) => {
        e.preventDefault()
        if (submitting) return

        if (categoryId == null) {
            toast.error('Category is missing. Please try again.')
            return
        }
        if (customFieldsLoading) {
            toast.error(t('pleaseWait') || 'Please wait for fields to load.')
            return
        }
        if (customFieldsError) {
            toast.error(t('somethingWentWrong') || 'Could not load category fields. Please try again.')
            return
        }
        if (customFieldsAll.length > 0 && !validateCustomFieldsRequired(customFieldsAll, extraDetails)) {
            return
        }

        const allCategoryIds =
            categoryIdsFromApi.length > 0 ? categoryIdsFromApi.join(',') : buildAllCategoryIds(pathNodes, leafCategory) || String(categoryId)

        if (!String(title || '').trim()) {
            toast.error('Please enter title.')
            return
        }
        if (!String(price || '').trim()) {
            toast.error('Please enter price.')
            return
        }
        if (!String(description || '').trim()) {
            toast.error('Please enter description.')
            return
        }
        if (isPhoneBareCountryCode(contact)) {
            toast.error('Please enter contact number.')
            return
        }
        if (phoneVisibility === null) {
            toast.error('Please choose whether to show or hide your phone number.')
            return
        }
        if (!mainPhotoFile && !existingMainImageUrl) {
            toast.error('Please upload main photo.')
            return
        }

        const lat = Number(position?.lat)
        const lng = Number(position?.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            toast.error('Invalid map location.')
            return
        }

        const transformedCustomFields = {}
        const customFieldFiles = []
        Object.entries(extraDetails).forEach(([key, value]) => {
            if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
                customFieldFiles.push({ key, files: value })
            } else if (value !== '' && value !== null && value !== undefined) {
                const currentField = customFieldsAll.find((cf) => String(cf.id) === String(key))
                const isNumberField = currentField?.type === 'number'
                if (isNumberField) {
                    const vals = Array.isArray(value) ? value : [value]
                    const numericValues = vals.map((v) => Number(v)).filter((n) => Number.isFinite(n))
                    if (numericValues.length > 0) {
                        transformedCustomFields[key] = numericValues
                    }
                    return
                }
                transformedCustomFields[key] = Array.isArray(value) ? value : [value]
            }
        })

        const addressLine = [streetQuery, locationQuery].map((s) => String(s || '').trim()).filter(Boolean).join(', ')
        const resolvedLocation = await resolveListingLocation({
            lat,
            lng,
            addressLine,
            placeApiKey: settings?.place_api_key,
        })
        const locationParts = resolveAreaAndBuilding({
            locationQuery,
            streetQuery,
            country: resolvedLocation.country,
            state: resolvedLocation.state,
            city: resolvedLocation.city,
            address: resolvedLocation.address || addressLine,
        })

        const payload = {
            name: String(title).trim(),
            slug: generateSlug(String(title).trim()),
            description: String(description).trim(),
            category_id: categoryId,
            all_category_ids: allCategoryIds,
            price: String(price).replace(/,/g, '').trim(),
            contact: String(contact).trim(),
            hide_phone_number: phoneVisibility === 'hide',
            custom_fields: Object.keys(transformedCustomFields).length > 0 ? transformedCustomFields : undefined,
            image: mainPhotoFile || undefined,
            latitude: lat,
            longitude: lng,
            address: resolvedLocation.address || addressLine || undefined,
            country: resolvedLocation.country || undefined,
            state: resolvedLocation.state || undefined,
            city: resolvedLocation.city || undefined,
            area: locationParts.area || undefined,
            building: locationParts.building || undefined,
            custom_field_files: customFieldFiles.length > 0 ? customFieldFiles : undefined,
        }

        try {
            setSubmitting(true)
            const res = editingItemId
                ? await editItemApi.editItem({
                    ...payload,
                    id: editingItemId,
                })
                : await addItemApi.addItem(payload)
            if (res?.data?.error === false) {
                const payloadData = res?.data?.data
                const nextItemId =
                    editingItemId ||
                    payloadData?.id ||
                    payloadData?.item_id ||
                    payloadData?.item?.id ||
                    (Array.isArray(payloadData) ? payloadData?.[0]?.id || payloadData?.[0]?.item_id : null)
                if (!nextItemId) {
                    toast.error('Item created, but item_id is missing in response.')
                    return
                }
                if (editingItemId && !shouldShowPlanPaymentAfterEdit(editItemData)) {
                    toast.success(res?.data?.message || t('success') || 'Success')
                    router.push('/myads')
                    return
                }
                setPaymentItemId(nextItemId)
                setStep(2)
                return
            }
            toast.error(res?.data?.message || 'Unable to create listing.')
        } catch (error) {
            console.error(error)
            toast.error('Unable to create listing.')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        return () => {
            if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        }
    }, [mainPhotoPreview])

    useEffect(() => {
        return () => {
            if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
        }
    }, [])

    const clearMainPhoto = () => {
        if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current)
            uploadTimerRef.current = null
        }
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        setMainPhotoFile(null)
        setExistingMainImageUrl('')
        setMainPhotoPreview('')
        setIsPhotoUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePhotoInputChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current)
            uploadTimerRef.current = null
        }
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)

        const previewUrl = URL.createObjectURL(selectedFile)
        setMainPhotoFile(selectedFile)
        setMainPhotoPreview(previewUrl)
        setIsPhotoUploading(true)

        uploadTimerRef.current = setTimeout(() => {
            setIsPhotoUploading(false)
            uploadTimerRef.current = null
        }, 2600)
    }

    if (step === 2) {
        return (
            <SelectPackageOrder
                itemId={paymentItemId}
                onConfirm={() => {
                    setStep(3)
                }}
            />
        )
    }

    if (step === 3) {
        return <PostAdPaymentSuccessPage isCarsCategory={false} />
    }

    return (
        <div className="relative mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
            <div className="mb-[12px] text-center">
                <h1 className="mb-[14px] text-center text-[20px] font-[Inter-Bold] text-[#23262A]">You&apos;re almost there!</h1>
                <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A]">Include as much details and pictures as possible!</p>
            </div>

            <div className="mb-[12px] flex items-center gap-[6px]">
                {editingItemId ? (
                    <span className="font-[Inter-Regular] text-[14px] text-[#23262A]">{parentLabel}</span>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            if (onBack) {
                                onBack()
                                return
                            }
                            setStep(1)
                        }}
                        className="cursor-pointer font-[Inter-Regular] text-[14px] text-[#3a88ef]"
                    >
                        {parentLabel}
                    </button>
                )}
                <RightArrowIcon className="h-[14px] w-[14px]" />
                <h4 className="font-[Inter-Regular] text-[14px] leading-[20px] text-[#23262A]">{subtypeLabel}</h4>
            </div>

            <form onSubmit={goNextFrom1} className="relative flex flex-col gap-[24px] pb-[100px]">
                <FieldInput id="mc-title" label="Title" required value={title} onChange={setTitle} defaultLabelInside />
                <div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoInputChange} />
                    {mainPhotoPreview ? (
                        <div className="mb-[16px]">
                            {isPhotoUploading ? (
                                <div className="flex items-center gap-[12px] py-[4px]">
                                    <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[2px] border border-[rgba(143,143,143,0.35)] bg-white p-[3px]">
                                        <img src={mainPhotoPreview} alt="Main" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="h-[4px] flex-1 rounded-full bg-[#F3D1D1]">
                                        <div className="h-full w-full animate-pulse rounded-full bg-[#DC0000]" />
                                    </div>
                                    <button type="button" onClick={clearMainPhoto} className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center" aria-label="Remove photo">
                                        <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative mx-auto h-[128px] w-[200px]">
                                    <button
                                        type="button"
                                        onClick={clearMainPhoto}
                                        className="absolute -right-[6px] -top-[6px] z-[2] flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border border-[rgba(35,38,42,0.35)] bg-white"
                                        aria-label="Remove photo"
                                    >
                                        <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                    </button>
                                    <div className="h-[120px] w-[200px] overflow-hidden rounded-[2px]">
                                        <img src={mainPhotoPreview} alt="Main" className="h-full w-full object-cover" />
                                    </div>
                                    <p className="absolute bottom-0 left-0 right-0 mx-auto w-fit rounded-[6px] border border-[rgba(35,38,42,0.3)] bg-white p-[8px_10px] text-center text-[14px] leading-none text-[#23262A]">
                                        Main photo
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] border border-[#DC0000] bg-white">
                        <CameraIcon className="h-[24px] w-[24px]" />
                        <p className="font-[Inter-SemiBold] text-[14px] leading-[20px] text-[#DC0000]">Add Pictures</p>
                    </button>
                </div>
                <PlaceAdPhoneField id="mc-contact" label="Contact number" required value={contact} onChange={setContact} />
                <div>
                    <div className="mx-auto mb-[14px] w-[400px] max-sm:w-full">
                        <p className="text-center text-[18px] font-[Inter-SemiBold] leading-[1.2] text-[#23262A]">
                            Do you want to show or hide your phone number?
                            <Image src={infoIcon} alt="" width={18} height={18} className="ml-[4px] inline-flex" />
                        </p>
                    </div>
                    <div className="flex gap-[12px]">
                        <button
                            type="button"
                            onClick={() => setPhoneVisibility('show')}
                            className={`flex-1 cursor-pointer rounded-[8px] border p-[14px_16px] text-[14px] font-[Inter-SemiBold] transition-colors ${phoneVisibility === 'show' ? 'border-[#23262A] bg-[#23262A] text-white' : 'border-[#f6f7f8] bg-[#f6f7f8] text-[#23262A]'
                                }`}
                        >
                            Show Phone
                        </button>
                        <button
                            type="button"
                            onClick={() => setPhoneVisibility('hide')}
                            className={`flex-1 cursor-pointer rounded-[8px] border p-[14px_16px] text-[14px] font-[Inter-SemiBold] transition-colors ${phoneVisibility === 'hide' ? 'border-[#23262A] bg-[#23262A] text-white' : 'border-[#f6f7f8] bg-[#f6f7f8] text-[#23262A]'
                                }`}
                        >
                            Hide Phone
                        </button>
                    </div>
                </div>
                <FieldInput id="mc-price" label="Price" required type="text" inputMode="decimal" value={price} onChange={setPrice} suffix="AED" defaultLabelInside />
                <FieldTextArea id="mc-desc" label="Description" required value={description} onChange={setDescription} maxLength={DESC_MAX} />

                {customFieldsLoading ? (
                    <p className="py-[8px] text-center text-[14px] font-[Inter-Regular] text-[#666]">Loading category fields…</p>
                ) : customFieldsError ? (
                    <p className="py-[8px] text-center text-[14px] font-[Inter-Regular] text-[#DC0000]">Could not load category fields.</p>
                ) : (
                    customFieldsAll.map((field) => <div key={field.id}>{renderMotorCustomField(field)}</div>)
                )}

                <div className="rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                    {locationLabel === 'home' ? (
                        <>
                            <div className="mb-[10px] flex items-center justify-between">
                                <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">Home</h3>
                                <button type="button" onClick={handleEditLocationModal} className="flex cursor-pointer items-center gap-[8px]">
                                    <Image src={edit} alt="" width={14} height={14} />
                                    <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Edit</p>
                                </button>
                            </div>
                            <p className="mb-[12px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                {[streetQuery, locationQuery].map((v) => String(v || '').trim()).filter(Boolean).join(' - ') || 'No location selected'}
                            </p>
                            <div className="relative mb-[14px] h-[350px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-[#f6f7f8]">
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
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: false,
                                            clickableIcons: false,
                                            draggable: false,
                                            zoomControl: false,
                                            disableDoubleClickZoom: true,
                                            keyboardShortcuts: false,
                                        }}
                                    >
                                        <Marker position={position} />
                                    </GoogleMap>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[12px] font-[Inter-Regular] text-[#6B7280]">
                                        Loading map...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="mb-[16px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Select Location</h3>
                            <div className="mb-[16px]">
                                <AutocompleteField
                                    id="mc-locate"
                                    label="Locate your motorcycle"
                                    value={locationQuery}
                                    onChange={setLocationQuery}
                                    suggestions={locationSuggestions}
                                    onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setLocationQuery)}
                                />
                            </div>
                            <div className="mb-[16px]">
                                <AutocompleteField
                                    id="mc-street"
                                    label="Building or Street name"
                                    value={streetQuery}
                                    onChange={setStreetQuery}
                                    suggestions={streetSuggestions}
                                    onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setStreetQuery)}
                                />
                            </div>
                            <h3 className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Is the pin in the right location?</h3>
                            <p className="mb-[12px] text-[12px] font-[Inter-Regular] leading-[22px] text-[#6B7280]">
                                Click and drag the pin to the exact spot. Users are more likely to respond to ads that are correctly shown on the map.
                            </p>
                            <div className="relative mb-[14px] h-[280px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)]">
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
                                    <div className="absolute inset-0 flex items-center justify-center text-[12px] font-[Inter-Regular] text-[#6B7280]">
                                        Loading map...
                                    </div>
                                )}

                                <div className="absolute left-[12px] top-[12px] overflow-hidden rounded-[6px] bg-white shadow-[0_0px_0px_2px_rgba(0,0,0,0.1)]">
                                    <button
                                        type="button"
                                        onClick={zoomIn}
                                        className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center border-b border-[rgba(35,38,42,0.2)]"
                                        aria-label="Zoom in"
                                    >
                                        <Image src={plus} alt="" width={26} height={26} />
                                    </button>
                                    <button type="button" onClick={zoomOut} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center" aria-label="Zoom out">
                                        <Image src={minus} alt="" width={26} height={26} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={locateMe}
                                    className="absolute bottom-[12px] right-[12px] flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[#23262A] bg-white p-[6px_12px]"
                                >
                                    <LocationIcon className="h-[16px] w-[16px]" fill="#23262A" fillOpacity="1" stroke="#000" strokeOpacity="1" />
                                    <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Locate Me</p>
                                </button>
                            </div>
                        </>
                    )}
                    <div className="mb-[6px] flex flex-wrap gap-[8px]">
                        <button
                            type="button"
                            onClick={handleOpenLocationModal}
                            className={`flex cursor-pointer items-center gap-[8px] rounded-[8px] border p-[8px_12px] ${locationLabel === 'new' ? 'border-[#DC0000] bg-[#FEF2F2]' : 'border-[#DC0000] bg-white'}`}
                        >
                            <Image src={plusicon} alt="" width={13} height={13} />
                            <p className="text-[14px] font-[Inter-Medium] text-[#DC0000]">New Location</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocationLabel((prev) => (prev === 'home' ? '' : 'home'))}
                            className={`flex cursor-pointer items-center gap-[8px] rounded-[8px] border p-[8px_12px] ${locationLabel === 'home' ? 'border-[rgba(0,0,0,0.08)] bg-[#00000014]' : 'border-[#23262A] bg-white'}`}
                        >
                            <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Home</p>
                            {locationLabel === 'home' ? <CloseIcon className="h-[8px] w-[8px]" fill="#6B7280" fillOpacity="1" /> : null}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-[6px] rounded-[8px] bg-[#F3F4F6] p-[14px]">
                    <div className="flex items-start gap-[8px]">
                        <Image src={infoIcon} alt="" width={24} height={24} />
                        <p className="mb-[8px] text-[14px] font-[Inter-Regular] text-[#6B7280]">
                            Your ad will be rejected if it does not comply with our{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                posting guidelines.
                            </Link>{' '}
                            Got questions?{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                email us.
                            </Link>
                        </p>
                    </div>
                    <div className="flex items-start gap-[8px]">
                        <TermsInfoIcon className="h-[24px] w-[24px] shrink-0" fill="#7b8385" fillOpacity="1" />
                        <p className="text-[14px] font-[Inter-Regular] text-[#6B7280]">
                            By proceeding, I confirm that I have reviewed the information provided above and confirm that such information is complete and accurate.{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                Terms &amp; conditions.
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-[100] mx-auto flex w-[478px] max-sm:w-full flex-col gap-[10px] bg-white p-[20px]">
                    <button type="submit" disabled={submitting || customFieldsLoading} className="w-full cursor-pointer rounded-[8px] bg-[#DC0000] py-[14px] text-[14px] font-[Inter-Regular] text-white transition-opacity disabled:opacity-60">
                        {submitting ? 'Please wait...' : 'Next'}
                    </button>
                </div>
            </form>
            <LocationDetailsModal
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
                modalMode={locationModalMode}
            />
        </div>
    )
}
