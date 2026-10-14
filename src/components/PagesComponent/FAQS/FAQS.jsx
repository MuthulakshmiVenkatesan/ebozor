"use client"
import Link from 'next/link'
import QuickAnswerAccordion from '@/components/LandingPage/QuickAnswerAccordion'
import NoData from '@/components/NoDataFound/NoDataFound'
import ArticleSearchInput from '@/components/Search/ArticleSearchInput'
import { t } from '@/utils'
import { getFaqApi } from '@/utils/api'
import React, { useEffect, useMemo, useState } from 'react'
import ContactHeader from '../ContactUs/components/ContactHeader'
import ContactFooter from '../ContactUs/components/ContactFooter'

const stripHtml = (html) => {
    if (html == null || typeof html !== 'string') return ''
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const FAQS = () => {

    const [Faq, setFaq] = useState([])

    const getFaqData = async () => {
        try {
            const res = await getFaqApi.getFaq()
            setFaq(Array.isArray(res?.data?.data) ? res.data.data : [])
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getFaqData()
    }, [])

    const [query, setQuery] = useState('')

    const filteredFaq = useMemo(() => {
        const text = query.trim().toLowerCase()
        if (!text) return Faq
        return Faq.filter((item) => {
            const q = (item?.question || '').toLowerCase()
            const a = stripHtml(item?.answer || '').toLowerCase()
            return q.includes(text) || a.includes(text)
        })
    }, [query, Faq])

    return (
        <>
            {/* <section className='static_pages'>
                <BreadcrumbComponent title2={t("faqs")} />
                <div className='container'>
                    <div className="static_div">
                        <div className="main_title">
                            <span>
                                {t('faqs')}
                            </span>
                        </div>
                        <div className="page_content p-0">
                            <div className="quickanswer_accordion_wrapper">
                                {Faq && Faq.length > 0 ? (

                                    <QuickAnswerAccordion Faq={Faq} />
                                ) : (
                                    <div>
                                        <NoData name={t('faqs')} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
            <ContactHeader />
            <div className="bg-[#fafafa] py-[26px] sm:py-[38px]">
                <div className="mx-auto w-full max-w-[1000px] px-[16px]">
                    <h1 className="mb-[16px] text-center text-[34px] font-[Inter-Regular] leading-tight text-[#666]">
                        How can we help you?
                    </h1>

                    <div className="mx-auto mb-[40px] w-full max-w-[770px]">
                        <ArticleSearchInput value={query} onChange={setQuery} />
                    </div>

                    <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_330px]">
                        <div className="overflow-hidden border border-[#d7d9dd] bg-white">
                            <div className="">
                                {filteredFaq && filteredFaq.length > 0 ? (

                                    <QuickAnswerAccordion Faq={filteredFaq} />
                                ) : (
                                    <div>
                                        <NoData name={t('faqs')} />
                                    </div>
                                )}
                            </div>
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

export default FAQS
