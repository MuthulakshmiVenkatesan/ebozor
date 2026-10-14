'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { DownArrowIcon, PlusIcon, SearchIcon } from '@/components/CustomFile/icons'
import ContactHeader from '../ContactUs/components/ContactHeader'
import ContactFooter from '../ContactUs/components/ContactFooter'
const HELP_CATEGORIES = [
    { id: 'my-account', title: 'My Account', articles: ['How to update profile', 'How to reset password'] },
    { id: 'ads', title: 'Ads', articles: ['How to post an ad', 'How to boost ad visibility'] },
    { id: 'trust-safety', title: 'Trust & Safety', articles: ['Report suspicious activity', 'Scam prevention tips'] },
    { id: 'verified-business', title: 'Verified Business', articles: ['How to get verified', 'Verification requirements'] },
    { id: 'troubleshooting', title: 'Troubleshooting', articles: ['App not loading', 'Unable to upload images'] },
    { id: 'motors-faqs', title: 'Motors FAQs', articles: ['How inspections work', 'How to contact seller'] },
]

const TRENDING_ARTICLES = [
    'How to post an ad quickly',
    'How to recover my account',
    'How to report fraud',
    'How to make listing verified',
]

export default function Help() {
    const [query, setQuery] = useState('')
    const [openCategoryId, setOpenCategoryId] = useState(null)

    const filteredCategories = useMemo(() => {
        const text = query.trim().toLowerCase()
        if (!text) return HELP_CATEGORIES
        return HELP_CATEGORIES.filter((item) => item.title.toLowerCase().includes(text))
    }, [query])

    return (
        <>
            <ContactHeader />
            <div className="bg-[#fafafa] py-[26px] sm:py-[38px]">
                <div className="mx-auto w-full max-w-[1000px] px-[16px]">
                    <h1 className="mb-[16px] text-center text-[34px] font-[Inter-Regular] leading-tight text-[#666]">
                        How can we help you?
                    </h1>

                    <div className="mx-auto mb-[40px] w-full max-w-[770px]">
                        <div className="flex  items-center rounded-[2px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px]">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search our articles"
                                className="h-full w-full border-none bg-transparent text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                            />
                            <SearchIcon className="h-[26px] w-[26px] shrink-0" stroke="#DC0000" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_330px]">
                        <div className="overflow-hidden border border-[#d7d9dd] bg-white">
                            {filteredCategories.map((item) => {
                                const isOpen = openCategoryId === item.id
                                return (
                                    <div key={item.id} className="border-b border-[#e3e5e8] last:border-b-0">
                                        <button
                                            type="button"
                                            onClick={() => setOpenCategoryId(isOpen ? null : item.id)}
                                            className="flex w-full items-center justify-between p-[16px_18px] text-left"
                                        >
                                            <div className="flex min-w-0 items-center gap-[14px]">
                                                <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-[2px] border border-[#d7d9dd]">
                                                    <PlusIcon className="h-[15px] w-[15px]" />
                                                </span>
                                                <span className="truncate text-[35px] font-[Inter-Regular] text-[#1f2937] max-sm:text-[27px]">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <DownArrowIcon
                                                className={`h-[18px] w-[18px] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                stroke="#9CA3AF"
                                            />
                                        </button>

                                        {isOpen ? (
                                            <div className="bg-[#fbfbfc] p-[0_18px_14px_64px]">
                                                {item.articles.map((article) => (
                                                    <p key={article} className="py-[6px] text-[16px] font-[Inter-Regular] text-[#4B5563]">
                                                        {article}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>

                        <aside className="border border-[#d7dce1] bg-white">
                            <h3 className="relative border-b border-[#eceff2] px-[16px] py-[16px] text-center text-[18px] font-[Inter-SemiBold] text-[#23262A] max-sm:text-[30px]">
                                Trending articles
                                <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#fff]" />
                            </h3>
                            <div className='p-[35px_25px_20px] bg-[#f3f3f3]'>
                                <div className='w-full'>
                                    <Link
                                        href="/blogs"
                                        className='flex justify-center items-center w-full cursor-pointer rounded-[2px] bg-[#DC0000] py-[10px] text-[16px] font-[Inter-Regular] text-white transition'>
                                        Read Articles
                                    </Link>
                                </div>
                            </div>

                        </aside>
                    </div>
                </div>
            </div>
            <ContactFooter />
        </>
    )
}
