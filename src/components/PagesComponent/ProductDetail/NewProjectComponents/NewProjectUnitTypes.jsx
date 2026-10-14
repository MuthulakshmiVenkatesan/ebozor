/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { DownArrowIcon } from '@/components/CustomFile/icons'
import { propertyPlanApi } from '@/utils/api'
import ApartmentIcon from '../../../../../public/assets/img/icons/apartmenticon.svg'
import floorplanicon from '../../../../../public/assets/img/icons/floorplanicon.svg'
import NewProjectFloorPlanModal from './NewProjectFloorPlanModal'

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function formatSqft(n) {
    if (n == null || n === '') return '—'
    const raw = String(n).trim()
    if (!raw) return '—'
    if (raw.includes('-')) return raw
    const num = typeof n === 'number' ? n : parseInt(raw.replace(/,/g, ''), 10)
    if (Number.isNaN(num)) return String(n)
    return num.toLocaleString('en-US')
}

function formatPriceCell(price) {
    if (price == null || price === '' || price === '-') return { text: '—', bold: false }
    const s = String(price).trim()
    if (!s || s === '-') return { text: '—', bold: false }
    return { text: s, bold: true }
}

function formatAed(value) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) return '—'
    return `AED ${numeric.toLocaleString('en-US')}`
}

function normalizeRow(raw) {
    const layoutLabel = pickString(raw.layoutLabel, raw.layout_type, raw.type, raw.name, raw.unit_type, 'Type')
    const sizeSqft = raw.sizeSqft ?? raw.size_sqft ?? raw.sqft ?? raw.area_sqft ?? raw.area
    const priceLabel =
        raw.priceLabel ??
        raw.price_label ??
        raw.price_display ??
        (raw.price != null && raw.price !== '' ? String(raw.price) : null)
    const floorPlanUrl = pickString(raw.floorPlanUrl, raw.floor_plan_url, raw.plan_url, raw.pdf_url)
    return { layoutLabel, sizeSqft, priceLabel, floorPlanUrl }
}

function normalizeGroup(raw) {
    const rawLabel = pickString(raw.groupLabel, raw.group_label, raw.bedroom_label, raw.category, 'Units')
    const numericCategory = Number(rawLabel)
    const groupLabel =
        Number.isFinite(numericCategory) && String(rawLabel).trim() !== ''
            ? `${numericCategory} ${numericCategory === 1 ? 'Bed' : 'Beds'}`
            : rawLabel
    const rows = Array.isArray(raw.rows) ? raw.rows.map(normalizeRow) : []
    return { groupLabel, rows }
}

function normalizeSection(raw) {
    const label = pickString(raw.label, raw.title, raw.name, raw.unit_type, 'Units')
    const fromPriceLabel =
        pickString(raw.fromPriceLabel, raw.from_price_label, raw.from_label) ||
        (raw.starting_price != null && raw.starting_price !== '' ? `From ${formatAed(raw.starting_price)}` : '')
    const categories = Array.isArray(raw.categories) ? raw.categories : []
    const groups = categories
        .map((cat) =>
            normalizeGroup({
                groupLabel: pickString(cat?.groupLabel, cat?.group_label, cat?.bedroom_label, cat?.category, 'Units'),
                rows: Array.isArray(cat?.plans) ? cat.plans : [],
            })
        )
        .filter((group) => group.rows.length > 0)
    return {
        id: pickString(raw.id, raw.slug, label.toLowerCase().replace(/\s+/g, '-')),
        label,
        fromPriceLabel,
        groups,
    }
}

function deriveFromPrice(groups) {
    let minK = Infinity
    for (const g of groups) {
        for (const r of g.rows || []) {
            const p = r.priceLabel
            if (!p || p === '-') continue
            const m = String(p).match(/([\d.]+)\s*K/i)
            if (m) minK = Math.min(minK, parseFloat(m[1]))
            const m2 = String(p).match(/([\d.]+)\s*M/i)
            if (m2) minK = Math.min(minK, parseFloat(m2[1]) * 1000)
        }
    }
    if (minK !== Infinity && minK < 1000) return `From AED ${minK % 1 === 0 ? minK : minK.toFixed(1)}K`
    if (minK !== Infinity) return `From AED ${(minK / 1000).toFixed(1)}M`
    return 'From AED —'
}

