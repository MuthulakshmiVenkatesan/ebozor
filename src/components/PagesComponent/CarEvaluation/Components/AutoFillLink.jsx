/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { PortfolioIcon } from '@/components/CustomFile/icons'
import checkederror from '../../../../../public/assets/img/icons/checkederror.svg'
import calendar from '../../../../../public/assets/img/icons/calendar.svg'
import speedometer from '../../../../../public/assets/img/icons/speedometer.svg'

export default function AutoFillLink({
    isOpen,
    autofillAdLink,
    setAutofillAdLink,
    autofillTouched,
    setAutofillTouched,
    isValidAutofillLink,
    isAutofillLoading,
    autofillError,
    handleCloseAutofillModal,
    handleConfirmAutofill,
    previewImage,
    previewData,
    invalidHelperText,
    invalidSubText,
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(0,0,0,0.55)] px-[20px]">
            <div className="max-sm:w-full w-[480px] rounded-[6px] bg-white p-[24px] shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
                <h3 className="mb-[12px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                    Autofill With Ad Link
                </h3>
                <p className=" text-[14px] font-[Inter-Regular] leading-[1.4] text-[#666B72] ">
                    Share the ebozor ad link and we will fetch the car and seller details.
                </p>

                <div className="mt-[24px] rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[14px]">
                    <div className="flex items-center gap-[10px]">
                        <PortfolioIcon className="h-[16px] w-[16px] rotate-[130deg] shrink-0" fill="#3a88ef" />
                        <input
                            type="text"
                            value={autofillAdLink}
                            onChange={(e) => setAutofillAdLink(e.target.value)}
                            onBlur={() => setAutofillTouched(true)}
                            placeholder="ebozor Car Ad Link"
                            className=" w-full border-0 bg-transparent text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                        />
                    </div>
                </div>

                {(autofillError && autofillTouched) ? (
                    <div className="mt-[14px] rounded-[10px] bg-[#0000000a] p-[12px] text-center">
                        <div className="mb-[8px] mx-auto flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#e50000] ">
                            <Image src={checkederror} alt="Checked Error" className="w-[24px] h-[24px]" />
                        </div>
                        <h4 className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                            {invalidHelperText || 'Provide a valid ebozor ad link to proceed.'}
                        </h4>
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                            {invalidSubText || 'Links from other websites are not supported for auto-filling information.'}
                        </p>
                    </div>
                ) : null}

                {isAutofillLoading ? (
                    <div className="mt-[14px] rounded-[10px] bg-[#0000000a] p-[12px]">
                        <div className="h-[90px] w-full animate-pulse rounded-[6px] bg-[#ECECEC]" />
                    </div>
                ) : null}

                {isValidAutofillLink && previewData ? (
                    <div className="mt-[14px] rounded-[10px] bg-[#0000000a] p-[12px]">
                        <div className="flex gap-[10px]">
                            <Image
                                src={String(previewData?.image || '').trim() || previewImage}
                                alt="Fetched car"
                                width={160}
                                height={90}
                                className="h-[90px] w-[160px] rounded-[6px] object-cover"
                            />
                            <div className="flex-1 flex flex-col gap-[10px]">
                                <div className="flex items-start justify-between gap-[10px]">
                                    <div>
                                        <h4 className="mb-[4px] text-[14px] font-[Inter-Regular] text-[#23262A] leading-[22px]">{String(previewData?.name || 'N/A')}</h4>
                                        <div className="flex items-center gap-[10px]">
                                            <div className="flex items-center gap-[4px]">
                                                <Image src={calendar} alt="Calendar" className="w-[16px] h-[16px]" />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#626465]">-</p>
                                            </div>
                                            <div className="flex items-center gap-[4px]">
                                                <Image src={speedometer} alt="Speedometer" className="w-[16px] h-[16px]" />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#626465]">-</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">AED {Number(previewData?.price || 0).toLocaleString('en-AE')}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-[10px]">
                                    <h4 className="text-[12px] font-[Inter-Regular] text-[#626465]">Seller Name</h4>
                                    <h3 className="text-[12px] font-[Inter-Regular] text-[#23262A]">{String(previewData?.user?.name || 'N/A')}</h3>
                                </div>
                                <div className="flex items-center gap-[10px]">
                                    <h4 className="text-[12px] font-[Inter-Regular] text-[#626465]">Seller Phone Number</h4>
                                    <h3 className="text-[12px] font-[Inter-Regular] text-[#23262A]">{String(previewData?.contact || previewData?.user?.mobile || 'N/A')}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="flex items-center gap-[12px] justify-between mt-[14px]">
                    <button
                        type="button"
                        onClick={handleCloseAutofillModal}
                        className="w-full border border-[#DC0000] text-[14px] font-[Inter-SemiBold] text-[#DC0000] p-[8px_20px] cursor-pointer rounded-[6px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmAutofill}
                        disabled={!isValidAutofillLink || isAutofillLoading}
                        className={`w-full text-[14px] font-[Inter-SemiBold] p-[8px_20px] rounded-[6px] ${isValidAutofillLink && !isAutofillLoading ? 'bg-[#DC0000] text-white cursor-pointer' : 'bg-[#D3D3D3] text-[#8f8f8f] cursor-not-allowed'
                            }`}
                    >
                        Confirm Details
                    </button>
                </div>
            </div>
        </div>
    )
}
