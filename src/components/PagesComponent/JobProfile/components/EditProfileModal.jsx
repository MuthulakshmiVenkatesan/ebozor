/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, DeleteIcon, EditIcon } from '@/components/CustomFile/icons'
import { FloatingOutlinedInput } from '../../ProductDetail/JobComponents/floatingFormFields'
import uploadfile from '../../../../../public/assets/img/icons/uploadfile.svg'
import CropImageModal from './CropImageModal'

const MAX_SUMMARY = 100

const AVAILABILITY_OPTIONS = ['Immediate Joiner', 'Actively Looking'].map((v) => ({ value: v, label: v }))

const MAX_PHOTO_BYTES = 2 * 1024 * 1024

function FloatingProfileSummary({ label, required, value, onChange, maxLength = MAX_SUMMARY }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim() !== ''
    const isFloated = hasValue || focused
    const ring = focused ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    const labelClass = isFloated
        ? 'top-0 -translate-y-1/2 text-[12px] leading-tight text-[#3a3f47]'
        : 'top-[24px] -translate-y-1/2 text-[14px] leading-snug text-[#3a3f47]'

    const fieldPad = isFloated ? 'px-[16px] pb-[28px] pt-[22px]' : 'px-[16px] pb-[28px] pt-[24px]'

    return (
        <div className={`relative min-h-[140px] rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
            <label
                className={`pointer-events-none absolute left-[11px] z-[2] max-w-[calc(100%-80px)] truncate bg-white px-[4px] font-[Inter-Regular] transition-all duration-200 ease-out ${labelClass}`}
            >
                {label}
                {required ? <span className="text-[#DC2626]"> *</span> : null}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={5}
                maxLength={maxLength}
                placeholder={isFloated ? 'Profile Summary' : ''}
                className={`w-full resize-none rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#9CA3AF] ${fieldPad}`}
            />
            <span className="pointer-events-none absolute bottom-[10px] right-[12px] text-[12px] font-[Inter-Regular] text-[#9CA3AF]">
                {String(value ?? '').length} / {maxLength}
            </span>
        </div>
    )
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   initialName?: string;
 *   initialSummary?: string;
 *   initialAvailability?: string;
 *   initialAvatarUrl?: string;
 *   onSave?: (payload: { name: string; summary: string; availability: string; profileFile: File | null }) => void;
 * }} props
 */
