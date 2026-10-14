'use client'

import React, { useEffect, useRef, useState } from 'react'
import { EditIcon, ModalCloseIcon } from '@/components/CustomFile/icons'

const RenameSearchModal = ({
    isOpen,
    onClose,
    onUpdate,
    searchCategory = 'Motors • Boats',
    initialName = 'My Boats Search',
    renameItem,
    isSubmitting = false,
}) => {
    const dialogRef = useRef(null)
    const [searchName, setSearchName] = useState(renameItem?.title || '')

    useEffect(() => {
        if (isOpen) setSearchName(renameItem?.title || '')
    }, [isOpen, renameItem?.title])

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-black/40 p-[12px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[500px] bg-white rounded-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <div className="flex items-start justify-between gap-[10px]">
                        <div className="flex items-center gap-[10px]">
                            <EditIcon className="w-[22px] h-[22px] " />
                            <div>
                                <h3 className="text-[20px] font-[Inter-SemiBold] text-[#000000CC] mb-[4px]">
                                    Rename Search
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                                    Edit the title of your saved search
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <div className='flex items-center gap-[10px] mb-[16px]'>
                    {Array.isArray(renameItem?.category_hierarchy) && renameItem.category_hierarchy.length > 0 ? (
                                                            renameItem.category_hierarchy.map((category, categoryIdx) => (
                                                                <React.Fragment key={`${category?.id || categoryIdx}`}>
                                                                    {categoryIdx > 0 && <div className='bg-[#000000CC] p-[2px] rounded-full'></div>}
                                                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                                                                        {category?.name}
                                                                    </h4>
                                                                </React.Fragment>
                                                            ))
                                                        ) : (
                                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                                                                {renameItem.parent_category_name || 'Saved Search'}
                                                            </h4>
                                                        )}
                    </div>

                    <div>
                        <label
                        className="text-[16px] font-[Inter-Regular] text-[#000000BF] mb-[10px]">
                            Search Name
                        </label>
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="w-full p-[14px_16px] rounded-[8px] border border-[rgba(35,38,42,0.2)] text-[14px] font-[Inter-Regular] text-[#000] outline-none"
                        />
                    </div>
                </div>

                <div className="p-[16px_20px] flex items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-[10px_20px] rounded-[6px] border border-[#8F8F8F] text-[14px] font-[Inter-Regular] text-[#000000BF] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdate?.(searchName.trim())}
                        disabled={isSubmitting || !searchName.trim()}
                        className="p-[10px_20px] rounded-[6px] bg-[#000] text-[#FFF] text-[14px] font-[Inter-Regular] cursor-pointer"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Title'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RenameSearchModal
