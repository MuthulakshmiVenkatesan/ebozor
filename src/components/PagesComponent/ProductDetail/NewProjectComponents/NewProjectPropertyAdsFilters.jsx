/* eslint-disable react/prop-types */
'use client'

import { useMemo, useState } from 'react'
import { SortArrowIcon, DownArrowIcon, RightArrowIcon } from '@/components/CustomFile/icons'

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function getProjectTitle(productData) {
    return pickString(productData.title, productData.name, productData.project_title, 'New Project')
}

function Switch({
    checked,
    onChange,
    label,
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="group flex items-center gap-[10px]"
            aria-pressed={checked}
        >
            {label ? (
                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">{label}</p>
            ) : null}
            <div className="cursor-pointer relative inline-flex h-[16px] w-[40px] shrink-0 items-center rounded-full bg-[rgba(143,143,143,0.22)] transition ">
                <span
                    className={`absolute z-[2] left-[0px] h-[20px] w-[20px] rounded-full bg-white shadow-[0_3px_10px_rgba(0,0,0,0.12)] transition ${checked ? 'translate-x-[22px]' : ''}`}
                />
                <span
                    className={`absolute inset-0 rounded-full transition ${checked ? 'bg-[#000]' : 'bg-transparent'}`}
                />
            </div>
        </button>
    )
}


