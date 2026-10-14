'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../../../public/assets/img/logo.png'
import { DownArrowIcon } from '@/components/CustomFile/icons'

export default function ContactHeader({
    languageLabel = 'English (United States)',
    placeAdHref = '/placeyourad',
    onLanguageChange,
}) {
    const [open, setOpen] = useState(false)
    const [currentLabel, setCurrentLabel] = useState(languageLabel)
    const rootRef = useRef(null)

    useEffect(() => {
        setCurrentLabel(languageLabel)
    }, [languageLabel])

    useEffect(() => {
        const onDocDown = (e) => {
            if (!rootRef.current) return
            if (!rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDocDown)
        return () => document.removeEventListener('mousedown', onDocDown)
    }, [])

    const languageOptions = useMemo(
        () => [
            { code: 'en', label: 'English (United States)' },
            { code: 'ar', label: 'Arabic' },
        ],
        []
    )

    const handlePick = (opt) => {
        setCurrentLabel(opt.label)
        setOpen(false)
        if (typeof onLanguageChange === 'function') {
            onLanguageChange(opt)
            return
        }
        if (typeof window !== 'undefined') window.location.href = `/?lang=${encodeURIComponent(opt.code)}`
    }

    return (
        <header className="w-full border-b border-[#DC0000] bg-white">
            <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between p-[0px_16px]">
                <Link href="/" className="inline-flex items-center" aria-label="Go to homepage">
                    <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                </Link>

                <div ref={rootRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="cursor-pointer inline-flex items-center gap-[6px] text-[14px] font-[Inter-Regular] text-[#7f1d1d]"
                        aria-label="Language selector"
                        aria-expanded={open}
                    >
                        <span>{currentLabel}</span>
                        <DownArrowIcon
                            className={`h-[14px] w-[14px] transition-transform ${open ? 'rotate-180' : ''}`}
                            stroke="#8F8F8F"
                        />
                    </button>

                    {open ? (
                        <div className="absolute left-1/2 top-[calc(100%+10px)] z-[50] w-[220px] -translate-x-1/2 overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.25)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                            {languageOptions.map((opt) => (
                                <button
                                    key={opt.code}
                                    type="button"
                                    onClick={() => handlePick(opt)}
                                    className={`cursor-pointer flex w-full cursor-pointer items-center justify-between px-[12px] py-[10px] text-left text-[13px] font-[Inter-Regular] text-[#23262A] hover:bg-[#f5f6f7] ${
                                        currentLabel === opt.label ? 'bg-[#f5f6f7] font-[Inter-SemiBold]' : ''
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {/* {currentLabel === opt.label ? (
                                        <span className="text-[12px] font-[Inter-SemiBold] text-[#0c4a9d]">Selected</span>
                                    ) : null} */}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <Link
                    href={placeAdHref}
                    className="inline-flex  items-center justify-center rounded-[2px] bg-[#dc0000] p-[10px_16px] text-[12px] font-[Inter-SemiBold] uppercase tracking-[0.02em] text-white transition rounded-[6px] max-sm:p-[6px] "
                >
                    Place your ad
                </Link>
            </div>
        </header>
    )
}
