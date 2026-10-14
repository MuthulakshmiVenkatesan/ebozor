'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { RightArrowIcon, FormDownArrowIcon, CloseIcon, CameraIcon, TickIcon, TermsInfoIcon } from '@/components/CustomFile/icons'
import { generateSlug, loadGoogleMaps, t } from '@/utils'
import {
    isTextualCustomFieldType,
    normalizeCustomFieldLength,
    normalizeCustomFieldRequired,
    validateCustomFieldTextLength,
} from '@/utils/placeAdCustomFields'
import { fieldsFromPlaceSelection, fillLocationFieldsFromMapCoords, resolveAreaAndBuilding } from '@/utils/listingLocation'
import Api from '@/api/AxiosInterceptors'
import { addItemApi, editItemApi, getCustomFieldsApi } from '@/utils/api'
import { shouldShowPlanPaymentAfterEdit } from '@/utils/productPromotionBadge'
import toast from 'react-hot-toast'
import { settingsData } from '@/redux/reuducer/settingSlice'
import LocationDetailsModal from '../components/LocationDetailsModal'
// import SelectPackage from '../Payment/SelectPackage'
// import SelectPackagePage from '../Payment/SelectPackagePage'
import SelectPackageOrderCar from '../Payment/SelectPackageOrderCar'
import PostAdPaymentSuccessPage from '../Payment/PostAdPaymentSuccessPage'
import PlaceAdPhoneField from '../components/PlaceAdPhoneField'
import { isPhoneBareCountryCode, sanitizeDecimalInput } from '@/utils/placeAdNumericInput'
import plusicon from '../../../../../public/assets/img/icons/plusicon.svg'
import edit from '../../../../../public/assets/img/icons/edit.svg'
import infoIcon from '../../../../../public/assets/img/icons/info.svg'

/** Matches `SelectPackage.jsx` — used for checkout totals. */
// const MOTORS_CHECKOUT_PACKAGE_BY_ID = {
//     lite: { name: 'Lite', priceAed: 69 },
//     basic: { name: 'Basic', priceAed: 109 },
//     extended: { name: 'Extended', priceAed: 139 },
// }

/** Matches `SelectPackage.jsx` — used for checkout totals. */
// const MOTORS_CHECKOUT_PACKAGE_BY_ID = {
//     lite: { name: 'Lite', priceAed: 69 },
//     basic: { name: 'Basic', priceAed: 109 },
//     extended: { name: 'Extended', priceAed: 139 },
// }

/** Order and labels aligned with ebozor-style emirate picker. */
const EMIRATE_OPTIONS = [
    'Dubai',
    'Abu Dhabi',
    'Ras al Khaimah',
    'Sharjah',
    'Fujairah',
    'Ajman',
    'Umm al Quwain',
    'Al Ain',
]
const PHONE_PREFIX = '+971'
const DESC_MAX = 16000
const LOCATION_SUGGESTIONS = [
    'Jumeirah Village Circle (JVC) ( Dubai )',
    'Business Bay ( Dubai )',
    'Dubai Marina ( Dubai )',
    'Al Helio ( Ajman )',
    'Al Helio 2 ( Al Helio, Ajman )',
    'Al Yasmeen ( Ajman )',
]

const MOTORS_STEP1_ORDER = ['regional', 'year', 'km', 'body']

/** Map API custom field row → internal shape (same rules as PlaceAdUniversalListingForm). */
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
            row?.value ??
            row?.custom_field_value?.value ??
            row?.custom_field_value ??
            null
        if (rawValue == null) return
        map[String(customFieldId)] = rawValue
    })
    return map
}

/** Which of the four “first page” motors fields this custom field represents (by label). */
function motorsStep1KeyFromFieldName(name) {
    const n = String(name || '')
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (n.includes('regional') && n.includes('spec')) return 'regional'
    if (n === 'year' || n.startsWith('year ')) return 'year'
    if (n.includes('kilometer') || n.includes('kilometre') || n.includes('mileage')) return 'km'
    if (n.includes('body') && n.includes('type')) return 'body'
    return null
}

/**
 * Step 1 = first matching API field per slot (regional / year / km / body).
 * Step 2 = every other custom field from the same API response (`id` not in step 1).
 */
function partitionMotorsCustomFields(fields) {
    const byKey = { regional: null, year: null, km: null, body: null }
    for (const f of fields) {
        const k = motorsStep1KeyFromFieldName(f.name)
        if (!k) continue
        if (!byKey[k]) byKey[k] = f
    }
    const step1Fields = MOTORS_STEP1_ORDER.map((key) => byKey[key]).filter(Boolean)
    const step1Ids = new Set(step1Fields.map((f) => f.id))
    const step2Fields = fields.filter((f) => !step1Ids.has(f.id))
    return { step1Fields, step2Fields }
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

/** Google Geocode `results[]` → country / state / city / formatted address (same as PlaceAdUniversalListingForm). */
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

const UAE_EMIRATE_NAMES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']

function inferLocationFromEnteredText(locationQuery, streetQuery) {
    const combined = `${String(locationQuery || '')} ${String(streetQuery || '')}`
    const lower = combined.toLowerCase()
    if (!combined.trim()) return { country: '', state: '', city: '' }

    for (const em of UAE_EMIRATE_NAMES) {
        if (lower.includes(em.toLowerCase())) {
            return { country: 'United Arab Emirates', state: em, city: em }
        }
    }
    return { country: '', state: '', city: '' }
}

async function resolveListingLocation({ lat, lng, addressLine, locationQuery, streetQuery, placeApiKey }) {
    const line = String(addressLine || '').trim()
    const out = {
        country: '',
        state: '',
        city: '',
        address: line,
    }

    if (placeApiKey) {
        try {
            const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: { latlng: `${lat},${lng}`, key: placeApiKey },
            })
            if (data.error_message) {
                toast.error(data.error_message)
            } else if (data.status === 'OK' && data.results?.length) {
                const p = parseGeocodeResults(data.results)
                out.country = p.country
                out.state = p.state
                out.city = p.city
                if (!out.address && p.formattedAddress) out.address = p.formattedAddress
            }
        } catch (e) {
            console.error(e)
        }

        if (line && (!out.city || !out.country)) {
            try {
                const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: { address: line, key: placeApiKey },
                })
                if (data.error_message) {
                    toast.error(data.error_message)
                } else if (data.status === 'OK' && data.results?.length) {
                    const p = parseGeocodeResults(data.results)
                    if (!out.country) out.country = p.country
                    if (!out.state) out.state = p.state
                    if (!out.city) out.city = p.city
                    if (!out.address) out.address = p.formattedAddress || line
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    if (!out.country || !out.city) {
        const inferred = inferLocationFromEnteredText(locationQuery, streetQuery)
        if (!out.country) out.country = inferred.country
        if (!out.state) out.state = inferred.state
        if (!out.city) out.city = inferred.city
    }

    return out
}

function FormFooter() {
    return (
        <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A]">
            Questions? Call{' '}
            <a href="tel:80038299453" className="font-[Inter-Medium] text-[#3a88ef]">
                800 Ebozor
            </a>
        </p>
    )
}

