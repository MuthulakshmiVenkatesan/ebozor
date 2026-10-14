'use client'

import { useEffect, useState } from 'react'

const initialForm = {
    name: '',
    email: '',
    message: ''
}

const SupportModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
    const [formData, setFormData] = useState(initialForm)

    useEffect(() => {
        if (!isOpen) {
            setFormData(initialForm)
        }
    }, [isOpen])

    if (!isOpen) {
        return null
    }

    const handleChange = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit?.(formData)
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 p-[16px]">
            <div className="w-full max-w-[360px] overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                <div className="relative flex items-center justify-center bg-[#DC0000] px-[16px] py-[12px]">
                    <h3 className="text-[30px] font-[Inter-SemiBold] leading-none text-white">Customer Support</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-[16px] top-1/2 -translate-y-1/2 text-white text-[22px] leading-none"
                        aria-label="Close support modal"
                    >
                        -
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-[#F3F3F3] px-[20px] py-[16px] space-y-[14px]">
                        <div>
                            <label className="mb-[6px] block text-[14px] font-[Inter-SemiBold] text-[#373E45]">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="h-[40px] w-full rounded-[4px] border border-[#CFCFCF] bg-white px-[10px] outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-[6px] block text-[14px] font-[Inter-SemiBold] text-[#373E45]">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="h-[40px] w-full rounded-[4px] border border-[#CFCFCF] bg-white px-[10px] outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-[6px] block text-[14px] font-[Inter-SemiBold] text-[#373E45]">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                                rows={6}
                                className="w-full resize-none rounded-[4px] border border-[#CFCFCF] bg-white p-[10px] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end bg-[#ECECEC] px-[20px] py-[14px]">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-[4px] bg-[#DC0000] px-[20px] py-[8px] text-[14px] font-[Inter-Medium] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Starting...' : 'Start chat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SupportModal
