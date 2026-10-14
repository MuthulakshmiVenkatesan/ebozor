"use client"
import React from 'react'
import { store } from '@/redux/store'
import AdsHeader from '../AdListing/components/AdsHeader'


const AboutUs = () => {

    const settingsData = store.getState().Settings?.data
    const aboutUs = settingsData?.data?.about_us

    return (
        <>
            <div className="w-full mx-auto">
                <AdsHeader />
                <div className="max-w-[600px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="aboutus_content mb-[60px]">
                            <div
                                className="text-[#23262A] [&_h1]:mb-[14px] [&_h1]:text-[34px] [&_h1]:font-[Inter-SemiBold] [&_h2]:mb-[12px] [&_h2]:mt-[20px] [&_h2]:text-[28px] [&_h2]:font-[Inter-SemiBold] [&_h3]:mb-[10px] [&_h3]:mt-[16px] [&_h3]:text-[22px] [&_h3]:font-[Inter-SemiBold] [&_h4]:mb-[8px] [&_h4]:mt-[14px] [&_h4]:text-[18px] [&_h4]:font-[Inter-SemiBold] [&_p]:mb-[12px] [&_p]:text-[15px] [&_p]:leading-[1.75] [&_ul]:mb-[14px] [&_ul]:list-disc [&_ul]:pl-[24px] [&_ol]:mb-[14px] [&_ol]:list-decimal [&_ol]:pl-[24px] [&_li]:mb-[6px] [&_strong]:font-[Inter-SemiBold] [&_em]:italic [&_a]:text-[#3A88EF] [&_a]:underline hover:[&_a]:text-[#DC0000] [&_blockquote]:my-[12px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#d9dde3] [&_blockquote]:pl-[12px] [&_img]:my-[12px] [&_img]:h-auto [&_img]:max-w-full [&_table]:mb-[14px] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[rgba(143,143,143,0.35)] [&_td]:p-[8px] [&_th]:border [&_th]:border-[rgba(143,143,143,0.35)] [&_th]:bg-[#f6f7f8] [&_th]:p-[8px]"
                                dangerouslySetInnerHTML={{ __html: aboutUs || "" }}
                            />
                    </div>
                </div>
            </div>
        </>
    )
}

export default AboutUs
