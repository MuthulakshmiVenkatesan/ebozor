'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import diamondicon from '../../../../../public/assets/img/icons/diamondicon.svg'
import { TickIcon } from '../../../CustomFile/icons'
import { getPackageApi } from '@/utils/api'
import { normalizePackageModel } from '@/utils/packageNormalizer'
import PaymentCardModal from './PaymentCardModal'
import PaymentFailedPage from './PaymentFailedPage'

const normalizeName = (value) => String(value || '').trim().toLowerCase()

export default function SelectPackageOrderCar({
    basePackage = null,
    itemId = null,
    onConfirm,
    onEditPackage,
}) {
    const [discountCode, setDiscountCode] = useState('')
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [showPaymentFailedPage, setShowPaymentFailedPage] = useState(false)
    const [packageModel, setPackageModel] = useState(() =>
        normalizePackageModel({
            listingPackages: [],
            advertisementPackages: [],
            basePrice: 0,
        })
    )
    const [selectedOptionsByGroup, setSelectedOptionsByGroup] = useState({})

    useEffect(() => {
        let isCancelled = false
        const fetchPackages = async () => {
            try {
                const [listingRes, advertisementRes] = await Promise.all([
                    getPackageApi.getPackage({ type: 'item_listing' }),
                    getPackageApi.getPackage({ type: 'advertisement' }),
                ])
                if (isCancelled) return

                const listingPackages = Array.isArray(listingRes?.data?.data) ? listingRes.data.data : []
                const advertisementPackages = Array.isArray(advertisementRes?.data?.data) ? advertisementRes.data.data : []

                const normalized = normalizePackageModel({
                    listingPackages,
                    advertisementPackages,
                    basePrice: 0,
                })

                if (!basePackage) {
                    setPackageModel(normalized)
                    return
                }

                const targetName = normalizeName(basePackage?.name)
                const matchedBasePackage = listingPackages.find((pkg) => normalizeName(pkg?.name) === targetName)
                    || listingPackages.find((pkg) => Number(pkg?.final_price ?? pkg?.price) === Number(basePackage?.priceAed))

                setPackageModel({
                    ...normalized,
                    basePackage: {
                        ...normalized.basePackage,
                        id: matchedBasePackage?.id ? `listing-${matchedBasePackage.id}` : `motors-${targetName || 'package'}`,
                        label: basePackage?.name || normalized.basePackage.label,
                        price: Number(basePackage?.priceAed ?? normalized.basePackage.price ?? 0),
                        packageId: matchedBasePackage?.id || null,
                    },
                })
            } catch (error) {
                if (!isCancelled) {
                    if (!basePackage) {
                        setPackageModel(
                            normalizePackageModel({
                                listingPackages: [],
                                advertisementPackages: [],
                                basePrice: 0,
                            })
                        )
                        return
                    }

                    setPackageModel((prev) => ({
                        ...prev,
                        basePackage: {
                            ...prev.basePackage,
                            label: basePackage?.name || prev.basePackage.label,
                            price: Number(basePackage?.priceAed ?? prev.basePackage.price ?? 0),
                            packageId: null,
                        },
                    }))
                }
            }
        }

        fetchPackages()
        return () => {
            isCancelled = true
        }
    }, [basePackage?.name, basePackage?.priceAed])

    const isOptionSelected = (groupKey, optionId) =>
        Array.isArray(selectedOptionsByGroup[groupKey]) && selectedOptionsByGroup[groupKey].includes(optionId)

    const sortedAddonGroups = useMemo(
        () => [...packageModel.addonGroups].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        [packageModel.addonGroups]
    )

    const toggleOption = (group, optionId) => {
        setSelectedOptionsByGroup((prev) => {
            const current = Array.isArray(prev[group.groupKey]) ? prev[group.groupKey] : []
            const mode = group.selectionMode || 'single'
            const isActive = current.includes(optionId)

            if (mode === 'multiple') {
                return {
                    ...prev,
                    [group.groupKey]: isActive
                        ? current.filter((id) => id !== optionId)
                        : [...current, optionId],
                }
            }

            return {
                ...prev,
                [group.groupKey]: isActive ? [] : [optionId],
            }
        })
    }

    const badgeBackgroundForGroup = (group) => {
        const customBadgeColor = String(group?.badge?.color || '').trim()
        if (customBadgeColor.includes('gradient(')) return customBadgeColor
        if (group.groupKey === 'premium' || group.groupKey === 'premium_boost') {
            return 'linear-gradient(94.47deg, rgb(255,189,61) 2.35%, rgb(241,162,7) 95.78%)'
        }
        if (group.groupKey === 'featured' || group.groupKey === 'featured_boost') {
            return 'linear-gradient(94.47deg, rgb(103,167,242) 2.35%, rgb(37,128,235) 95.78%)'
        }
        return `linear-gradient(94.47deg, ${customBadgeColor || '#6b7280'} 2.35%, ${customBadgeColor || '#6b7280'} 95.78%)`
    }

    const selectedAddonRows = useMemo(() => {
        const rows = []
        sortedAddonGroups.forEach((group) => {
            const selectedIds = selectedOptionsByGroup[group.groupKey] || []
            group.options.forEach((opt) => {
                if (selectedIds.includes(opt.id)) {
                    rows.push({
                        groupKey: group.groupKey,
                        groupTitle: group.title,
                        optionId: opt.id,
                        packageId: opt.packageId,
                        label: opt.label,
                        priceDelta: Number(opt.priceDelta || 0),
                    })
                }
            })
        })
        return rows
    }, [selectedOptionsByGroup, sortedAddonGroups])

    const { subtotal, vat, total } = useMemo(() => {
        const selectedAddonsTotal = selectedAddonRows.reduce((sum, row) => sum + Number(row.priceDelta || 0), 0)
        const subtotalVal = Number(packageModel.basePackage.price || 0) + selectedAddonsTotal
        const vatVal = +(subtotalVal * 0.05).toFixed(2)
        const totalVal = +(subtotalVal + vatVal).toFixed(2)
        return { subtotal: subtotalVal, vat: vatVal, total: totalVal }
    }, [packageModel.basePackage.price, selectedAddonRows])

    const handleConfirm = (cardDetails = null) => {
        const payload = {
            basePackageId: packageModel.basePackage.id,
            basePackageRecordId: packageModel.basePackage.packageId,
            selectedOptionsByGroup,
            selectedAddonOptionIds: selectedAddonRows.map((row) => row.optionId),
            selectedAddonPackageIds: selectedAddonRows.map((row) => row.packageId).filter(Boolean),
            basePrice: Number(packageModel.basePackage.price || 0),
            subtotal,
            vat,
            total,
            discountCode: discountCode.trim() || null,
            cardDetails,
        }
        onConfirm?.(payload)
    }

    const paymentPayload = useMemo(() => ({
        itemId,
        basePackageRecordId: packageModel.basePackage.packageId,
        selectedAddonPackageIds: selectedAddonRows.map((row) => row.packageId).filter(Boolean),
    }), [itemId, packageModel.basePackage.packageId, selectedAddonRows])

    if (showPaymentFailedPage) {
        return <PaymentFailedPage onTryAgain={() => setShowPaymentFailedPage(false)} />
    }

    return (
        <div className='bg-[#F7F7F8]'>
            <div className="mx-auto flex max-sm:w-full w-[980px] gap-[24px] py-[36px] max-sm:p-[20px_15px] max-sm:flex-col">
                <div className="flex-1 rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white">
                    <div className='p-[16px_24px] border-b border-[rgba(143,143,143,0.35)]'>
                        <h2 className="text-[20px] text-center font-[Inter-Bold] text-[#3B4245]">
                            Select a package that works for you
                        </h2>
                    </div>

                    <div className='p-[16px_24px]'>
                        <div className="mb-[16px] rounded-[6px] bg-[#eff3fc] p-[16px] flex items-start gap-[14px]">
                            <div className="shrink-0 flex items-center justify-center">
                                <Image src={diamondicon} alt="diamondicon" width={34} height={34} />
                            </div>
                            <div className='flex flex-col gap-[4px]'>
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                    You&apos;re posting in a paid only category
                                </p>
                                <p className="text-[14px] font-[Inter-Regular] text-[#626465]">
                                    This will help you get quality buyers for a small fee.
                                </p>
                            </div>
                        </div>

                        <div className="mb-[16px] rounded-[6px] border border-[#e5e5e5] bg-white p-[20px]">
                            <label className="relative flex items-center justify-between gap-[12px]">
                                <div className="flex items-start gap-[10px]">
                                    <input
                                        type="checkbox"
                                        checked
                                        disabled
                                        readOnly
                                        className="w-[24px] h-[24px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded checked:bg-[#fff] checked:border-[#8f8f8f] cursor-not-allowed opacity-80"
                                    />
                                    <TickIcon className="w-[24px] h-[22px] absolute left-[0px]" fill="#8f8f8f" />
                                    <div>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{packageModel.basePackage.label}</p>
                                        {onEditPackage ? (
                                            <button
                                                type="button"
                                                onClick={onEditPackage}
                                                className="mt-[4px] text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                            >
                                                Edit
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                                <p className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                                    {Number(packageModel.basePackage.price || 0).toLocaleString('en-AE')} AED
                                </p>
                            </label>
                        </div>

                        {sortedAddonGroups.map((group, groupIndex) => (
                            <div
                                key={group.groupKey}
                                className="mb-[16px] rounded-[10px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_0px_rgba(0,0,0,0.02),0px_1px_10px_0px_rgba(0,0,0,0.04)] bg-white p-[16px_24px] max-sm:p-[10px]"
                            >
                                <div className="mb-[10px] flex items-center justify-between gap-[4px]">
                                    <div className="flex flex-col gap-[4px]">
                                        <div className="flex items-center gap-[8px]">
                                            <h4 className="text-[18px] font-[Inter-Medium] text-[#3b4245]">{group.title}</h4>
                                            {group.chip ? (
                                                <span
                                                    className="rounded-full p-[2px_10px] text-[12px] font-[Inter-Regular] uppercase tracking-[0.04em] text-white"
                                                    style={{ backgroundColor: group.chip.color || '#43bb3f' }}
                                                >
                                                    {group.chip.label}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-[12px] font-[Inter-Regular] text-[#626465]">{group.description}</p>
                                    </div>
                                    {group.badge ? (
                                        <div className="rounded-[4px] p-[4px_6px]" style={{ background: badgeBackgroundForGroup(group) }}>
                                            <p className="text-[10px] font-[Inter-SemiBold] text-[#fff] uppercase">{group.badge.label}</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-col gap-[10px] mb-[26px]">
                                    {[...group.options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((opt) => {
                                        const active = isOptionSelected(group.groupKey, opt.id)
                                        return (
                                            <div key={opt.id} className={`rounded-[6px] border p-[20px] ${active ? 'border-[#DC0000] bg-[#fff]' : 'border-[#e5e5e5] bg-white'}`}>
                                                <div className="relative flex cursor-pointer items-center justify-between gap-[12px]" onClick={() => toggleOption(group, opt.id)}>
                                                    <div className="flex items-center gap-[10px] max-sm:flex-col max-sm:items-start">
                                                        <input
                                                            type="checkbox"
                                                            checked={active}
                                                            onChange={() => toggleOption(group, opt.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0 w-[24px] h-[24px] cursor-pointer appearance-none rounded border-2 border-[rgba(143,143,143,0.5)] checked:border-[#DC0000] checked:bg-[#fff]"
                                                        />
                                                        {active ? <TickIcon className="w-[24px] h-[22px] absolute left-[0px]" fill="#DC0000" /> : null}
                                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{opt.label}</p>
                                                    </div>
                                                    <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">
                                                        + {Number(opt.priceDelta || 0).toLocaleString('en-AE')} AED
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {groupIndex === sortedAddonGroups.length - 1 ? (
                                    <>
                                        <p className="text-[12px] text-center font-[Inter-SemiBold] text-[#626465]">Prices are exclusive of VAT</p>
                                        <div className='text-center mt-[30px]'>
                                            <p className="text-[12px] text-center font-[Inter-Regular] text-[#626465]">
                                                Paid ads that violate our posting rules will be deleted and will not be refunded.
                                                {' '}
                                                <Link href="/terms-and-conditions" className="text-[#3a86ff]">Read more</Link>
                                            </p>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-[350px] max-sm:w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white h-fit">
                    <div className='p-[16px_24px] border-b border-[rgba(143,143,143,0.35)]'>
                        <h2 className="text-[20px] text-center font-[Inter-Bold] text-[#3B4245]">Order Summary</h2>
                    </div>

                    <div className='p-[16px_24px_30px]'>
                        <div className='mb-[14px]'>
                            <div>
                                <div className="flex items-center justify-between gap-[8px]">
                                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">{packageModel.basePackage.label}</h4>
                                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                        {Number(packageModel.basePackage.price || 0).toLocaleString('en-AE')} AED
                                    </h4>
                                </div>
                                {selectedAddonRows.map((row) => (
                                    <div key={row.optionId} className="mt-[14px] flex items-center justify-between gap-[8px]">
                                        <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">{row.label}</h4>
                                        <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            AED {Number(row.priceDelta || 0).toLocaleString('en-AE')}.00
                                        </h4>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-[8px] mt-[24px]">
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="Discount code"
                                    className="p-[12px_30px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                                <button
                                    type="button"
                                    disabled={!String(discountCode).trim()}
                                    className={`shrink-0 p-[12px] w-[80px] rounded-[8px] border text-[14px] font-[Inter-SemiBold] ${
                                        String(discountCode).trim()
                                            ? 'cursor-pointer border-[#23262A] bg-white text-[#23262A]'
                                            : 'cursor-not-allowed border-[rgba(143,143,143,0.45)] bg-[#fff] text-[rgba(0,0,0,0.26)]'
                                    }`}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-[14px] border-b border-t border-[rgba(143,143,143,0.25)] py-[14px]">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">Subtotal</h4>
                                <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">{subtotal.toLocaleString('en-AE')} AED</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">VAT 5%</h4>
                                <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">{vat.toLocaleString('en-AE')} AED</h4>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-[14px]">
                            <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">Total</h4>
                            <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{total.toLocaleString('en-AE')} AED</h4>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="mt-[4px] flex w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#DC0000] py-[12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95"
                        >
                            Pay AED {total.toLocaleString('en-AE')}
                        </button>
                    </div>
                </div>
            </div>

            <PaymentCardModal
                open={isPaymentModalOpen}
                total={total}
                paymentPayload={paymentPayload}
                onClose={() => setIsPaymentModalOpen(false)}
                onPay={(cardDetails) => {
                    handleConfirm(cardDetails)
                }}
                onPaymentFailed={() => setShowPaymentFailedPage(true)}
            />
        </div>
    )
}