function getSectionsFromProduct(productData) {
    const raw =
        productData.unit_types_sections ||
        productData.unitTypesSections ||
        productData.unit_types ||
        productData.unitTypes ||
        productData.project_unit_types
    if (Array.isArray(raw) && raw.length) {
        return raw.map(normalizeSection).filter((s) => s.groups.length)
    }
    return []
}

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf('<link')
    const scriptIndex = payload.indexOf('<script')
    let cutIndex = -1
    if (debugAssetIndex >= 0 && scriptIndex >= 0) cutIndex = Math.min(debugAssetIndex, scriptIndex)
    else if (debugAssetIndex >= 0) cutIndex = debugAssetIndex
    else if (scriptIndex >= 0) cutIndex = scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch {
        return {}
    }
}

function UnitTypesSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {[0, 1].map((idx) => (
                <div key={idx} className="rounded-[12px] bg-[#F5F9FE] p-[20px_16px]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-[22px] w-[180px] animate-pulse rounded bg-[#dde3ea]" />
                        <div className="h-[20px] w-[120px] animate-pulse rounded bg-[#dde3ea]" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function UnitTable({ groups, onOpenFloorPlan }) {
    return (
        <div className="mt-[20px]">
            <div className="max-sm:-mx-1 max-sm:px-1">
                <div className="overflow-x-auto overflow-y-visible pb-2 [-webkit-overflow-scrolling:touch]">
                    <div className="min-w-[520px] sm:min-w-0">
                        <div className="grid grid-cols-[100px_1fr_100px_100px_72px] items-center bg-[#fff] p-[16px] rounded-[8px] mb-[16px]">
                            <div className="pl-1 sm:pl-2" />
                            <div className="text-[14px] font-[Inter-SemiBold] text-[#23262A] whitespace-nowrap">Layout type</div>
                            <div className="text-[14px] font-[Inter-SemiBold] text-[#23262A] whitespace-nowrap">Size (sqft)</div>
                            <div className="text-[14px] font-[Inter-SemiBold] text-[#23262A] whitespace-nowrap">Price (AED)</div>
                            <div className="text-center text-[14px] font-[Inter-SemiBold] text-[#23262A] whitespace-nowrap">Floor plan</div>
                        </div>

                        <div className="divide-y divide-[#F5F9FE] bg-[#fff] rounded-[8px]">
                            {groups.map((group) => (
                                <div key={group.groupLabel} className="flex min-h-0">
                                    <div className="flex w-[100px] shrink-0 items-start justify-start border-r-[2px] border-[#F5F9FE] p-[16px]">
                                        <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{group.groupLabel}</h4>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {group.rows.map((row, idx) => {
                                            const price = formatPriceCell(row.priceLabel)
                                            return (
                                                <div
                                                    key={`${group.groupLabel}-${row.layoutLabel}-${idx}`}
                                                    className="grid grid-cols-[1fr_100px_100px_72px] items-center border-t-[2px] border-[#F5F9FE] px-3 py-2.5 first:border-t-0 sm:px-4"
                                                >
                                                    <p className="min-w-0 truncate text-left text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                        {row.layoutLabel}
                                                    </p>
                                                    <p className="shrink-0 text-left text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                        {formatSqft(row.sizeSqft)}
                                                    </p>
                                                    <p
                                                        className={`shrink-0 text-left text-[14px] ${price.bold ? 'font-[Inter-Bold] text-[#23262A]' : 'font-[Inter-Regular] text-[#23262A]'}`}
                                                    >
                                                        {price.text}
                                                    </p>
                                                    <div className="flex shrink-0 justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                onOpenFloorPlan?.(row.floorPlanUrl || '')
                                                            }}
                                                            className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-[#E8F1FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A88EF]"
                                                            aria-label={`Floor plan ${row.layoutLabel}`}
                                                        >
                                                            <Image src={floorplanicon} alt="Floor plan" width={14} height={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function NewProjectUnitTypes({ productData = {} }) {
    const title = pickString(productData.title, productData.name, 'Project')
    const fallbackSections = useMemo(() => getSectionsFromProduct(productData), [productData])

    const [openId, setOpenId] = useState('')
    const [sections, setSections] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false)
    const [floorPlans, setFloorPlans] = useState([])
    const [floorPlanIndex, setFloorPlanIndex] = useState(0)

    useEffect(() => {
        const itemId = productData?.id ?? productData?.item_id ?? null
        if (!itemId) {
            setSections(fallbackSections)
            setIsLoading(false)
            return
        }

        let cancelled = false
        const run = async () => {
            setIsLoading(true)
            try {
                const response = await propertyPlanApi.getPropertyPlan({ item_id: itemId })
                const parsed = parseApiPayload(response?.data)
                const unitTypes = Array.isArray(parsed?.data?.unit_types) ? parsed.data.unit_types : []
                const mapped = unitTypes.map(normalizeSection).filter((section) => section.groups.length > 0)
                if (!cancelled) {
                    setSections(mapped)
                    setOpenId((prev) => (mapped.some((s) => s.id === prev) ? prev : ''))
                }
            } catch {
                if (!cancelled) {
                    setSections(fallbackSections)
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [productData?.id, productData?.item_id, fallbackSections])

    const openFloorPlanModal = (section, selectedUrl) => {
        const pickedUrl = pickString(selectedUrl)
        if (!pickedUrl) return
        setFloorPlans([pickedUrl])
        setFloorPlanIndex(0)
        setIsFloorPlanOpen(true)
    }

    if (!isLoading && !sections.length) return null

    return (
        <div className="w-full border-b border-[rgba(143,143,143,0.35)] bg-white py-[40px]">
            <div className="mb-[30px]">
                <h2 className="text-[24px] font-[Inter-Bold] leading-tight text-[#23262A] mb-[6px]">
                    Unit Types
                </h2>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Apartments in {title}
                </p>
            </div>
            {isLoading ? <UnitTypesSkeleton /> : <div className="flex flex-col gap-4">
                {sections.map((section) => {
                    const isOpen = openId === section.id
                    const fromRaw =
                        section.fromPriceLabel ||
                        (section.groups?.length ? deriveFromPrice(section.groups) : 'From AED —')
                    const fromMatch = String(fromRaw).match(/^From\s+(.+)$/i)
                    const fromBold = fromMatch ? fromMatch[1].trim() : String(fromRaw).trim()

                    return (
                        <div
                            key={section.id}
                            className="overflow-x-visible overflow-y-visible bg-[#F5F9FE] rounded-[12px] p-[20px_16px]"
                        >
                            <button
                                type="button"
                                onClick={() => setOpenId(isOpen ? '' : section.id)}
                                className="flex w-full cursor-pointer items-center justify-between gap-3 max-sm:flex-wrap"
                            >
                                <div className="flex min-w-0 items-center gap-[12px]">
                                    <Image src={ApartmentIcon} alt="Apartment" width={20} height={20} />
                                    <p className="text-[18px] font-[Inter-Medium] text-[#23262A] ">
                                        {section.label}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-[10px]">
                                    <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                        From <span className="font-[Inter-Bold]">{fromBold}</span>
                                    </p>
                                    <div
                                        className={`inline-flex transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    >
                                        <DownArrowIcon className="w-[24px] h-[24px]" stroke="#23262A" />
                                    </div>
                                </div>
                            </button>

                            {isOpen ? (
                                <UnitTable
                                    groups={section.groups}
                                    onOpenFloorPlan={(selectedUrl) => openFloorPlanModal(section, selectedUrl)}
                                />
                            ) : null}
                        </div>
                    )
                })}
            </div>}
            <NewProjectFloorPlanModal
                isOpen={isFloorPlanOpen}
                images={floorPlans}
                activeIndex={floorPlanIndex}
                onClose={() => {
                    setIsFloorPlanOpen(false)
                    setFloorPlans([])
                    setFloorPlanIndex(0)
                }}
                onPrev={() => setFloorPlanIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => setFloorPlanIndex((prev) => Math.min(floorPlans.length - 1, prev + 1))}
            />
        </div>
    )
}
