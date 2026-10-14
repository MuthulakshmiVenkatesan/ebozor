/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import calendarIc from '../../../../../public/assets/img/icons/calendar.svg'
import speedometerIc from '../../../../../public/assets/img/icons/speedometer.svg'
import regionalSpecsIc from '../../../../../public/assets/img/icons/regional-specs.svg'
import seatingcapacity from '../../../../../public/assets/img/icons/seatingcapacity.svg'
import doorsIc from '../../../../../public/assets/img/icons/Doors.svg'
import baggagecapacity from '../../../../../public/assets/img/icons/baggagecapacity.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import { VerifiedBadge } from '@/components/CustomFile/icons'

function splitPriceDisplay(displayPrice, currencyFallback) {
    const s = String(displayPrice || '').trim()
    if (!s || s === '—') {
        return { sym: currencyFallback, amt: '—' }
    }
    const parts = s.split(/\s+/)
    if (parts.length >= 2) {
        return { sym: parts[0], amt: parts.slice(1).join(' ') }
    }
    return { sym: currencyFallback, amt: s }
}

const phoneIconRedStyle = {
    filter:
        'brightness(0) saturate(100%) invert(12%) sepia(94%) saturate(7482%) hue-rotate(4deg) brightness(99%) contrast(118%)',
}

/**
 * Sticky top bar after scroll — listing summary + dealer strip + call / WhatsApp.
 * Rental vs sale (used / new / export) use different left columns and button styling.
 */
