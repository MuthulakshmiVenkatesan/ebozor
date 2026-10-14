'use client'

import React from 'react'

const DeleteModal = ({ open, onClose, onConfirm }) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(0,0,0,0.45)] p-[16px]">
            <div className="max-sm:w-full w-[540px] overflow-hidden rounded-[6px] bg-white [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]">
                <div className="border-b border-[rgba(143,143,143,0.25)] p-[20px_24px]">
                    <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A] max-sm:text-[26px]">Delete draft?</h3>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.25)] p-[20px_24px]">
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A] max-sm:text-[18px]">
                        Are you sure you want to delete this draft?
                    </p>
                </div>

                <div className="flex items-center justify-end gap-[8px] p-[10px_8px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.6)] bg-white p-[8px_22px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="cursor-pointer rounded-[6px] border border-[#DC0000] bg-[#DC0000] p-[8px_22px] text-[14px] font-[Inter-SemiBold] text-white"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteModal
