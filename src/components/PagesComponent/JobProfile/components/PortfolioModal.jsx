/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import { FloatingOutlinedInput } from '../../ProductDetail/JobComponents/floatingFormFields'

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   initialName?: string;
 *   initialLink?: string;
 *   onSave?: (data: { name: string; link: string }) => void;
 * }} props
 */
export default function PortfolioModal({ open, onClose, initialName = '', initialLink = '', onSave }) {
    const [name, setName] = useState('')
    const [link, setLink] = useState('')
    const [attemptedSave, setAttemptedSave] = useState(false)

    const isValidHttpUrl = useCallback((value) => {
        const v = String(value ?? '').trim()
        if (!v) return false
        try {
            const url = new URL(v)
            return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
            return false
        }
    }, [])

    useEffect(() => {
        if (!open) return
        setName(initialName == null ? '' : String(initialName))
        setLink(initialLink == null ? '' : String(initialLink))
        setAttemptedSave(false)
    }, [open, initialName, initialLink])

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

    const reset = useCallback(() => {
        setName('')
        setLink('')
        setAttemptedSave(false)
    }, [])

    const trimmedName = String(name).trim()
    const trimmedLink = String(link).trim()
    const nameError = trimmedName !== '' && trimmedName.length < 5 ? 'Ensure this field has at least 5 characters' : ''
    const linkError = trimmedLink !== '' && !isValidHttpUrl(trimmedLink) ? 'Please enter a valid url' : ''
    const canSave = trimmedName.length >= 5 && isValidHttpUrl(trimmedLink)

    const handleSave = useCallback(() => {
        setAttemptedSave(true)
        if (!canSave) return
        onSave?.({ name: String(name).trim(), link: String(link).trim() })
        onClose()
    }, [canSave, name, link, onSave, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1255] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="portfolio-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
            <div
                className="relative z-[1] flex max-h-[90vh] w-[500px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="portfolio-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Portfolio
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[24px]">
                    <p className="mb-[20px] text-[14px] font-[Inter-Regular] leading-snug text-[#3a3f47]">
                        Add links to your online work projects.
                    </p>
                    <div className="flex flex-col gap-[18px]">
                        <FloatingOutlinedInput label="Name" required value={name} onChange={setName} placeholder="Name" autoComplete="off" />
                        {nameError && (attemptedSave || trimmedName.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{nameError}</p>
                        ) : null}
                        <FloatingOutlinedInput
                            label="Link"
                            required
                            type="url"
                            value={link}
                            onChange={setLink}
                            placeholder="Link"
                            autoComplete="url"
                        />
                        {linkError && (attemptedSave || trimmedLink.length > 0) ? (
                            <p className="mt-[-8px] text-[12px] font-[Inter-Regular] text-[#d32f2f]">{linkError}</p>
                        ) : null}
                    </div>
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                    <div className="flex items-center justify-end gap-[8px]">
                        <button
                            type="button"
                            onClick={reset}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[6px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_16px] text-[14px] font-[Inter-SemiBold] ${
                                canSave ? 'cursor-pointer bg-[#23262a] text-white' : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'
                            }`}
                        >
                            Save
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}
