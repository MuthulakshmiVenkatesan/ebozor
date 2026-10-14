/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import VerifiedMain from '../../GetVerified/VerifiedMain'

function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => n.toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    const v = row?.custom_field_value?.value ?? row?.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
    return v != null && v !== '' ? String(v) : ''
}

function slugifyLabel(value = '') {
    return String(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

function dealerDisplayName(productData) {
    const item = productData || {}
    return firstTruthy(
        item.dealer_name,
        item.company_name,
        item.store_name,
        item.business_name,
        item.user?.company_name,
        item.user?.name,
        item.seller_name,
        item.user_name,
        customFieldValue(item, 'Dealer', 'Company', 'Seller Name')
    )
}

function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '')
}

function buildWhatsAppUrl(phone, message) {
    const raw = digitsOnly(phone)
    if (!raw) return ''
    const base = `https://wa.me/${raw}`
    if (message) return `${base}?text=${encodeURIComponent(message)}`
    return base
}

function formatSellerTypeLabel(raw) {
    const s = String(raw || '').trim()
    if (!s) return 'Seller'
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * Car detail sidebar: dealer card (logo, name, type, View All Cars, phone, WhatsApp) + verified-user CTA.
 */
export default function MotorCarProfile({
    productData = {},
    listingItem = '',
    viewAllCarsHref = '',
    verifiedCtaHref = '/login',
    onShowPhone,
    onOpenWhatsApp,
}) {
    const item = productData || {}
    const user = item?.user && typeof item.user === 'object' ? item.user : null

    const sellerName = useMemo(() => dealerDisplayName(item) || 'Seller', [item])

    const sellerLogo = useMemo(
        () =>
            firstTruthy(
                item.dealer_logo,
                item.company_logo,
                item.store_logo,
                item.seller_image,
                item.logo,
                user?.company_logo,
                user?.profile,
                user?.image,
                user?.profile_image,
                '/assets/img/user.jpeg'
            ),
        [item, user]
    )

    const sellerTypeLabel = useMemo(
        () =>
            formatSellerTypeLabel(
                firstTruthy(
                    item.seller_type,
                    item.sellerType,
                    item.listed_by_type,
                    customFieldValue(item, 'Seller type', 'Seller Type', 'Listed by')
                )
            ),
        [item]
    )

    const phoneNumber = useMemo(
        () =>
            firstTruthy(
                item.phone,
                item.mobile,
                item.contact_phone,
                item.seller_phone,
                item.phone_number,
                user?.phone,
                user?.mobile
            ),
        [item, user]
    )

    const whatsappNumber = useMemo(
        () =>
            firstTruthy(
                item.whatsapp,
                item.whatsapp_number,
                item.whats_app,
                item.wa_number,
                user?.whatsapp,
                user?.whatsapp_number,
                phoneNumber
            ),
        [item, user, phoneNumber]
    )

    const whatsappUrl = useMemo(() => {
        const msg = firstTruthy(item.whatsapp_message, item.whatsappMessage, '')
        return buildWhatsAppUrl(whatsappNumber, msg)
    }, [item, whatsappNumber])

    const viewAllHref = useMemo(() => {
        if (String(viewAllCarsHref || '').trim()) return viewAllCarsHref
        const label = String(listingItem || 'Used Cars').trim()
        const q = new URLSearchParams()
        q.set('mode', 'motors')
        q.set('item', label)
        q.set('slug', slugifyLabel(label))
        return `/products?${q.toString()}`
    }, [listingItem, viewAllCarsHref])

    return (
        <div className="flex w-full flex-col gap-[16px]">
            <div className="rounded-[12px] bg-white p-[18px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.04),0px_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex gap-[14px] border-b border-[rgba(143,143,143,0.25)] pb-[18px]">
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.08)] ">
                        <Image
                            src={sellerLogo}
                            alt={sellerName}
                            fill
                            className="object-contain w-full h-full rounded-[12px]"
                            sizes="72px"
                            unoptimized={String(sellerLogo).startsWith('http')}
                        />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-[4px]">
                        <h3 className="text-[20px] font-[Inter-Bold] leading-snug truncate text-[#23262A]">{sellerName}</h3>
                        <p className=" text-[14px] font-[Inter-Regular] text-[#8F8F8F]">{sellerTypeLabel}</p>
                        <Link
                            href={viewAllHref}
                            className="inline-block text-[14px] font-[Inter-SemiBold] text-[#3A88EF] hover:underline"
                        >
                            View All Cars
                        </Link>
                    </div>
                </div>


                <div className="flex flex-col gap-[10px]">
                    <button
                        type="button"
                        disabled={!onShowPhone}
                        onClick={() => onShowPhone?.()}
                        className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#DC0000] py-[12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <Image src={phoneOutline} alt="" width={18} height={18} className="h-[18px] w-[18px] brightness-0 invert" />
                        Show Phone Number
                    </button>
                    {whatsappUrl ? (
                        onOpenWhatsApp ? (
                            <button
                                type="button"
                                onClick={() => onOpenWhatsApp()}
                                className="flex w-full items-center justify-center gap-[10px] rounded-[8px] border border-[#E0E0E0] bg-white py-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition-colors hover:bg-[#fafafa]"
                            >
                                <Image src={whatsapp} alt="" width={20} height={20} className="h-[20px] w-[20px] shrink-0" />
                                WhatsApp
                            </button>
                        ) : (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-[10px] rounded-[8px] border border-[#E0E0E0] bg-white py-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition-colors hover:bg-[#fafafa]"
                            >
                                <Image src={whatsapp} alt="" width={20} height={20} className="h-[20px] w-[20px] shrink-0" />
                                WhatsApp
                            </a>
                        )
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] border border-[#E0E0E0] bg-[#fafafa] py-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                        >
                            <Image src={whatsapp} alt="" width={20} height={20} className="h-[20px] w-[20px] shrink-0 opacity-50" />
                            WhatsApp
                        </button>
                    )}
                </div>
            </div>

            <div>
                <VerifiedMain showTickBadge={false} />
            </div>

        </div>
    )
}
