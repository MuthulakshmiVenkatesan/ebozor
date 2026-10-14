'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { Checkbox, Radio } from 'antd'
import toast from 'react-hot-toast'
import {
    CloseIcon,
    FormDownArrowIcon,
    LocationIcon,
    RightArrowIcon,
    TermsInfoIcon,
    TickIcon,
    UploadLinkIcon,
    DocumentIcon,
    DocumentUploadIcon,
} from '@/components/CustomFile/icons'
import { addItemApi, editItemApi, getCustomFieldsApi, jobRolesApi } from '@/utils/api'
import { generateSlug, isLogin, loadGoogleMaps, t } from '@/utils'
import {
    isTextualCustomFieldType,
    normalizeCustomFieldLength,
    normalizeCustomFieldRequired,
    validateCustomFieldTextLength,
} from '@/utils/placeAdCustomFields'
import { fillLocationFieldsFromMapCoords, resolveAreaAndBuilding } from '@/utils/listingLocation'
import infoIcon from '../../../../public/assets/img/icons/info.svg'
import editIcon from '../../../../public/assets/img/icons/edit.svg'
import plus from '../../../../public/assets/img/icons/plus.svg'
import minus from '../../../../public/assets/img/icons/minus.svg'
import plusicon from '../../../../public/assets/img/icons/plusicon.svg'
import resume from '../../../../public/assets/img/resume.svg'
import deletewhite from '../../../../public/assets/img/icons/deletewhite.svg'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { settingsData } from '@/redux/reuducer/settingSlice'
import LocationDetailsModal from './components/LocationDetailsModal'

const DESC_MAX = 16000
const PHONE_PREFIX = '+971'
const CUSTOM_FILE_MAX_BYTES = 5 * 1024 * 1024
/** Jobs form: non-CV `fileinput` fields accept documents only. */
const JOBS_CUSTOM_FIELD_ACCEPT =
    '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Same as `PlaceAdUniversalListingForm` — used for CV upload fields. */
const UNIVERSAL_CUSTOM_FILE_ACCEPT =
    '.pdf,.doc,.docx,.jpg,.jpeg,.png,.svg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/svg+xml'

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

function normalizeJobRolesMarker(raw) {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/-/g, '_')
}

