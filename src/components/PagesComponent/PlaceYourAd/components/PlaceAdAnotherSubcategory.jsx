'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { RightArrowIcon , HomeIcon } from '@/components/CustomFile/icons'
import { MOTORCYCLE_AD_TYPES, MOTORCYCLE_SUBTYPES_BY_PARENT_KEY } from './placeAdSubcategoryData'
import PlaceAdMotorForm from '../MotorsForm/PlaceAdMotorForm'

/**
 * Motors → Motorcycles → [type] drill-down. Sport Bike opens a fourth step (Hyper sports, Super bike, Super sports).
 */
export default function PlaceAdAnotherSubcategory({
    onBackToSubcategories,
    onBackToMain,
    variant = 'motorcycles',
    propertyRows = [],
    propertyParentLabel = 'Residential',
    propertyParentRow = null,
    onSelectProperty,
    apiRows = [],
    apiRootLabel = '',
    apiParentLabel = '',
    apiCurrentLabel = '',
    onBackToApiRoot,
    onSelectApiRow,
}) {
    const [hoverKey, setHoverKey] = useState(null)
    /** When set, we show child list (e.g. Sport Bike subtypes). */
    const [drillParent, setDrillParent] = useState(null)
    /** Sport Bike subtype → multi-step listing wizard. */
    const [listingContext, setListingContext] = useState(null)

    const subtypes = drillParent ? MOTORCYCLE_SUBTYPES_BY_PARENT_KEY[drillParent.key] ?? [] : []

    const handlePickMotorcycleType = (row) => {
        setListingContext({
            parentLabel: 'Motorcycles',
            subtypeLabel: row.label,
        })
    }

    const handlePickSubtype = (row) => {
        setListingContext({
            parentLabel: drillParent?.label || 'Motorcycles',
            subtypeLabel: row.label,
        })
    }

    const setRowHover = (key) => {
        setHoverKey(key)
    }

    const clearRowHover = () => {
        setHoverKey(null)
    }

    // Generic list view for API title-search category results.
    if (variant === 'api-search-list') {
        const hasApiSubCategory = Boolean(
            apiCurrentLabel && apiCurrentLabel !== (apiRootLabel || apiParentLabel)
        )
        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <div className="mb-[24px] text-center">
                    <h1 className="text-[22px] font-[Inter-Bold] text-[#23262A] sm:text-[24px]">
                        Now choose the right category for your ad:
                    </h1>
                </div>

                <nav className="mb-[16px] flex flex-wrap items-center gap-[6px] text-[14px]" aria-label="Breadcrumb">
                    <button type="button" onClick={onBackToMain} className="cursor-pointer border-0 bg-transparent p-0 leading-none" aria-label="Home">
                        <HomeIcon className="w-[24px] h-[24px]" />
                    </button>
                    <RightArrowIcon className="h-[14px] w-[14px]" />
                    <button
                        type="button"
                        onClick={onBackToApiRoot}
                        className={`cursor-pointer border-0 bg-transparent p-0 font-[Inter-Regular] ${hasApiSubCategory ? 'text-[#3A88EF]' : 'text-[#23262A]'}`}
                    >
                        {apiRootLabel || apiParentLabel}
                    </button>
                    {hasApiSubCategory ? (
                        <>
                            <RightArrowIcon className="h-[14px] w-[14px]" />
                            <span className="font-[Inter-Regular] leading-[20px] text-[#23262A]" aria-current="page">
                                {apiCurrentLabel}
                            </span>
                        </>
                    ) : null}
                </nav>

                <div>
                    {apiRows.map((row) => (
                        <button
                            key={row.key}
                            type="button"
                            onClick={() => onSelectApiRow?.(row)}
                            className="flex w-full cursor-pointer items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[18px] text-left transition-colors"
                        >
                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{row.label}</h4>
                            <RightArrowIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // Reuse this screen layout for Property for Sale > Residential list.
    if (variant === 'property-sale-residential') {
        // Commercial / Land / Multiple Units: no child rows, go directly to PropertyForm.
        if (!propertyRows.length) {
            onSelectProperty?.(propertyParentRow)
            return null
        }

        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <div className="mb-[24px] text-center">
                    <h1 className="text-[22px] font-[Inter-Bold] text-[#23262A] sm:text-[24px]">
                        Now choose the right category for your ad:
                    </h1>
                </div>

                <nav className="mb-[16px] flex flex-wrap items-center gap-[6px] text-[14px]" aria-label="Breadcrumb">
                    <button type="button" onClick={onBackToMain} className="cursor-pointer border-0 bg-transparent p-0 leading-none" aria-label="Home">
                        <HomeIcon className="w-[24px] h-[24px]" />
                    </button>
                    <RightArrowIcon className="h-[14px] w-[14px]" />
                    <button type="button" onClick={onBackToSubcategories} className="cursor-pointer border-0 bg-transparent p-0 font-[Inter-Regular] text-[#4294ff]">
                        Property for Sale
                    </button>
                    <RightArrowIcon className="h-[14px] w-[14px]" />
                    <span className="font-[Inter-Regular] leading-[20px] text-[#23262A]">{propertyParentLabel}</span>
                </nav>

                <div>
                    {propertyRows.map((row) => {
                        return (
                            <button
                                key={row.key}
                                type="button"
                                onClick={() => onSelectProperty?.(row)}
                                className="flex w-full cursor-pointer items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[18px] text-left transition-colors"
                            >
                                <h4 className={`text-[14px] font-[Inter-SemiBold] text-[#23262A] `}>{row.label}</h4>
                                <RightArrowIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (listingContext) {
        return (
            <PlaceAdMotorForm
                parentLabel={listingContext.parentLabel}
                subtypeLabel={listingContext.subtypeLabel}
                onBack={() => setListingContext(null)}
            />
        )
    }

    return (
        <div className="mx-auto max-sm:w-full w-[480px] px-[16px] py-[28px] sm:py-[36px]">
            <div className="mb-[24px] text-center">
                <h1 className="text-[22px] font-[Inter-Bold] text-[#23262A] sm:text-[24px]">
                    Now choose the right category for your ad:
                </h1>
            </div>

            <nav className="mb-[16px] flex flex-wrap items-center gap-[6px] text-[14px]" aria-label="Breadcrumb">
                <button type="button" onClick={onBackToMain} className="cursor-pointer border-0 bg-transparent p-0 leading-none" aria-label="Home">
                    <HomeIcon className="w-[24px] h-[24px]" />
                </button>
                <RightArrowIcon className="h-[14px] w-[14px]" />
                <button type="button" onClick={onBackToSubcategories} className="cursor-pointer border-0 bg-transparent p-0 font-[Inter-Regular] text-[#4294ff]">
                    Motors
                </button>
                <RightArrowIcon className="h-[14px] w-[14px]" />
                {drillParent ? (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setDrillParent(null)
                                setHoverKey(null)
                            }}
                            className="cursor-pointer border-0 bg-transparent p-0 font-[Inter-Regular] text-[#4294ff]"
                        >
                            Motorcycles
                        </button>
                        <RightArrowIcon className="h-[14px] w-[14px]" />
                        <span className="font-[Inter-Bold] leading-[20px] text-[#23262A]">{drillParent.label}</span>
                    </>
                ) : (
                    <span className="font-[Inter-Regular] leading-[20px] text-[#23262A]">Motorcycles</span>
                )}
            </nav>

            <div className="">
                {drillParent
                    ? subtypes.map((row) => (
                          <button
                              key={row.key}
                              type="button"
                              onClick={() => handlePickSubtype(row)}
                              className="flex w-full cursor-pointer items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[18px] text-left transition-colors"
                          >
                              <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{row.label}</h4>
                              <RightArrowIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                          </button>
                      ))
                    : MOTORCYCLE_AD_TYPES.map((row) => {
                          const active = hoverKey === row.key
                          return (
                              <button
                                  key={row.key}
                                  type="button"
                                  onClick={() => handlePickMotorcycleType(row)}
                                  onMouseEnter={() => setRowHover(row.key)}
                                  onMouseLeave={clearRowHover}
                                  onFocus={() => setRowHover(row.key)}
                                  onBlur={clearRowHover}
                                  className="flex w-full cursor-pointer items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[18px] text-left transition-colors "
                              >
                                  <h4
                                      className={`text-[14px] font-[Inter-SemiBold] transition-colors text-[#23262A] ${
                                          active ? '' : ''
                                      }`}
                                  >
                                      {row.label}
                                  </h4>
                                  <RightArrowIcon className="h-[18px] w-[18px] shrink-0" stroke={active ? '#DC0000' : '#23262A'} />
                              </button>
                          )
                      })}
            </div>
        </div>
    )
}
