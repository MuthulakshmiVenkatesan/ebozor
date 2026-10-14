/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import { PHONE_DIAL_CODES } from '@/components/PagesComponent/ProductDetail/JobComponents/floatingFormFields'
import Image from 'next/image'
import greencheck from '../../../../../public/assets/img/icons/greencheck.svg'
/** Alphabetical makes — includes reference list (Haval, Honda, Austin-Healey, …) plus common GCC brands */
const CAR_MAKES = [
    'Acura',
    'Alfa Romeo',
    'Aston Martin',
    'Audi',
    'Austin-Healey',
    'Bentley',
    'BMW',
    'Buick',
    'BYD',
    'Cadillac',
    'Chery',
    'Chevrolet',
    'Chrysler',
    'Citroën',
    'Citroen',
    'Cupra',
    'Dacia',
    'Daewoo',
    'Daihatsu',
    'Dodge',
    'DS',
    'Ferrari',
    'Fiat',
    'Ford',
    'Geely',
    'Genesis',
    'GMC',
    'Great Wall',
    'Haval',
    'Higer',
    'Hino',
    'HiPhi',
    'Holden',
    'Honda',
    'Hongqi',
    'Hummer',
    'Hyundai',
    'Infiniti',
    'Isuzu',
    'Jaguar',
    'Jeep',
    'Jetour',
    'Kia',
    'Lamborghini',
    'Land Rover',
    'Lexus',
    'Lincoln',
    'Lotus',
    'Lucid',
    'Mahindra',
    'Maserati',
    'Mazda',
    'McLaren',
    'Mercedes-Benz',
    'MG',
    'Mini',
    'Mitsubishi',
    'Nissan',
    'Opel',
    'Peugeot',
    'Polestar',
    'Porsche',
    'Ram',
    'Renault',
    'Rolls-Royce',
    'Rover',
    'Saab',
    'SEAT',
    'Skoda',
    'Smart',
    'SsangYong',
    'Subaru',
    'Suzuki',
    'Tesla',
    'Toyota',
    'Volkswagen',
    'Volvo',
    'XPeng',
    'Zeekr',
].sort((a, b) => a.localeCompare(b))


const DIAL_FLAG_EMOJI = {
    '+971': '🇦🇪',
    '+91': '🇮🇳',
    '+44': '🇬🇧',
    '+1': '🇺🇸',
    '+92': '🇵🇰',
    '+63': '🇵🇭',
    '+966': '🇸🇦',
}

function UaeFlagIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 12 6" aria-hidden>
            <rect width="3" height="6" fill="#E43131" />
            <rect x="3" width="9" height="2" fill="#009639" />
            <rect x="3" y="2" width="9" height="2" fill="#fff" />
            <rect x="3" y="4" width="9" height="2" fill="#000" />
        </svg>
    )
}

function FlagForDial({ dial }) {
    if (dial === '+971') {
        return <UaeFlagIcon className="h-[16px] w-[24px] shrink-0 overflow-hidden rounded-[2px]" />
    }
    const emoji = DIAL_FLAG_EMOJI[dial] || '🏳️'
    return (
        <span className="flex h-[16px] w-[24px] shrink-0 items-center justify-center text-[14px] leading-none" aria-hidden>
            {emoji}
        </span>
    )
}

function nationalDigitsFromInput(raw, dialDigits) {
    const all = String(raw || '').replace(/\D/g, '')
    if (all.startsWith(dialDigits)) {
        return all.slice(dialDigits.length)
    }
    const sortedPrefixes = [...PHONE_DIAL_CODES]
        .map((c) => c.replace(/\D/g, ''))
        .sort((a, b) => b.length - a.length)
    for (const p of sortedPrefixes) {
        if (all.startsWith(p)) {
            return all.slice(p.length)
        }
    }
    return all
}




function buildYearOptions() {
    const y = new Date().getFullYear()
    const out = []
    for (let i = 0; i <= y - 1990; i += 1) {
        out.push(y - i)
    }
    return out
}

function filterMakes(query) {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return CAR_MAKES
    return CAR_MAKES.filter((m) => m.toLowerCase().includes(q))
}

function HighlightedMatch({ text, query }) {
    const q = String(query || '').trim()
    if (!q) {
        return <span>{text}</span>
    }
    const lowerText = text.toLowerCase()
    const lowerQ = q.toLowerCase()
    const parts = []
    let pos = 0
    let key = 0
    while (pos < text.length) {
        const found = lowerText.indexOf(lowerQ, pos)
        if (found === -1) {
            parts.push(<span key={key++}>{text.slice(pos)}</span>)
            break
        }
        if (found > pos) {
            parts.push(<span key={key++}>{text.slice(pos, found)}</span>)
        }
        parts.push(
            <span key={key++} className="underline decoration-[1.5px] underline-offset-[3px]">
                {text.slice(found, found + q.length)}
            </span>
        )
        pos = found + q.length
    }
    return <span className="text-[15px] font-[Inter-Regular] text-[#111827]">{parts}</span>
}

function useClickOutside(ref, onOutside, active) {
    useEffect(() => {
        if (!active) return undefined
        const handle = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onOutside()
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [ref, onOutside, active])
}

function CarMakeCombobox({ value, onChange, error, id, name }) {
    const [open, setOpen] = useState(false)
    const [focused, setFocused] = useState(false)
    const wrapRef = useRef(null)
    const activeBorder = open || focused
    const closeList = useCallback(() => setOpen(false), [])

    const filtered = useMemo(() => filterMakes(value), [value])

    useClickOutside(wrapRef, closeList, open)

    const showList = open && filtered.length > 0

    return (
        <div ref={wrapRef} className="relative">
            <input
                id={id}
                name={name}
                type="text"
                autoComplete="off"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => {
                    setFocused(true)
                    setOpen(true)
                }}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation()
                        setOpen(false)
                    }
                }}
                placeholder="Search Make, Model, or Trim"
                aria-expanded={showList}
                aria-controls={showList ? `${id}-listbox` : undefined}
                aria-autocomplete="list"
                role="combobox"
                className={`w-full p-[14px_14px] rounded-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] border border-[rgba(143,143,143,0.24)] ${showList ? '' : ''
                    }  ${error && !activeBorder
                        ? ''
                        : activeBorder
                            ? ''
                            : ''
                    }`}
            />
            {showList ? (
                <ul
                    id={`${id}-listbox`}
                    role="listbox"
                    className="absolute z-30 max-h-[min(280px,40vh)] w-full overflow-y-auto rounded-b-[8px] border border-t-0 border-[#DC0000] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] [scrollbar-color:#9CA3AF_#F3F4F6] [scrollbar-width:thin]"
                >
                    {filtered.map((make) => (
                        <li key={make} role="option" className="border-b border-[#ECECEC] last:border-b-0">
                            <button
                                type="button"
                                className="flex w-full cursor-pointer px-[14px] py-[12px] text-left transition-colors hover:bg-[#F5F5F5]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(make)
                                    setOpen(false)
                                }}
                            >
                                <HighlightedMatch text={make} query={value} />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}

function YearCombobox({ value, onChange, years, error, id, name }) {
    const [open, setOpen] = useState(false)
    const [focused, setFocused] = useState(false)
    const [query, setQuery] = useState('')
    const wrapRef = useRef(null)
    const activeBorder = open || focused
    const closeList = useCallback(() => setOpen(false), [])

    const filtered = useMemo(() => {
        const q = String(query || '').trim()
        if (!q) return years
        return years.filter((y) => String(y).includes(q))
    }, [years, query])

    useEffect(() => {
        setQuery(value ? String(value) : '')
    }, [value])

    useClickOutside(wrapRef, closeList, open)

    const showList = open && filtered.length > 0

    return (
        <div ref={wrapRef} className="relative">
            <input
                id={id}
                name={name}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                    const t = e.target.value
                    setQuery(t)
                    setOpen(true)
                    const trimmed = t.trim()
                    if (!trimmed) {
                        onChange('')
                        return
                    }
                    const n = parseInt(trimmed, 10)
                    if (!Number.isNaN(n) && years.includes(n) && String(n) === trimmed) {
                        onChange(String(n))
                    } else {
                        onChange('')
                    }
                }}
                onFocus={() => {
                    setFocused(true)
                    setOpen(true)
                }}
                onBlur={() => {
                    setFocused(false)
                    const t = String(query || '').trim()
                    if (t && years.includes(Number(t))) {
                        onChange(t)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.stopPropagation()
                        setOpen(false)
                    }
                }}
                placeholder="Search Make, Model, or Trim"
                aria-expanded={showList}
                aria-controls={showList ? `${id}-year-list` : undefined}
                role="combobox"
                className={`w-full p-[14px_14px] rounded-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] border border-[rgba(143,143,143,0.24)] ${showList ? '' : ''
                    } border ${error && !activeBorder
                        ? ''
                        : activeBorder
                            ? ''
                            : ''
                    } ${value ? 'text-[#23262A]' : ''}`}
            />
            {showList ? (
                <ul
                    id={`${id}-year-list`}
                    role="listbox"
                    className="absolute z-30 max-h-[min(260px,38vh)] w-full overflow-y-auto rounded-b-[8px] border border-t-0 border-[#E0E0E0] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.1)] [scrollbar-color:#6B7280_#E5E7EB] [scrollbar-width:thin]"
                >
                    {filtered.map((y) => (
                        <li key={y} role="option" className="border-b border-[#ECECEC] last:border-b-0">
                            <button
                                type="button"
                                className="flex w-full cursor-pointer px-[14px] py-[12px] text-left text-[15px] font-[Inter-Regular] text-[#111827] transition-colors hover:bg-[#F5F5F5]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    const s = String(y)
                                    setQuery(s)
                                    onChange(s)
                                    setOpen(false)
                                }}
                            >
                                {y}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}

/**
 * Car trade-in or car finance lead: form modal → thank-you state (Continue Browsing closes).
 */
export default function MotorTradeInModal({
    open,
    onClose,
    dealerName = 'Dealer',
    defaultCarSearch = '',
    defaultYear = '',
    variant = 'tradeIn',
}) {
    const isFinance = variant === 'finance'
    const [step, setStep] = useState('form')
    const [name, setName] = useState('')
    const [phoneLocal, setPhoneLocal] = useState('')
    const [dialCode, setDialCode] = useState('+971')
    const [carSearch, setCarSearch] = useState('')
    const [year, setYear] = useState('')
    const [submitAttempted, setSubmitAttempted] = useState(false)
    const [dialOpen, setDialOpen] = useState(false)
    const phoneDialRef = useRef(null)

    const years = useMemo(() => buildYearOptions(), [])

    const closeDialMenu = useCallback(() => setDialOpen(false), [])
    useClickOutside(phoneDialRef, closeDialMenu, dialOpen)

    const dealerUpper = String(dealerName || 'Dealer').trim().toUpperCase()

    const resetForm = useCallback(() => {
        setStep('form')
        setName('')
        setPhoneLocal('')
        setDialCode('+971')
        setCarSearch(String(defaultCarSearch || '').trim())
        const y = String(defaultYear || '').trim()
        const n = parseInt(y, 10)
        setYear(!Number.isNaN(n) && years.includes(n) ? y : '')
        setSubmitAttempted(false)
        setDialOpen(false)
    }, [defaultCarSearch, defaultYear, years])

    useEffect(() => {
        if (open) {
            resetForm()
        }
    }, [open, resetForm])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitAttempted(true)
        const phoneOk = String(phoneLocal || '').replace(/\s/g, '').length >= 8
        const carOk = isFinance
            ? String(defaultCarSearch || carSearch || '').trim().length > 0
            : String(carSearch || '').trim().length > 0
        const ok =
            String(name || '').trim().length > 0 && phoneOk && carOk && String(year || '').trim().length > 0
        if (!ok) return
        setStep('success')
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(15,23,42,0.55)] px-[16px] py-[24px]"
            role="presentation"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={isFinance ? 'motor-finance-title' : 'motor-trade-in-title'}
                className="relative w-[480px] max-sm:w-full rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)] p-[20px] "
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-[16px] top-[16px] flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full text-[#23262A] transition-colors hover:bg-[#f3f4f6] sm:right-[20px] sm:top-[20px]"
                >
                    <CloseIcon className="h-[14px] w-[14px]" fill="#111827" />
                </button>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="pt-[8px]">
                        <div className="mb-[12px]">
                            <h2
                                id={isFinance ? 'motor-finance-title' : 'motor-trade-in-title'}
                                className="mb-[2px] text-[16px] font-[Inter-SemiBold] leading-tight text-[#23262A]"
                            >
                                {isFinance ? 'Get Car Finance' : 'Car Trade In'}
                            </h2>
                            <p className="text-[14px] font-[Inter-Regular] leading-[22px] text-[#4B5563]">
                                {isFinance
                                    ? `${dealerUpper} will help you find the best financing deals.`
                                    : `${dealerUpper} will assess your information to provide trade-in for your car`}
                            </p>
                        </div>

                        <div className='flex flex-col gap-[14px] mb-[18px]'>

                            <div className="space-y-[10px]">
                                <div>
                                    <label className="mb-[8px] block text-[14px] font-[Inter-Medium] text-[#666]">
                                        Your Details *
                                    </label>
                                    <input
                                        type="text"
                                        name="tradeInName"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Name"
                                        className={`w-full rounded-[8px] border px-[14px] py-[12px] text-[15px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]  ${submitAttempted && !String(name).trim()
                                            ? 'border-[#DC0000]'
                                            : 'border-[#E0E0E0]'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <span className="sr-only">Phone number</span>
                                    <div ref={phoneDialRef} className="relative">
                                        <div
                                            className={`flex overflow-hidden rounded-[8px] border bg-white ${submitAttempted &&
                                                String(phoneLocal || '')
                                                    .replace(/\s/g, '')
                                                    .length < 8
                                                ? 'border-[#DC0000]'
                                                : 'border-[rgba(143,143,143,0.24)]'
                                                }`}
                                        >
                                            <div className="flex shrink-0 items-stretch border-r border-[#E0E0E0] bg-white">
                                                <button
                                                    type="button"
                                                    className="cursor-pointer flex items-center gap-[6px] py-[12px] pl-[10px] pr-[8px] outline-none transition-colors hover:bg-[#F9FAFB]"
                                                    aria-haspopup="listbox"
                                                    aria-expanded={dialOpen}
                                                    aria-label="Country calling code"
                                                    onClick={() => setDialOpen((o) => !o)}
                                                >
                                                    <FlagForDial dial={dialCode} />
                                                    <DownArrowIcon className="h-[24px] w-[24px]" stroke="#23262A" />
                                                </button>
                                            </div>
                                            <input
                                                type="tel"
                                                name="tradeInPhone"
                                                autoComplete="tel"
                                                value={`${dialCode}${phoneLocal}`}
                                                onChange={(e) => {
                                                    const dc = dialCode.replace(/\D/g, '')
                                                    setPhoneLocal(nationalDigitsFromInput(e.target.value, dc))
                                                }}
                                                placeholder="Phone number"
                                                className="min-w-0 flex-1 border-0 bg-white py-[12px] pl-[12px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                                            />
                                        </div>
                                        {dialOpen ? (
                                            <ul
                                                className="absolute left-0 top-full z-[60] mt-[4px] max-h-[200px] min-w-[140px] overflow-y-auto rounded-[8px] border border-[#E0E0E0] bg-white py-[4px] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                                                role="listbox"
                                            >
                                                {PHONE_DIAL_CODES.map((code) => (
                                                    <li key={code} role="option" aria-selected={code === dialCode}>
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F3F4F6]"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setDialCode(code)
                                                                setDialOpen(false)
                                                            }}
                                                        >
                                                            <FlagForDial dial={code} />
                                                            <span>{code}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="">
                                <label className="mb-[8px] block text-[14px] font-[Inter-Medium] text-[#666]">
                                    Car Details *
                                </label>
                                {isFinance ? (
                                    <input
                                        type="text"
                                        name="financeCar"
                                        readOnly
                                        tabIndex={-1}
                                        value={carSearch}
                                        aria-readonly="true"
                                        className={`w-full cursor-default rounded-[8px] border bg-[#F9FAFB] px-[14px] py-[12px] text-[15px] font-[Inter-Regular] text-[#23262A] outline-none ${submitAttempted && !String(carSearch || '').trim() ? 'border-[#DC0000]' : 'border-[#E0E0E0]'}`}
                                    />
                                ) : (
                                    <CarMakeCombobox
                                        id="trade-in-car-make"
                                        name="tradeInCar"
                                        value={carSearch}
                                        onChange={setCarSearch}
                                        error={submitAttempted && !String(carSearch).trim()}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="mb-[8px] block text-[14px] font-[Inter-Medium] text-[#666]">
                                    Year *
                                </label>
                                <YearCombobox
                                    id="trade-in-year"
                                    name="tradeInYear"
                                    value={year}
                                    onChange={setYear}
                                    years={years}
                                    error={submitAttempted && !String(year).trim()}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full cursor-pointer bg-[#DC0000] text-center font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95 ${isFinance ? 'rounded-[10px] py-[14px] text-[15px]' : 'rounded-[6px] py-[12px] text-[14px]'}`}
                        >
                            {isFinance ? 'Get Car Finance' : 'Submit'}
                        </button>
                    </form>
                ) : (
                    <div className="p-[50px] max-sm:p-[20px] text-center">
                        <Image src={greencheck} alt="success" width={48} height={48} className='mx-auto mb-[10px]' />
                        <h2 className="mb-[10px] text-[20px] font-[Inter-Bold] leading-[24px] text-[#23262A]">
                            Thank you for submitting your details.
                        </h2>
                        <p className="mb-[24px] text-[14px] font-[Inter-Regular] leading-[22px] text-[#23262A]">
                            <span className="font-[Inter-Bold] uppercase tracking-wide text-[#23262A]">{dealerUpper}</span>{' '}
                            {isFinance
                                ? 'will be in touch soon to help you find the best financing deals.'
                                : 'will be in touch soon to walk you through the best car trade in options.'}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer text-[14px] font-[Inter-Regular] text-[#23262A] "
                        >
                            Continue Browsing
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
