'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RightArrowIcon } from '@/components/CustomFile/icons'
import individual from '../../../../../public/assets/img/jobdashboard/individual.svg'
import company from '../../../../../public/assets/img/jobdashboard/company.svg'




function ProfileTypeCard({ type, description, ctaLabel, href, Illustration }) {
    return (
        <div className="rounded-[6px] bg-white p-[32px] [box-shadow:0px_3px_5px_-1px_rgba(0,0,0,0.1),0px_6px_10px_rgba(0,0,0,0.07),0px_1px_18px_rgba(0,0,0,0.06)] flex flex-col items-center gap-[14px]">
            <Image src={Illustration} alt={type} width={160} height={160} className="mx-auto" />
            <p className="text-center text-[16px] font-[Inter-Regular] leading-[1.5] text-[#464c55] ">
                {description}
            </p>
            <div className="flex justify-center">
                <Link
                    href={href}
                    className="inline-flex items-center gap-[4px] rounded-[6px] bg-[#DC0000] p-[8px_16px] text-[14px] font-[Inter-Medium] text-white transition "
                >
                    <p className="text-[14px] font-[Inter-Bold] text-white">{ctaLabel}</p>
                    <RightArrowIcon className="h-[20px] w-[20px]" stroke="#ffffff" />
                </Link>
            </div>
        </div>
    )
}

const ProfileLanding = () => {
    return (
        <section className="mx-auto w-full max-w-[980px] ">
            <header className="mb-[26px] text-center">
                <h1 className="text-[24px] font-[Inter-Bold] leading-[1.2] text-[#23262A] mb-[4px]">
                    Who are you hiring for?
                </h1>
                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                    Your dashboard will be customized based on your selection
                </p>
            </header>

            <div className="mx-auto w-[640px] grid grid-cols-2 gap-[34px] max-sm:grid-cols-1 max-sm:w-full">
                <ProfileTypeCard
                    type="personal"
                    description="Source candidates for individual services. Eg: Drivers, Tutors, House help etc."
                    ctaLabel="Personal"
                    href="/jobdashboard/my-profile"
                    Illustration={individual}
                />
                <ProfileTypeCard
                    type="company"
                    description="Source candidates for corporate jobs. Eg: Engineers, Accountants, Front desk etc."
                    ctaLabel="Company"
                    href="/jobdashboard/companyprofile"
                    Illustration={company}
                />
            </div>

            <p className="mt-[34px] text-center text-[16px] font-[Inter-Regular] italic text-[#23262A]">
                *If you want to update this later please contact our customer support at 800 ebozor.
            </p>
        </section>
    )
}

export default ProfileLanding
