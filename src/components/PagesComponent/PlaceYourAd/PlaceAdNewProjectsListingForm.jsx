'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import toast from 'react-hot-toast'
import PlaceAdUniversalListingForm from './PlaceAdUniversalListingForm'
import { FormDownArrowIcon } from '@/components/CustomFile/icons'
import { propertyPlanApi } from '@/utils/api'

const emptyPlan = () => ({
    category: '',
    layout_type: '',
    size_sqft: '',
    price: '',
    floor_plan: null,
})

const DEFAULT_UNIT_TYPES = () => []

function toFiniteNumberOrOriginal(value) {
    if (value === '' || value === null || value === undefined) return value
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
}

function normalizeUnitTypesForPayload(unitTypes) {
    if (!Array.isArray(unitTypes)) return []
    return unitTypes.map((ut) => {
        const plans = Array.isArray(ut?.plans) ? ut.plans : []
        return {
            ...ut,
            plans: plans.map((plan) => ({
                ...plan,
                size_sqft: toFiniteNumberOrOriginal(plan?.size_sqft),
                price: toFiniteNumberOrOriginal(plan?.price),
            })),
        }
    })
}

function parsePropertyPlansResponse(response) {
    const data = response?.data?.data
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
}

function normalizeUnitTypeLabel(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    return raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function propertyPlansToUnitTypes(planRows) {
    const grouped = new Map()
    ;(Array.isArray(planRows) ? planRows : []).forEach((row) => {
        const type = normalizeUnitTypeLabel(row?.unit_type)
        if (!type) return
        const current = grouped.get(type) || []
        current.push({
            category: row?.category != null ? String(row.category) : '',
            layout_type: row?.layout_type != null ? String(row.layout_type) : '',
            size_sqft: row?.size_sqft != null ? String(row.size_sqft) : '',
            price: row?.price != null ? String(row.price) : '',
            floor_plan: row?.floor_plan || null,
        })
        grouped.set(type, current)
    })

    return Array.from(grouped.entries()).map(([type, plans]) => ({
        type,
        plans: plans.length > 0 ? plans : [emptyPlan()],
    }))
}

/** Matches API “Unit Types” custom field label. */
export function isNewProjectsUnitTypesCustomField(field) {
    return /\bunit\s*types?\b/i.test(String(field?.name || ''))
}

export function validateNewProjectUnitTypes(values) {
    const unitTypes = values?.unit_types
    if (!Array.isArray(unitTypes)) return true
    for (const ut of unitTypes) {
        const plans = Array.isArray(ut?.plans) ? ut.plans : []
        for (const p of plans) {
            if (!String(p?.layout_type ?? '').trim()) {
                toast.error('Layout type is required for every plan.')
                return false
            }
            if (!String(p?.size_sqft ?? '').trim()) {
                toast.error('Size (sq ft) is required for every plan.')
                return false
            }
        }
    }
    return true
}

const slugifyType = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

const BEDS_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+']

function getCategoryPreset(typeLabel) {
    const key = slugifyType(typeLabel)
    return { mode: 'select', options: BEDS_OPTIONS, key }
}

function getSelectedUnitTypeValues(customFields, extraDetails) {
    const unitTypeField = (customFields || []).find(
        (f) => isNewProjectsUnitTypesCustomField(f) && String(f.type || '').toLowerCase() === 'multiselect_dropdown'
    )
    if (!unitTypeField) return []
    const picked = extraDetails?.[unitTypeField.id]
    if (!Array.isArray(picked)) return []
    return picked.map((v) => String(v || '').trim()).filter(Boolean)
}

function PlanFloorPlanCell({ unitIndex, planIndex }) {
    const { control } = useFormContext()
    return (
        <Controller
            control={control}
            name={`unit_types.${unitIndex}.plans.${planIndex}.floor_plan`}
            render={({ field: { value, onChange } }) => (
                <label className="flex cursor-pointer flex-col gap-[4px]">
                    <span className="sr-only">Floor plan</span>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                        className="max-w-[180px] cursor-pointer text-[12px] font-[Inter-Regular] text-[#23262A] file:mr-[8px] file:cursor-pointer file:rounded-[6px] file:border file:border-[rgba(143,143,143,0.45)] file:bg-white file:px-[10px] file:py-[6px] file:text-[12px]"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            onChange(f)
                            e.target.value = ''
                        }}
                    />
                    {value instanceof File ? (
                        <span className="truncate text-[11px] font-[Inter-Regular] text-[#6B7280]" title={value.name}>
                            {value.name}
                        </span>
                    ) : value ? (
                        <span className="truncate text-[11px] font-[Inter-Regular] text-[#6B7280]" title={String(value)}>
                            {String(value)}
                        </span>
                    ) : null}
                </label>
            )}
        />
    )
}

