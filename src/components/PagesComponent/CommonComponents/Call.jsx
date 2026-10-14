/* eslint-disable react/prop-types */
'use client'
import Image from 'next/image'
import { CloseIcon } from '@/components/CustomFile/icons'
import { placeholderImage } from '@/utils'

export default function Call({
    open,
    onClose,
    agentName = '-',
    agencyName = '-',
    agentImage = '',
    referenceCode = '-',
    phoneNumber = '-',
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(15,23,42,0.55)] px-[16px]">
            <div className="w-[500px] max-sm:w-full overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between border-b border-[rgba(143,143,143,0.25)] p-[22px]">
                    <div className="flex items-center gap-[16px]">
                        <div className="flex items-center justify-center border border-[#eaebed] rounded-[12px]">
                            {agentImage ? (
                                <Image
                                    src={agentImage}
                                    alt={agentName}
                                    width={80}
                                    height={80}
                                    className="h-[80px] w-[80px] rounded-[12px] object-cover"
                                    onErrorCapture={placeholderImage}
                                />
                            ) : (
                                <div className="flex h-[80px] w-[80px] items-center justify-center rounded-[12px] bg-[#EEF2F7] text-[20px] font-[Inter-SemiBold] text-[#23262A]">
                                    -
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-[14px]">
                            <h3 className="text-[22px] font-[Inter-SemiBold] text-[#23262A]">{agentName || '-'}</h3>
                            <p className="text-[14px] font-[Inter-Regular] text-[#374151]">{agencyName || '-'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="cursor-pointer"
                    >
                        <CloseIcon className="w-[14px] h-[14px]" fill="#666666" />
                    </button>
                </div>

                <div className="p-[40px_50px_20px] text-center">
                    <p className="mb-[10px] text-[16px] font-[Inter-Regular] text-[#23262A]">
                        Don&apos;t forget to mention the property reference{' '}
                        <span className="font-[Inter-Bold] text-[#DC0000]">{referenceCode || '-'}</span> when you call.
                    </p>
                    <button
                        type="button"
                        className="cursor-pointer mt-[22px] w-full rounded-[10px] bg-[#FFF4F4] py-[14px] text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                    >
                        {phoneNumber || '-'}
                    </button>
                </div>
            </div>
        </div>
    )
}
