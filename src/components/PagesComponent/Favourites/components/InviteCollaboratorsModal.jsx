'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ModalCloseIcon, RightArrowIcon, LinkIcon } from '@/components/CustomFile/icons'
import postads from '../../../../../public/assets/img/postads.png'
import Image from 'next/image'
import ShareViewOnlyLinkModal from './ShareViewOnlyLinkModal'

const InviteCollaboratorsModal = ({
    open,
    onClose,
    onInvite,
    onShareViewOnly,
    listName = 'New',
    savedAdsLabel = '0 Saved Ads',
}) => {
    const dialogRef = useRef(null)
    const [isShareViewOnlyOpen, setIsShareViewOnlyOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open) return null

    // const handleShareViewOnly = () => {
    //     setIsShareViewOnlyOpen(true)
    //     onShareViewOnly?.()
    // }

    return (
        <>

     
            <div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-[16px]"
                onMouseDown={(e) => {
                    if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
                }}
            >
                <div
                    ref={dialogRef}
                    className="max-sm:w-full w-[500px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                    onMouseDown={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="p-[18px] border-b border-[rgba(143,143,143,0.24)] flex items-center justify-between">
                        <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000]">
                            Invite others to collaborate
                        </h3>
                        <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="flex items-center justify-center cursor-pointer"
                            aria-label="Close"
                        >
                            <ModalCloseIcon className='w-[24px] h-[24px]' />
                        </button>
                    </div>

                    <div className="p-[18px] pb-[26px]">
                        <button
                            type="button"
                            onClick={() => { }}
                            className="mb-[12px] w-full flex items-center justify-between gap-[12px] bg-[rgba(58,136,239,0.14)] rounded-[4px] p-[10px_12px] cursor-pointer"
                        >
                            <div className="flex items-center gap-[16px]">
                                <div className="w-[34px] h-[34px] flex items-center justify-center">
                                    <Image src={postads} alt="postads" width={34} height={34} />
                                </div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                                    Invite others to collaborate
                                </p>
                            </div>
                            <div>
                                <RightArrowIcon className='w-[20px] h-[20px] rtl:rotate-180' stroke='#000' />
                            </div>
                        </button>
                        <div className='ml-[14px] mb-[24px]'>
                            <p className="text-[14px] font-[Inter-Regular] text-[#000000BF] mb-[10px]">
                                You can share and invite friends to collaborate or view your list
                            </p>
                            <p className="text-[14px] font-[Inter-Regular] text-[#000000BF]">
                                Invite collaborators on this list
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsShareViewOnlyOpen(true)
                                onShareViewOnly?.()
                            }}
                            className="flex items-center gap-[10px] cursor-pointer"
                        >
                            <LinkIcon className='' />
                            <p className='text-[14px] font-[Inter-Medium] text-[#3A88EF]'>Share a view only link</p>
                        </button>
                    </div>

                    <div className="p-[18px] border-t border-[rgba(143,143,143,0.24)] flex items-center justify-end gap-[10px]">
                        <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="p-[8px_22px] rounded-[6px] border border-[#8F8F8F] text-[14px] font-[Inter-Regular] text-[#000000BF] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onInvite?.()
                                onClose?.()
                            }}
                            className="p-[8px_26px] rounded-[6px] bg-[#DC0000] text-white text-[14px] font-[Inter-Regular] cursor-pointer"
                        >
                            Invite
                        </button>
                    </div>
                </div>
            </div>
            <ShareViewOnlyLinkModal
                open={isShareViewOnlyOpen}
                onClose={() => setIsShareViewOnlyOpen(false)}
                listName={listName}
                savedAdsLabel={savedAdsLabel}
            />
        </>
    )
}

export default InviteCollaboratorsModal

