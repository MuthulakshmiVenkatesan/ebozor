/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import Link from 'next/link'

function ToolIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-[20px] w-[20px] shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="m13.7826 15.1719 2.1213-2.1213 5.9963 5.9962-2.1213 2.1213zM17.5 10c1.93 0 3.5-1.57 3.5-3.5 0-.58-.16-1.12-.41-1.6l-2.7 2.7-1.49-1.49 2.7-2.7c-.48-.25-1.02-.41-1.6-.41C15.57 3 14 4.57 14 6.5c0 .41.08.8.21 1.16l-1.85 1.85-1.78-1.78.71-.71-1.41-1.41L12 3.49c-1.17-1.17-3.07-1.17-4.24 0L4.22 7.03l1.41 1.41H2.81l-.71.71 3.54 3.54.71-.71V9.15l1.41 1.41.71-.71 1.78 1.78-7.41 7.41 2.12 2.12L16.34 9.79c.36.13.75.21 1.16.21" fill="#4294ff"></path></svg>)
}

function SellerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-[20px] w-[20px] shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16.48 10.41c-.39.39-1.04.39-1.43 0l-4.47-4.46-7.05 7.04-.66-.63c-1.17-1.17-1.17-3.07 0-4.24l4.24-4.24c1.17-1.17 3.07-1.17 4.24 0L16.48 9c.39.39.39 1.02 0 1.41m.7-2.12c.78.78.78 2.05 0 2.83-1.27 1.27-2.61.22-2.83 0l-3.76-3.76-5.57 5.57c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.42 0l4.62-4.62.71.71-4.62 4.62c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.42 0l4.62-4.62.71.71-4.62 4.62c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.62-4.62.71.71-4.62 4.62c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l8.32-8.34c1.17-1.17 1.17-3.07 0-4.24l-4.24-4.24c-1.15-1.15-3.01-1.17-4.18-.06z" fill="#4294FF" />
        </svg>
    )
}

function OnlinemoneyIcon() {
    return (
        <svg className="h-[20px] w-[20px] shrink-0" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CreditCardIcon"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4v-6h16zm0-10H4V6h16z" fill="#4294ff"></path></svg>
    )
}

function buildTelHref(raw) {
    const t = String(raw || '').trim()
    if (!t) return '#'
    const cleaned = t.replace(/[^\d+]/g, '')
    return cleaned ? `tel:${cleaned}` : '#'
}




function TipRow({ Icon, text, iconIndex }) {
    return (
        <li className="flex items-start gap-[12px]">
            <Icon className={`h-[20px] w-[20px] shrink-0 text-[#4294ff] ${iconIndex === 0 ? 'text-[#4294ff]' : iconIndex === 1 ? 'text-[#4294ff]' : 'text-[#4294ff]'}`} />
            <p className="text-[14px] font-[Inter-Regular] leading-[22px] text-[#4294ff]">{text}</p>
        </li>
    )
}

const SAFETY_TIPS = [
    { id: 'condition', Icon: ToolIcon, text: 'Check the condition of the item' },
    { id: 'meet', Icon: SellerIcon, text: 'Meet the seller in person' },
    { id: 'wire', Icon: OnlinemoneyIcon, text: "Don't wire money online" },
]

/**
 * Phone reveal modal for motor listings — dealer header, safety tips, tap-to-call CTA.
 */
export default function MotorContactPhoneModal({ open, onClose, sellerName = '', sellerLogo = '', phoneNumber = '' }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    const displayName = String(sellerName || 'Seller').trim()
    const tel = buildTelHref(phoneNumber)
    const logoRemote = String(sellerLogo || '').startsWith('http')

    return (
        <div
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(15,23,42,0.55)] "
            role="presentation"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="motor-contact-phone-title"
                className="relative w-[440px] max-sm:w-full rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] "
                onClick={(e) => e.stopPropagation()}
            >

                <div className="p-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-[18px] top-[18px] flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full text-[#23262A] transition-colors hover:bg-[#f3f4f6]"
                    >
                        <CloseIcon className="h-[14px] w-[14px]" fill="#111827" />
                    </button>

                    <div className="flex items-start gap-[14px]">
                        <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#fff]">
                            {sellerLogo ? (
                                <Image
                                    src={sellerLogo}
                                    alt=""
                                    fill
                                    className="object-contain rounded-[12px]"
                                    sizes="84px"
                                    unoptimized={logoRemote}
                                />
                            ) : null}
                        </div>
                        <h2
                            id="motor-contact-phone-title"
                            className="text-[16px] font-[Inter-SemiBold] truncate text-[#23262A]"
                        >
                            {displayName}
                        </h2>
                    </div>

                    <div className="mt-[22px] rounded-[6px] bg-[#eef5ff] p-[10px_16px]">
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#4294ff]">Tips for a safer transaction:</p>
                        <ul className="mt-[14px] list-none space-y-[6px] p-0">
                            {SAFETY_TIPS.map((row) => (
                                <TipRow key={row.id} Icon={row.Icon} text={row.text} iconIndex={row.iconIndex} />
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="p-[20px]">
                    <Link
                        href={tel}
                        className="flex w-full cursor-pointer items-center justify-center gap-[20px] rounded-[10px] bg-[#DC0000] py-[10px] text-center text-[14px] font-[Inter-Bold] text-white transition-opacity hover:opacity-95"
                    >
                        <Image
                            src={phoneOutline}
                            alt=""
                            width={20}
                            height={20}
                            className="h-[20px] w-[20px] shrink-0 brightness-0 invert"
                        />
                        {String(phoneNumber || '').trim() || '—'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
