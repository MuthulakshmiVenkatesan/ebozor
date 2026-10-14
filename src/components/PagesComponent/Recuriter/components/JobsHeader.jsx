'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../../../public/assets/img/logo.png'

const JobsHeader = () => {
    return (
        <header className="w-full bg-white fixed top-0 z-50">
            <div className="max-w-[1170px] mx-auto flex items-center justify-between py-[14px] gap-[24px]">
                <div className="flex items-center gap-[14px]">
                    <Link href="/">
                        <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                    </Link>
                    <span className="h-[24px] w-px bg-[#000]" />
                    <h4 className="text-[14px] font-[Inter-Medium] text-[#000000]">Jobs</h4>
                </div>

                <nav className="hidden md:flex items-center gap-[30px] ">
                    <Link href="/recuriter#available-plans" className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                        Pricing
                    </Link>
                    <Link href="/recuriter#cv-section" className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                        CV Search
                    </Link>
                    <Link href="/recuriter#performance" className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                        Why Ebozor Jobs?
                    </Link>
                </nav>

                <div className="flex items-center gap-[16px]">
                    <button className="cursor-pointer bg-[#DC0000] text-white text-[14px] font-[Inter-SemiBold] rounded-full p-[10px_26px]">
                        Contact us
                    </button>
                </div>
            </div>
        </header>
    );
};

export default JobsHeader;

