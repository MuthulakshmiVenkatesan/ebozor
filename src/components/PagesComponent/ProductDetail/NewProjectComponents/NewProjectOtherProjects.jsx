/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import { LocationIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function getJvcLabel(productData) {
    const loc = pickString(productData.location, productData.address, productData.area)
    if (!loc) return 'Jumeirah Village Circle (JVC)'
    const hasJvc = loc.toLowerCase().includes('jvc') || loc.toLowerCase().includes('jumeirah village circle')
    return hasJvc ? 'Jumeirah Village Circle (JVC)' : 'Jumeirah Village Circle (JVC)'
}

const DEMO_OTHER_PROJECTS = [
    {
        id: 1,
        title: 'Binghatti Etherea',
        launchPrice: 'Launch Price AED 700K',
        locationLine: '@ Binghatti Etherea, JVC District 10, Jumeirah Village …',
        tag: 'Under Construction',
        images: ['/assets/img/property/2.png'],
    },
    {
        id: 2,
        title: 'Almaan 101',
        launchPrice: 'Launch Price AED 699K',
        locationLine: '@ Almaan 101, JVC District 13…',
        tag: 'Under Construction',
        images: ['/assets/img/property/3.png'],
    },
    {
        id: 3,
        title: 'The Veranda Colle…',
        launchPrice: '',
        locationLine: '',
        tag: 'Under Construction',
        images: [],
    },
    {
        id: 4,
        title: 'Waref Residences…',
        launchPrice: 'Launch Price AED 836K',
        locationLine: '@ Waref Residences by Sido…',
        tag: 'Under Construction',
        images: ['/assets/img/property/1.png'],
    },
    {
        id: 5,
        title: 'Terrazo Residences',
        launchPrice: 'Launch Price AED 950K',
        locationLine: '@ Terrazo Residences, JVC',
        tag: 'Under Construction',
        images: ['/assets/img/property/4.png'],
    },
    {
        id: 6,
        title: 'Skyhills Residence 3',
        launchPrice: '',
        locationLine: '@ Skyhills Residence 3, JVC…',
        tag: 'Under Construction',
        images: ['/assets/img/property/5.png'],
    },
    {
        id: 7,
        title: 'Helvetia Residence…',
        launchPrice: 'Launch Price AED 699K',
        locationLine: '@ Helvetia Residences',
        tag: 'Under Construction',
        images: ['/assets/img/property/6.png'],
    },
]

export default function NewProjectOtherProjects({ productData = {} }) {
    const title = getJvcLabel(productData)
    const cards = useMemo(() => {
        const fromApi = productData?.other_projects || productData?.otherProjects || productData?.recommended_projects
        if (Array.isArray(fromApi) && fromApi.length) return fromApi
        return DEMO_OTHER_PROJECTS
    }, [productData])

    const [index, setIndex] = useState(0)
    const viewportRef = useRef(null)

    const [cardW, setCardW] = useState(248)
    const gap = 18
    const visibleCards = 4
    const maxIndex = Math.max(0, cards.length - visibleCards)

    useEffect(() => {
        const el = viewportRef.current
        if (!el) return

        const measure = () => {
            const w = el.clientWidth
            if (!w) return
            const cw = (w - gap * (visibleCards - 1)) / visibleCards
            setCardW(Math.max(180, cw))
        }

        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const canPrev = index > 0
    const canNext = index < maxIndex

    return (
        <div className="w-full bg-white py-[40px]">
            <div className="w-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-[22px] font-[Inter-Bold] text-[#23262A] leading-tight">
                        Other Projects in {title}
                    </h3>
                    <Link
                        href="#"
                        className="rounded-[6px] border border-[rgba(143,143,143,0.25)] p-[8px_14px] text-[14px] font-[Inter-Regular] text-[#3a88ef]"
                    >
                        View All
                    </Link>
                </div>

                <div className="relative">
                    <div ref={viewportRef} className="overflow-hidden">
                        <div
                            className="flex gap-[18px] transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${index * (cardW + gap)}px)` }}
                        >
                            {cards.map((p, idx) => (
                                <OtherProjectCard key={p.id ?? idx} project={p} cardW={cardW} />
                            ))}
                        </div>
                    </div>

                    {cards.length > 4 ? (
                        <>
                            <button
                                type="button"
                                disabled={!canPrev}
                                onClick={() => setIndex((s) => Math.max(0, s - 1))}
                                className="disabled:opacity-0 disabled:cursor-not-allowed absolute left-[-14px] top-1/2 z-[2] -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] cursor-pointer"
                                aria-label="Previous projects"
                            >
                                <PaginationPrevIcon className="h-4 w-4" stroke="#23262A" />
                            </button>
                            <button
                                type="button"
                                disabled={!canNext}
                                onClick={() => setIndex((s) => Math.min(maxIndex, s + 1))}
                                className="disabled:opacity-0 disabled:cursor-not-allowed absolute right-[-14px] top-1/2 z-[2] -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] cursor-pointer"
                                aria-label="Next projects"
                            >
                                <PaginationNextIcon className="h-4 w-4" stroke="#23262A" />
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function OtherProjectCard({ project, cardW }) {
    const images = Array.isArray(project?.images) ? project.images : []
    const src = images[0] || ''

    const title = pickString(project?.title, project?.name, project?.project_title)
    const launchPrice = pickString(project?.launchPrice, project?.launch_price, project?.priceLine)
    const locationLine = pickString(project?.locationLine, project?.location_line, project?.location)
    const tag = pickString(project?.tag, project?.status, 'Under Construction')

    return (
        <Link href="#" className="block">
            <div
                className="relative h-[328px] shrink-0 overflow-hidden rounded-[16px]"
                style={{ width: cardW }}
            >
                {src ? (
                    <Image src={src} alt={title || 'project'} fill className="h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#d6d9de]">
                        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[14px] border-[8px] border-[#6f7782] text-[#6f7782]">
                            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="8" r="1.6" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute left-[10px] top-[10px] z-[2] rounded-[6px] bg-white p-[4px_8px] text-[12px] font-[Inter-Medium] text-[#23262A]">
                    {tag}
                </div>

                <div className="absolute bottom-[14px] left-[14px] right-[14px] z-[2]">
                    <h4 className="text-[16px] font-[Inter-SemiBold] text-white leading-tight truncate">
                        {title}
                    </h4>
                    {launchPrice ? (
                        <p className="mb-[4px] text-[14px] font-[Inter-Medium] text-white truncate">
                            {launchPrice}
                        </p>
                    ) : null}
                    {locationLine ? (
                        <div className="flex items-center gap-[4px] mb-[4px]">
                            <LocationIcon className="w-[16px] h-[16px] flex-shrink-0" stroke="#fff" />
                            <p className="text-[14px] font-[Inter-Regular] text-white truncate">
                                {locationLine}
                            </p>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        className="w-full cursor-pointer rounded-[6px] bg-[#ecf8ec] py-[10px] text-center text-[14px] font-[Inter-Medium] text-[#23262A] inline-flex items-center justify-center gap-[10px]"
                    >
                        <Image src={whatsapp} alt="WhatsApp" width={18} height={18} />
                        WhatsApp
                    </button>
                </div>
            </div>
        </Link>
    )
}