export default function NewProjectPropertyAdsFilters({
    productData = {},
    activeTab: activeTabProp,
    onTabChange,
}) {
    const title = useMemo(() => getProjectTitle(productData), [productData])

    const [sortOpen, setSortOpen] = useState(false)
    const sortOptions = [
        'Popular',
        'Verified',
        'Newest to Oldest',
        'Oldest to Newest',
        'Price Highest to Lowest',
        'Price Lowest to Highest',
    ]
    const [selectedSort, setSelectedSort] = useState(sortOptions[0])

    const [verifiedFirst, setVerifiedFirst] = useState(false)

    const tabs = ['All', 'Initial Sale', 'Resale', 'Direct From Developer']
    const [activeTabLocal, setActiveTabLocal] = useState(tabs[0])
    const activeTab = activeTabProp || activeTabLocal
    const setActiveTab = (next) => {
        if (onTabChange) onTabChange(next)
        else setActiveTabLocal(next)
    }

    const [openMenu, setOpenMenu] = useState('')

    const closeMenus = () => setOpenMenu('')

    const [bedsValue, setBedsValue] = useState('Any')
    const bedsOptions = ['Any', 'Studio', '1', '2', '3', '4', '5', '6', '7', '8+']

    const [propertyTypeValue, setPropertyTypeValue] = useState('Apartments')
    const propertyTypeGroups = [
        {
            label: 'Residential',
            items: ['Apartments', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Residential Building'],
        },
        { label: 'Commercial', items: ['Office', 'Retail', 'Warehouse', 'Commercial Building'] },
        { label: 'Land', items: ['Residential Land', 'Commercial Land', 'Industrial Land'] },
    ]
    const [propertyTypeLeftKey, setPropertyTypeLeftKey] = useState('Residential')

    const [areaFrom, setAreaFrom] = useState('')
    const [areaTo, setAreaTo] = useState('')
    const [priceFrom, setPriceFrom] = useState('')
    const [priceTo, setPriceTo] = useState('')

    const applyFilters = () => {
        closeMenus()
        // UI-only (no listing wiring) for now.
    }
    const clearFilters = () => {
        setBedsValue('Any')
        setPropertyTypeValue('Apartments')
        setAreaFrom('')
        setAreaTo('')
        setPriceFrom('')
        setPriceTo('')
        setActiveTab(tabs[0])
        setVerifiedFirst(false)
    }

    return (
        <div className="w-full bg-white py-[40px]">
            <div className="w-full">
                <div className="flex-wrap flex items-start justify-between gap-4 mb-[24px] ">
                    <h2 className="text-[24px] font-[Inter-Bold] text-[#23262A] md:text-[24px]">
                        Off Plan Properties In {title}
                    </h2>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setSortOpen((v) => !v)
                                setOpenMenu('')
                            }}
                            className="flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white p-[6px_12px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                        >
                            <div className='flex-col flex items-center gap-[4px]'>
                                <SortArrowIcon className="rotate-180" fill="#000" fillOpacity="1" />
                                <SortArrowIcon className="" fill="#000" fillOpacity="1" />
                            </div>
                            <p className="">
                                Sort: <span className="font-[Inter-SemiBold]">{selectedSort}</span>
                            </p>
                        </button>

                        {sortOpen ? (
                            <div className='absolute left-0 top-[calc(100%+10px)] p-[4px] z-20 w-[240px] rounded-[8px] border border-[rgba(143,143,143,0.16)] bg-white shadow-[0_6px_18px_rgba(17,24,39,0.12)]'>
                                {sortOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSort(opt)
                                            setSortOpen(false)
                                        }}
                                        className={`flex cursor-pointer h-[48px] w-full items-center px-[16px] text-left text-[14px] font-[Inter-Regular] border-b border-[rgba(143,143,143,0.12)] ${selectedSort === opt ? 'font-[Inter-SemiBold] text-[#23262A]' : 'font-[Inter-Regular] text-[#4B5563]'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-[30px]">
                    {/* Combined filter bar (exact screenshot layout) */}
                    <div className="relative rounded-[16px] border border-[#c2c4c733] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-[6px]">
                        <div className="grid grid-cols-4 divide-x divide-[rgba(143,143,143,0.18)] max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMenu((m) => (m === 'propertyType' ? '' : 'propertyType'))
                                        setSortOpen(false)
                                    }}
                                    className="w-full cursor-pointer p-[8px_14px] text-left"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Property Type</p>
                                            <p className="mt-1 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                {propertyTypeValue || 'Any'}
                                            </p>
                                        </div>
                                        <DownArrowIcon className="h-[20px] w-[20px] shrink-0" stroke="#23262A" />
                                    </div>
                                </button>
                                {openMenu === 'propertyType' ? (
                                    <div className='absolute left-0 top-[calc(100%+8px)] z-[95] w-[430px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full'>
                                        <div className="grid grid-cols-[180px_1fr] overflow-hidden">
                                            <div className="max-h-[320px] overflow-y-auto border-r border-[rgba(143,143,143,0.2)] bg-[#F5F5F5]">
                                                {propertyTypeGroups.map((g) => {
                                                    const active = propertyTypeLeftKey === g.label
                                                    return (
                                                        <button
                                                            key={g.label}
                                                            type="button"
                                                            onMouseEnter={() => setPropertyTypeLeftKey(g.label)}
                                                            onClick={() => setPropertyTypeLeftKey(g.label)}
                                                            className={`w-full cursor-pointer items-center justify-between px-[14px] py-[12px] flex  ${active ? 'bg-[#fff] font-[Inter-SemiBold]' : ''}`}
                                                        >
                                                            <p className="truncate text-[14px] leading-[18px] text-[#000] font-[Inter-Regular]">{g.label}</p>
                                                            <RightArrowIcon className="w-[18px] h-[18px] " />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <div className="max-h-[320px] overflow-y-auto bg-white">
                                                {(() => {
                                                    const right = propertyTypeGroups.find((g) => g.label === propertyTypeLeftKey) || propertyTypeGroups[0]
                                                    const list = right?.items || []
                                                    return (
                                                        <div className="">
                                                            {list.map((it) => (
                                                                <button
                                                                    key={it}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPropertyTypeValue(it)
                                                                        closeMenus()
                                                                    }}
                                                                    className={`cursor-pointer block w-full px-[16px] py-[11px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5] ${propertyTypeValue === it ? 'font-[Inter-SemiBold] bg-[rgba(58,136,239,0.08)]' : ''}`}
                                                                >
                                                                    <span className="truncate">{it}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMenu((m) => (m === 'beds' ? '' : 'beds'))
                                        setSortOpen(false)
                                    }}
                                    className="w-full cursor-pointer p-[8px_14px] text-left"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Beds</p>
                                            <p className="mt-1 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                {bedsValue || 'Any'}
                                            </p>
                                        </div>
                                        <DownArrowIcon className="h-[20px] w-[20px] shrink-0" stroke="#23262A" />
                                    </div>
                                </button>
                                {openMenu === 'beds' ? (
                                    <div className='absolute left-0 top-[calc(100%+8px)] z-[95] w-[340px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full'>
                                        <div className="flex flex-col gap-[12px] p-[14px]">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Beds</p>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap gap-3">
                                                    {['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((opt) => {
                                                        const active = bedsValue === opt
                                                        return (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => setBedsValue(opt)}
                                                                className={`cursor-pointer rounded-full border px-[16px] py-[8px] text-[14px] leading-[18px]  text-[#23262A] font-[Inter-Regular] transition ${active
                                                                    ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)]'
                                                                    : 'border-[rgba(143,143,143,0.45)] bg-white bg-white '
                                                                    }`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        )
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => setBedsValue('Any')}
                                                        className='cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[16px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]'                                                >
                                                        View More
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                onClick={() => setBedsValue('Any')}
                                                className='cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]'
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    closeMenus()
                                                }}
                                                className='flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white'                                        >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMenu((m) => (m === 'area' ? '' : 'area'))
                                        setSortOpen(false)
                                    }}
                                    className="w-full cursor-pointer p-[8px_14px] text-left"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Area / Size (Sqft)</p>
                                            <p className="mt-1 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                {areaFrom || areaTo ? `${areaFrom || 'Any'} - ${areaTo || 'Any'}` : 'Any'}
                                            </p>
                                        </div>
                                        <DownArrowIcon className="h-[20px] w-[20px] shrink-0" stroke="#23262A" />
                                    </div>
                                </button>
                                {openMenu === 'area' ? (
                                    <div className='absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full'>
                                        <div className="flex flex-col gap-[12px] p-[14px]">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Area / Size (sqft)</p>
                                            <div className="grid grid-cols-2 gap-[12px]">
                                                <div>
                                                    <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">From</label>
                                                    <input
                                                        value={areaFrom}
                                                        onChange={(e) => setAreaFrom(e.target.value)}
                                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">Up to</label>
                                                    <input
                                                        value={areaTo}
                                                        onChange={(e) => setAreaTo(e.target.value)}
                                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                        placeholder="Any"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAreaFrom('')
                                                    setAreaTo('')
                                                }}
                                                className='cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]'
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={applyFilters}
                                                className='flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white'
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenMenu((m) => (m === 'price' ? '' : 'price'))
                                        setSortOpen(false)
                                    }}
                                    className="w-full cursor-pointer p-[8px_14px] text-left"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Price Range</p>
                                            <p className="mt-1 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                {priceFrom || priceTo ? `${priceFrom || 'Any'} - ${priceTo || 'Any'}` : 'Any'}
                                            </p>
                                        </div>
                                        <DownArrowIcon className="h-[20px] w-[20px] shrink-0" stroke="#23262A" />
                                    </div>
                                </button>
                                {openMenu === 'price' ? (
                                    <div className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full">
                                        <div className="flex flex-col gap-[12px] p-[14px]">
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Price Range</p>
                                            <div className="grid grid-cols-2 gap-[12px]">
                                                <div>
                                                    <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">From</label>
                                                    <input
                                                        value={priceFrom}
                                                        onChange={(e) => setPriceFrom(e.target.value)}
                                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">Up to</label>
                                                    <input
                                                        value={priceTo}
                                                        onChange={(e) => setPriceTo(e.target.value)}
                                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                        placeholder="Any"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPriceFrom('')
                                                    setPriceTo('')
                                                }}
                                                className='cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]'
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={applyFilters}
                                                className='flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white'
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white">
                        <div className="flex flex-wrap items-center gap-3">
                            {tabs.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setActiveTab(t)}
                                    className={`cursor-pointer rounded-[6px] p-[6px_16px] text-[14px] font-[Inter-Medium]  transition ${activeTab === t
                                        ? 'bg-[#3A88EF1A] text-[#3A88EF] border border-[#3A88EF] '
                                        : 'bg-white text-[#23262A] border border-[rgba(143,143,143,0.35)]  '
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="">
                            <Switch checked={verifiedFirst} onChange={setVerifiedFirst} label="Show Verified First" />
                        </div>
                    </div>
                </div>

                {/* Ads list renders in parent. */}
            </div>
        </div>
    )
}

