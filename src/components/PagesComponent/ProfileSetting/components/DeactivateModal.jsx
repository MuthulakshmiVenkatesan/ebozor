'use client'

import React, { useEffect } from 'react'

export default function DeactivateModal({ open, onClose, onConfirm }) {
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-[16px]" role="dialog" aria-modal="true" aria-labelledby="deactivate-modal-title">
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={onClose} />
            <div
                className="relative z-[1] w-[500px] max-sm:w-full rounded-[6px] bg-white p-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <h2 id="deactivate-modal-title" className="mb-[18px] text-left text-[18px] font-[Inter-SemiBold] leading-snug text-[#23262A]">
                    Are you sure you want to deactivate your account?
                </h2>
                <p className="mb-[24px] text-left text-[14px] font-[Inter-Regular] leading-[1.5] text-[#23262A]">This action cannot be undone.</p>
                <div className="flex flex-wrap items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.55)] bg-white p-[10px_24px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm?.()
                            onClose?.()
                        }}
                        className="cursor-pointer rounded-[6px] bg-[#23262A] p-[10px_24px] text-[14px] font-[Inter-SemiBold] text-white transition-colors"
                    >
                        Yes, Deactivate
                    </button>
                </div>
            </div>
        </div>
    )
}