function BedsDropdown({ name, options = [] }) {
    const { control } = useFormContext()
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onDocClick = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onEsc = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [open])

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { value, onChange } }) => (
                <div ref={rootRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex h-[40px] w-full items-center justify-between rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[10px] text-left text-[13px] text-[#23262A] outline-none"
                    >
                        <span className={`${value ? 'text-[#23262A]' : 'text-[#9CA3AF]'}`}>
                            {value || 'Select'}
                        </span>
                        <FormDownArrowIcon
                            className={`h-[16px] w-[16px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                            fill="#8F8F8F"
                        />
                    </button>
                    {open ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                            <div className="max-h-[180px] overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('')
                                        setOpen(false)
                                    }}
                                    className="block w-full cursor-pointer px-[10px] py-[8px] text-left text-[13px] text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
                                >
                                    Select
                                </button>
                                {options.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt)
                                            setOpen(false)
                                        }}
                                        className={`block w-full cursor-pointer px-[10px] py-[8px] text-left text-[13px] transition-colors hover:bg-[#F9FAFB] ${
                                            String(value || '') === String(opt) ? 'bg-[#F3F4F6] text-[#23262A]' : 'text-[#23262A]'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        />
    )
}

function UnitTypeAccordion({ unitIndex, title }) {
    const { control, register } = useFormContext()
    const { fields, append, remove } = useFieldArray({
        control,
        name: `unit_types.${unitIndex}.plans`,
    })
    const [expanded, setExpanded] = useState(true)
    const [openPlanIndexes, setOpenPlanIndexes] = useState([0])
    const preset = getCategoryPreset(title)

    useEffect(() => {
        if (fields.length === 0) {
            setOpenPlanIndexes([])
            return
        }
        setOpenPlanIndexes((prev) => {
            const normalized = (prev || [])
                .filter((i) => Number.isInteger(i) && i >= 0 && i < fields.length)
                .sort((a, b) => a - b)
            if (normalized.length === 0) return [Math.min(fields.length - 1, 0)]
            return normalized
        })
    }, [fields.length])

    return (
        <div className="overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white">
            <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="flex w-full cursor-pointer items-center justify-between gap-[12px] border-b border-[rgba(143,143,143,0.25)] bg-[#FAFAFA] px-[16px] py-[14px] text-left transition-colors hover:bg-[#F3F4F6]"
                aria-expanded={expanded}
            >
                <span className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{title}</span>
                <FormDownArrowIcon
                    className={`h-[22px] w-[22px] shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    fill="#8F8F8F"
                />
            </button>

            {expanded ? (
                <div className="p-[16px]">
                    <div className="mb-[12px] flex flex-col gap-[10px]">
                        {fields.map((row, planIndex) => (
                            <div
                                key={row.id}
                                className="rounded-[6px] border border-[rgba(143,143,143,0.3)] bg-[#FAFAFA] p-[12px]"
                            >
                                <div className="mb-[10px] flex items-center justify-between gap-[10px]">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenPlanIndexes((prev) =>
                                                prev.includes(planIndex)
                                                    ? prev.filter((i) => i !== planIndex)
                                                    : [...prev, planIndex].sort((a, b) => a - b)
                                            )
                                        }
                                        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white px-[10px] py-[8px] text-left"
                                    >
                                        <span className="truncate text-[13px] font-[Inter-Medium] text-[#23262A]">
                                            {`Plan ${planIndex + 1}`}
                                        </span>
                                        <FormDownArrowIcon
                                            className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${openPlanIndexes.includes(planIndex) ? 'rotate-180' : ''}`}
                                            fill="#8F8F8F"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={fields.length <= 1}
                                        onClick={() => {
                                            remove(planIndex)
                                            setOpenPlanIndexes((prev) =>
                                                prev
                                                    .filter((idx) => idx !== planIndex)
                                                    .map((idx) => (idx > planIndex ? idx - 1 : idx))
                                            )
                                        }}
                                        className="cursor-pointer rounded-[6px] border border-[#DC0000] bg-white px-[10px] py-[8px] text-[12px] font-[Inter-Medium] text-[#DC0000] transition-colors hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:text-[#9CA3AF]"
                                    >
                                        Remove
                                    </button>
                                </div>

                                {openPlanIndexes.includes(planIndex) ? (
                                    <>
                                        <div className="mb-[10px] grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[12px] font-[Inter-Medium] text-[#23262A]">Beds</label>
                                                <BedsDropdown
                                                    name={`unit_types.${unitIndex}.plans.${planIndex}.category`}
                                                    options={preset.options || []}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[12px] font-[Inter-Medium] text-[#23262A]">
                                                    Layout type <span className="text-[#DC0000]">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Type 1"
                                                    {...register(`unit_types.${unitIndex}.plans.${planIndex}.layout_type`)}
                                                    className="h-[40px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[10px] text-[13px] outline-none focus:border-[#23262A]"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[12px] font-[Inter-Medium] text-[#23262A]">
                                                    Size (sq ft) <span className="text-[#DC0000]">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="1200"
                                                    {...register(`unit_types.${unitIndex}.plans.${planIndex}.size_sqft`)}
                                                    className="h-[40px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[10px] text-[13px] outline-none focus:border-[#23262A]"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[12px] font-[Inter-Medium] text-[#23262A]">Price (optional)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="—"
                                                    {...register(`unit_types.${unitIndex}.plans.${planIndex}.price`)}
                                                    className="h-[40px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[10px] text-[13px] outline-none focus:border-[#23262A]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-end justify-between gap-[10px]">
                                            <div className="min-w-[200px] flex-1">
                                                <p className="mb-[6px] text-[12px] font-[Inter-Medium] text-[#23262A]">Floor plan</p>
                                                <PlanFloorPlanCell unitIndex={unitIndex} planIndex={planIndex} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-[12px] font-[Inter-Regular] text-[#6B7280]">
                                        Collapsed
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            append(emptyPlan())
                            setOpenPlanIndexes((prev) => [...prev, fields.length].sort((a, b) => a - b))
                        }}
                        className="cursor-pointer rounded-[8px] border border-[#23262A] bg-white px-[14px] py-[8px] text-[13px] font-[Inter-Medium] text-[#23262A] transition-colors hover:bg-[#F9FAFB]"
                    >
                        + Add Plan
                    </button>
                </div>
            ) : null}
        </div>
    )
}

function UnitTypesPlansDynamicBlock({ customFields, extraDetails }) {
    const selectedTypeValues = useMemo(
        () => getSelectedUnitTypeValues(customFields, extraDetails),
        [customFields, extraDetails]
    )
    const { control, getValues } = useFormContext()
    const { fields: unitTypeFields, replace } = useFieldArray({
        control,
        name: 'unit_types',
    })

    useEffect(() => {
        const selectedKeys = selectedTypeValues.map(slugifyType)
        const currentRows = Array.isArray(getValues('unit_types')) ? getValues('unit_types') : []
        if (selectedKeys.length === 0 && currentRows.length > 0) return
        const currentByKey = new Map(currentRows.map((row) => [slugifyType(row?.type), row]))
        const nextRows = selectedTypeValues.map((typeLabel) => {
            const key = slugifyType(typeLabel)
            const existing = currentByKey.get(key)
            if (existing && Array.isArray(existing.plans) && existing.plans.length > 0) {
                return { ...existing, type: typeLabel }
            }
            return { type: typeLabel, plans: [emptyPlan()] }
        })
        const currentKeys = currentRows.map((row) => slugifyType(row?.type))
        const isSame =
            currentKeys.length === selectedKeys.length &&
            currentKeys.every((k, idx) => k === selectedKeys[idx])
        if (!isSame) replace(nextRows)
    }, [selectedTypeValues, getValues, replace])

    if (selectedTypeValues.length === 0 && unitTypeFields.length === 0) return null

    return (
        <div className="flex flex-col gap-[16px]">
            <div>
                <h3 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">Unit types &amp; plans</h3>
                <p className="mt-[4px] text-[13px] font-[Inter-Regular] text-[#6B7280]">
                    Based on selected Unit Types. Add plans per type. Layout type and size (sq ft) are required; price is optional.
                </p>
            </div>
            <div className="flex flex-col gap-[12px]">
                {unitTypeFields.map((ut, index) => (
                    <UnitTypeAccordion
                        key={ut.id}
                        unitIndex={index}
                        title={ut.type}
                    />
                ))}
            </div>
        </div>
    )
}

function NewProjectsListingFormInner({ onComplete, ...rest }) {
    const methods = useForm({
        defaultValues: {
            unit_types: DEFAULT_UNIT_TYPES(),
        },
        mode: 'onSubmit',
    })

    const { getValues, setValue } = methods

    useEffect(() => {
        const itemId = rest?.editingItemId
        if (!itemId) return
        let cancelled = false
        propertyPlanApi
            .getPropertyPlans({ item_id: itemId })
            .then((response) => {
                if (cancelled) return
                const unitTypes = propertyPlansToUnitTypes(parsePropertyPlansResponse(response))
                if (unitTypes.length > 0) {
                    setValue('unit_types', unitTypes, { shouldDirty: false, shouldValidate: false })
                }
            })
            .catch(() => {
                if (!cancelled) toast.error('Could not load unit types & plans.')
            })
        return () => {
            cancelled = true
        }
    }, [rest?.editingItemId, setValue])

    const validateExtraBeforeSubmit = useCallback(() => validateNewProjectUnitTypes(getValues()), [getValues])

    const getExtraAddItemPayload = useCallback(
        () => ({ unit_types: normalizeUnitTypesForPayload(getValues('unit_types')) }),
        [getValues]
    )

    const listingAppendSections = useCallback(
        ({ customFields, extraDetails }) => (
            <UnitTypesPlansDynamicBlock customFields={customFields} extraDetails={extraDetails} />
        ),
        []
    )

    return (
        <FormProvider {...methods}>
            <PlaceAdUniversalListingForm
                {...rest}
                onComplete={onComplete}
                listingAppendSections={listingAppendSections}
                listingAppendSectionsAfterField={(field) =>
                    isNewProjectsUnitTypesCustomField(field) &&
                    String(field?.type || '').toLowerCase() === 'multiselect_dropdown'
                }
                validateExtraBeforeSubmit={validateExtraBeforeSubmit}
                getExtraAddItemPayload={getExtraAddItemPayload}
            />
        </FormProvider>
    )
}

/**
 * New Projects: uses API "Unit Types" multiselect custom field as the source of truth,
 * then renders nested plans (useFieldArray) for each selected type and submits multipart unit_types[].
 */
export default function PlaceAdNewProjectsListingForm({ onComplete, leafCategory, ...rest }) {
    return (
        <NewProjectsListingFormInner
            key={leafCategory?.category_id ?? 'new-project'}
            onComplete={onComplete}
            leafCategory={leafCategory}
            {...rest}
        />
    )
}
