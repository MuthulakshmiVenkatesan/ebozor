/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

const MAX_LEN = 50

const CreateListModal = ({
    open,
    onClose,
    onCreate,
    title = 'Create a list',
    description = 'Favorite lists help to keep saved ads organised',
    confirmLabel = 'Create',
    initialValue = '',
}) => {
    const [name, setName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const dialogRef = useRef(null)

    useEffect(() => {
        if (!open) return
        setName(initialValue || '')
    }, [open, initialValue])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const countLabel = useMemo(() => `${name.length}/${MAX_LEN} Characters`, [name.length])
    const canCreate = name.trim().length > 0

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-[16px]"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) {
                    onClose?.()
                }
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[500px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[4px]">
                        {title}
                    </h3>
                    <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                        {description}
                    </p>
                </div>

                <div className="p-[20px] mt-[20px]">
                    <label className="block">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, MAX_LEN))}
                            placeholder="List Name"
                            className="w-full rounded-[10px] border border-[rgba(143,143,143,0.70)] p-[14px] text-[#000] text-[14px] font-[Inter-Regular] outline-none placeholder:text-[#8F8F8FB2]"
                        />
                    </label>
                    <p className="ml-[10px] mt-[4px] text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                        {countLabel}
                    </p>
                </div>

                <div className="p-[20px] border-t border-[rgba(143,143,143,0.24)] flex items-center justify-end gap-[10px]">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onClose?.()}
                        className="p-[10px_20px] rounded-[6px] border border-[#8F8F8F] text-[12px] font-[Inter-Regular] text-[#000000BF] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canCreate || isSubmitting}
                        onClick={async () => {
                            if (!canCreate) return
                            try {
                                setIsSubmitting(true)
                                await onCreate?.(name.trim())
                            } finally {
                                setIsSubmitting(false)
                            }
                            onClose?.()
                        }}
                        className="p-[10px_20px] rounded-[6px] bg-[#DC0000] text-[12px] font-[Inter-Regular] text-[#fff] cursor-pointer disabled:bg-[#8F8F8F38] disabled:text-[#8F8F8F] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateListModal

