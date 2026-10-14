'use client'

import Image from 'next/image'
import { LocationIcon } from '@/components/CustomFile/icons'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'

export default function CommonProjectCard({
    image = '/assets/img/property/1.png',
    title = 'Palace Residences Hillside A',
    propertyType = 'Apartment',
    location = 'Palace Residences Hillside A, Palace Residences Hillside, Dubai',
    launchPrice = 'AED 1.7M',
    downPayment = '10%',
    developer = 'Emaar',
    developerLogo = '/assets/img/client.png',
    whatsappLabel = 'WhatsApp',
    onWhatsAppClick,
    className = '',
}) {
    return (
        <div className='pt-[10px] pb-[18px] border-b border-[rgba(143,143,143,0.18)] cursor-pointer '>
            <div
                className={`w-full overflow-hidden rounded-[16px] bg-white shadow-[0_3px_3px_-2px_rgba(0,0,0,0.1),_0_3px_4px_rgba(0,0,0,0.07),_0_1px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transition-all duration-300 ${className}`}
            >
                <div className="flex min-w-0 items-stretch max-sm:flex-col">
                    <div className="w-[42%] max-w-[360px] shrink-0 max-sm:w-full max-sm:max-w-none">
                        <Image
                            src={image}
                            alt={title}
                            width={360}
                            height={280}
                            className="h-[300px] w-full object-cover max-sm:h-[220px]"
                        />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between p-[18px_16px]">
                        <div className="min-w-0">
                            <h3 className="mb-[8px] text-[22px] font-[Inter-SemiBold] text-[#23262A]">
                                {title}
                            </h3>

                            <p className="mb-[8px] text-[14px] font-[Inter-SemiBold] text-[#23262A] ">
                                {propertyType}
                            </p>

                            <div className="mb-[14px] flex min-w-0 items-center gap-[6px]">
                                <LocationIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                                <p className="min-w-0 flex-1 truncate text-[14px] font-[Inter-Regular] text-[#23262A] ">
                                    {location}
                                </p>
                            </div>

                            <div className="mb-[14px] flex flex-wrap items-start gap-[30px]">
                                <div>
                                    <p className="mb-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                        Launch Price
                                    </p>
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] ">
                                        {launchPrice}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                        Down Payment
                                    </p>
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] max-sm:text-[18px] max-sm:leading-[26px]">
                                        {downPayment}
                                    </p>
                                </div>
                            </div>

                            <p className="mb-[16px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                Developer: <span className="font-[Inter-SemiBold]">{developer}</span>
                            </p>
                        </div>

                        <div className="flex items-end justify-between gap-[12px]">
                            <button
                                type="button"
                                onClick={onWhatsAppClick}
                                className="cursor-pointer flex items-center gap-[8px] rounded-[8px] bg-[#43bb3f1a] px-[18px] py-[10px] max-sm:px-[14px] max-sm:py-[8px]"
                            >
                                <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">{whatsappLabel}</p>
                            </button>

                            <div className="shrink-0 ">
                                <Image
                                    src={developerLogo}
                                    alt={`${developer} logo`}
                                    width={80}
                                    height={60}
                                    className="h-[60px] w-[80px] object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
