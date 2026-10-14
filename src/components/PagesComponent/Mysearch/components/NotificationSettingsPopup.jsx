'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { InviteNotifyIcon, CloseIcon } from '../../../CustomFile/icons'
import emailnotify from '../../../../../public/assets/img/icons/emailnotify.png'
import pushnotify from '../../../../../public/assets/img/icons/pushnotify.png'
const NotificationSettingsPopup = ({
    isOpen,
    onClose,
    searchCategory = 'Motor . Usedcar',
    searchName = 'My Used Cars search',
    newAdsCount = 4567,
    thumbnail,
}) => {
    const [emailOn, setEmailOn] = useState(false)
    const [pushOn, setPushOn] = useState(true)

    if (!isOpen) return null

    const handleUpdate = () => {
        // TODO: call API to update notification preferences
        onClose()
    }

    return (
        <>
            <div
                className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 max-sm:p-[4px]"
                onClick={onClose}
                aria-hidden="true">
                <div
                    className="flex flex-col max-sm:w-full w-[500px] bg-white rounded-[14px] border border-[rgba(143,143,143,0.2)] shadow-[0_4.949px_29.693px_0_rgba(0,0,0,0.25)] z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center gap-[12px] p-[20px_16px] border-b border-[rgba(143,143,143,0.24)]">
                        <InviteNotifyIcon className="w-[24px] h-[24px] flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[4px]">
                                Invite others to collaborate
                            </h3>
                            <p className="text-[14px] font-[Inter-Medium] text-[#000] ">
                                Get Notified when ads match your search
                            </p>
                        </div>
                    </div>

                    {/* Search details */}
                    <div className='mt-[20px]'>
                        <div className="p-[16px]">
                            <div className=" mb-[30px] flex items-center justify-between gap-[12px] border border-[rgba(143,143,143,0.16)] shadow-[0_0_2px_0_gba(0,0,0,0.06)] p-[16px] rounded-[12px]">
                                <div className="">
                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC] mb-[4px]">
                                        {searchCategory}
                                    </h4>
                                    <div className="flex items-center gap-[10px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#000000CC] truncate">
                                            {searchName}
                                        </p>
                                        <p className="inline-flex items-center p-[2px_6px] rounded-[12px] bg-[#A8E6AB] text-[12px] font-[Inter-Regular] text-[#fff]">
                                            {newAdsCount} new ads
                                        </p>
                                    </div>
                                </div>
                                {thumbnail && (
                                    <div className="flex relative flex-shrink-0">
                                        <Image
                                            src={thumbnail}
                                            alt="Saved search"
                                            width={48}
                                            height={48}
                                            className="w-[48px] h-[48px] object-cover absolute top-0 right-[30px] rounded-[6px] z-[1]"
                                        />
                                        <Image
                                            src={thumbnail}
                                            alt="Saved search"
                                            width={48}
                                            height={48}
                                            className="w-[48px] h-[48px] object-cover absolute top-0 right-[16px] rounded-[6px] z-[2]"
                                        />
                                        <Image
                                            src={thumbnail}
                                            alt="Saved search"
                                            width={48}
                                            height={48}
                                            className="w-[48px] h-[48px] object-cover rounded-[6px] z-[3]"
                                        />
                                    </div>
                                )}
                            </div>
                            {/* Toggles */}
                            <div className="flex flex-col gap-[24px] px-[16px] mb-[20px]">
                                {/* Email */}
                                <div className="flex items-center justify-between gap-[16px]">
                                    <div className="flex items-center gap-[12px]">
                                        <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0">
                                            <Image
                                                src={emailnotify}
                                                alt="Email notify"

                                            />
                                        </div>
                                        <div className="">
                                            <h4 className="text-[14px] font-[Inter-Medium] text-[#000]">Email</h4>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Receive emails with new ads that match
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={emailOn}
                                        onClick={() => setEmailOn((v) => !v)}
                                        className={`flex-shrink-0 w-[44px] h-[24px] rounded-full transition-colors cursor-pointer bg-[#BDC3C7] ${emailOn ? '' : ''}`}
                                    >
                                        <span
                                            className={`block w-[18px] h-[18px] rounded-full transition-transform ${emailOn ? 'translate-x-[22px] bg-[#000]' : 'translate-x-[3px] bg-[#fff]'}`}
                                        />
                                    </button>
                                </div>

                                {/* Push */}
                                <div className="flex items-center justify-between gap-[16px]">
                                    <div className="flex items-center gap-[12px]">
                                        <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0">
                                            <Image
                                                src={pushnotify}
                                                alt="Push notify"

                                            />
                                        </div>
                                        <div className="">
                                            <h4 className="text-[14px] font-[Inter-Medium] text-[#000]">Push</h4>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Get notifications on your phone with the new ads
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={pushOn}
                                        onClick={() => setPushOn((v) => !v)}
                                        className={`flex-shrink-0 w-[44px] h-[24px] rounded-full transition-colors cursor-pointer bg-[#BDC3C7] ${pushOn ? '' : ''}`}
                                    >
                                        <span
                                            className={`block w-[18px] h-[18px] rounded-full transition-transform ${pushOn ? 'translate-x-[22px] bg-[#000]' : 'translate-x-[3px] bg-[#fff]'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Actions */}
                        <div className="flex gap-[12px] justify-end border-t border-[rgba(143,143,143,0.24)] p-[16px]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-[8px_18px] rounded-[6px] border border-[#8F8F8F] bg-white text-[14px] font-[Inter-Regular] text-[#000000BF] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdate}
                                className="p-[8px_18px] rounded-[6px] bg-[#000] text-[#FFF] text-[14px] font-[Inter-Regular] cursor-pointer"
                            >
                                Update Notification
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NotificationSettingsPopup
