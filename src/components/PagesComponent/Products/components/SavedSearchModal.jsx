'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import savednew from '../../../../../public/assets/img/icons/savednew.svg'
import { TickIcon } from '@/components/CustomFile/icons'
import savedfill from '../../../../../public/assets/img/icons/savedfill.svg'

export default function SavedSearchModal({
    isOpen,
    onClose,
    onDone,
    onDelete,
    initialName = 'My Toyota Search',
    isAlreadySaved = false,
}) {
    const [searchName, setSearchName] = useState(initialName)
    const [emailWhenMatched, setEmailWhenMatched] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setSearchName(initialName)
            setEmailWhenMatched(true)
        }
    }, [isOpen, initialName])

    if (!isOpen) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(17,24,39,0.5)] ">
            <div
                className="max-sm:m-[10px] max-sm:w-full w-[550px] bg-white rounded-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-[16px] overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className={`border-b border-[rgba(143,143,143,0.2)] pb-[20px] ${isAlreadySaved ? '' : 'text-center'}`}>
                    {isAlreadySaved ? (
                        <div className="mb-[8px] flex items-center gap-[16px]">
                            <Image src={savedfill} alt="savedfill" className="h-[24px] w-[24px]" />
                            <div>
                                <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[4px]">You already saved this search!</h3>
                                <p className={`text-[14px] font-[Inter-Regular] text-[#000] ${isAlreadySaved ? '' : ''}`}>
                                    Access your saved searches from the top navigation
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto mb-[10px] flex items-center justify-center">
                            <Image src={savednew} alt="savednew" className="h-[100px] w-[100px]" />
                        </div>
                    )}
                    {!isAlreadySaved ? (
                        <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[8px]">Search Saved!</h3>
                    ) : null}

                </div>

                <div className="py-[16px]">
                    <p className="mb-[4px] text-[16px] leading-[24px] font-[Inter-Regular] text-[#3a3f47]">
                        {isAlreadySaved ? 'Would you like to rename your search?' : 'Name your search'}
                    </p>
                    <input
                        value={searchName}
                        onChange={(event) => setSearchName(event.target.value)}
                        className="p-[14px_16px] w-full rounded-[8px] border border-[rgba(143,143,143,0.6)] text-[14px] font-[Inter-Regular] text-[#000] placeholder:text-[#8f8f8f] outline-none"
                    />

                    {/* <label className="mt-[24px] relative flex cursor-pointer items-center gap-[10px]">
                        <input
                            type="checkbox"
                            checked={emailWhenMatched}
                            onChange={(event) => setEmailWhenMatched(event.target.checked)}
                            className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                            checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                        />
                        {emailWhenMatched ? (
                            <TickIcon
                                className="w-[24px] h-[22px] absolute left-[-1px]"
                                fill="#DC0000"
                            />
                        ) : null}
                        <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#23262A]">
                            Email me when ads match this search
                        </p>
                    </label> */}
                </div>

                <div className="flex items-center justify-between gap-[12px] border-t border-[rgba(143,143,143,0.2)] pt-[16px]">
                    <div className={`${isAlreadySaved ? '' : 'invisible'}`}>
                        <button
                            type="button"
                            onClick={() => onDelete?.()}
                            className={`cursor-pointer text-[14px] font-[Inter-Regular] text-[#000] `}
                        >
                            Delete this search
                        </button>
                    </div>
                    <div className='flex items-center justify-end gap-[16px]'>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-[8px_22px] rounded-[6px] border border-[#8F8F8F] text-[14px] font-[Inter-Regular] text-[#000000BF] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onDone({ name: searchName.trim(), emailWhenMatched })}
                            className="p-[8px_26px] rounded-[6px] bg-[#23262A] text-[#fff] text-[14px] font-[Inter-Regular] cursor-pointer"
                        >
                            {isAlreadySaved ? 'Save' : 'Done'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