function mapApiCustomFieldToInternal(raw) {
    const id = raw.custom_field_id
    const required = normalizeCustomFieldRequired(raw)
    const multi = Number(raw.is_field_multiselect) === 1
    const fieldType = String(raw.field_type || '').toLowerCase()
    const values = Array.isArray(raw.field_values) ? raw.field_values : raw.field_values ? [raw.field_values] : []
    const min_length = normalizeCustomFieldLength(raw.min_length)
    const max_length = normalizeCustomFieldLength(raw.max_length)

    if (fieldType === 'dropdown_api') {
        const marker = normalizeJobRolesMarker(values[0])
        const isJobRoles = marker === 'job_roles'
        return {
            id,
            name: raw.label_name,
            type: 'dropdown',
            values: isJobRoles ? [] : values,
            required,
            min_length,
            max_length,
            _jobRolesFromApi: isJobRoles,
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
            case 'text':
            case 'textbox':
                next[item.id] = ''
                break
            case 'dropdown':
                next[item.id] = ''
                if (item._jobRolesFromApi) {
                    next[`${item.id}_custom`] = ''
                }
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

function validateExtraDetails(customFields, extraDetails, filePreviews) {
    for (const field of customFields) {
        const { name, type, required, id, min_length, max_length: maxLenField } = field
        const val = extraDetails[id]

        if (field._jobRolesFromApi) {
            const fromList = String(val ?? '').trim()
            const customText = String(extraDetails[`${id}_custom`] ?? '').trim()
            const effective = fromList || customText
            if (required && !effective) {
                toast.error(`${t('fillDetails')} ${name}.`)
                return false
            }
            if (
                customText &&
                !validateCustomFieldTextLength({
                    name,
                    value: customText,
                    minLength: min_length,
                    maxLength: maxLenField,
                })
            ) {
                return false
            }
            continue
        }

        if (required) {
            if (type === 'checkbox' || type === 'multiselect_dropdown' || type === 'radio') {
                const ok =
                    type === 'radio'
                        ? String(val || '').trim() !== ''
                        : Array.isArray(val) && val.length > 0
                if (!ok) {
                    toast.error(
                        type === 'radio' ? `${t('fillDetails')} ${name}.` : `${t('selectAtleastOne')} ${name}.`
                    )
                    return false
                }
            } else if (type === 'fileinput') {
                if (!val && !filePreviews[id]) {
                    toast.error(`${t('fillDetails')} ${name}.`)
                    return false
                }
            } else if (type === 'textbox' || type === 'button' || type === 'text') {
                if (!String(val || '').trim()) {
                    toast.error(`${t('fillDetails')} ${name}.`)
                    return false
                }
            } else if (type === 'number') {
                if (!String(val ?? '').trim()) {
                    toast.error(`${t('fillDetails')} ${name}.`)
                    return false
                }
            } else if (!val && val !== 0) {
                toast.error(`${t('fillDetails')} ${name}.`)
                return false
            }
        }

        if (isTextualCustomFieldType(type)) {
            const ok = validateCustomFieldTextLength({
                name,
                value: val,
                minLength: min_length,
                maxLength: maxLenField,
                asDigits: type === 'number',
            })
            if (!ok) return false
        }
    }
    return true
}

function FloatingInput({ id, label, required, value, onChange, type = 'text', suffix, inputMode, maxLength }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${
                    isFloating
                        ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-100px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${
                    focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                }`}
            >
                <input
                    id={id}
                    type={type}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {suffix ? <span className="shrink-0 pr-[14px] rtl:pl-[14px] rtl:pr-0 text-[12px] font-[Inter-Regular] text-[#9CA3AF]">{suffix}</span> : null}
            </div>
        </div>
    )
}

function FloatingTextArea({ id, label, required, value, onChange, maxLength }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    const len = String(value ?? '').length
    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${
                    isFloating
                        ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                        : 'left-[14px] top-[24px] -translate-y-1/2 px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative rounded-[8px] border bg-white pb-[28px] pt-[18px] transition-[border-color] duration-200 ${
                    focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
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
                    className="min-h-[250px] w-full resize-none rounded-[8px] border-0 bg-transparent px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {maxLength ? (
                    <span className="pointer-events-none absolute bottom-[8px] right-[12px] text-[12px] font-[Inter-Regular] text-[#9CA3AF] rtl:right-[12px] rtl:left-auto">
                        {len}/{maxLength}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

function FloatingSelectField({ id, label, required, value, onChange, options = [], disabled = false }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    const rowOptions = useMemo(() => {
        const mapped = (options || []).map((opt) => ({ value: opt, label: opt }))
        if (required) return mapped
        return [{ value: '', label: '—' }, ...mapped]
    }, [options, required])

    const hasValue = !(value === '' || value == null)
    const displayText = rowOptions.find((o) => o.value === value)?.label ?? ''
    const isFloating = hasValue || open

    useEffect(() => {
        if (disabled) setOpen(false)
    }, [disabled])

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
    if (!isFloating) {
        buttonInner = null
    } else if (hasValue) {
        buttonInner = <span className="truncate ">{displayText}</span>
    } else if (open) {
        buttonInner = (
            <span className="text-[15px] font-[Inter-Regular] text-[#9CA3AF]" aria-hidden>
                |
            </span>
        )
    } else {
        buttonInner = <span className={`truncate ${!hasValue ? 'text-[#9CA3AF]' : 'text-[#23262A]'}`}>{displayText}</span>
    }

    return (
        <div ref={rootRef} className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[3] bg-white font-[Inter-Regular] text-[#23262A] transition-[top,transform,font-size,padding-left,padding-right] duration-200 ease-out ${
                    isFloating
                        ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-100px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
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
                onClick={() => {
                    if (!disabled) setOpen((o) => !o)
                }}
                className={`flex h-[54px] w-full items-center rounded-[8px] bg-white py-[14px] pl-[14px] text-left text-[14px] font-[Inter-Regular] outline-none transition-[border-color,colors] duration-200 ${
                    hasValue ? 'pr-[100px]' : required ? 'pr-[56px]' : 'pr-[118px]'
                } ${open && !disabled ? 'border border-[#23262A]' : 'border border-[rgba(143,143,143,0.45)]'} ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
            >
                {buttonInner}
            </button>
            <div className="pointer-events-none absolute right-[14px] top-1/2 flex -translate-y-1/2 items-center gap-[8px]">
                {hasValue && !disabled ? (
                    <button
                        type="button"
                        className="pointer-events-auto flex cursor-pointer items-center justify-center rounded-full bg-white"
                        aria-label="Clear selection"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onChange('')
                            setOpen(false)
                        }}
                    >
                        <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                    </button>
                ) : !required ? (
                    <span className="shrink-0 text-[12px] font-[Inter-Regular] text-[#9CA3AF]">Optional</span>
                ) : null}
                <FormDownArrowIcon
                    className={`pointer-events-none h-[24px] w-[24px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="#8F8F8F"
                />
            </div>

            {open && !disabled ? (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(320px,30vh)] overflow-y-auto rounded-[4px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]"
                >
                    {rowOptions.map((opt) => (
                        <li key={String(opt.value === '' ? '__empty' : opt.value)} role="presentation">
                            <button
                                type="button"
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => {
                                    onChange(opt.value)
                                    setOpen(false)
                                }}
                                className={`flex w-full cursor-pointer p-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors hover:bg-[#FDF2F2] focus:bg-[#FDF2F2] focus:outline-none ${
                                    value === opt.value ? 'bg-[#FEF2F2]' : 'bg-white'
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

function CustomFieldFileUpload({
    fieldId,
    label,
    required,
    previewUrl,
    isImage,
    file,
    onPick,
    onClear,
    accept = JOBS_CUSTOM_FIELD_ACCEPT,
    formatHint = 'PDF, DOC, DOCX — below 5MB',
}) {
    const inputRef = useRef(null)

    const handleChange = (e) => {
        const f = e.target.files?.[0]
        if (inputRef.current) inputRef.current.value = ''
        if (f) onPick(f)
    }

    const onDragOver = (e) => e.preventDefault()

    const onDrop = (e) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (f) onPick(f)
    }

    const hasFile = Boolean(file)

    return (
        <div>
            <p className="mb-[10px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                {label}
                {required ? <span className="text-[#DC0000]"> *</span> : null}
            </p>
            <input
                ref={inputRef}
                id={`cf-file-${fieldId}`}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
            />
            {!hasFile ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className="flex h-[224px] w-full cursor-pointer flex-col items-center justify-center rounded-[6px] border-2 border-dashed border-[#1270ec] bg-[#f5f9fe] text-center transition-colors hover:bg-[#eef5fd]"
                >
                    <div className="mb-[14px] flex h-[48px] w-[48px] items-center justify-center rounded-[8px] bg-[#d2e3fb] p-[12px]">
                        <DocumentUploadIcon className="h-[22px] w-[22px]" fill="#1270ec" />
                    </div>
                    <h4 className="mb-[8px] text-[16px] font-[Inter-Medium] text-[#23262A]">Drag and drop or click to select</h4>
                    <p className="px-[12px] text-[14px] font-[Inter-Regular] text-[#6B7280]">{formatHint}</p>
                </button>
            ) : (
                <div className="overflow-hidden rounded-[6px] bg-[#d8e2ff]">
                    <div className="relative flex h-[60px] items-center justify-center rounded-[6px] bg-[#d8e2ff]">
                        <Image src={resume} alt="resume" width={80} height={80} className="h-auto w-auto mt-[40px]" />
                        <button
                            type="button"
                            aria-label="Remove file"
                            onClick={onClear}
                            className="absolute right-[12px] top-[12px] flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-[6px] bg-[#5C6370]"
                        >
                            <Image src={deletewhite} alt="delete" className="h-[20px] w-[20px]" />
                        </button>
                    </div>
                    <div className="relative z-[9] flex items-center justify-between gap-[12px] bg-[#f5f9fe] p-[8px_16px]">
                        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                            <div className="shrink-0">
                                <DocumentIcon className="h-[24px] w-[24px]" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="mb-[4px] text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</h4>
                                <p className="truncate text-[12px] font-[Inter-Regular] text-[#23262A]" title={file.name}>
                                    {file.name}
                                </p>
                            </div>
                        </div>
                        {previewUrl ? (
                            <Link
                                href={previewUrl}
                                className="flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-[#23262A] p-[8px_6px] text-[13px] font-[Inter-Medium] text-[#23262A] transition-colors hover:bg-[#F3F4F6]"
                            >
                                View
                                <UploadLinkIcon className="h-[16px] w-[16px]" />
                            </Link>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

function MultiSelectCheckboxDropdown({ fieldId, label, required, options, value, onChange }) {
    const [open, setOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const rootRef = useRef(null)
    const inputRef = useRef(null)

    const selected = Array.isArray(value) ? value : []
    const hasSelection = selected.length > 0
    const hasFilter = String(filter).trim().length > 0
    const hint = required ? null : 'Optional'
    const listboxId = `${fieldId}-listbox`

    const filtered = useMemo(() => {
        const list = options || []
        const q = filter.trim().toLowerCase()
        if (!q) return list
        return list.filter((o) => String(o).toLowerCase().includes(q))
    }, [options, filter])

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const toggle = (opt) => {
        if (selected.includes(opt)) onChange(selected.filter((v) => v !== opt))
        else onChange([...selected, opt])
    }

    const clearAll = () => {
        onChange([])
        setFilter('')
    }

    const openField = () => {
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
    }

    const showChipArea = open || hasSelection || hasFilter

    return (
        <div ref={rootRef} className="relative">
            {showChipArea ? (
                <>
                    <label
                        className={`pointer-events-none absolute left-[12px] top-0 z-[3] -translate-y-1/2 bg-white px-[6px] text-[12px] font-[Inter-Regular] leading-[1.2] ${
                            open || hasSelection ? 'text-[#DC0000]' : 'text-[#23262A]'
                        }`}
                        htmlFor={fieldId}
                    >
                        {label}
                    </label>
                    <div
                        className={`relative min-h-[54px] rounded-[8px] border bg-white px-[10px] pb-[10px] pt-[18px] transition-[border-color] duration-200 ${
                            open ? 'border-[#DC0000]' : 'border-[rgba(143,143,143,0.45)]'
                        }`}
                    >
                        <div className="flex flex-wrap items-center gap-[8px] pr-[56px]">
                            {selected.map((v) => (
                                <div key={v} className="inline-flex items-center gap-[6px] rounded-full bg-[#edeeee] px-[10px] py-[5px]">
                                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{v}</span>
                                    <button
                                        type="button"
                                        className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#BFC3C9] text-white"
                                        aria-label={`Remove ${v}`}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggle(v)
                                        }}
                                    >
                                        <CloseIcon className="h-[8px] w-[8px]" fill="#fff" fillOpacity="1" />
                                    </button>
                                </div>
                            ))}
                            <input
                                ref={inputRef}
                                id={fieldId}
                                type="text"
                                value={filter}
                                onChange={(e) => {
                                    setFilter(e.target.value)
                                    setOpen(true)
                                }}
                                onFocus={() => setOpen(true)}
                                className="min-w-[100px] flex-1 border-0 bg-transparent py-[6px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                aria-label={`Filter ${label}`}
                                aria-controls={listboxId}
                                aria-expanded={open}
                            />
                        </div>
                        <div className="absolute right-[8px] top-[14px] flex items-center gap-[2px]">
                            {selected.length > 0 ? (
                                <button
                                    type="button"
                                    className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] text-[#6B7280]"
                                    aria-label={`Clear all ${label}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={clearAll}
                                >
                                    <CloseIcon className="h-[12px] w-[12px]" fill="#6B7280" fillOpacity="1" />
                                </button>
                            ) : null}
                            <button
                                type="button"
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center text-[#6B7280]"
                                aria-expanded={open}
                                aria-label="Toggle list"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setOpen((o) => !o)}
                            >
                                <FormDownArrowIcon className={`h-[20px] w-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    id={fieldId}
                    onClick={openField}
                    className="relative flex h-[54px] w-full cursor-pointer items-center rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white px-[14px] text-left transition-[border-color] duration-200 hover:border-[rgba(143,143,143,0.65)]"
                >
                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</span>
                    <span className="ml-auto flex items-center gap-[10px] pr-[4px]">
                        {hint ? (
                            <span className="text-[12px] font-[Inter-Regular] text-[#9CA3AF]">{hint}</span>
                        ) : null}
                        <FormDownArrowIcon className="h-[20px] w-[20px] text-[#6B7280]" />
                    </span>
                </button>
            )}

            {open ? (
                <div
                    id={listboxId}
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] max-h-[min(280px,40vh)] overflow-y-auto rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    role="listbox"
                    aria-multiselectable="true"
                >
                    {filtered.length === 0 ? (
                        <p className="px-[14px] py-[12px] text-[14px] font-[Inter-Regular] text-[#9CA3AF]">No matches</p>
                    ) : (
                        filtered.map((opt) => {
                            const active = selected.includes(opt)
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => toggle(opt)}
                                    className={`flex w-full cursor-pointer items-center gap-[12px] px-[12px] py-[10px] text-left transition-colors ${
                                        active ? 'bg-[#FDF2F2]' : 'bg-white hover:bg-[#f6f7f8]'
                                    }`}
                                >
                                    <div
                                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 ${
                                            active ? 'border-[#DC0000] bg-[#DC0000]' : 'border-[#8f8f8f] bg-white'
                                        }`}
                                    >
                                        {active ? <TickIcon className="h-[16px] w-[16px]" fill="#fff" fillOpacity="1" /> : null}
                                    </div>
                                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{opt}</span>
                                </button>
                            )
                        })
                    )}
                </div>
            ) : null}
        </div>
    )
}

function ButtonChipField({ ariaLabel, options, value, required, onChange }) {
    const selected = value == null ? '' : String(value)

    const pick = (opt) => {
        const str = String(opt)
        const isSel = selected === str
        if (isSel) {
            if (!required) onChange('')
            return
        }
        onChange(str)
    }

    return (
        <div className="flex flex-wrap gap-[8px]" role="group" aria-label={ariaLabel}>
            {(options || []).map((opt) => {
                const isSel = selected === String(opt)
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => pick(opt)}
                        className={`cursor-pointer rounded-[8px] border p-[4px_10px] text-[14px] font-[Inter-Regular] text-[#23262A] transition-colors ${
                            isSel ? 'border-[#23262A] bg-[#edeeee] text-[#23262A]' : 'border-[rgba(143,143,143,0.45)] bg-white'
                        }`}
                    >
                        {opt}
                    </button>
                )
            })}
        </div>
    )
}

function parseJobRolesPayload(res) {
    let payload = res?.data?.data ?? res?.data
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const inner = payload.roles ?? payload.job_roles ?? payload.items ?? payload.list ?? payload.records
        if (Array.isArray(inner)) payload = inner
    }
    if (!Array.isArray(payload)) return []
    return payload
        .map((row) => {
            if (typeof row === 'string') return String(row).trim()
            const label = row?.name ?? row?.title ?? row?.label ?? row?.role_name ?? row?.job_role
            return String(label ?? '').trim()
        })
        .filter(Boolean)
}

/** CV field: use universal listing file UI (full accept list). */
function isCvUploadField(field) {
    const n = String(field?.name || '').toLowerCase()
    return n.includes('upload your cv') || n.includes('upload cv')
}

/** Breadcrumb copy for jobs sub-branches (slug or common API names). */
function getJobsBreadcrumbLabel(node) {
    const slug = String(node?.slug || '').toLowerCase()
    if (slug === 'jobs-jobs-seekers') return 'Jobs'
    if (slug === 'jobs-recruiters') return 'Jobs Wanted'
    const name = String(node?.name || node?.label || '').trim()
    if (/^jobs\s*seekers$/i.test(name.replace(/[-_]+/g, ' '))) return 'Jobs'
    if (/^recruiters?$/i.test(name)) return 'Jobs Wanted'
    return name
}

/** From `rootCategory` + `pathNodes` slugs (same flow as PlaceYourAd jobs branch). */
function resolveJobsBranchKind(rootCategory, pathNodes) {
    const nodes = [rootCategory, ...(Array.isArray(pathNodes) ? pathNodes : [])].filter(Boolean)
    const slugs = new Set(nodes.map((n) => String(n?.slug || '').toLowerCase()))
    if (slugs.has('jobs-recruiters')) return 'recruiters'
    if (slugs.has('jobs-jobs-seekers')) return 'seekers'
    return 'default'
}

/**
 * Jobs branch (recruiters / job seekers): title, description, custom fields, and map (no main listing photos).
 * `dropdown_api` + job_roles loads options from GET job-roles?category_slug=<leaf slug>.
 */
export default function PlaceAdJobsListingForm({
    leafCategory,
    pathNames = [],
    pathNodes = [],
    rootCategory,
    onNavigateToCategory,
    onBack,
    onComplete,
    initialTitle = '',
    editingItemId = null,
    editItemData = null,
}) {
    const user = useSelector(userSignUpData)

    const [title, setTitle] = useState(() => String(initialTitle ?? '').trim())
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')

    const [customFields, setCustomFields] = useState([])
    const [categoryIdsFromApi, setCategoryIdsFromApi] = useState([])
    const [extraDetails, setExtraDetails] = useState({})
    const [filePreviews, setFilePreviews] = useState({})
    const [fieldsLoading, setFieldsLoading] = useState(true)
    const [fieldsError, setFieldsError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [jobRolesOptionsByFieldId, setJobRolesOptionsByFieldId] = useState({})
    const [jobRolesLoading, setJobRolesLoading] = useState(false)
    const [jobRolesError, setJobRolesError] = useState(null)
    const customFieldsRef = useRef(customFields)
    const mapRef = useRef(null)

    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const { isLoaded } = loadGoogleMaps()

    const [mapZoom, setMapZoom] = useState(12)
    const [position, setPosition] = useState({ lat: 25.2048, lng: 55.2708 })
    const [locationLabel, setLocationLabel] = useState('home')
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationModalMode, setLocationModalMode] = useState('new')
    const [locationQuery, setLocationQuery] = useState('')
    const [streetQuery, setStreetQuery] = useState('')

    const categoryId = leafCategory?.category_id
    const leafSlug = String(leafCategory?.slug || '').trim()

    const jobsBranchKind = useMemo(() => resolveJobsBranchKind(rootCategory, pathNodes), [rootCategory, pathNodes])
    const titleFieldLabel = jobsBranchKind === 'recruiters' ? 'Head line' : jobsBranchKind === 'seekers' ? 'Job title' : 'Title'
    const descriptionFieldLabel =
        jobsBranchKind === 'recruiters' ? 'Cover letter' : jobsBranchKind === 'seekers' ? 'Job description' : 'Description'
    const showGuidelinesAndTermsBlock = jobsBranchKind !== 'recruiters'

    const needsJobRoles = useMemo(() => customFields.some((f) => f._jobRolesFromApi), [customFields])

    useEffect(() => {
        customFieldsRef.current = customFields
    }, [customFields])

    useEffect(() => {
        setSlug(generateSlug(title))
    }, [title])

    useEffect(() => {
        if (!editingItemId || !editItemData) return
        const item = editItemData || {}
        const itemTitle = String(item?.name || item?.title || '').trim()
        const itemSlug = String(item?.slug || '').trim()
        const itemDescription = String(item?.description || '').trim()
        const itemAddress = String(item?.address || '').trim()
        const itemLat = Number(item?.latitude)
        const itemLng = Number(item?.longitude)

        setTitle(itemTitle)
        setSlug(itemSlug || generateSlug(itemTitle))
        setDescription(itemDescription)
        setLocationQuery(itemAddress)
        setStreetQuery('')
        setLocationLabel(itemAddress ? 'home' : '')
        if (Number.isFinite(itemLat) && Number.isFinite(itemLng)) {
            setPosition({ lat: itemLat, lng: itemLng })
        }
    }, [editingItemId, editItemData])

    useEffect(() => {
        if (!editingItemId || !editItemData || customFields.length === 0) return
        const customFieldValueMap = extractEditCustomFieldMap(editItemData)
        if (Object.keys(customFieldValueMap).length === 0) return

        setExtraDetails((prev) => {
            const next = { ...prev }
            customFields.forEach((field) => {
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
                if (field.type === 'fileinput') {
                    const fileUrl = Array.isArray(parsed) ? parsed[0] : parsed
                    if (fileUrl && typeof fileUrl === 'string') {
                        setFilePreviews((old) => ({
                            ...old,
                            [field.id]: {
                                url: fileUrl,
                                isPdf: /\.pdf$/i.test(fileUrl),
                                isImage: /\.(jpe?g|png|svg)$/i.test(fileUrl),
                            },
                        }))
                    }
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
    }, [editingItemId, editItemData, customFields])

    useEffect(() => {
        if (categoryId == null) return
        let cancelled = false
        setFieldsLoading(true)
        setFieldsError(null)
        getCustomFieldsApi
            .getCustomFieldsByCategoryId({ category_id: categoryId })
            .then((res) => {
                const { categoryIds, fields } = parseCustomFieldsByCategoryResponse(res)
                if (cancelled) return
                setCategoryIdsFromApi(categoryIds)
                setCustomFields(fields)
                setExtraDetails(initExtraDetailsFromFields(fields))
                setJobRolesOptionsByFieldId({})
                setJobRolesError(null)
            })
            .catch((err) => {
                if (!cancelled) setFieldsError(err)
            })
            .finally(() => {
                if (!cancelled) setFieldsLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [categoryId])

    useEffect(() => {
        if (!leafSlug || !needsJobRoles) return
        let cancelled = false
        setJobRolesLoading(true)
        setJobRolesError(null)
        jobRolesApi
            .getByCategorySlug({ category_slug: leafSlug })
            .then((res) => {
                const labels = parseJobRolesPayload(res)
                if (cancelled) return
                const targets = customFieldsRef.current.filter((f) => f._jobRolesFromApi)
                setJobRolesOptionsByFieldId(() => {
                    const next = {}
                    targets.forEach((t) => {
                        next[t.id] = labels
                    })
                    return next
                })
            })
            .catch((err) => {
                if (!cancelled) {
                    setJobRolesError(err)
                    toast.error(t('somethingWentWrong') || 'Could not load job roles.')
                }
            })
            .finally(() => {
                if (!cancelled) setJobRolesLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [leafSlug, needsJobRoles, categoryId])

    /** When job-roles options load, move saved free-text values off the dropdown into the custom input. */
    useEffect(() => {
        if (!needsJobRoles || jobRolesLoading) return
        const targets = customFields.filter((f) => f._jobRolesFromApi)
        if (targets.length === 0) return

        setExtraDetails((prev) => {
            let changed = false
            const next = { ...prev }
            for (const field of targets) {
                const id = field.id
                if (!Object.prototype.hasOwnProperty.call(jobRolesOptionsByFieldId, id)) {
                    continue
                }
                const opts = jobRolesOptionsByFieldId[id]
                if (!Array.isArray(opts)) continue

                const customKey = `${id}_custom`
                const rawList = String(next[id] ?? '').trim()
                const rawCustom = String(next[customKey] ?? '').trim()
                if (!rawList) continue

                if (opts.length === 0) {
                    if (!rawCustom) {
                        next[id] = ''
                        next[customKey] = rawList
                        changed = true
                    }
                    continue
                }

                if (!opts.includes(rawList) && !rawCustom) {
                    next[id] = ''
                    next[customKey] = rawList
                    changed = true
                }
            }
            return changed ? next : prev
        })
    }, [jobRolesOptionsByFieldId, jobRolesLoading, customFields, needsJobRoles])

    const breadcrumbNodes =
        Array.isArray(pathNodes) && pathNodes.length > 0
            ? pathNodes
            : [{ name: rootCategory?.name || pathNames[0] || 'Category' }, { name: leafCategory?.name || pathNames[pathNames.length - 1] || '' }].filter(
                  (n) => n.name
              )

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

    const handleCustomFile = (id, file) => {
        if (!file) return
        if (file.size > CUSTOM_FILE_MAX_BYTES) {
            toast.error(t('fileTooLarge') || 'File must be below 5MB.')
            return
        }
        const field = customFields.find((f) => f.id === id)
        const isCv = field && isCvUploadField(field)
        const allowed = isCv ? /\.(jpg|jpeg|svg|png|pdf|doc|docx)$/i : /\.(pdf|doc|docx)$/i
        if (!allowed.test(file.name)) {
            toast.error(t('notAllowedFile'))
            return
        }
        setFilePreviews((prev) => {
            const old = prev[id]?.url
            if (old) URL.revokeObjectURL(old)
            const fileUrl = URL.createObjectURL(file)
            return {
                ...prev,
                [id]: {
                    url: fileUrl,
                    isPdf: /\.pdf$/i.test(file.name),
                    isImage: /\.(jpe?g|png|svg)$/i.test(file.name),
                },
            }
        })
        setExtraDetails((prev) => ({ ...prev, [id]: file }))
    }

    const clearCustomFile = (id) => {
        setFilePreviews((prev) => {
            const old = prev[id]?.url
            if (old) URL.revokeObjectURL(old)
            const next = { ...prev }
            delete next[id]
            return next
        })
        setExtraDetails((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    const handleCheckboxChange = (id, value, checked) => {
        setExtraDetails((prev) => {
            const current = Array.isArray(prev[id]) ? prev[id] : []
            const next = checked ? [...current, value] : current.filter((v) => v !== value)
            return { ...prev, [id]: next }
        })
    }

    const handleChange = (id, value) => {
        setExtraDetails((prev) => ({ ...prev, [id]: value !== null && value !== undefined ? value : '' }))
    }

    const handleMultiselectDropdownChange = (id, next) => {
        setExtraDetails((prev) => ({ ...prev, [id]: Array.isArray(next) ? next : [] }))
    }

    const renderCustomField = (field) => {
        const { id, name, type, required, values, min_length, max_length: maxLen } = field
        const currentValue = extraDetails[id]
        const dropdownOptions = field._jobRolesFromApi ? jobRolesOptionsByFieldId[id] ?? [] : values || []
        const jobRolesDropdownBusy = field._jobRolesFromApi && jobRolesLoading

        switch (type) {
            case 'text':
                return (
                    <FloatingInput
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        value={currentValue ?? ''}
                        onChange={(v) => handleChange(id, v)}
                        type="text"
                        maxLength={maxLen || undefined}
                    />
                )
            case 'number':
                return (
                    <FloatingInput
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        value={currentValue ?? ''}
                        onChange={(v) => handleChange(id, v)}
                        type="text"
                        inputMode="decimal"
                        maxLength={maxLen || undefined}
                    />
                )
            case 'textbox':
                return (
                    <FloatingTextArea
                        id={`cf-${id}`}
                        required={!!required}
                        label={name}
                        value={currentValue ?? ''}
                        maxLength={maxLen}
                        onChange={(v) => handleChange(id, v)}
                    />
                )
            case 'fileinput': {
                const fp = filePreviews[id]?.url
                const fileObj = extraDetails[id] instanceof File ? extraDetails[id] : null
                const cvField = isCvUploadField(field)
                return (
                    <CustomFieldFileUpload
                        fieldId={id}
                        label={name}
                        required={!!required}
                        previewUrl={fp}
                        isImage={!!filePreviews[id]?.isImage}
                        file={fileObj}
                        onPick={(f) => handleCustomFile(id, f)}
                        onClear={() => clearCustomFile(id)}
                        accept={cvField ? UNIVERSAL_CUSTOM_FILE_ACCEPT : JOBS_CUSTOM_FIELD_ACCEPT}
                        formatHint={cvField ? 'JPG, PNG, SVG, PDF, DOC, DOCX — below 5MB' : 'PDF, DOC, DOCX — below 5MB'}
                    />
                )
            }
            case 'dropdown':
                if (field._jobRolesFromApi) {
                    const customKey = `${id}_custom`
                    return (
                        <div className="flex flex-col gap-[10px]">
                            <FloatingSelectField
                                id={`cf-${id}`}
                                label={name}
                                required={!!required}
                                value={currentValue ?? ''}
                                onChange={(v) => handleChange(id, v)}
                                options={dropdownOptions}
                                disabled={jobRolesDropdownBusy}
                            />
                            <FloatingInput
                                id={`cf-${id}-custom`}
                                label={t('jobRoleEnterOwn')}
                                required={false}
                                value={extraDetails[customKey] ?? ''}
                                onChange={(v) => handleChange(customKey, v)}
                                type="text"
                                maxLength={maxLen}
                            />
                            {required ? (
                                <p className="text-[12px] font-[Inter-Regular] text-[#6B7280]">{t('jobRoleSelectOrTypeHint')}</p>
                            ) : null}
                        </div>
                    )
                }
                return (
                    <FloatingSelectField
                        id={`cf-${id}`}
                        label={name}
                        required={!!required}
                        value={currentValue ?? ''}
                        onChange={(v) => handleChange(id, v)}
                        options={dropdownOptions}
                        disabled={jobRolesDropdownBusy}
                    />
                )
            case 'button':
                return (
                    <ButtonChipField
                        ariaLabel={name}
                        options={values || []}
                        value={currentValue ?? ''}
                        required={!!required}
                        onChange={(v) => handleChange(id, v)}
                    />
                )
            case 'multiselect_dropdown':
                return (
                    <MultiSelectCheckboxDropdown
                        fieldId={`cf-${id}`}
                        label={name}
                        required={!!required}
                        options={values || []}
                        value={Array.isArray(currentValue) ? currentValue : []}
                        onChange={(next) => handleMultiselectDropdownChange(id, next)}
                    />
                )
            case 'checkbox':
                return (
                    <div className="flex flex-col gap-[8px]">
                        {(values || []).map((val) => (
                            <Checkbox
                                key={val}
                                checked={Array.isArray(extraDetails[id]) && extraDetails[id].includes(val)}
                                onChange={(e) => handleCheckboxChange(id, val, e.target.checked)}
                            >
                                {val}
                            </Checkbox>
                        ))}
                    </div>
                )
            case 'radio':
                return (
                    <Radio.Group
                        className="flex flex-col gap-[8px]"
                        value={currentValue}
                        onChange={(e) => handleChange(id, e.target.value)}
                    >
                        {(values || []).map((opt) => (
                            <Radio key={opt} value={opt}>
                                {opt}
                            </Radio>
                        ))}
                    </Radio.Group>
                )
            default:
                return (
                    <input
                        id={`cf-${id}`}
                        type="text"
                        name={name}
                        value={currentValue ?? ''}
                        placeholder={`${t('enter')} ${name}`}
                        onChange={(e) => handleChange(id, e.target.value)}
                        className="w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[14px] text-[14px] outline-none focus:border-[#23262A]"
                    />
                )
        }
    }

    const handleSubmit = async () => {
        if (!isLogin()) {
            toast.error(t('loginFirst'))
            return
        }

        if (!String(title).trim()) {
            toast.error(t('titleRequired'))
            return
        }
        if (!String(description).trim()) {
            toast.error(t('descriptionRequired'))
            return
        }
        const slugTrim = String(slug || '').trim()
        if (slugTrim && !/^[a-z0-9-]+$/.test(slugTrim)) {
            toast.error(t('addValidSlug'))
            return
        }

        const phone =
            String(user?.phone || user?.mobile || user?.phonenumber || user?.phone_number || '')
                .trim()

        if (!validateExtraDetails(customFields, extraDetails, filePreviews)) return

        const transformedCustomFields = {}
        const customFieldFiles = []
        Object.entries(extraDetails).forEach(([key, value]) => {
            if (typeof key === 'string' && key.endsWith('_custom')) return

            const currentField = customFields.find((cf) => String(cf.id) === String(key))

            if (currentField?._jobRolesFromApi) {
                const fromList = value !== null && value !== undefined ? String(value).trim() : ''
                const other = String(extraDetails[`${key}_custom`] ?? '').trim()
                const merged = fromList || other
                if (merged) {
                    transformedCustomFields[key] = [merged]
                }
                return
            }

            if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
                customFieldFiles.push({ key, files: value })
            } else if (value !== '' && value !== null && value !== undefined) {
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

        const catId = leafCategory.category_id
        const allCategoryIds = categoryIdsFromApi.length > 0 ? categoryIdsFromApi.join(',') : String(catId)

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

            const locationParts = resolveAreaAndBuilding({
                locationQuery,
                streetQuery,
                country: resolved.country,
                state: resolved.state,
                city: resolved.city,
                address: resolved.address || addressLine,
            })

            const payload = {
                name: title.trim(),
                slug: slugTrim || generateSlug(title),
                description: description.trim(),
                category_id: catId,
                all_category_ids: allCategoryIds,
                price: '0',
                contact: phone,
                custom_fields: transformedCustomFields,
                gallery_images: [],
                custom_field_files: customFieldFiles,
                show_only_to_premium: 1,
                address: resolved.address || addressLine || undefined,
                latitude: lat,
                longitude: lng,
                country: resolved.country || undefined,
                state: resolved.state || undefined,
                city: resolved.city || undefined,
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
                toast.success(res?.data?.message || t('success') || 'Success')
                const createdItemId = editingItemId ?? res?.data?.data?.[0]?.id ?? res?.data?.data?.id ?? null
                onComplete?.({ itemId: createdItemId })
            } else {
                toast.error(res?.data?.message || t('somethingWentWrong'))
            }
        } catch (e) {
            console.error(e)
            toast.error(t('somethingWentWrong'))
        } finally {
            setSubmitting(false)
        }
    }

    const isEditMode = Boolean(editingItemId)

    return (
        <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
            <div className="mb-[12px] text-center">
                <h1 className="mb-[14px] text-center text-[20px] font-[Inter-Bold] text-[#23262A]">You&apos;re almost there!</h1>
                <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A] w-[380px] mx-auto max-sm:w-full">
                    Include as much detail as possible for your job listing.
                </p>
            </div>

            <nav className="mb-[16px] flex flex-wrap items-center gap-[6px]" aria-label="Breadcrumb">
                {breadcrumbNodes.map((node, idx) => {
                    const isLast = idx === breadcrumbNodes.length - 1
                    const label = getJobsBreadcrumbLabel(node) || node?.name || node?.label || 'Category'
                    return (
                        <React.Fragment key={node?.category_id != null ? `bc-${node.category_id}` : `bc-${idx}-${label}`}>
                            {idx > 0 ? <RightArrowIcon className="h-[14px] w-[14px]" /> : null}
                            {isLast || isEditMode ? (
                                <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (node?.category_id != null && onNavigateToCategory) {
                                            onNavigateToCategory(node)
                                            return
                                        }
                                        onBack?.()
                                    }}
                                    className="cursor-pointer border-0 bg-transparent p-0 text-[14px] font-[Inter-Regular] text-[#4294ff]"
                                >
                                    {label}
                                </button>
                            )}
                        </React.Fragment>
                    )
                })}
            </nav>

            <div className="relative flex flex-col gap-[24px] pb-[60px]">
                <FloatingInput id="ad-title" label={titleFieldLabel} required value={title} onChange={setTitle} />

                <FloatingTextArea
                    id="ad-desc"
                    label={descriptionFieldLabel}
                    required
                    value={description}
                    onChange={setDescription}
                    maxLength={DESC_MAX}
                />

                {fieldsLoading && <p className="text-[14px] text-[#666]">Loading custom fields…</p>}
                {fieldsError && !fieldsLoading && (
                    <p className="text-[14px] text-[#DC0000]">
                        Could not load custom fields. You can still submit once they are available again.
                    </p>
                )}
                {jobRolesLoading ? <p className="text-[14px] text-[#666]">Loading job roles…</p> : null}
                {!fieldsLoading &&
                    customFields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-[6px]">
                            {field.type === 'button' || field.type === 'checkbox' || field.type === 'radio' ? (
                                <label
                                    className={`text-[14px] text-[#23262A] ${field.type === 'button' ? 'font-[Inter-Medium]' : 'font-[Inter-Medium]'}`}
                                    htmlFor={field.type === 'button' ? undefined : `cf-${field.id}`}
                                >
                                    {field.name}
                                    {field.required ? (
                                        <span>
                                            {' '}
                                            *
                                        </span>
                                    ) : null}
                                </label>
                            ) : null}
                            {renderCustomField(field)}
                        </div>
                    ))}

                <div className="rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                    <div className="mb-[10px] flex items-center justify-between">
                        <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">Home</h3>
                        <button
                            type="button"
                            onClick={handleEditLocationModal}
                            className="flex cursor-pointer items-center gap-[8px]"
                        >
                            <Image src={editIcon} alt="edit" width={14} height={14} />
                            <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Edit</p>
                        </button>
                    </div>

                    <p className="mb-[12px] text-[14px] font-[Inter-Regular] text-[#23262A]">{[streetQuery, locationQuery].map((v) => String(v || '').trim()).filter(Boolean).join(' - ') || 'No location selected'}</p>
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
                                onClick={(e) => {
                                    if (!e.latLng) return
                                    handleMapCoordsSelect(e.latLng.lat(), e.latLng.lng())
                                }}
                                onZoomChanged={() => {
                                    if (!mapRef.current) return
                                    setMapZoom(mapRef.current.getZoom())
                                }}
                                options={{
                                    disableDefaultUI: true,
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
                                <Image src={plus} alt="plus" width={26} height={26} />
                            </button>
                            <button
                                type="button"
                                onClick={zoomOut}
                                className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center"
                                aria-label="Zoom out"
                            >
                                <Image src={minus} alt="minus" width={26} height={26} />
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

                    <div className="mb-[6px] flex flex-wrap gap-[8px]">
                        <button
                            type="button"
                            onClick={handleOpenLocationModal}
                            className={`flex cursor-pointer items-center gap-[8px] rounded-[8px] border p-[8px_12px] ${
                                locationLabel === 'new' ? 'border-[#DC0000] bg-[#FEF2F2]' : 'border-[#DC0000] bg-white'
                            }`}
                        >
                            <Image src={plusicon} alt="plus" width={13} height={13} />
                            <p className="text-[14px] font-[Inter-Medium] text-[#DC0000]">New Location</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocationLabel((prev) => (prev === 'home' ? '' : 'home'))}
                            className={`flex cursor-pointer items-center gap-[8px] rounded-[8px] border p-[8px_12px] ${
                                locationLabel === 'home' ? 'border-[rgba(0,0,0,0.08)] bg-[#00000014]' : 'border-[#23262A] bg-white'
                            }`}
                        >
                            <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Home</p>
                            {locationLabel === 'home' ? <CloseIcon className="h-[8px] w-[8px]" fill="#6B7280" fillOpacity="1" /> : null}
                        </button>
                    </div>
                </div>

                {showGuidelinesAndTermsBlock ? (
                    <div className="flex flex-col gap-[6px] rounded-[8px] bg-[#F3F4F6] p-[14px]">
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
                ) : null}

                <div className="fixed bottom-[0px] left-0 right-0 z-[100] mx-auto flex w-[478px] max-sm:w-full flex-col gap-[10px] bg-white p-[20px]">
                    <button
                        type="submit"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="w-full cursor-pointer rounded-[8px] bg-[#DC0000] py-[14px] text-[14px] font-[Inter-Regular] text-white transition-opacity "
                    >
                        {submitting ? 'Submitting…' : 'Next'}
                    </button>
                </div>
            </div>

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
