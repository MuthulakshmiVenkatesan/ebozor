/* eslint-disable react/prop-types */
'use client'
import Image from 'next/image'
import { CloseIcon } from '@/components/CustomFile/icons'
import user from '../../../../../public/assets/img/user.jpeg'

function dialDigits(value) {
    if (value == null) return ''
    return String(value).replace(/\D/g, '')
}

export default function PhoneNumberModal({
    open,
    onClose,
    phoneNumber = '+97148376876',
    phoneRaw,
    name = 'Candidate',
    imageSrc,
}) {
    if (!open) return null

    const displayName = String(name || '').trim() || 'Candidate'
    const photo = String(imageSrc || '').trim() || user
    const callableDigits = dialDigits(phoneRaw ?? phoneNumber)
    const canCall = callableDigits.length >= 8

    const handleCall = () => {
        if (!canCall) return
        window.location.href = `tel:${callableDigits}`
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(15,23,42,0.55)] px-[16px]">
            <div className="w-[400px] max-sm:w-full overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
                <div className="relative flex items-start justify-between">

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="cursor-pointer absolute top-[14px] right-[20px]"
                    >
                        <CloseIcon className="w-[14px] h-[14px]" fill="#666666" />
                    </button>
                </div>

                <div className="p-[14px] text-center">
                    <div className="flex items-center gap-[16px]">
                        <div className="flex items-center justify-center border border-[#eaebed] rounded-[12px]">
                            <Image
                                src={photo}
                                alt={displayName}
                                width={80}
                                height={80}
                                className="h-[80px] w-[80px] rounded-[12px] object-cover"
                            />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-[14px] text-left">
                            <h3 className="break-words text-[22px] font-[Inter-SemiBold] text-[#23262A]">{displayName}</h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCall}
                        disabled={!canCall}
                        className="cursor-pointer mt-[22px] w-full rounded-[10px] bg-[#FFF4F4] py-[14px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {phoneNumber}
                    </button>
                </div>
            </div>
        </div>
    )
}
