'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import logo from '../../../../../public/assets/img/logo.png'

const Header = () => {
    const pathname = usePathname()
    const isSellMyCar = pathname?.startsWith('/sellmycar') ?? false
    const isHelpBuy = pathname?.startsWith('/helpbuy') ?? false

    const navMuted = 'text-[14px] font-[Inter-Regular] text-[#525252]'
    const navActive = 'text-[14px] font-[Inter-Regular] text-[#DC0000]'

    return (
        <header className="border-b border-[#eee] bg-white p-[5px_0] mb-[30px]">
            <div className="mx-auto flex h-[44px] max-w-[1170px] items-center gap-[18px] px-[15px] common_container">
                <Link href="/" className="">
                    <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                </Link>

                <nav className="flex items-center gap-[24px]">
                    <Link href="#" className={navMuted}>
                        Cars
                    </Link>
                    <Link href="/sellmycar" className={isSellMyCar ? navActive : navMuted}>
                        Sell My Car
                    </Link>
                    <Link href="/helpbuy" className={isHelpBuy ? navActive : navMuted}>
                        Help Me Buy
                    </Link>
                </nav>
            </div>
        </header>
    )
}

export default Header
