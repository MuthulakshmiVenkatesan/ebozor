/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import favourites from '../../../../../public/assets/img/favourites.png'
import whatsapp from '../../../../../public/assets/img/social/whatsapp.png'
import facebook from '../../../../../public/assets/img/social/facebook.png'
import email from '../../../../../public/assets/img/social/email.png'
import x from '../../../../../public/assets/img/social/twitter.png'
import { ModalCloseIcon } from '@/components/CustomFile/icons'
import { buildWhatsAppMeTextShareUrl } from '@/utils/whatsapp'
import {
    getDefaultFavouritesShareUrl,
    getShareEmailSubjectViewList,
    buildFacebookSharerUrl,
    buildTwitterIntentShareUrl,
} from '@/utils/siteUrl'

const ShareViewOnlyLinkModal = ({
    open,
    onClose,
    listName = 'New',
    savedAdsLabel = '0 Saved Ads',
    shareUrl,
}) => {
    const dialogRef = useRef(null)
    const resolvedShareUrl = shareUrl ?? getDefaultFavouritesShareUrl()

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const shareTargets = useMemo(
        () => [
            { key: 'wa', label: 'Whatsapp', icon: whatsapp, href: buildWhatsAppMeTextShareUrl(resolvedShareUrl) },
            { key: 'fb', label: 'Facebook', icon: facebook, href: buildFacebookSharerUrl(resolvedShareUrl) },
            { key: 'x', label: 'X', icon: x, href: buildTwitterIntentShareUrl(resolvedShareUrl) },
            {
                key: 'mail',
                label: 'Email',
                icon: email,
                href: `mailto:?subject=${encodeURIComponent(getShareEmailSubjectViewList())}&body=${encodeURIComponent(resolvedShareUrl)}`,
            },
        ],
        [resolvedShareUrl]
    )

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-[16px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="p-[18px] max-sm:w-full w-[440px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="mb-[16px] flex items-center justify-between gap-[10px]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000]">
                        Invite a friend to join and collaborate on your list
                    </h3>
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="flex items-center justify-center cursor-pointer"
                        aria-label="Close"
                    >
                        <ModalCloseIcon className='w-[24px] h-[24px]' />
                    </button>
                </div>

                <div className="">
                    <div className="bg-white shadow-[0_0px_12px_0_rgba(0,0,0,0.6)] rounded-[12px] p-[18px] flex items-center gap-[14px] mb-[14px]">
                        <Image
                            src={favourites}
                            alt=""
                            width={68}
                            height={68}
                            className="w-[68px] h-[68px] object-cover rounded-[6px]"
                        />
                        <div className="flex-1 flex flex-col gap-[18px]">
                            <p className="text-[14px] font-[Inter-Medium] text-[#000] truncate ">{listName}</p>
                            <p className="text-[14px] font-[Inter-Medium] text-[#000000CC] ">{savedAdsLabel}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-[10px] bg-[#8F8F8F1F] rounded-[4px] p-[10px] ">
                        <input
                            value={resolvedShareUrl}
                            readOnly
                            className="max-sm:w-[100px] flex-1 text-[14px] font-[Inter-Regular] text-[#000000] outline-none shadow-none focus:outline-none focus:shadow-none border-none"
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(resolvedShareUrl)
                                } catch (e) {
                                    // ignore
                                }
                            }}
                            className="p-[6px_16px] rounded-[4px] border border-[#8F8F8F] text-[13px] font-[Inter-Medium] text-[#000000CC] bg-transparent cursor-pointer"
                        >
                            Copy
                        </button>
                    </div>

                    <div className="pt-[20px] border-t border-[rgba(143,143,143,0.24)] mt-[20px] flex items-center justify-center gap-[18px]">
                        {shareTargets.map((s) => (
                            <a
                                key={s.key}
                                href={s.href}
                                target="_blank"
                                rel="noreferrer"
                                className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center cursor-pointer"
                                aria-label={s.label}
                            >
                                <Image src={s.icon} alt={s.label} width={34} height={34} className="w-[34px] h-[34px]" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShareViewOnlyLinkModal

