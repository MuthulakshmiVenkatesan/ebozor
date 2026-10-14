'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SearchIcon, TermsInfoIcon, FileIcon } from '@/components/CustomFile/icons'
import logo from '../../../../public/assets/img/logo.png'
import legalbg from '../../../../public/assets/img/legalbg.png'
import LegalTermsicon from '../../../../public/assets/img/LegalTermsicon.svg'
import PrivacyPolicyicon from '../../../../public/assets/img/PrivacyPolicyicon.svg'

const LEGAL_TERMS_LINKS = [
    { label: 'Terms of Use', href: '/terms-and-condition' },
    { label: 'Additional Terms – Property', href: '/terms-and-condition' },
    { label: 'Additional Terms – Motors', href: '/terms-and-condition' },
    { label: 'Additional Terms – Jobs', href: '/terms-and-condition' },
    { label: 'Additional Terms – Holiday Homes', href: '/terms-and-condition' },
    { label: 'Additional Terms – Verified Business Account', href: '/terms-and-condition' },
    { label: 'Acceptable Use Policy', href: '/terms-and-condition' },
    { label: 'Vehicle Inspection Terms and Conditions', href: '/terms-and-condition' },
    { label: 'Vehicle Auction Terms and Conditions', href: '/terms-and-condition' },
    { label: 'Vehicle Intermediary Services Terms and Conditions', href: '/terms-and-condition' },
    { label: 'Vehicle Evaluation Terms and Conditions', href: '/terms-and-condition' },
]

const PRIVACY_LINKS = [{ label: 'Privacy Policy', href: '/privacy-policy' }]

const CONTACT_EMAILS = [
    { label: 'support@ebozor.com', href: 'mailto:support@ebozor.com' },
    { label: 'privacy@ebozor.com', href: 'mailto:privacy@ebozor.com' },
]

const LegalHub = () => {
    const [query, setQuery] = useState('')

    const filteredTerms = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return LEGAL_TERMS_LINKS
        return LEGAL_TERMS_LINKS.filter((item) => item.label.toLowerCase().includes(q))
    }, [query])

    return (
        <div className="w-full ">
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

            <section
                className="relative border-t border-[rgba(143,143,143,0.2)] p-[80px_0px_40px] max-sm:px-[15px]"
                style={{
                    backgroundImage: `url(${legalbg.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="max-w-[1170px] relative mx-auto max-sm:max-w-full">
                    <h2 className="text-[34px] font-[Inter-Regular] leading-tight text-[#222]">
                        Welcome to
                    </h2>
                    <h1 className="text-[48px] font-[Inter-Medium] leading-tight text-[#e00718]">
                    ebozor Legal Hub
                    </h1>
                    <p className="text-[20px] font-[Inter-Regular] text-[#222]">
                        Find legal information and resources for ebozor products and services
                    </p>

                    <div className="mt-[22px] w-full max-w-[350px]">
                        <div className="flex items-center rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white p-[8px_12px]">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search"
                                className="h-full w-full border-none bg-transparent text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                            />
                            <SearchIcon className="h-[22px] w-[22px]" stroke="#000" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container py-[48px]">
                <div className="grid grid-cols-1 gap-[40px] md:grid-cols-2">
                    <div>
                        <div>
                            <Image src={LegalTermsicon} alt="Legal Terms" width={60} height={50} />
                        </div>
                        <h3 className="text-[20px] font-[Inter-Bold] text-[#222]">Legal Terms</h3>
                        <p className="text-[14px] font-[Inter-Regular] text-[#222]">
                            Terms you agree to when you use ebozor
                        </p>
                        <div className="space-y-[6px]">
                            {filteredTerms.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="block text-[14px] font-[Inter-Regular] text-[#2A2C2D] underline hover:text-[#DC0000]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div>
                            <Image src={PrivacyPolicyicon} alt="Privacy Policy" width={40} height={50} />
                        </div>
                        <h3 className="text-[20px] font-[Inter-Bold] text-[#222]">Privacy Policy</h3>
                        <p className="text-[14px] font-[Inter-Regular] text-[#222]">
                            Information about how we handle your personal information
                        </p>
                        <div className="space-y-[6px]">
                            {PRIVACY_LINKS.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="block text-[14px] font-[Inter-Regular] text-[#2A2C2D] underline hover:text-[#DC0000]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#eceeef] py-[46px]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className='mb-[20px]'>
                        <h4 className="text-[20px] font-[Inter-Regular] text-[#222]">We’re all about transparency and accountability.</h4>
                        <p className="mt-[8px] text-[14px] font-[Inter-Regular] text-[#222]">
                            That’s why we built this hub: to simplify access to the legal bits. Let’s make buying and selling a
                            seamless and enjoyable experience for everyone.
                        </p>
                    </div>

                    <h5 className="mt-[34px] text-[20px] font-[Inter-Regular] text-[#222]">Need to contact us?</h5>
                    <p className="mt-[8px] text-[14px] font-[Inter-Regular] text-[#222]">
                        For any questions about your use of our services, please email{' '}
                        <Link href={CONTACT_EMAILS[0].href} className="underline">
                            {CONTACT_EMAILS[0].label}
                        </Link>
                        .
                    </p>
                    <p className="mt-[4px] text-[14px] font-[Inter-Regular] text-[#222]">
                        For any questions relating to your privacy or our use of your personal information, please email{' '}
                        <Link href={CONTACT_EMAILS[1].href} className="underline">
                            {CONTACT_EMAILS[1].label}
                        </Link>
                        .
                    </p>
                </div>
            </section>
        </div>
    )
}

export default LegalHub
