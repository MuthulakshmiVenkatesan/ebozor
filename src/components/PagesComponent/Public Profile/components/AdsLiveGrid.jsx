'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

function formatAed(amount) {
    const n = Number(amount)
    if (Number.isNaN(n)) return '0'
    return n.toLocaleString('en-AE')
}

/**
 * @param {{ id: string, imageSrc: string, title: string, price: number, currency?: string, href?: string }[]} ads
 */
export default function AdsLiveGrid({ ads = [], totalCount = null }) {
    const count = Number(totalCount)
    const displayCount = Number.isFinite(count) && count >= 0 ? count : ads.length
    if (displayCount === 0) return null

    return (
        <div>
            <p className="mb-[20px] text-[14px] font-[Inter-Bold] leading-none text-[#23262A]">
                {displayCount} item{displayCount === 1 ? '' : 's'} live
            </p>
            <div className="grid grid-cols-4 gap-[24px] max-sm:grid-cols-1">
                {ads.map((ad) => (
                    <Link
                        key={ad.id}
                        href={ad.href || '/ads'}
                        className="group block overflow-hidden rounded-[8px] bg-white "
                    >
                        <div className="relative ">
                            <Image
                                src={ad.imageSrc}
                                alt=""
                                width={100}
                                height={172}
                                className="object-cover w-full h-[172px] transition-transform duration-200"
                            />
                        </div>
                        <div className="p-[16px]">
                            <p className="text-[16px] font-[Inter-Bold] leading-tight text-[#23262A] mb-[4px]">
                                {(ad.currency || 'AED')} {formatAed(ad.price)}
                            </p>
                            <p className="truncate text-[14px] font-[Inter-Regular] leading-snug text-[#23262A]" title={ad.title}>
                                {ad.title}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
