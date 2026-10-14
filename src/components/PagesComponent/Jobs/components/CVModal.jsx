'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/CustomFile/icons';
import { IoCheckmarkCircle } from 'react-icons/io5';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const isAllowedCvFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.pdf');
};

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {(file: File) => void} [onUploadSuccess] — called after a valid file is chosen (wire to API later)
 */
export default function CVModal({ open, onClose, onUploadSuccess }) {
    const [phase, setPhase] = useState('idle');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        setPhase('idle');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const handleClose = useCallback(() => {
        setPhase('idle');
        onClose?.();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, handleClose]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            window.alert('Please choose a file of 5 MB or smaller.');
            return;
        }
        if (!isAllowedCvFile(file)) {
            window.alert('Please choose a .DOC, .DOCX, or .PDF file.');
            return;
        }
        setPhase('success');
        onUploadSuccess?.(file);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[280] flex items-center justify-center bg-black/45 p-[16px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                aria-label="Close dialog"
                onClick={handleClose}
            />
            <div
                className="relative z-[1] max-sm:w-full w-[500px] overflow-hidden rounded-[6px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.25)] p-[14px]">
                    <h2 id="cv-modal-title" className="text-[16px] font-[Inter-Bold] leading-tight text-[#23262A]">
                        Update CV
                    </h2>
                    <button type="button" onClick={handleClose} className="cursor-pointer p-[6px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" fillOpacity="1" />
                    </button>
                </div>

                <div className="p-[14px] text-center">
                    <p className="text-[16px] font-[Inter-Regular] leading-[1.6] text-[#23262A]">
                        We support a maximum of 5 MB file in
                        <br />
                        <span className="font-[Inter-Bold]">.DOC, .DOCX, .PDF</span>
                        <br />
                        formats
                    </p>
                </div>

                {phase === 'idle' ? (
                    <div className="border-t border-[rgba(143,143,143,0.25)] flex justify-start p-[14px]">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                            className="sr-only"
                            tabIndex={-1}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-[6px] bg-[#DC0000] p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95"
                        >
                            Update CV
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[14px] p-[6px] sm:flex-row sm:items-center sm:justify-between sm:gap-[16px]">
                        <div className="flex min-w-0 flex-1 items-start gap-[10px] sm:items-center">
                            <IoCheckmarkCircle className="mt-[2px] shrink-0 text-[24px] text-[#4CAF50] sm:mt-0" aria-hidden />
                            <p className="text-left text-[14px] font-[Inter-Regular] leading-snug text-[#23262A]">
                                Your CV has been successfully uploaded to My Profile.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="shrink-0 cursor-pointer self-end rounded-[6px] bg-[#000000] p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-90 sm:self-auto"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
