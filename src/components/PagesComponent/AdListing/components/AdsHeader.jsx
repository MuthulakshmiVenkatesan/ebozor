import React from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { settingsData } from '@/redux/reuducer/settingSlice'
import Image from 'next/image'
import { placeholderImage } from '@/utils'
import { FaChevronLeft } from 'react-icons/fa'

const AdsHeader = () => {
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    return (
        <div className='w-full p-[0px_20px] shadow-[0_2px_8px_0px_rgba(0,0,0,0.1)]'>
            <div className='w-full flex items-center justify-center gap-2'>
                <Link
                    href="/"
                    prefetch={false}
                    className='flex h-10 w-10 shrink-0 items-center justify-center text-[#000000] hover:opacity-75'
                    aria-label="Back to home"
                >
                    <FaChevronLeft size={20} />
                </Link>
                <div className='flex min-w-0 flex-1 justify-center'>
                    <Link href="/" prefetch={false}>
                        <div className='flex items-center justify-center'>
                            <Image src={settings?.header_logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' onErrorCapture={placeholderImage} />
                        </div>
                    </Link>
                </div>
                <span className='h-10 w-10 shrink-0' aria-hidden />
            </div>
        </div>
    )
}

export default AdsHeader