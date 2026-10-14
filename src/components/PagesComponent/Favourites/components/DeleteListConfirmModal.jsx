/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useRef } from 'react'

const DeleteListConfirmModal = ({
    open,
    onClose,
    onConfirm,
}) => {
    const dialogRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 px-[16px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[440px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-[18px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[8px]">
                        Are you sure you want to delete this list?
                    </h3>
                    <p className="text-[14px] font-[Inter-Regular] text-[#00000080]">
                        Along with your list, the collaborators on the list will be deleted as well
                    </p>
                </div>

                <div className="p-[18px] flex items-center justify-end gap-[10px]">
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
                            onConfirm?.()
                            onClose?.()
                        }}
                        className="p-[8px_22px] rounded-[6px] bg-[#000000D9] text-white text-[14px] font-[Inter-Regular] cursor-pointer"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteListConfirmModal

