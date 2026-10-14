'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CategoryIcon } from '@/components/CustomFile/icons'
import youtube from '../../../../../public/assets/img/sellcar_social/youtube.svg'
import facebook from '../../../../../public/assets/img/sellcar_social/facebook.svg'
import instagram from '../../../../../public/assets/img/sellcar_social/instagram.svg'
import linkedin from '../../../../../public/assets/img/sellcar_social/linkedin.svg'
import twitter from '../../../../../public/assets/img/sellcar_social/twitter.svg'
import appstore from '../../../../../public/assets/img/appstore.png'
import googleplay from '../../../../../public/assets/img/googleplay.png'

const footerLinks = [
    { label: 'About Us', href: '/about-us' },
    { label: 'Terms of use', href: '/terms-and-condition' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact Us', href: '/contact-us' },
]

const socialLinks = [
    { label: 'YouTube', href: '#', icon: youtube },
    { label: 'Facebook', href: '#', icon: facebook },
    { label: 'Instagram', href: '#', icon: instagram },
    { label: 'LinkedIn', href: '#', icon: linkedin },
    { label: 'Twitter', href: '#', icon: twitter },
]

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false)

    useEffect(() => {
        const toggleScrollTopButton = () => {
            setShowScrollTop(window.scrollY > 120)
        }

        toggleScrollTopButton()
        window.addEventListener('scroll', toggleScrollTopButton)

        return () => window.removeEventListener('scroll', toggleScrollTopButton)
    }, [])

    return (
        <footer className="relative">
            <div className="bg-[#2A2C2D] py-[40px]">
                <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-[18px] px-[15px] common_container max-md:flex-col max-md:items-start">
                    <div className="flex flex-wrap items-center gap-[6px]">
                        {footerLinks.map((item, idx) => (
                            <React.Fragment key={item.label}>
                                <Link
                                    href={item.href}
                                    className="text-[12px] font-[Inter-Bold] leading-[1.2] text-[#cccccc] "
                                >
                                    {item.label}
                                </Link>
                                {idx < footerLinks.length - 1 ? (
                                    <div className="text-[#777] text-[12px] font-[Inter-Regular] leading-[1.2]" aria-hidden>
                                        |
                                    </div>
                                ) : null}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-[14px]">
                        <div className="flex items-center gap-[20px]">
                            {socialLinks.map(({ label, href, icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className=""
                                >
                                    <Image src={icon} alt={label} width={20} height={20} className="h-[20px] w-[20px]" />
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-[20px]">
                            <Link href="#" aria-label="Download on the App Store">
                                <Image
                                    src={appstore}
                                    alt="Download on the App Store"
                                    width={90}
                                    height={30}
                                    className="h-[30px] w-auto"
                                />
                            </Link>
                            <Link href="#" aria-label="Get it on Google Play">
                                <Image
                                    src={googleplay}
                                    alt="Get it on Google Play"
                                    width={90}
                                    height={30}
                                    className="h-[30px] w-auto"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#626465] py-[12px]">
                <div className="mx-auto max-w-[1170px] px-[15px] common_container">
                    <p className="text-[12px] font-[Inter-Regular] text-[#fff]">
                        © 2026 ebozor Cars Services
                    </p>
                </div>
            </div>

            <button
                type="button"
                aria-label="Back to top"
                className={`cursor-pointer fixed bottom-[20px] right-[20px] w-[36px] h-[36px] rounded-full bg-[#DC0000] flex items-center justify-center rotate-[268deg] transition-opacity duration-200 ${showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <CategoryIcon className="w-[20px] h-[20px]" fill="#fff" />
            </button>
        </footer>
    )
}

export default Footer
