/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, FileIcon } from '@/components/CustomFile/icons'
import uploadfile from '../../../../../public/assets/img/icons/uploadfile.svg'
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT_EXT = ['.pdf', '.doc', '.docx']
const ACCEPT_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function extFromName(name) {
    const i = name.lastIndexOf('.')
    if (i < 0) return ''
    return name.slice(i).toLowerCase()
}

function isAllowedFile(file) {
    if (!file || file.size > MAX_BYTES) return false
    if (ACCEPT_MIME.has(file.type)) return true
    return ACCEPT_EXT.includes(extFromName(file.name))
}

export default function ResumeModal({ open, onClose, onSave, initialFile = null, initialFileUrl = '' }) {
    const inputRef = useRef(null)
    const [file, setFile] = useState(null)
    const [existingFileUrl, setExistingFileUrl] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (!open) return
        setFile(initialFile instanceof File ? initialFile : null)
        setExistingFileUrl(typeof initialFileUrl === 'string' ? initialFileUrl : '')
        setError('')
    }, [open, initialFile, initialFileUrl])

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

    const pickFiles = useCallback((list) => {
        setError('')
        const f = list?.[0]
        if (!f) return
        if (!isAllowedFile(f)) {
            setError('Use .DOC, .DOCX, or .PDF up to 5 MB.')
            return
        }
        setFile(f)
    }, [])

    const onInputChange = useCallback(
        (e) => {
            pickFiles(e.target.files)
            e.target.value = ''
        },
        [pickFiles]
    )

    const clearFile = useCallback(() => {
        setFile(null)
        setExistingFileUrl('')
        setError('')
    }, [])

    const handleSave = useCallback(() => {
        if (!file) return
        onSave?.(file)
        onClose()
    }, [file, onSave, onClose])

    const canSave = !!file

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="resume-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close dialog" />
            <div
                className="relative z-[1] flex max-h-[min(560px,90vh)] w-full max-w-[480px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[24px] py-[18px]">
                    <h2 id="resume-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Resume
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[24px] py-[24px]">
                    <p className="mb-[16px] text-[14px] font-[Inter-Regular] text-[#23262a]">Upload your most recent resume.</p>

                    <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={onInputChange} />

                    {!file && !existingFileUrl ? (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-[#8f8f8f] p-[16px] transition-colors hover:border-[#9CA3AF] hover:bg-[#F3F4F6]"
                        >
                            <Image src={uploadfile} alt="upload file" className="mb-[12px]" />
                            <h4 className="mb-[8px] text-[16px] font-[Inter-Regular] text-[#23262a]">Click to upload</h4>
                            <p className="text-center text-[12px] font-[Inter-Regular] leading-snug text-[#23262a]">
                                We support a maximum of 5 MB file in .DOC, .DOCX, .PDF formats
                            </p>
                        </button>
                    ) : (
                        <div className="flex items-center gap-[14px] rounded-[10px] border border-[rgba(143,143,143,0.25)] bg-white p-[14px]">
                            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] bg-[#edf0ff]">
                                <FileIcon className="h-[24px] w-[24px]" fill="#3a88ef" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262a]">Resume</p>
                                {file?.name ? (
                                    <p className="truncate text-[12px] font-[Inter-Regular] text-[#9CA3AF]" title={file.name}>
                                        {file.name}
                                    </p>
                                ) : null}
                                {!file && existingFileUrl ? (
                                    <a
                                        href={existingFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate text-[12px] font-[Inter-Regular] text-[#3A88EF] underline"
                                    >
                                        View uploaded resume
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {error ? <p className="mt-[12px] text-[12px] font-[Inter-Regular] text-[#DC2626]">{error}</p> : null}
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[24px] py-[16px]">
                    <div className="flex items-center justify-end gap-[12px]">
                        <button
                            type="button"
                            disabled={!file}
                            onClick={clearFile}
                            className={`rounded-[6px] border border-[#8f8f8f] bg-white p-[8px_18px] text-[14px] font-[Inter-SemiBold] text-[#23262a] ${
                                file ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                            }`}
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_18px] text-[14px] font-[Inter-SemiBold]  ${
                                canSave ? 'cursor-pointer bg-[#23262a] text-[#fff]' : 'cursor-not-allowed bg-[rgba(143,143,143,0.25)] text-[#666]'
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
