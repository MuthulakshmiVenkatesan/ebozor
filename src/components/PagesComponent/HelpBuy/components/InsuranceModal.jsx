'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DownArrowIcon, CloseIcon } from '@/components/CustomFile/icons'
import SuccessModal from './SuccessModal'
import {
    formatHelpBuyPhone,
    HELP_BUY_SERVICE_INSURANCE,
    submitHelpMeBuyForm,
} from '../helpBuyFormUtils'

const countryCodeOptions = [
    { flag: '🇦🇪', label: 'United Arab Emirates', code: '+971' },
    { flag: '🇦🇫', label: 'Afghanistan', code: '+93' },
    { flag: '🇦🇽', label: 'Aland Islands', code: '+358' },
    { flag: '🇦🇱', label: 'Albania', code: '+355' },
    { flag: '🇩🇿', label: 'Algeria', code: '+213' },
    { flag: '🇦🇸', label: 'American Samoa', code: '+1' },
]

const serviceOptions = ['Car Insurance']

const DEFAULT_INSURANCE_MESSAGE =
    'I am interested in car insurance services ebozor provides. Please call me at your earliest convenience.'

const InsuranceModal = ({ isOpen, onClose }) => {
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [formName, setFormName] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formMessage, setFormMessage] = useState(DEFAULT_INSURANCE_MESSAGE)
    const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodeOptions[0])
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
    const [countrySearch, setCountrySearch] = useState('')
    const countryDropdownRef = useRef(null)

    const filteredCountryCodes = useMemo(() => {
        const normalizedSearch = countrySearch.trim().toLowerCase()
        if (!normalizedSearch) {
            return countryCodeOptions
        }

        return countryCodeOptions.filter((country) => {
            return country.label.toLowerCase().includes(normalizedSearch) || country.code.toLowerCase().includes(normalizedSearch)
        })
    }, [countrySearch])

    useEffect(() => {
        if (!isOpen) {
            return undefined
        }

        const handleOutsideClick = (event) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryDropdownOpen(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    const handleSubmit = async () => {
        if (submitLoading) return
        setIsCountryDropdownOpen(false)
        setSubmitLoading(true)
        try {
            await submitHelpMeBuyForm(
                {
                    name: formName,
                    email: formEmail,
                    phone_no: formatHelpBuyPhone(selectedCountryCode.code, formPhone),
                    service_type: HELP_BUY_SERVICE_INSURANCE,
                    message: formMessage,
                },
                { onSuccess: () => setIsSuccessOpen(true) }
            )
        } finally {
            setSubmitLoading(false)
        }
    }

    useEffect(() => {
        if (!isOpen) {
            setIsSuccessOpen(false)
            setIsCountryDropdownOpen(false)
            setCountrySearch('')
            setFormName('')
            setFormEmail('')
            setFormPhone('')
            setFormMessage(DEFAULT_INSURANCE_MESSAGE)
            return
        }

        const { overflow } = document.body.style
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = overflow
        }
    }, [isOpen])

    if (!isOpen) {
        return null
    }

    if (isSuccessOpen) {
        return (
            <SuccessModal
                onClose={() => {
                    setIsSuccessOpen(false)
                    onClose()
                }}
            />
        )
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(17,24,39,0.55)] px-[16px]" onClick={onClose}>
            <div
                className="relative max-sm:w-full w-[500px] rounded-[6px] bg-white p-[24px]"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute right-[-12px] top-[-12px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black text-[20px] leading-none text-white"
                >
                    <CloseIcon className="h-[10px] w-[10px]" fill="#fff" fillOpacity="1" />
                </button>

                <h3 className="mb-[20px] text-center text-[24px] leading-[1.2] font-[Inter-Bold] text-[#111827]">
                    Car Insurance
                </h3>

                <div className="space-y-[14px]">
                    <input
                        type="text"
                        placeholder="Name*"
                        value={formName}
                        onChange={(event) => setFormName(event.target.value)}
                        className="h-[52px] w-full rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white px-[16px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                    />
                    <input
                        type="email"
                        placeholder="Email*"
                        value={formEmail}
                        onChange={(event) => setFormEmail(event.target.value)}
                        className="h-[52px] w-full rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white px-[16px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                    />

                    <div className="relative" ref={countryDropdownRef}>
                        <div className="flex h-[52px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white">
                            <button
                                type="button"
                                onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                                className="flex shrink-0 cursor-pointer items-center gap-[8px] border-r border-[rgba(143,143,143,0.35)] px-[12px] text-[16px] font-[Inter-Regular] text-[#222222] max-sm:text-[14px]"
                            >
                                <span className="text-[18px]">{selectedCountryCode.flag}</span>
                                <DownArrowIcon className="h-[16px] w-[16px]" stroke="#111827" />
                            </button>
                            <input
                                type="tel"
                                placeholder="050 123 4567"
                                value={formPhone}
                                onChange={(event) => setFormPhone(event.target.value)}
                                className="h-full w-full bg-white px-[16px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                            />
                        </div>

                        {isCountryDropdownOpen ? (
                            <div className="absolute left-0 top-[56px] z-10 w-full overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
                                <div className="border-b border-[rgba(143,143,143,0.35)] p-[8px]">
                                    <input
                                        type="text"
                                        value={countrySearch}
                                        onChange={(event) => setCountrySearch(event.target.value)}
                                        placeholder="Search"
                                        className="h-[40px] w-full rounded-[4px] border border-[rgba(143,143,143,0.35)] px-[10px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none placeholder:text-[#8f8f8f]"
                                    />
                                </div>

                                <div className="max-h-[230px] overflow-y-auto py-[4px]">
                                    {filteredCountryCodes.map((country) => (
                                        <button
                                            key={`${country.label}-${country.code}`}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCountryCode(country)
                                                setIsCountryDropdownOpen(false)
                                                setCountrySearch('')
                                            }}
                                            className={`flex w-full items-center gap-[10px] px-[10px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#111827] hover:bg-[#f3f4f6] ${selectedCountryCode.label === country.label && selectedCountryCode.code === country.code ? 'bg-[#eeeeee]' : 'bg-white'
                                                }`}
                                        >
                                            <span className="text-[18px] leading-none">{country.flag}</span>
                                            <span>{country.label}</span>
                                            <span className="ml-auto text-[#6b7280]">{country.code}</span>
                                        </button>
                                    ))}
                                    {filteredCountryCodes.length === 0 ? (
                                        <p className="px-[10px] py-[10px] text-[14px] font-[Inter-Regular] text-[#6b7280]">
                                            No country found.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="relative">
                        <select
                            value={HELP_BUY_SERVICE_INSURANCE}
                            disabled
                            className="h-[52px] w-full cursor-not-allowed appearance-none rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-[#fff] px-[16px] text-[14px] font-[Inter-Regular] text-[#6b7280] outline-none"
                        >
                            {serviceOptions.map((service) => (
                                <option key={service} value={service}>
                                    {service}
                                </option>
                            ))}
                        </select>
                        <DownArrowIcon className="pointer-events-none absolute right-[12px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#111827" />
                    </div>

                    <div className="relative rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white px-[14px] pb-[12px] pt-[14px]">
                        <textarea
                            rows={2}
                            value={formMessage}
                            onChange={(event) => setFormMessage(event.target.value)}
                            className="w-full resize-none text-[14px] leading-[1.4] font-[Inter-Regular] text-[#111827] outline-none"
                        />
                        <label className="absolute left-[10px] top-[-9px] bg-white px-[6px] text-[12px] font-[Inter-Regular] leading-none text-[#6b7280]">
                            Write a message*
                        </label>
                    </div>

                    <div className="flex min-h-[72px] items-center justify-between rounded-[4px] border border-[#cecece] bg-white px-[14px] py-[10px]">
                        <div className="flex items-center gap-[10px]">
                            <span className="inline-flex h-[24px] w-[24px] rounded-[2px] border border-[#727272]" />
                            <span className="text-[14px] font-[Inter-Regular] text-[#1f2937]">I&apos;m not a robot</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[12px] font-[Inter-Bold] text-[#2563eb]">reCAPTCHA</p>
                            <p className="text-[10px] font-[Inter-Regular] text-[#6b7280]">Privacy - Terms</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitLoading}
                        className={`w-full rounded-[6px] bg-[#DC0000] p-[14px] text-[14px] font-[Inter-Bold] text-white transition hover:bg-[#b80000] ${submitLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                        {submitLoading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InsuranceModal