export default function MotorsFloatingListingBar({
    visible,
    isRental,
    displayPrice,
    currencySymbol,
    headlineTitle,
    rentalTagline,
    yearDisplay,
    mileageDisplay,
    specsRowLabel,
    seatingDisplay,
    doorsDisplay,
    baggageDisplay,
    sellerLogo,
    dealerName,
    sellerTypeLabel,
    verifiedDealer,
    viewAllHref,
    whatsappUrl,
    onOpenPhone,
    onOpenWhatsApp,
}) {
    const { sym, amt } = splitPriceDisplay(displayPrice, currencySymbol)
    const logoRemote = String(sellerLogo || '').startsWith('http')
    const dealerTitle = String(dealerName || 'Dealer').trim()
    const typeLabel = String(sellerTypeLabel || 'Dealer').trim()
    const canWhatsApp = Boolean(String(whatsappUrl || '').trim())
    const tagline = String(rentalTagline || '').trim()

    return (
        <div
            className={`fixed inset-x-0 top-0 z-[999] flex justify-center border-b border-[#E5E7EB] bg-white transition-[transform,opacity] duration-200 ease-out ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
                }`}
        >
            <div
                className={`flex w-full max-w-[1170px] flex-col gap-[14px] px-[20px] py-[16px] sm:flex-row sm:justify-between sm:gap-[24px] ${isRental ? '' : 'sm:items-start'
                    }`}
            >
                {isRental ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                        <h4 className="text-[22px] font-[Inter-Bold] leading-snug text-[#23262A]">{headlineTitle}</h4>
                        {tagline ? (
                            <p className="text-[16px] font-[Inter-Regular] leading-snug text-[#23262A]">{tagline}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-[20px]">
                            <div className="inline-flex items-center gap-[6px] ">
                                <Image
                                    src={calendarIc}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{yearDisplay || '—'}</p>
                            </div>
                            <div className="inline-flex items-center gap-[6px] ">
                                <Image
                                    src={seatingcapacity}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{seatingDisplay}</p>
                            </div>
                            <div className="inline-flex items-center gap-[6px]">
                                <Image
                                    src={doorsIc}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{doorsDisplay}</p>
                            </div>
                            <div className="inline-flex items-center gap-[6px]">
                                <Image
                                    src={baggagecapacity}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{baggageDisplay}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                        <p className="text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">
                            <span className="font-[Inter-Medium] text-[#23262A]">{sym}</span> <span>{amt}</span>
                        </p>
                        <p className="truncate text-[16px] font-[Inter-Regular] text-[#23262A]">{headlineTitle}</p>
                        <div className="flex flex-wrap items-center gap-[20px]">
                            <div className="inline-flex items-center gap-[6px] ">
                                <Image
                                    src={calendarIc}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain "
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{yearDisplay || '—'}</p>
                            </div>
                            <div className="inline-flex items-center gap-[6px] ">
                                <Image
                                    src={speedometerIc}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain "
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{mileageDisplay}</p>
                            </div>
                            <div className="inline-flex items-center gap-[6px] ">
                                <Image
                                    src={regionalSpecsIc}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain "
                                />
                                <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">{specsRowLabel}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex w-full shrink-0 flex-col gap-[12px] sm:w-[min(100%,380px)] sm:items-stretch">
                    <div className="flex items-start gap-[12px]">
                        <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
                            {sellerLogo ? (
                                <Image
                                    src={sellerLogo}
                                    alt=""
                                    fill
                                    className="object-contain p-[4px]"
                                    sizes="64px"
                                    unoptimized={logoRemote}
                                />
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-[6px]">
                                <h4 className="truncate text-[16px] font-[Inter-Bold] text-[#23262A]">{dealerTitle}</h4>
                                {!isRental && verifiedDealer ? (
                                    <VerifiedBadge className="h-[16px] w-[16px] shrink-0" fill="#3A88EF" />
                                ) : null}
                            </div>
                            <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">{typeLabel}</p>
                            <Link
                                href={viewAllHref}
                                className="mt-[2px] inline-block text-[14px] font-[Inter-Regular] text-[#3A88EF] hover:underline"
                            >
                                View All Cars
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-[10px]">
                        <button
                            type="button"
                            disabled={!onOpenPhone}
                            onClick={() => onOpenPhone?.()}
                            className={
                                isRental
                                    ? 'flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#FEF2F2] p-[12px_16px] transition-opacity disabled:cursor-not-allowed disabled:opacity-40'
                                    : 'flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border border-[#23262A] bg-white p-[12px_16px] transition-opacity disabled:cursor-not-allowed disabled:opacity-40'
                            }
                            aria-label="Call seller"
                        >
                            <Image
                                src={phoneOutline}
                                alt=""
                                width={22}
                                height={22}
                                className="h-[22px] w-[22px]"
                                style={phoneIconRedStyle}
                            />
                        </button>
                        {canWhatsApp ? (
                            onOpenWhatsApp ? (
                                <button
                                    type="button"
                                    onClick={() => onOpenWhatsApp?.()}
                                    className={
                                        isRental
                                            ? 'flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#ECFDF5] p-[12px_16px] transition-colors hover:bg-[#D1FAE5]'
                                            : 'flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border border-[#23262A] bg-white p-[12px_16px] transition-colors hover:bg-[#fafafa]'
                                    }
                                    aria-label="WhatsApp seller"
                                >
                                    <Image src={whatsapp} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                                </button>
                            ) : (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={
                                        isRental
                                            ? 'flex min-h-[48px] items-center justify-center rounded-[8px] border-0 bg-[#ECFDF5] p-[12px_16px] transition-colors hover:bg-[#D1FAE5]'
                                            : 'flex min-h-[48px] items-center justify-center rounded-[8px] border border-[#23262A] bg-white p-[12px_16px] transition-colors hover:bg-[#fafafa]'
                                    }
                                    aria-label="WhatsApp seller"
                                >
                                    <Image src={whatsapp} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                                </a>
                            )
                        ) : (
                            <button
                                type="button"
                                disabled
                                className={
                                    isRental
                                        ? 'flex min-h-[48px] cursor-not-allowed items-center justify-center rounded-[8px] border-0 bg-[#f3f4f6] p-[12px_16px] '
                                        : 'flex min-h-[48px] cursor-not-allowed items-center justify-center rounded-[8px] border border-[#23262A] bg-[#fff] p-[12px_16px] '
                                }
                                aria-label="WhatsApp unavailable"
                            >
                                <Image src={whatsapp} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