export default function EditProfileModal({
    open,
    onClose,
    initialName = '',
    initialSummary = '',
    initialAvailability = '',
    initialAvatarUrl = '',
    onSave,
}) {
    const fileInputId = useId()
    const fileInputRef = useRef(null)
    const [name, setName] = useState('')
    const [summary, setSummary] = useState('')
    const [availability, setAvailability] = useState('')
    const [profileFile, setProfileFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [photoError, setPhotoError] = useState('')
    const [cropOpen, setCropOpen] = useState(false)
    const [pendingCropUrl, setPendingCropUrl] = useState(null)

    const revokeIfUrl = (url) => {
        if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url)
    }

    useEffect(() => {
        if (!open) return
        setName(initialName == null ? '' : String(initialName))
        setSummary(initialSummary == null ? '' : String(initialSummary))
        setAvailability(initialAvailability == null ? '' : String(initialAvailability))
        setProfileFile(null)
        setPhotoError('')
        setCropOpen(false)
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return null
        })
        setAvatarPreview((prev) => {
            revokeIfUrl(prev)
            return typeof initialAvatarUrl === 'string' ? initialAvatarUrl : null
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [open, initialName, initialSummary, initialAvailability, initialAvatarUrl])

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
            if (e.key === 'Escape' && !cropOpen) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose, cropOpen])

    const reset = useCallback(() => {
        setName('')
        setSummary('')
        setAvailability('')
        setProfileFile(null)
        setPhotoError('')
        setCropOpen(false)
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return null
        })
        setAvatarPreview((prev) => {
            revokeIfUrl(prev)
            return null
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])

    const canSave = String(name).trim() !== ''

    const closeCropOnly = useCallback(() => {
        setCropOpen(false)
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return null
        })
    }, [])

    const handleCroppedFile = useCallback((file) => {
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return null
        })
        setCropOpen(false)
        setProfileFile(file)
        setAvatarPreview((prev) => {
            revokeIfUrl(prev)
            return URL.createObjectURL(file)
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])

    const removeAvatar = useCallback(() => {
        setProfileFile(null)
        setAvatarPreview((prev) => {
            revokeIfUrl(prev)
            return null
        })
        setPhotoError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])

    const openRecrop = useCallback(() => {
        if (!profileFile) return
        const url = URL.createObjectURL(profileFile)
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return url
        })
        setCropOpen(true)
    }, [profileFile])

    const handleFile = (list) => {
        const f = list?.[0]
        if (!f) return
        if (f.size > MAX_PHOTO_BYTES) {
            setPhotoError('File must be 2 MB or smaller.')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        const lower = String(f.name || '').toLowerCase()
        const ok = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        if (!ok) {
            setPhotoError('Please use .png or .jpeg only.')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        setPhotoError('')
        const url = URL.createObjectURL(f)
        setPendingCropUrl((prev) => {
            revokeIfUrl(prev)
            return url
        })
        setCropOpen(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSave = useCallback(() => {
        if (!canSave) return
        onSave?.({
            name: String(name).trim(),
            summary: String(summary).trim(),
            availability: String(availability).trim(),
            profileFile,
        })
        onClose()
    }, [canSave, name, summary, availability, profileFile, onSave, onClose])

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-[1260] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="edit-profile-modal-title">
                <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
                <div
                    className="relative z-[1] flex max-h-[90vh] w-[550px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="relative z-0 flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] bg-white px-[20px] py-[18px]">
                        <h2 id="edit-profile-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                            Profile
                        </h2>
                        <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                            <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[24px]">
                        <div className="flex flex-col gap-[18px]">
                            <FloatingOutlinedInput label="Name" required value={name} onChange={setName} autoComplete="name" />

                            <div>
                                <p className="mb-[10px] text-[14px] font-[Inter-Regular] text-[#23262A]">Upload your profile picture</p>
                                <input
                                    ref={fileInputRef}
                                    id={fileInputId}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    className="sr-only"
                                    onChange={(e) => handleFile(e.target.files)}
                                />
                                {avatarPreview ? (
                                    <div className="flex flex-wrap justify-between items-center gap-[14px] bg-white ">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <div className="flex items-center gap-[10px]">
                                            <img
                                                src={avatarPreview}
                                                alt=""
                                                className="h-[40px] w-[40px] shrink-0 rounded-[4px] object-cover"
                                                width={40}
                                                height={40}
                                            />
                                            <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Image</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-[24px]">
                                            <button
                                                type="button"
                                                onClick={removeAvatar}
                                                className="inline-flex cursor-pointer items-center gap-[6px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                                            >
                                                <DeleteIcon width={18} height={18} className="h-[18px] w-[18px]" fill="#23262A" />
                                                Delete
                                            </button>
                                            <button
                                                type="button"
                                                onClick={openRecrop}
                                                className="inline-flex cursor-pointer items-center gap-[6px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                                            >
                                                <EditIcon width={18} height={18} className="h-[18px] w-[18px]" fill="#23262A" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor={fileInputId}
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-[rgba(143,143,143,0.25)] bg-white p-[20px] transition-colors hover:border-[#23262a]/40"
                                    >
                                        <Image src={uploadfile} alt="" width={40} height={40} className="h-[40px] w-[40px]" />
                                        <h4 className="mt-[16px] text-[14px] font-[Inter-Medium] text-[#3a3f47]">Click to upload</h4>
                                        <p className="mt-[10px] text-center text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            We support a maximum of 2 MB file in .png, .jpeg formats
                                        </p>
                                        {photoError ? <p className="mt-[8px] text-[12px] font-[Inter-Regular] text-[#DC2626]">{photoError}</p> : null}
                                    </label>
                                )}
                            </div>

                            <FloatingProfileSummary label="Profile Summary" required={false} value={summary} onChange={setSummary} maxLength={MAX_SUMMARY} />

                            <div>
                                <p className="mb-[14px] text-[14px] font-[Inter-Regular] text-[#23262A]">Availability to join</p>
                                <div className="flex flex-wrap gap-[10px]">
                                    {AVAILABILITY_OPTIONS.map((o) => {
                                        const selected = availability === o.value
                                        return (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => setAvailability(selected ? '' : o.value)}
                                                className={`cursor-pointer rounded-[8px] border border-[#23262a] p-[8px_16px] text-[14px] font-[Inter-Regular] text-[#23262a] transition-colors ${selected ? 'bg-[#E8E8E8]' : 'bg-white hover:bg-[#F5F5F5]'
                                                    }`}
                                            >
                                                {o.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] bg-white px-[20px] py-[10px]">
                        <div className="flex items-center justify-end gap-[8px]">
                            <button
                                type="button"
                                onClick={reset}
                                className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                            >
                                Clear All
                            </button>
                            <button
                                type="button"
                                disabled={!canSave}
                                onClick={handleSave}
                                className={`rounded-[6px] p-[8px_16px] text-[14px] font-[Inter-SemiBold] ${canSave ? 'cursor-pointer bg-[#23262a] text-white' : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'
                                    }`}
                            >
                                Save
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            <CropImageModal open={cropOpen} imageUrl={pendingCropUrl} onClose={closeCropOnly} onComplete={handleCroppedFile} />
        </>
    )
}
