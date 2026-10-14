'use client'

import React, { useEffect } from 'react'

const DeleteAdConfirmModal = ({ open, onClose, onConfirm, selectedCount = 0 }) => {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open) return null

    const heading =
        Number(selectedCount) > 1 ? 'Delete selected ad(s)?' : 'Delete Ad?'

    const body =
        Number(selectedCount) > 1
            ? `This action cannot be undone and the selected ads will be gone forever.`
            : `This action cannot be undone and the ad will be gone forever.`

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 px-[12px]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.()
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="p-[20px] max-sm:w-full w-[560px] bg-white rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="mb-[14px]">
                    <h3 className="text-[20px] font-[Inter-SemiBold] text-[#DC0000]">{heading}</h3>
                </div>
                <div className="mb-[14px]">
                    <p className="text-[14px] font-[Inter-Regular] text-[#00000CC]">{body}</p>
                </div>
                <div className="flex items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-[10px_30px] rounded-[4px] border border-[#8F8F8F] text-[14px] font-[Inter-Medium] text-[#000000CC] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="p-[10px_30px] rounded-[4px] bg-[#DC0000] text-white text-[14px] font-[Inter-Medium] cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteAdConfirmModal

