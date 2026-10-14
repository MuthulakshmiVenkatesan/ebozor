'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, FormDownArrowIcon } from '@/components/CustomFile/icons'
import {
    PLACE_AD_COUNTRY_CODES,
    isPhoneBareCountryCode,
    joinPhoneWithCountryCode,
    sanitizePhoneDigits,
    splitPhoneWithCountryCode,
} from '@/utils/placeAdNumericInput'

function CountryCodeSelect({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    return (
        <div ref={rootRef} className="relative shrink-0 pl-[12px] pr-[8px]">
            <button
                type="button"
                aria-label="Country code"
                aria-expanded={open}
                className="flex cursor-pointer items-center gap-[4px] border-0 bg-transparent text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen((v) => !v)}
            >
                <span>{value}</span>
                <FormDownArrowIcon className={`h-[16px] w-[16px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-[60] max-h-[220px] min-w-[96px] overflow-y-auto rounded-[8px] bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)]">
                    {PLACE_AD_COUNTRY_CODES.map((code) => (
                        <button
                            key={code}
                            type="button"
                            className={`w-full cursor-pointer px-[14px] py-[10px] text-left text-[14px] text-[#23262A] hover:bg-[#F3F4F6] ${
                                value === code ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange(code)
                                setOpen(false)
                            }}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/**
 * Place Your Ad phone field: country-code select + digits-only local number.
 * `value` / `onChange` use full international string (e.g. +971501234567).
 */
export default function PlaceAdPhoneField({
    id,
    label = 'Phone number',
    required = false,
    value,
    onChange,
    defaultCountryCode = '+971',
}) {
    const [focused, setFocused] = useState(false)
    const { countryCode, localNumber } = useMemo(
        () => splitPhoneWithCountryCode(value, defaultCountryCode),
        [value, defaultCountryCode]
    )
    const isFloating = true
    const canClear = !isPhoneBareCountryCode(value, defaultCountryCode)

    const emit = (nextCode, nextLocal) => {
        onChange?.(joinPhoneWithCountryCode(nextCode, nextLocal))
    }

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${
                    isFloating
                        ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-120px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${
                    focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                }`}
            >
                <CountryCodeSelect
                    value={countryCode}
                    onChange={(code) => emit(code, localNumber)}
                />
                <span className="h-[22px] w-px shrink-0 bg-[rgba(143,143,143,0.35)]" aria-hidden />
                <input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[0-9]*"
                    value={localNumber}
                    onChange={(e) => emit(countryCode, sanitizePhoneDigits(e.target.value))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[12px] pr-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {canClear ? (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Clear phone number"
                        className="mr-[10px] flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#6B7280] outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => emit(countryCode, '')}
                    >
                        <CloseIcon className="h-[12px] w-[12px]" fill="#6B7280" fillOpacity="1" />
                    </button>
                ) : null}
            </div>
        </div>
    )
}
