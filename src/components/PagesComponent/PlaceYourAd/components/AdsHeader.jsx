import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../../../public/assets/img/logo.png'

const AdsHeader = () => {

    return (
        <div className='w-full p-[0px_20px] shadow-[0_2px_8px_0px_rgba(0,0,0,0.1)]'>
            <Link href="/">
                <div className='w-full flex items-center justify-center'>
                    <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                </div>
            </Link>
        </div>
    )
}

export default AdsHeader