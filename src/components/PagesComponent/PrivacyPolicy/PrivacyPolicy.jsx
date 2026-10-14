'use client'
import React from 'react'
import { store } from '@/redux/store'
import { domToReact } from 'html-react-parser';
import Link from "next/link"
import Image from 'next/image'
import logo from '../../../../public/assets/img/logo.png'
import legalbg from '../../../../public/assets/img/legalbg.png'

const PrivacyPolicy = () => {

    const settingsData = store.getState().Settings.data
    const privacy = settingsData?.data?.privacy_policy


    const options = {
        replace: (domNode) => {
            // Check if the node is an anchor tag <a>
            if (domNode.name === 'a' && domNode.attribs && domNode.attribs.href) {
                const { href, ...otherAttribs } = domNode.attribs;
                return (
                    <Link href={href} {...otherAttribs} className="blog_link">
                        {domToReact(domNode.children)}
                    </Link>
                );
            }
        },
    };


    return (
        // <section className='aboutus'>
        //     <BreadcrumbComponent title2={t('privacyPolicy')} />
        //     <div className='container'>

        //         <div className="page_content">
        //             {parse(privacy || '', options)}
        //         </div>
        //     </div>
        // </section>
        <div className="w-full mx-auto">
            <div className="bg-white">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container flex items-center justify-between py-[8px]">
                    <Link href="/" className="inline-flex items-center">
                        <Image src={logo} alt="logo" width={120} height={60} className="h-[52px] w-auto" />
                    </Link>
                    <Link
                        href="/placeyourad"
                        className="inline-flex items-center justify-center rounded-[8px] bg-[#DC0000] px-[18px] py-[10px] text-[12px] font-[Inter-Bold] uppercase text-white"
                    >
                        Place your ad
                    </Link>
                </div>
            </div>
            <div className="relative border-t border-[rgba(143,143,143,0.2)] p-[30px_0] max-sm:px-[15px]"
                style={{
                    backgroundImage: `url(${legalbg.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right',
                    backgroundRepeat: 'no-repeat',
                }}
            >

                <div className="max-w-[1170px] relative mx-auto max-sm:max-w-full">
                    <p className="text-[14px] font-[Inter-Regular] text-[#2A2C2D]">
                        <Link href="/" className="underline">
                            Legal Hub
                        </Link>{' '}
                        » Privacy Policy
                    </p>
                </div>
            </div>
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container py-[20px]">
                <div>
                    <h4 className="mb-[10px] text-[32px] font-[Inter-Medium] text-[#222]">
                        ebozor
                    </h4>
                    <h3 className="text-[40px] font-[Inter-Medium] text-[#222]">
                        Privacy Policy
                    </h3>

                </div>
                <div
                    className="page_content text-[#23262A] [&_h1]:mb-[14px] [&_h1]:text-[34px] [&_h1]:font-[Inter-SemiBold] [&_h2]:mb-[12px] [&_h2]:mt-[20px] [&_h2]:text-[28px] [&_h2]:font-[Inter-SemiBold] [&_h3]:mb-[10px] [&_h3]:mt-[16px] [&_h3]:text-[22px] [&_h3]:font-[Inter-SemiBold] [&_h4]:mb-[8px] [&_h4]:mt-[14px] [&_h4]:text-[18px] [&_h4]:font-[Inter-SemiBold] [&_p]:mb-[12px] [&_p]:text-[15px] [&_p]:leading-[1.75] [&_ul]:mb-[14px] [&_ul]:list-disc [&_ul]:pl-[24px] [&_ol]:mb-[14px] [&_ol]:list-decimal [&_ol]:pl-[24px] [&_li]:mb-[6px] [&_li::marker]:font-[Inter-Regular] [&_strong]:font-[Inter-SemiBold] [&_em]:italic [&_a]:text-[#3A88EF] [&_a]:underline hover:[&_a]:text-[#DC0000] [&_blockquote]:my-[12px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#d9dde3] [&_blockquote]:pl-[12px] [&_img]:my-[12px] [&_img]:h-auto [&_img]:max-w-full [&_table]:mb-[14px] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[rgba(143,143,143,0.35)] [&_td]:p-[8px] [&_th]:border [&_th]:border-[rgba(143,143,143,0.35)] [&_th]:bg-[#f6f7f8] [&_th]:p-[8px] "
                    dangerouslySetInnerHTML={{ __html: privacy || '' }}
                >
                </div>
            </div>
        </div>
    )
}

export default PrivacyPolicy
