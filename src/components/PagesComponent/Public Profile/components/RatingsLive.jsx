'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { FaStar } from 'react-icons/fa6'

function StarRow({ value = 5, max = 5, size = 14, gapClass = 'gap-[2px]' }) {
    return (
        <span className={`inline-flex items-center ${gapClass} text-[#F5B400]`} aria-hidden>
            {Array.from({ length: max }, (_, i) => (
                <FaStar key={i} size={size} className={i < value ? 'opacity-100' : 'opacity-[0.22]'} />
            ))}
        </span>
    )
}

/**
 * @param {{
 *   overallRating: number,
 *   basedOnCount: number,
 *   reviews: {
 *     id: string,
 *     reviewerName: string,
 *     role: 'buyer' | 'seller',
 *     avatarSrc: string,
 *     rating: number,
 *     timeAgo: string,
 *     tags: string[],
 *     text: string,
 *   }[]
 * }} data
 */
export default function RatingsLive({ data }) {
    const { overallRating, basedOnCount, reviews } = data
    const [filter, setFilter] = useState('all')

    const buyerCount = useMemo(() => reviews.filter((r) => r.role === 'buyer').length, [reviews])
    const sellerCount = useMemo(() => reviews.filter((r) => r.role === 'seller').length, [reviews])
    const allCount = reviews.length

    const filteredReviews = useMemo(() => {
        if (filter === 'buyer') return reviews.filter((r) => r.role === 'buyer')
        if (filter === 'seller') return reviews.filter((r) => r.role === 'seller')
        return reviews
    }, [reviews, filter])

    const tabClass = (key, disabled) =>
        `relative flex-1 inline-flex items-center justify-center gap-[10px] p-[14px] text-[14px] transition-colors ${disabled
            ? 'cursor-not-allowed text-[#C4C4C4]'
            : filter === key
                ? 'cursor-pointer font-[Inter-SemiBold] text-[#23262A]'
                : 'cursor-pointer font-[Inter-Regular] text-[#6B7280] hover:text-[#23262A]'
        }`

    const underline = (key) =>
        filter === key ? <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-[1px] bg-[#DC0000]" /> : null

    const countPill = (n) => (
        <span className={`inline-flex w-[30px] h-[20px] items-center justify-center rounded-[4px] bg-[#f7f7f8] text-[11px] font-[Inter-Medium] leading-none ${n > 0 ? 'text-[#23262A]' : 'text-[#6B7280]'}`}>
            {n}
        </span>
    )

    return (
        <div className='grid grid-cols-[1fr_380px] gap-[20px] max-sm:grid-cols-1'>
            <div className='bg-white shadow-[rgba(0,0,0,0.02)_0px_4px_8px_-2px,rgba(0,0,0,0.02)_0px_3px_8px,rgba(0,0,0,0.04)_0px_1px_10px] rounded-[6px]'>
                <div className="flex flex-wrap gap-x-[28px] gap-y-[8px] border-b-[2px] border-[rgba(143,143,143,0.2)]">
                    <button type="button" className={tabClass('all', false)} onClick={() => setFilter('all')}>
                        All
                        {countPill(allCount)}
                        {underline('all')}
                    </button>
                    <button type="button" className={tabClass('buyer', false)} onClick={() => setFilter('buyer')}>
                        Buyer
                        {countPill(buyerCount)}
                        {underline('buyer')}
                    </button>
                    <button type="button" className={tabClass('seller', sellerCount === 0)} onClick={() => sellerCount > 0 && setFilter('seller')}>
                        Seller
                        {sellerCount > 0 ? countPill(sellerCount) : null}
                        {sellerCount > 0 ? underline('seller') : null}
                    </button>
                </div>
                <div className="">
                    {filteredReviews.length === 0 ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#6B7280]">No reviews in this category.</p>
                    ) : (
                        <ul className="flex flex-col gap-[28px]">
                            {filteredReviews.map((rev) => (
                                <li key={rev.id} className="border-b border-[rgba(143,143,143,0.12)] pb-[28px] last:border-b-0 last:pb-0 p-[24px]">
                                    <div className="flex items-start gap-[12px] max-sm:flex-col min-w-0">
                                        <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full">
                                            <Image src={rev.avatarSrc} alt="" width={40} height={40} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col gap-[10px]">
                                            <div className="flex flex-wrap items-baseline gap-x-[8px] gap-y-[2px]">
                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#464c55]">{rev.reviewerName}</h4>
                                                <span className="text-[12px] font-[Inter-Regular] capitalize text-[#9CA3AF]">{rev.role}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
                                                <StarRow value={rev.rating} size={15} gapClass="gap-[3px]" />
                                                <span className="text-[12px] font-[Inter-Regular] text-[#9CA3AF]">{rev.timeAgo}</span>
                                            </div>
                                            {rev.tags?.length ? (
                                                <div className="flex flex-wrap gap-[8px]">
                                                    {rev.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="rounded-full bg-[#ffffff] border border-[rgba(143,143,143,0.18)] px-[12px] py-[5px] text-[12px] font-[Inter-Medium] text-[#23262A]"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            <p className="text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A] truncate max-sm:max-w-[250px]">{rev.text}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>

            <div className="h-fit rounded-[10px] border border-[rgba(143,143,143,0.12)] bg-white p-[24px] shadow-[0px_2px_10px_rgba(0,0,0,0.04)] lg:sticky lg:top-[24px] flex flex-col gap-[10px]">
                <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Overall Rating</h3>
                <div className="flex flex-wrap items-center gap-[10px]">
                    <StarRow value={Math.round(overallRating)} size={22} gapClass="gap-[4px]" />
                    <span className="text-[28px] font-[Inter-Bold] leading-none text-[#23262A]">{overallRating}</span>
                </div>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Based on <span className="font-[Inter-SemiBold] text-[#23262A]">{basedOnCount} rating{basedOnCount === 1 ? '' : 's'}</span> 
                </p>
            </div>
        </div>
    )
}
