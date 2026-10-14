'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CloseIcon, DeleteIcon, EditIcon } from '@/components/CustomFile/icons'

function EditModal({ open, title, onClose, children }) {
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
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])




    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1260] flex items-center justify-center p-[16px]">
            <button type="button" onClick={onClose} className="absolute inset-0 z-0 bg-black/45" aria-label="Close section editor" />
            <div
                className="relative z-[1] w-[500px] max-sm:w-full overflow-hidden rounded-[8px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between border-b border-[rgba(143,143,143,0.25)] p-[20px_24px]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        {title}
                    </h3>
                    <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Close">
                        <CloseIcon width={12} height={12} className="h-[12px] w-[12px]" fill="#8f8f8f" />
                    </button>
                </header>
                <div className="p-[16px_24px]">{children}</div>
            </div>
        </div>
    )
}

function EditModalRow({ icon, title, subtitle, onDelete, onEdit, subtitleHref }) {
    return (
        <div className="flex items-center justify-between gap-[16px] border-b border-[rgba(143,143,143,0.25)] py-[12px] last:border-b-0">
            <div className="min-w-0 flex items-center gap-[12px]">
                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#EDF0FF]">{icon}</div>
                <div className="min-w-0">
                    <p className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#23262A] truncate">{title || 'N/A'}</p>
                    {subtitle ? (
                        subtitleHref ? (
                            <Link href={subtitleHref} className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate">
                                {subtitle}
                            </Link>
                        ) : (
                            <p className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate">{subtitle}</p>
                        )
                    ) : null}
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-[22px]">
                <button type="button" onClick={onDelete} className="inline-flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] text-[#23262A] ">
                    <DeleteIcon width={20} height={20} fill="#8f8f8f"  className="h-[20px] w-[20px]"/>
                    Delete
                </button>
                <button type="button" onClick={onEdit} className="inline-flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] text-[#23262A] ">
                    <EditIcon width={20} height={20} fill="#8f8f8f" className="h-[20px] w-[20px]" />
                    Edit
                </button>
            </div>
        </div>
    )
}

EditModal.Row = EditModalRow

export default EditModal
