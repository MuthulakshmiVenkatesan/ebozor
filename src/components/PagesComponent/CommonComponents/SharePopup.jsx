'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import {
    FacebookIcon,
    FacebookShareButton,
    TwitterShareButton,
    WhatsappIcon,
    WhatsappShareButton,
    XIcon,
    EmailShareButton,
    EmailIcon,
    LinkedinIcon,
    LinkedinShareButton,
} from 'react-share'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { CloseIcon } from '@/components/CustomFile/icons'
import whatsapp from '../../../../public/assets/img/social/whatsapp.png'
import facebook from '../../../../public/assets/img/social/facebook.png'
import email from '../../../../public/assets/img/social/email.png'
import x from '../../../../public/assets/img/social/twitter.png'
import linkedin from '../../../../public/assets/img/social/linkedin.png'
import { getDefaultFavouritesShareUrl, getShareDefaultListTitle, getShareFacebookHashtag } from '@/utils/siteUrl'

function resolveShareUrl(url) {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return raw

    try {
        if (typeof window !== 'undefined' && window.location?.origin) {
            return new URL(raw, window.location.origin).href
        }
    } catch (err) {
        return raw
    }

    return raw
}

const SharePopup = ({ isOpen, onClose, shareUrl, title }) => {
    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    const resolvedShareUrl = resolveShareUrl(shareUrl ?? getDefaultFavouritesShareUrl())
    const resolvedTitle = title ?? getShareDefaultListTitle()
    const fbHashtag = getShareFacebookHashtag()

    const handleCopy = async () => {
        try {
            if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(resolvedShareUrl)
            } else {
                const input = document.createElement('textarea')
                input.value = resolvedShareUrl
                input.setAttribute('readonly', '')
                input.style.position = 'fixed'
                input.style.opacity = '0'
                document.body.appendChild(input)
                input.select()
                document.execCommand('copy')
                document.body.removeChild(input)
            }
            toast.success('Link copied to clipboard')
        } catch (err) {
            toast.error('Failed to copy')
        }
    }

    const emailHref = `mailto:?subject=${encodeURIComponent(resolvedTitle)}&body=${encodeURIComponent(resolvedShareUrl)}`

    const shareOptions = [
        {
            label: 'Whatsapp',
            Button: WhatsappShareButton,
            Icon: <Image src={whatsapp} alt="whatsapp" width={48} height={48} className="w-[48px] h-[48px]" />,
            props: { url: resolvedShareUrl, title: resolvedTitle },
        },
        {
            label: 'Facebook',
            Button: FacebookShareButton,
            Icon: <Image src={facebook} alt="facebook" width={48} height={48} className="w-[48px] h-[48px]" />,
            props: { url: resolvedShareUrl, ...(fbHashtag ? { hashtag: fbHashtag } : {}) },
        },
        {
            label: 'Email',
            href: emailHref,
            Icon: <Image src={email} alt="email" width={48} height={48} className="w-[48px] h-[48px]" />,
        },
        {
            label: 'X',
            Button: TwitterShareButton,
            Icon: <Image src={x} alt="x" width={48} height={48} className="w-[48px] h-[48px]" />,
            props: { url: resolvedShareUrl, title: resolvedTitle },
        },
        {
            label: 'Linkedin',
            Button: LinkedinShareButton,
            Icon: <Image src={linkedin} alt="linkedin" width={48} height={48} className="w-[48px] h-[48px]" />,
            props: { url: resolvedShareUrl, title: resolvedTitle },
        },
    ]

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 max-sm:p-[4px]"
                onClick={onClose}
                aria-hidden="true">

                <div
                    className="flex flex-col max-sm:w-full w-[650px] bg-white rounded-[14px] border border-[rgba(143,143,143,0.2)] shadow-[0_4.949px_29.693px_0_rgba(0,0,0,0.25)] z-[9999]"
                    onClick={(e) => {
                        e.stopPropagation()
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-[20px_16px] border-b border-[rgba(143,143,143,0.24)]">
                        <h3 className="text-[18px] font-[Inter-Bold] text-[#000]">
                            Share this Listing
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer"
                            aria-label="Close"
                        >
                            <CloseIcon className="w-[18px] h-[18px]" />
                        </button>
                    </div>

                    <div className="p-[16px] mt-[20px]">
                        <div className="flex items-center justify-center gap-[32px] mb-[24px] flex-wrap">
                            {shareOptions.map(({ label, Button, Icon, props, href }) => (
                                <div key={label} className="flex flex-col items-center gap-[14px]">
                                    {href ? (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="focus:outline-none"
                                        >
                                            <div className="flex items-center justify-center overflow-hidden">
                                                {Icon}
                                            </div>
                                        </a>
                                    ) : (
                                        <Button {...props} className="focus:outline-none">
                                            <div className="flex items-center justify-center overflow-hidden">
                                                {Icon}
                                            </div>
                                        </Button>
                                    )}
                                    <p className="text-[12px] font-[Inter-Regular] text-[#000000CC]">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-[8px]">
                            <input
                                type="text"
                                readOnly
                                value={resolvedShareUrl}
                                className="w-full border-none outline-none focus:outline-none focus:border-none shadow-none p-[12px] rounded-[4px] bg-[rgba(143,143,143,0.12)] text-[14px] font-[Inter-Regular] text-[#000]"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-[10px_20px] rounded-[4px] bg-[#000] text-white text-[14px] font-[Inter-Regular] cursor-pointer"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}

export default SharePopup