/**
 * Outlined select with optional “label inside until open/value” (Material-style jump to top border).
 * When `defaultLabelInside`: empty + closed → label centered in field; open or selected → small label on border.
 */
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
    searchable = false,
    searchPlaceholder = 'Search...',
    loading = false,
    loadingText = 'Loading...',
    noOptionsText = 'No options found',
}) {
    const [open, setOpen] = useState(false)
    const [searchText, setSearchText] = useState('')
    const rootRef = useRef(null)
    const searchInputRef = useRef(null)

    const hasValue = !(value === '' || value == null)
    const displayText = options.find((o) => o.value === value)?.label ?? placeholder ?? label
    const isFloating = !defaultLabelInside || hasValue || open || loading

    useEffect(() => {
        if (disabled) setOpen(false)
    }, [disabled])

    useEffect(() => {
        if (!open) {
            setSearchText('')
            return
        }
        if (searchable) setSearchText('')
    }, [open, searchable])

    useEffect(() => {
        if (open && searchable && searchInputRef.current) searchInputRef.current.focus()
    }, [open, searchable])

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false)
            }
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
    if (loading) {
        buttonInner = <span className="block w-full text-center text-[#9CA3AF]">{loadingText}</span>
    } else if (!isFloating) {
        buttonInner = null
    } else if (hasValue) {
        buttonInner = <span className="truncate text-[#23262A]">{displayText}</span>
    } else if (open) {
        buttonInner = (
            <span className="text-[15px] font-[Inter-Regular] text-[#9CA3AF]" aria-hidden>
                |
            </span>
        )
    } else {
        buttonInner = (
            <span className={`truncate ${!hasValue ? 'text-[#9CA3AF]' : 'text-[#23262A]'}`}>{displayText}</span>
        )
    }

    const filteredOptions = searchable
        ? options.filter((opt) => String(opt.label).toLowerCase().includes(searchText.trim().toLowerCase()))
        : options

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
            <div
                id={id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => {
                    if (!disabled) setOpen((o) => !o)
                }}
                onKeyDown={(e) => {
                    if (disabled) return
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setOpen((o) => !o)
                    } else if (e.key === 'Escape') {
                        setOpen(false)
                    }
                }}
                className={`flex w-full items-center rounded-[8px] bg-white h-[54px] p-[14px_14px] text-left rtl:text-right text-[14px] font-[Inter-Regular] outline-none transition-[border-color,colors] duration-200 ${open && !disabled ? 'border border-[#23262A]' : 'border border-[rgba(143,143,143,0.45)]'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
                {searchable && open ? (
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchText}
                        disabled={loading}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-full w-full border-0 bg-transparent p-0 text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                    />
                ) : (
                    buttonInner
                )}
            </div>
            <div className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 rtl:left-[14px] rtl:right-auto">
                <FormDownArrowIcon className={`h-[24px] w-[24px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && !disabled ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[4px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
                    <ul role="listbox" className="max-h-[min(320px,30vh)] overflow-y-auto">
                        {loading ? (
                            <li className="px-[10px] py-[12px] text-[14px] font-[Inter-Regular] text-[#9CA3AF]">{loadingText}</li>
                        ) : filteredOptions.length ? (
                            filteredOptions.map((opt) => (
                                <li key={String(opt.value)} role="presentation">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={value === opt.value}
                                        onClick={() => {
                                            onChange(opt.value)
                                            setSearchText('')
                                            setOpen(false)
                                        }}
                                        className={`flex w-full cursor-pointer p-[10px] text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors hover:bg-[#FDF2F2] focus:bg-[#FDF2F2] focus:outline-none ${value === opt.value ? 'bg-[#FEF2F2]' : 'bg-white'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-[10px] py-[12px] text-[14px] font-[Inter-Regular] text-[#9CA3AF]">{noOptionsText}</li>
                        )}
                    </ul>
                </div>
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
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-[top,transform,font-size,padding,max-width] duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : suffix
                        ? 'left-[14px] top-1/2 max-w-[calc(100%-80px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-28px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span className=""> *</span> : null}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused ? 'border-[#DC0000]' : 'border-[rgba(143,143,143,0.45)]'
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
                {suffix ? (
                    <span className="shrink-0 pr-[14px] text-[12px] font-[Inter-Medium] text-[#666] rtl:pl-[14px] rtl:pr-0">{suffix}</span>
                ) : null}
            </div>
        </div>
    )
}

function FieldTextArea({ id, label, required, value, onChange, maxLength }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    const len = String(value ?? '').length

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                    : 'left-[14px] top-[24px] -translate-y-1/2 px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span className=""> *</span> : null}
            </label>
            <div
                className={`relative rounded-[8px] border bg-white pb-[28px] pt-[18px] transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                <textarea
                    id={id}
                    value={value}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={5}
                    className="min-h-[200px] w-full resize-none rounded-[8px] border-0 bg-transparent px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                <span className="pointer-events-none absolute bottom-[8px] right-[12px] text-[12px] font-[Inter-Regular] text-[#9CA3AF]">
                    {len}/{maxLength}
                </span>
            </div>
        </div>
    )
}

function AutocompleteField({ id, label, value, onChange, suggestions = [], onSuggestionPick }) {
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

    return (
        <div ref={rootRef} className="relative">
            <label className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto' : 'left-[14px] top-1/2 max-w-[calc(100%-88px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'}`}>
                {label}
            </label>
            <div className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused || open ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'}`}>
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
                <span className="shrink-0 pr-[14px] text-[12px] rtl:pl-[14px] rtl:pr-0 font-[Inter-Regular] text-[#9CA3AF]">Optional</span>
            </div>
            {open && focused ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[8px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.14),0_2px_10px_rgba(0,0,0,0.08)]">
                    <ul className="max-h-[220px] overflow-y-auto py-[6px]">
                        {filtered.map((item) => {
                            const text = suggestionLabel(item)
                            const key = typeof item === 'string' ? item : item.place_id || text
                            return (
                                <li key={key}>
                                    <button
                                        type="button"
                                        className="flex w-full cursor-pointer px-[14px] py-[10px] text-left rtl:text-right text-[14px] hover:bg-[#F3F4F6]"
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
                        })}
                    </ul>
                </div>
            ) : null}
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
                className={`cursor-pointer w-full min-h-[54px] rounded-[8px] border bg-white p-[8px] pt-[18px] text-left rtl:text-right ${open ? 'border-[#DC0000]' : 'border-[rgba(143,143,143,0.45)]'}`}
            >
                <div className="flex min-h-[24px] flex-wrap items-center gap-[8px] pr-[24px]">
                    {values.length ? values.map((v) => (
                        <div key={v} className="inline-flex items-center gap-[8px] rounded-full bg-[#edeeee] px-[10px] py-[6px]">
                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{v}</p>
                            <div
                                className="cursor-pointer flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#BFC3C9] text-white"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleValue(v)
                                }}
                            >
                                <CloseIcon className="h-[8px] w-[8px]" fill="#fff" fillOpacity="1" />
                            </div>
                        </div>
                    )) : <h4 className={`text-[14px] ${open ? 'text-[#9CA3AF]' : 'text-transparent'}`}>{open ? '|' : 'Select options'}</h4>}
                </div>
                <div className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 rtl:left-[14px] rtl:right-auto">
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
                                className={`cursor-pointer flex w-full items-center gap-[12px] px-[12px] py-[10px] text-left rtl:text-right ${active ? 'bg-[#FDF2F2]' : 'bg-white hover:bg-[#f6f7f8]'}`}
                            >
                                <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 ${active ? 'border-[#DC0000] bg-[#DC0000]' : 'border-[#8f8f8f] bg-white'}`}>
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

/**
 * Single-form Motors → Cars listing flow (ebozor-style).
 */
export default function PlaceAdMotorsCarForm({ onBackToSubcategories, leafCategory, editingItemId = null, editItemData = null }) {
    const router = useRouter()
    const settings = useSelector(settingsData)
    const fileInputRef = useRef(null)
    const uploadTimerRef = useRef(null)
    const [step, setStep] = useState(1)
    const [finalSubmitErrors, setFinalSubmitErrors] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [categoryIdsFromApi, setCategoryIdsFromApi] = useState([])
    const [mainImageFile, setMainImageFile] = useState(null)
    const [existingMainImageUrl, setExistingMainImageUrl] = useState('')
    const [galleryImageFiles, setGalleryImageFiles] = useState([])
    const [emirate, setEmirate] = useState('Dubai')
    const [make, setMake] = useState('')
    const [model, setModel] = useState('')
    const [trim, setTrim] = useState('')
    const [makeOptions, setMakeOptions] = useState([])
    const [modelOptions, setModelOptions] = useState([])
    const [trimOptions, setTrimOptions] = useState([])
    const [isMakeLoading, setIsMakeLoading] = useState(false)
    const [isModelLoading, setIsModelLoading] = useState(false)
    const [isTrimLoading, setIsTrimLoading] = useState(false)
    const [customFieldsAll, setCustomFieldsAll] = useState([])
    const [extraDetails, setExtraDetails] = useState({})
    const [customFieldsLoading, setCustomFieldsLoading] = useState(false)
    const [customFieldsError, setCustomFieldsError] = useState(null)
    const [price, setPrice] = useState('')
    const [phone, setPhone] = useState('+971')
    const [adTitle, setAdTitle] = useState('')
    const [adDescription, setAdDescription] = useState('')
    const [mainPhotoPreview, setMainPhotoPreview] = useState('')
    const [isPhotoUploading, setIsPhotoUploading] = useState(false)
    const [locationLabel, setLocationLabel] = useState('home')
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationModalMode, setLocationModalMode] = useState('new')
    const [locationQuery, setLocationQuery] = useState('')
    const [streetQuery, setStreetQuery] = useState('')
    const [locationSuggestions, setLocationSuggestions] = useState(LOCATION_SUGGESTIONS)
    const [streetSuggestions, setStreetSuggestions] = useState(LOCATION_SUGGESTIONS)
    const { isLoaded } = loadGoogleMaps()
    const mapRef = useRef(null)
    const [mapZoom, setMapZoom] = useState(12)
    const [position, setPosition] = useState({ lat: 25.2048, lng: 55.2708 })
    const [paymentItemId, setPaymentItemId] = useState(null)
    // const [checkoutPackageId, setCheckoutPackageId] = useState(null)

    const { step1Fields, step2Fields } = useMemo(() => partitionMotorsCustomFields(customFieldsAll), [customFieldsAll])

    const categoryId = leafCategory?.category_id
    const isRentalCarsCategory = useMemo(() => {
        const slug = String(leafCategory?.slug || '')
            .toLowerCase()
            .replace(/[_\s]+/g, '-')
            .trim()
        const name = String(leafCategory?.name || '')
            .toLowerCase()
            .replace(/[_\s]+/g, '-')
            .trim()
        return slug === 'rental-cars' || name === 'rental-cars'
    }, [leafCategory])

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
        const itemAddress = String(item?.address || '').trim()
        const itemLat = Number(item?.latitude)
        const itemLng = Number(item?.longitude)
        const imageUrl = String(item?.image || '').trim()
        const itemCustomFields = getEditItemCustomFields(item)

        setStep(1)
        setMake(item?.car_make != null ? String(item.car_make) : '')
        setModel(item?.car_model != null ? String(item.car_model) : '')
        setTrim(item?.car_trim != null ? String(item.car_trim) : '')
        setPrice(itemPrice)
        setPhone(itemContact || PHONE_PREFIX)
        setAdTitle(itemTitle)
        setAdDescription(itemDescription)
        setLocationQuery(itemAddress)
        setStreetQuery('')
        setLocationLabel(itemAddress ? 'home' : '')
        if (Number.isFinite(itemLat) && Number.isFinite(itemLng)) {
            setPosition({ lat: itemLat, lng: itemLng })
        }
        setMainImageFile(null)
        setExistingMainImageUrl(imageUrl)
        setMainPhotoPreview(imageUrl)
        setGalleryImageFiles([])
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

    const renderMotorsCustomField = (field) => {
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
                                        className={`cursor-pointer rounded-[8px] border p-[4px_10px] text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors ${
                                            isSel ? 'border-[#23262A] bg-[#edeeee]' : 'border-[rgba(143,143,143,0.45)] bg-white'
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
                        maxLength={max_length || undefined}
                        onChange={(v) => setCustomFieldValue(id, v)}
                    />
                )
            case 'multiselect_dropdown': {
                const selected = Array.isArray(val) ? val : []
                return (
                    <MultiTagDropdown
                        title={name}
                        required={!!required}
                        options={values || []}
                        values={selected}
                        onChange={(next) => setCustomFieldValue(id, next)}
                    />
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
                        {val instanceof File ? (
                            <p className="mt-[6px] text-[12px] font-[Inter-Regular] text-[#6B7280]">{val.name}</p>
                        ) : null}
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

    const formatCustomFieldSummaryValue = (field) => {
        const v = extraDetails[field.id]
        if (field.type === 'checkbox' || field.type === 'multiselect_dropdown') return Array.isArray(v) && v.length ? v.join(', ') : '-'
        if (field.type === 'fileinput' && v instanceof File) return v.name
        if (v === '' || v == null) return '-'
        return String(v)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const isEmpty = (val) => String(val ?? '').trim() === ''

        if (isEmpty(emirate)) {
            toast.error('Please select Emirate.')
            return
        }
        if (isEmpty(make)) {
            toast.error('Please select Make.')
            return
        }
        if (isEmpty(model)) {
            toast.error('Please select Model.')
            return
        }
        if (isEmpty(trim)) {
            toast.error('Please select Trim.')
            return
        }
        if (categoryId != null && customFieldsLoading) {
            toast.error('Please wait for vehicle fields to load.')
            return
        }
        if (categoryId != null && customFieldsError) {
            toast.error('Could not load vehicle fields. Please try again.')
            return
        }
        if (!validateCustomFieldsRequired(step1Fields, extraDetails)) return

        if (!isRentalCarsCategory && isEmpty(price)) {
            toast.error('Please enter Price.')
            return
        }
        if (isPhoneBareCountryCode(phone)) {
            toast.error('Please enter Phone number.')
            return
        }

        setStep(2)
    }

    const handleFinalSubmit = async (e) => {
        e.preventDefault()
        const errors = []
        const isEmpty = (val) => String(val ?? '').trim() === ''

        if (isEmpty(make)) errors.push('Make is required.')
        if (isEmpty(model)) errors.push('Model is required.')
        if (isEmpty(trim)) errors.push('Trim is required.')
        if (!isRentalCarsCategory && isEmpty(price)) errors.push('Price is required.')
        if (isPhoneBareCountryCode(phone)) errors.push('Phone number is required.')
        if (isEmpty(adTitle)) errors.push('Title is required.')
        if (isEmpty(adDescription)) errors.push('Description is required.')

        if (errors.length) {
            setFinalSubmitErrors(errors)
            return
        }

        if (categoryId == null) {
            toast.error(t('somethingWentWrong') || 'Category is missing.')
            return
        }
        if (!mainImageFile && !existingMainImageUrl) {
            toast.error(t('uploadMainPicture') || 'Please add a main photo.')
            return
        }

        if (!validateCustomFieldsRequired(customFieldsAll, extraDetails)) return

        const lat = Number(position?.lat)
        const lng = Number(position?.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            toast.error(t('somethingWentWrong') || 'Invalid map location.')
            return
        }

        const addressLine = [streetQuery, locationQuery]
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .join(', ')

        const transformedCustomFields = {}
        const customFieldFiles = []
        Object.entries(extraDetails).forEach(([key, value]) => {
            if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
                customFieldFiles.push({ key, files: value })
            } else if (value !== '' && value !== null && value !== undefined) {
                const currentField = customFieldsAll.find((cf) => String(cf.id) === String(key))
                const isNumberField = currentField?.type === 'number'
                if (isNumberField) {
                    const values = Array.isArray(value) ? value : [value]
                    const numericValues = values
                        .map((v) => Number(v))
                        .filter((n) => Number.isFinite(n))
                    if (numericValues.length > 0) {
                        transformedCustomFields[key] = numericValues
                    }
                    return
                }
                transformedCustomFields[key] = Array.isArray(value) ? value : [value]
            }
        })

        const allCategoryIds =
            categoryIdsFromApi.length > 0 ? categoryIdsFromApi.join(',') : String(categoryId)
        const priceForApi = isRentalCarsCategory ? '' : String(price ?? '').replace(/,/g, '').trim()

        setFinalSubmitErrors([])
        setSubmitting(true)
        try {
            const resolved = await resolveListingLocation({
                lat,
                lng,
                addressLine,
                locationQuery,
                streetQuery,
                placeApiKey: settings?.place_api_key,
            })

            const cityForApi = String(resolved.city || locationQuery || emirate || '')
                .trim() || undefined
            const stateForApi = String(resolved.state || emirate || '')
                .trim() || undefined
            const locationParts = resolveAreaAndBuilding({
                locationQuery,
                streetQuery,
                country: resolved.country,
                state: stateForApi,
                city: cityForApi,
                address: resolved.address || addressLine,
            })

            const payload = {
                name: adTitle.trim(),
                slug: generateSlug(adTitle.trim()),
                description: adDescription.trim(),
                category_id: categoryId,
                all_category_ids: allCategoryIds,
                car_make: String(make).trim(),
                car_model: String(model).trim(),
                car_trim: String(trim).trim(),
                price: priceForApi || undefined,
                contact: phone.trim(),
                custom_fields: transformedCustomFields,
                image: mainImageFile || undefined,
                gallery_images: galleryImageFiles,
                custom_field_files: customFieldFiles,
                show_only_to_premium: 1,
                address: resolved.address || addressLine || undefined,
                latitude: lat,
                longitude: lng,
                country: resolved.country || undefined,
                state: stateForApi,
                city: cityForApi,
                area: locationParts.area || undefined,
                building: locationParts.building || undefined,
            }

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
                    (Array.isArray(payloadData) ? payloadData?.[0]?.id || payloadData?.[0]?.item_id : null) ||
                    null
                if (!nextItemId) {
                    toast.error('Item created, but item_id is missing in response.')
                    return
                }
                toast.success(res?.data?.message || t('success') || 'Success')
                if (editingItemId && !shouldShowPlanPaymentAfterEdit(editItemData)) {
                    router.push('/myads')
                    return
                }
                setPaymentItemId(nextItemId)
                setStep(3)
            } else {
                toast.error(res?.data?.message || t('somethingWentWrong'))
            }
        } catch (err) {
            console.error(err)
            toast.error(t('somethingWentWrong'))
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

    useEffect(() => {
        let active = true
        const loadCarMakes = async () => {
            setIsMakeLoading(true)
            try {
                const response = await Api.get('car_makes', { headers: { Accept: 'application/json' } })
                const nextOptions = (response?.data?.data || []).map((item) => ({
                    value: String(item.id),
                    label: item.translated_name || item.name || String(item.id),
                }))
                if (active) setMakeOptions(nextOptions)
            } catch (error) {
                if (active) setMakeOptions([])
            } finally {
                if (active) setIsMakeLoading(false)
            }
        }
        loadCarMakes()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        setModel('')
        setTrim('')
        setTrimOptions([])
        if (!make) {
            setModelOptions([])
            return
        }
        let active = true
        const loadModels = async () => {
            setIsModelLoading(true)
            try {
                const response = await Api.get(`car_models/${make}`, { headers: { Accept: 'application/json' } })
                const nextOptions = (response?.data?.data || []).map((item) => ({
                    value: String(item.id),
                    label: item.translated_name || item.name || String(item.id),
                }))
                if (active) setModelOptions(nextOptions)
            } catch (error) {
                if (active) setModelOptions([])
            } finally {
                if (active) setIsModelLoading(false)
            }
        }
        loadModels()
        return () => {
            active = false
        }
    }, [make])

    useEffect(() => {
        setTrim('')
        if (!model) {
            setTrimOptions([])
            return
        }
        let active = true
        const loadTrims = async () => {
            setIsTrimLoading(true)
            try {
                const response = await Api.get(`car_model_trims/${model}`, { headers: { Accept: 'application/json' } })
                const nextOptions = (response?.data?.data || []).map((item) => ({
                    value: String(item.id),
                    label: item.name || String(item.id),
                }))
                if (active) setTrimOptions(nextOptions)
            } catch (error) {
                if (active) setTrimOptions([])
            } finally {
                if (active) setIsTrimLoading(false)
            }
        }
        loadTrims()
        return () => {
            active = false
        }
    }, [model])

    useEffect(() => {
        if (!editingItemId || !editItemData) return
        if (editItemData?.car_make != null) setMake(String(editItemData.car_make))
        if (editItemData?.car_model != null) setModel(String(editItemData.car_model))
        if (editItemData?.car_trim != null) setTrim(String(editItemData.car_trim))
    }, [editingItemId, editItemData, makeOptions.length, modelOptions.length, trimOptions.length])

    const clearMainPhoto = () => {
        if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current)
            uploadTimerRef.current = null
        }
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        setMainPhotoPreview('')
        setMainImageFile(null)
        setExistingMainImageUrl('')
        setGalleryImageFiles([])
        setIsPhotoUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePhotoInputChange = (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        const [first, ...rest] = files
        setMainImageFile(first)
        setGalleryImageFiles(rest)
        const previewUrl = URL.createObjectURL(first)
        setMainPhotoPreview(previewUrl)
        setIsPhotoUploading(true)
        uploadTimerRef.current = setTimeout(() => {
            setIsPhotoUploading(false)
            uploadTimerRef.current = null
        }, 2600)
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
        navigator.geolocation.getCurrentPosition((pos) => {
            const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            handleMapCoordsSelect(next.lat, next.lng)
            if (mapRef.current) {
                mapRef.current.panTo(next)
                mapRef.current.setZoom(14)
            }
        })
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
        const t = setTimeout(() => {
            if (!String(locationQuery || '').trim()) {
                setLocationSuggestions(LOCATION_SUGGESTIONS)
                return
            }
            getPredictions(locationQuery, setLocationSuggestions)
        }, 180)
        return () => clearTimeout(t)
    }, [locationQuery])

    useEffect(() => {
        const t = setTimeout(() => {
            if (!String(streetQuery || '').trim()) {
                setStreetSuggestions(LOCATION_SUGGESTIONS)
                return
            }
            getPredictions(streetQuery, setStreetSuggestions)
        }, 180)
        return () => clearTimeout(t)
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

    if (step === 2) {
        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <h1 className="mb-[12px] text-center text-[20px] font-[Inter-Bold] text-[#23262A]">You&apos;re almost there!</h1>
                <p className="mb-[12px] text-center text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Include as much details and pictures as possible, and set the right price!
                </p>
                <nav className="mb-[16px] flex items-center gap-[6px]">
                    {editingItemId ? (
                        <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">Motors</span>
                    ) : (
                        <button type="button" onClick={() => setStep(1)} className="cursor-pointer text-[14px] font-[Inter-Regular] text-[#4294ff]">
                            Motors
                        </button>
                    )}
                    <RightArrowIcon className="h-[14px] w-[14px]" />
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Cars</p>
                </nav>

                <div className="mb-[20px] rounded-[12px] bg-[#f6f7f8] p-[16px]">
                    <div className="mb-[12px] flex items-center justify-between">
                        <h3 className="text-[18px] font-[Inter-SemiBold] text-[#424648]">Listing Summary</h3>
                        <div>
                            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-[4px]">
                                <p className="text-[18px] font-[Inter-SemiBold] text-[#DC0000]">Edit</p>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-[12px]">
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Make</p><p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">{makeOptions.find((m) => m.value === make)?.label || '-'}</p>
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Model</p><p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">{modelOptions.find((m) => m.value === model)?.label || '-'}</p>
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Trim</p><p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">{trimOptions.find((t) => t.value === trim)?.label || '-'}</p>
                        {step1Fields.map((f) => (
                            <React.Fragment key={f.id}>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{f.name}</p>
                                <p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                    {formatCustomFieldSummaryValue(f)}
                                </p>
                            </React.Fragment>
                        ))}
                        {!isRentalCarsCategory ? (
                            <>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Price</p>
                                <p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">{price || '-'}</p>
                            </>
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Phone number</p><p className="font-[Inter-SemiBold] text-[14px] font-[Inter-Regular] text-[#23262A]">{phone || '-'}</p>
                    </div>
                </div>

                <form onSubmit={handleFinalSubmit} className="flex flex-col gap-[20px] pb-[80px]">
                    {finalSubmitErrors.length ? (
                        <div className="rounded-[8px] border border-[#DC0000] bg-[#FEF2F2] p-[12px]">
                            <p className="mb-[6px] text-[14px] font-[Inter-SemiBold] text-[#DC0000]">Please complete required fields:</p>
                            <ul className="list-disc pl-[18px] text-[13px] font-[Inter-Regular] text-[#23262A]">
                                {finalSubmitErrors.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handlePhotoInputChange}
                        />
                        {mainPhotoPreview ? (
                            <div className="mb-[16px]">
                                {isPhotoUploading ? (
                                    <div className="flex items-center gap-[12px] py-[4px]">
                                        <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[2px] border border-[rgba(143,143,143,0.35)] bg-white p-[3px]">
                                            <img src={mainPhotoPreview} alt="Main photo" className="h-full w-full object-cover" />
                                        </div>
                                        <div className="h-[4px] flex-1 rounded-full bg-[#F3D1D1]">
                                            <div className="h-full w-full animate-pulse rounded-full bg-[#DC0000]" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearMainPhoto}
                                            className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center"
                                            aria-label="Remove photo"
                                        >
                                            <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative h-[128px] w-[200px] mx-auto">
                                        <button
                                            type="button"
                                            onClick={clearMainPhoto}
                                            className="absolute -right-[6px] -top-[6px] z-[2] flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border border-[rgba(35,38,42,0.35)] bg-white"
                                            aria-label="Remove photo"
                                        >
                                            <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                        </button>
                                        <div className="h-[120px] w-[200px] overflow-hidden rounded-[2px] ">
                                            <img src={mainPhotoPreview} alt="Main photo" className="h-full w-full object-cover" />
                                        </div>
                                        <p className="absolute bottom-0 left-0 right-0 w-fit mx-auto text-center rounded-[6px] border border-[rgba(35,38,42,0.3)] bg-white p-[8px_10px] text-[14px] leading-none text-[#23262A]">
                                            Main photo
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] border border-[#DC0000] bg-white "
                        >

                            <CameraIcon className="w-[24px] h-[24px]" />
                            <p className="font-[Inter-SemiBold] text-[#DC0000] text-[14px] leading-[20px]">Add Pictures</p>
                        </button>
                    </div>

                    <FieldInput id="car-title" label="Title" required value={adTitle} onChange={setAdTitle} defaultLabelInside />
                    <FieldTextArea id="car-desc" label="Describe your item" required value={adDescription} onChange={setAdDescription} maxLength={DESC_MAX} />

                    {step2Fields.length > 0 ? (
                        <div className="flex flex-col gap-[20px]">
                            {step2Fields.map((field) => (
                                <div key={field.id} className="flex flex-col gap-[6px]">
                                    {renderMotorsCustomField(field)}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                        {locationLabel === 'home' ? (
                            <>
                                <div className="mb-[10px] flex items-center justify-between">
                                    <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">Home</h3>
                                    <button
                                        type="button"
                                        onClick={handleEditLocationModal}
                                        className="cursor-pointer flex items-center gap-[8px]"
                                    >
                                        <Image src={edit} alt="edit" width={14} height={14} />
                                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Edit</p>
                                    </button>
                                </div>
                                <p className="mb-[12px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                    {[streetQuery, locationQuery].map((v) => String(v || '').trim()).filter(Boolean).join(' - ') || 'No location selected'}
                                </p>
                                <div className="relative mb-[14px] h-[350px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-[#f6f7f8]">
                                    {isLoaded ? (
                                        <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={position} zoom={mapZoom} onLoad={(map) => { mapRef.current = map }} onUnmount={() => { mapRef.current = null }} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false, draggable: false, zoomControl: false }}>
                                            <Marker position={position} />
                                        </GoogleMap>
                                    ) : <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#6B7280]">Loading map...</div>}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="mb-[16px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Select Location</h3>
                                <div className="mb-[16px]">
                                    <AutocompleteField id="car-locate" label="Locate your motorcycle" value={locationQuery} onChange={setLocationQuery} suggestions={locationSuggestions} onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setLocationQuery)} />
                                </div>
                                <div className="mb-[16px]">
                                    <AutocompleteField id="car-street" label="Building or Street name" value={streetQuery} onChange={setStreetQuery} suggestions={streetSuggestions} onSuggestionPick={(prediction) => applyPlaceSelection(prediction, setStreetQuery)} />
                                </div>
                                <h3 className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Is the pin in the right location?</h3>
                                <p className="mb-[12px] text-[12px] font-[Inter-Regular] leading-[22px] text-[#6B7280]">Click and drag the pin to the exact spot. Users are more likely to respond to ads that are correctly shown on the map.</p>
                                <div className="relative mb-[14px] h-[280px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)]">
                                    {isLoaded ? (
                                        <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={position} zoom={mapZoom} onLoad={(map) => { mapRef.current = map }} onUnmount={() => { mapRef.current = null }} onClick={(e) => { if (!e.latLng) return; handleMapCoordsSelect(e.latLng.lat(), e.latLng.lng()) }} onZoomChanged={() => { if (!mapRef.current) return; setMapZoom(mapRef.current.getZoom()) }} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false }}>
                                            <Marker position={position} draggable onDragEnd={(e) => { if (!e.latLng) return; handleMapCoordsSelect(e.latLng.lat(), e.latLng.lng()) }} />
                                        </GoogleMap>
                                    ) : <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#6B7280]">Loading map...</div>}
                                    <div className="absolute left-[12px] top-[12px] overflow-hidden rounded-[6px] border border-[rgba(35,38,42,0.25)] bg-white">
                                        <button type="button" onClick={zoomIn} className="block h-[30px] w-[30px] border-b border-[rgba(35,38,42,0.2)] text-[22px] leading-none text-[#23262A]">+</button>
                                        <button type="button" onClick={zoomOut} className="block h-[30px] w-[30px] text-[20px] leading-none text-[#23262A]">-</button>
                                    </div>
                                    <button type="button" onClick={locateMe} className="absolute bottom-[12px] right-[12px] cursor-pointer rounded-[8px] border border-[rgba(35,38,42,0.35)] bg-white px-[12px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Locate Me</button>
                                </div>
                            </>
                        )}
                        <div className="mb-[6px] flex flex-wrap gap-[8px]">
                            <button
                                type="button"
                                onClick={handleOpenLocationModal}
                                className={`cursor-pointer rounded-[8px] border p-[8px_12px] flex items-center gap-[8px] ${locationLabel === 'new'
                                    ? 'border-[#DC0000] bg-[#FEF2F2]'
                                    : 'border-[#DC0000] bg-white'
                                    }`}
                            >
                                <Image src={plusicon} alt="plus" width={13} height={13} />
                                <p className="text-[14px] font-[Inter-Medium] text-[#DC0000]">New Location</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationLabel((prev) => (prev === 'home' ? '' : 'home'))}
                                className={`cursor-pointer flex items-center gap-[8px] rounded-[8px] border p-[8px_12px] flex items-center gap-[8px] ${locationLabel === 'home'
                                    ? 'border-[rgba(0,0,0,0.08)] bg-[#00000014]'
                                    : 'border-[#23262A] bg-white'
                                    }`}
                            >
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Home</p>
                                {locationLabel === 'home' ? <CloseIcon className="h-[8px] w-[8px]" fill="#6B7280" fillOpacity="1" /> : null}
                            </button>
                        </div>
                    </div>
                    <div className="rounded-[8px] bg-[#F3F4F6] p-[14px] ">
                        <p className="text-[14px] font-[Inter-Regular] text-[#6B7280] leading-[22px]">
                            Make sure the car information you have entered is correct. You will only be able to make select changes once the ad is live.
                            <Image src={infoIcon} alt="terminfo" width={16} height={16} className='inline-flex ml-[4px]' />
                        </p>
                    </div>
                    <div className="rounded-[8px] bg-[#F3F4F6] p-[14px] flex flex-col gap-[6px]">
                        <div className="flex items-start gap-[8px]">
                            <Image src={infoIcon} alt="terminfo" width={24} height={24} />
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

                    <div className='z-[100] fixed bottom-[0px] p-[20px] w-[478px] max-sm:w-full left-0 right-0 bg-white mx-auto max-sm:w-full flex flex-col gap-[10px]'>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="py-[14px] w-full cursor-pointer rounded-[8px] bg-[#DC0000] text-[14px] font-[Inter-Regular] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (t('loading') || 'Please wait…') : 'Next'}
                        </button>
                    </div>
                </form>
                <LocationDetailsModal
                    open={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    onSave={() => setShowLocationModal(false)}
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

    if (step === 3) {
        return (
            <div className="w-full">
                {/*
                const makeLab = makeOptions.find((m) => m.value === make)?.label ?? '—'
                const modelLab = makeOptions.find((m) => m.value === model)?.label ?? '—'
                const trimLab = trimOptions.find((t) => t.value === trim)?.label ?? '—'
                const priceNum = Number(String(price ?? '').replace(/,/g, ''))
                const priceLabel = Number.isFinite(priceNum)
                    ? `AED ${priceNum.toLocaleString('en-AE')}`
                    : `AED ${String(price || '—')}`
                const yearField = step1Fields.find((f) => motorsStep1KeyFromFieldName(f.name) === 'year')
                const yearSpec = yearField ? formatCustomFieldSummaryValue(yearField) : '—'
                const listingPreview = {
                    imageSrc: mainPhotoPreview || '/assets/img/user.jpeg',
                    imageAlt: adTitle || 'Your car',
                    priceLabel,
                    breadcrumb: `${makeLab}`,
                    description: (adDescription || '').trim() ? (adDescription || '').trim().slice(0, 140) : adTitle || '—',
                    specsLine: [yearSpec],
                }

                if (checkoutPackageId && MOTORS_CHECKOUT_PACKAGE_BY_ID[checkoutPackageId]) {
                    return (
                        <div className="w-full">
                            <SelectPackagePage
                                basePackage={MOTORS_CHECKOUT_PACKAGE_BY_ID[checkoutPackageId]}
                                listing={listingPreview}
                                onEditPackage={() => setCheckoutPackageId(null)}
                                onPay={() => {
                                    setCheckoutPackageId(null)
                                    setStep(4)
                                }}
                            />
                        </div>
                    )
                }
                */}
                {/*
                <SelectPackagePage
                    itemId={paymentItemId}
                    onPay={() => {
                        setStep(4)
                    }}
                />
                */}
                <SelectPackageOrderCar
                    itemId={paymentItemId}
                    onConfirm={() => {
                        setStep(4)
                    }}
                />
            </div>
        )
    }

    if (step === 4) {
        return <PostAdPaymentSuccessPage isCarsCategory />
    }



    return (
        <div className="mx-auto w-full max-w-[480px] px-[16px] py-[28px] sm:py-[36px]">
            <h1 className="mb-[20px] text-center text-[22px] font-[Inter-Bold] text-[#23262A] sm:text-[24px]">
                Tell us about your car
            </h1>

            <nav className="mb-[16px] flex items-center gap-[6px]" aria-label="Breadcrumb">
                {editingItemId ? (
                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">Motors</span>
                ) : (
                    <button type="button" onClick={onBackToSubcategories} className="cursor-pointer text-[14px] font-[Inter-Regular] text-[#4294ff]">
                        Motors
                    </button>
                )}
                <RightArrowIcon className="h-[14px] w-[14px]" />
                <p className="text-[14px] font-[Inter-Regular] leading-[20px] text-[#23262A]">Cars</p>
            </nav>

            <div className="mb-[24px] rounded-[4px] bg-[#f6f7f8] p-[12px]">
                <h4 className="mb-[4px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">Selling more than one car?</h4>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Save with our business packages!{' '}
                    <Link href="/placeyourad" className="font-[Inter-SemiBold] text-[#3a88ef]">
                        Learn More
                    </Link>
                </p>
            </div>

            <form onSubmit={handleSubmit} className='relative '>
                <div className="flex flex-col gap-[24px] pb-[60px] ">
                    <OutlineSelectDropdown
                        id="emirate"
                        label="Emirate"
                        required
                        value={emirate}
                        onChange={setEmirate}
                        options={EMIRATE_OPTIONS.map((name) => ({ value: name, label: name }))}
                        placeholder="Emirate"
                    />

                    <OutlineSelectDropdown
                        id="make"
                        label="Make"
                        required
                        value={make}
                        onChange={setMake}
                        options={makeOptions}
                        placeholder="Make"
                        searchable
                        loading={isMakeLoading}
                        loadingText="Loading..."
                        noOptionsText="No make found"
                        disabled={isMakeLoading}
                        defaultLabelInside
                    />

                    <OutlineSelectDropdown
                        id="model"
                        label="Model"
                        required
                        value={model}
                        onChange={setModel}
                        options={modelOptions}
                        placeholder={make ? 'Model' : 'Select make first'}
                        searchable
                        loading={isModelLoading}
                        loadingText="Loading..."
                        noOptionsText={make ? 'No model found' : 'Select make first'}
                        disabled={!make || isModelLoading}
                        defaultLabelInside
                    />

                    <OutlineSelectDropdown
                        id="trim"
                        label="Trim"
                        required
                        value={trim}
                        onChange={setTrim}
                        options={trimOptions}
                        placeholder="Trim"
                        searchable
                        loading={isTrimLoading}
                        loadingText="Loading..."
                        noOptionsText={model ? 'No trim found' : 'Select model first'}
                        disabled={!model || isTrimLoading}
                        defaultLabelInside
                    />

                    {customFieldsLoading ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#666]">Loading vehicle fields…</p>
                    ) : null}
                    {customFieldsError && !customFieldsLoading ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#DC0000]">Could not load custom fields.</p>
                    ) : null}
                    {!customFieldsLoading &&
                        step1Fields.map((field) => (
                            <div key={field.id} className="flex flex-col gap-[6px]">
                                {renderMotorsCustomField(field)}
                            </div>
                        ))}

                    {!isRentalCarsCategory ? (
                        <FieldInput
                            id="price"
                            label="Price"
                            required
                            type="text"
                            inputMode="decimal"
                            value={price}
                            onChange={setPrice}
                            suffix="AED"
                            defaultLabelInside
                        />
                    ) : null}

                    <PlaceAdPhoneField id="phone" label="Phone number" required value={phone} onChange={setPhone} />
                </div>
                <div className='z-[100] fixed bottom-[0px] p-[20px] w-[478px] max-sm:w-full left-0 right-0 bg-white mx-auto max-sm:w-full flex flex-col gap-[10px]'>
                    <button
                        type="submit"
                        // disabled={submitting}
                        // onClick={handleSubmit}
                        className="py-[14px] w-full cursor-pointer rounded-[8px] bg-[#DC0000] text-[14px] font-[Inter-Regular] text-white transition-opacity "
                    >
                        Next
                    </button>
                </div>
            </form>

        </div>
    )
}
