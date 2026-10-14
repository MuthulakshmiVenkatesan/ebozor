'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import googleplay from '../../../../../public/assets/img/googleplay.png'
import appstore from '../../../../../public/assets/img/appstore.png'
import contactfooter from '../../../../../public/assets/img/contactfooter.png'

const FOOTER_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'Terms of Use', href: '/terms-and-condition' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Place Your Ad', href: '/placeyourad' },
]

export default function ContactFooter() {
    const year = new Date().getFullYear()

    return (
        <footer className="relative w-full overflow-hidden border-t border-[rgba(143,143,143,0.45)] bg-[#e8e8e8]">
          
          <div>
            <Image src={contactfooter} alt="contactfooter" className="w-full h-[180px]" />
          </div>

            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-[16px] px-[16px] py-[14px] md:flex-row md:items-center md:justify-between bg-[#e8e8e8]">
                <nav className="flex flex-wrap items-center gap-[12px] text-[12px] font-[Inter-Regular] text-[#666666]">
                    {FOOTER_LINKS.map((item, idx) => (
                        <React.Fragment key={item.href}>
                            <Link href={item.href} className="transition hover:text-[#000]">
                                {item.label}
                            </Link>
                            {idx < FOOTER_LINKS.length - 1 ? <span className="text-[#c8ccd2]">|</span> : null}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="flex items-center gap-[10px]">
                    <Link href="#" aria-label="Get it on Google Play">
                        <Image src={googleplay} alt="Google Play" className="h-[34px] w-auto" />
                    </Link>
                    <Link href="#" aria-label="Download on the App Store">
                        <Image src={appstore} alt="App Store" className="h-[34px] w-auto" />
                    </Link>
                </div>
            </div>

            <div className="relative bg-[#DC0000] py-[12px]">
                <div className="mx-auto w-full max-w-[1000px] px-[16px] text-[12px] font-[Inter-Regular] text-white">
                    &copy; ebozor.com {year}, All Rights Reserved.
                </div>

                {/* <button
                    type="button"
                    className="absolute right-[16px] top-1/2 inline-flex -translate-y-1/2 items-center gap-[6px] rounded-[999px] bg-[#d40000] px-[14px] py-[7px] text-[24px] font-[Inter-SemiBold] text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                >
                    <span className="text-[22px] leading-none">◔</span> chat
                </button> */}
            </div>
        </footer>
    )
}
