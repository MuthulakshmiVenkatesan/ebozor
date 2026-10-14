'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { loadGoogleMaps } from '@/utils'
import PlaceAdPhoneField from '../components/PlaceAdPhoneField'
import { sanitizeDecimalInput } from '@/utils/placeAdNumericInput'
import { CameraIcon, CloseIcon, FormDownArrowIcon, PaginationNextIcon, PaginationPrevIcon, RightArrowIcon, TickIcon, TermsInfoIcon } from '@/components/CustomFile/icons'
import { fillLocationFieldsFromMapCoords } from '@/utils/listingLocation'
import LocationDetailsModal from '../components/LocationDetailsModal'
import editIcon from '../../../../../public/assets/img/icons/edit.svg'
import infoIcon from '../../../../../public/assets/img/icons/info.svg'
import plusicon from '../../../../../public/assets/img/icons/plusicon.svg'

const DESC_MAX = 16000
const PHONE_PREFIX = '+971'
const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+']
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+']
const FURNISHED_OPTIONS = ['Furnished', 'Unfurnished']
const OCCUPANCY_OPTIONS = ['Vacant', 'Occupied']

const AMENITIES_OPTIONS = [
    'Maids Room',
    'Study',
    'Concierge Service',
    'Central A/C & Heating',
    'Balcony',
    'Built-in Wardrobes',
    'Covered Parking',
    'Private Garden',
    'Private Pool',
    'Shared Pool',
    'Security',
    'Walk-in Closet',
    'View of Water',
    'View of Landmark',
    'Maid Service',
    'Barbecue Area',
    "Children's Play Area",
    'Gym',
    'Sauna',
    'Steam Room',
]

const RERA_STATUS_OPTIONS = ['Complete', 'Incomplete']

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function parseISODate(s) {
    if (!s || typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
    const [y, m, d] = s.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
    return dt
}

function toISO(y, monthIndex, day) {
    const mm = String(monthIndex + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${y}-${mm}-${dd}`
}

function getMonthGrid(year, monthIndex) {
    const first = new Date(year, monthIndex, 1)
    const last = new Date(year, monthIndex + 1, 0)
    const startPad = first.getDay()
    const daysInMonth = last.getDate()
    const cells = []
    for (let i = 0; i < startPad; i += 1) cells.push(null)
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
    return cells
}


function FieldInput({ id, label, required, value, onChange, type = 'text', suffix, inputMode, defaultLabelInside = false, numeric = false }) {
    const enforceNumeric = numeric || inputMode === 'decimal' || inputMode === 'numeric'
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = !defaultLabelInside || hasValue || focused

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-[top,transform,font-size,padding,max-width] duration-200 ease-out ${isFloating
                    ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2]'
                    : suffix
                        ? 'left-[14px] top-1/2 max-w-[calc(100%-100px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2]'
                        : 'left-[14px] top-1/2 max-w-[calc(100%-28px)] -translate-y-1/2 truncate px-0 text-[14px] leading-[1.2]'
                    }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                <input
                    id={id}
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={(e) => onChange(enforceNumeric ? sanitizeDecimalInput(e.target.value) : e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                {suffix ? <span className="shrink-0 pr-[14px] rtl:pl-[14px] rtl:pr-0 text-[12px] font-[Inter-Regular] text-[#9CA3AF]">{suffix}</span> : null}
            </div>
        </div>
    )
}

function OptionalInlineField({ id, label, value, onChange, type = 'text', rightHint = '*Optional', trailing }) {
    const [focused, setFocused] = useState(false)
    const inputRef = useRef(null)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    const isDateField = type === 'date'

    // Custom (non-native) datepicker popover to match reference design.
    const [dateOpen, setDateOpen] = useState(false)
    const [monthMenuOpen, setMonthMenuOpen] = useState(false)
    const selected = parseISODate(value)
    const todayYear = new Date().getFullYear()
    const MIN_YEAR = todayYear - 100
    const MAX_YEAR = todayYear + 50
    const [viewYear, setViewYear] = useState(() => selected?.getFullYear?.() ?? todayYear)
    const [viewMonth, setViewMonth] = useState(() => selected?.getMonth?.() ?? new Date().getMonth())

    const anchorRef = useRef(null)
    const popoverRef = useRef(null)
    const [popoverStyle, setPopoverStyle] = useState({ top: 0, left: 0, width: 0 })

    const syncViewFromValue = useCallback(() => {
        if (selected) {
            setViewYear(selected.getFullYear())
            setViewMonth(selected.getMonth())
        }
    }, [selected])

    useEffect(() => {
        if (!isDateField) return
        if (dateOpen) syncViewFromValue()
    }, [dateOpen, isDateField, syncViewFromValue])

    const updatePopoverPosition = useCallback(() => {
        const el = anchorRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const width = Math.max(r.width, 288)
        let left = r.left
        if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
        if (left < 8) left = 8
        let top = r.bottom + 6
        const estHeight = 340
        if (top + estHeight > window.innerHeight - 8) top = Math.max(8, r.top - estHeight - 6)
        setPopoverStyle({ top, left, width })
    }, [])

    useLayoutEffect(() => {
        if (!isDateField) return
        if (!dateOpen) return
        updatePopoverPosition()
        const onWin = () => updatePopoverPosition()
        window.addEventListener('resize', onWin)
        window.addEventListener('scroll', onWin, true)
        return () => {
            window.removeEventListener('resize', onWin)
            window.removeEventListener('scroll', onWin, true)
        }
    }, [dateOpen, isDateField, updatePopoverPosition])

    useEffect(() => {
        if (!isDateField) return
        if (!dateOpen) return
        const onDoc = (e) => {
            if (anchorRef.current?.contains(e.target)) return
            if (popoverRef.current?.contains(e.target)) return
            setDateOpen(false)
            setMonthMenuOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [dateOpen, isDateField])

    useEffect(() => {
        if (!isDateField) return
        if (!dateOpen) return
        const onEsc = (e) => {
            if (e.key !== 'Escape') return
            e.stopPropagation()
            setDateOpen(false)
            setMonthMenuOpen(false)
        }
        window.addEventListener('keydown', onEsc, true)
        return () => window.removeEventListener('keydown', onEsc, true)
    }, [dateOpen, isDateField])

    const grid = getMonthGrid(viewYear, viewMonth)
    const atMinMonth = viewYear <= MIN_YEAR && viewMonth <= 0
    const atMaxMonth = viewYear >= MAX_YEAR && viewMonth >= 11

    const goPrevMonth = () => {
        setMonthMenuOpen(false)
        setViewMonth((m) => {
            if (m === 0) {
                setViewYear((y) => Math.max(MIN_YEAR, y - 1))
                return 11
            }
            return m - 1
        })
    }

    const goNextMonth = () => {
        setMonthMenuOpen(false)
        setViewMonth((m) => {
            if (m === 11) {
                setViewYear((y) => Math.min(MAX_YEAR, y + 1))
                return 0
            }
            return m + 1
        })
    }

    const pickDay = (day) => {
        onChange(toISO(viewYear, viewMonth, day))
        setDateOpen(false)
        setMonthMenuOpen(false)
    }

    const calendar =
        isDateField && dateOpen && typeof document !== 'undefined'
            ? createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[10000] rounded-[12px] border border-[#E8E8E8] bg-white p-[14px] shadow-[0px_8px_24px_rgba(0,0,0,0.14)]"
                    style={{
                        top: popoverStyle.top,
                        left: popoverStyle.left,
                        width: popoverStyle.width,
                        maxWidth: 'min(100vw - 16px, 320px)',
                    }}
                    role="dialog"
                    aria-label="Choose date"
                >
                    <div className="relative">
                        <div className="mb-[12px] flex items-center justify-between gap-[8px]">
                            <div className="flex min-w-0 flex-1 items-center gap-[4px]">
                                <button
                                    type="button"
                                    onClick={() => setMonthMenuOpen((o) => !o)}
                                    className="cursor-pointer flex min-w-0 items-center gap-[4px] rounded-md py-[4px] pl-[6px] pr-[4px] text-left text-[14px] font-[Inter-SemiBold] text-[#23262a] hover:bg-[#F3F4F6]"
                                >
                                    <p className="truncate">
                                        {MONTHS[viewMonth]} {viewYear}
                                    </p>
                                    <FormDownArrowIcon className="h-[20px] w-[20px] shrink-0" />
                                </button>
                            </div>
                            <div className="flex shrink-0 items-center gap-[2px]">
                                <button
                                    type="button"
                                    disabled={atMinMonth}
                                    onClick={goPrevMonth}
                                    className={`cursor-pointer flex h-[32px] w-[32px] items-center justify-center rounded-md text-[#23262a] ${atMinMonth ? 'opacity-35' : 'hover:bg-[#F3F4F6]'}`}
                                    aria-label="Previous month"
                                >
                                    <PaginationPrevIcon className="h-[14px] w-[14px]" stroke="#8f8f8f" />
                                </button>
                                <button
                                    type="button"
                                    disabled={atMaxMonth}
                                    onClick={goNextMonth}
                                    className={`cursor-pointer flex h-[32px] w-[32px] items-center justify-center rounded-md ${atMaxMonth ? 'text-[#C5C8CE]' : 'text-[#23262a] hover:bg-[#F3F4F6]'}`}
                                    aria-label="Next month"
                                >
                                    <PaginationNextIcon className="h-[14px] w-[14px]" stroke="#8f8f8f" />
                                </button>
                            </div>
                        </div>

                        {monthMenuOpen ? (
                            <div className="absolute left-0 right-0 top-[36px] z-[2] rounded-[10px] border border-[#E5E7EB] bg-white p-[10px] shadow-md">
                                <div className="mb-[8px] flex items-center justify-between px-[4px]">
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded p-[4px] hover:bg-[#F3F4F6]"
                                        onClick={() => setViewYear((y) => Math.max(MIN_YEAR, y - 1))}
                                        aria-label="Previous year"
                                    >
                                        <PaginationPrevIcon className="h-[14px] w-[14px]" stroke="#8f8f8f" />
                                    </button>
                                    <span className="text-[13px] font-[Inter-SemiBold] text-[#23262a]">{viewYear}</span>
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded p-[4px] hover:bg-[#F3F4F6]"
                                        onClick={() => setViewYear((y) => Math.min(MAX_YEAR, y + 1))}
                                        aria-label="Next year"
                                    >
                                        <PaginationNextIcon className="h-[14px] w-[14px]" stroke="#8f8f8f" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-[6px]">
                                    {MONTHS.map((name, i) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                setViewMonth(i)
                                                setMonthMenuOpen(false)
                                            }}
                                            className={`cursor-pointer rounded-[6px] py-[8px] text-center text-[12px] font-[Inter-Medium] ${i === viewMonth ? 'bg-[#DBEAFE] text-[#23262a]' : 'text-[#23262a] hover:bg-[#F3F4F6]'}`}
                                        >
                                            {name.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="mb-[8px] grid grid-cols-7 gap-0 text-center">
                            {WEEKDAYS.map((d, i) => (
                                <div key={`${d}-${i}`} className="py-[6px] text-[11px] font-[Inter-Medium] text-[#6B7280]">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-[4px]">
                            {grid.map((day, idx) => {
                                if (day == null) return <div key={`e-${idx}`} className="h-[36px]" />
                                const isSel =
                                    selected &&
                                    selected.getFullYear() === viewYear &&
                                    selected.getMonth() === viewMonth &&
                                    selected.getDate() === day
                                return (
                                    <div key={`${viewYear}-${viewMonth}-${day}`} className="flex h-[36px] items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => pickDay(day)}
                                            className={`cursor-pointer flex h-[32px] w-[32px] items-center justify-center rounded-full text-[13px] font-[Inter-Regular] transition-colors ${isSel ? 'border border-[#DC0000] bg-[#DC0000] font-[Inter-SemiBold] text-[#fff]' : 'text-[#23262a] hover:bg-[#F3F4F6]'}`}
                                        >
                                            {day}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )
            : null

    return (
        <>
            <div ref={anchorRef} className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto' : 'left-[14px] top-1/2 -translate-y-1/2 px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
            </label>
            <div
                className={`relative flex h-[54px] items-center rounded-[8px] border bg-white transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                {isDateField ? (
                    <button
                        type="button"
                        ref={inputRef}
                        id={id}
                        onClick={() => {
                            setDateOpen((o) => !o)
                            setMonthMenuOpen(false)
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[6px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                        aria-expanded={dateOpen}
                        aria-haspopup="dialog"
                    >
                        <span className={hasValue ? 'text-[#23262A]' : 'text-[#9CA3AF]'}>{value || 'YYYY-MM-DD'}</span>
                    </button>
                ) : (
                    <input
                        ref={inputRef}
                        id={id}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="h-full min-w-0 flex-1 rounded-[8px] border-0 bg-transparent pl-[14px] pr-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                    />
                )}
                <div className="flex shrink-0 items-center gap-[6px] pr-[12px]">
                    <span className="text-[12px] font-[Inter-Regular] text-[#9CA3AF]">{rightHint}</span>
                    {isDateField && hasValue ? (
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label={`Clear ${label}`}
                            className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full text-[#9CA3AF]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onChange('')}
                        >
                            <CloseIcon className="h-[10px] w-[10px]" fill="#9CA3AF" fillOpacity="1" />
                        </button>
                    ) : null}
                    {isDateField ? (
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label={`Open ${label} calendar`}
                            className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-[4px]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setDateOpen(true)
                                setMonthMenuOpen(false)
                            }}
                        >
                            {trailing}
                        </button>
                    ) : (
                        trailing
                    )}
                </div>
            </div>
            </div>
            {calendar}
        </>
    )
}

function FieldTextArea({ id, label, required, value, onChange, maxLength }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim().length > 0
    const isFloating = hasValue || focused
    const len = String(value ?? '').length

    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`pointer-events-none absolute z-[2] bg-white font-[Inter-Regular] text-[#23262A] transition-all duration-200 ease-out ${isFloating ? 'left-[12px] top-0 -translate-y-1/2 px-[6px] text-[12px] leading-[1.2] rtl:right-[12px] rtl:left-auto' : 'left-[14px] top-[24px] -translate-y-1/2 px-0 text-[14px] leading-[1.2] rtl:right-[14px] rtl:left-auto'
                    }`}
            >
                {label}
                {required ? <span> *</span> : null}
            </label>
            <div
                className={`relative rounded-[8px] border bg-white pb-[28px] pt-[18px] transition-[border-color] duration-200 ${focused ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                    }`}
            >
                <textarea
                    id={id}
                    value={value}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={5}
                    className="min-h-[200px] w-full resize-none rounded-[8px] border-0 bg-transparent px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                />
                <span className="pointer-events-none absolute bottom-[8px] right-[12px] text-[12px] font-[Inter-Regular] text-[#9CA3AF]">
                    {len}/{maxLength}
                </span>
            </div>
        </div>
    )
}

function ChipRow({ label, required, options, value, onChange }) {
    return (
        <div>
            <p className="mb-[4px] text-[14px] font-[Inter-Medium] text-[#23262A]">
                {label}
                {required ? <span className=""> *</span> : null}
            </p>
            <div className="flex flex-wrap gap-[8px]">
                {options.map((opt) => {
                    const active = value === opt
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onChange(opt)}
                            className={`cursor-pointer rounded-[8px] border p-[4px_10px] text-[14px] text-[#23262A] font-[Inter-Regular] transition-colors ${active ? 'border-[#23262A] bg-[#edeeee] text-[#23262A]' : 'border-[rgba(143,143,143,0.45)] bg-white'
                                }`}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/** Multi-select with chips, filter input, red border when open; checkbox list with pink row when selected. */
function AmenitiesMultiSelect({ options, values, onChange }) {
    const [open, setOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const rootRef = useRef(null)
    const inputRef = useRef(null)

    const hasSelection = values.length > 0
    const hasFilter = String(filter).trim().length > 0

    const filtered = options.filter((o) => o.toLowerCase().includes(filter.toLowerCase()))

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    const toggle = (opt) => {
        if (values.includes(opt)) onChange(values.filter((v) => v !== opt))
        else onChange([...values, opt])
    }

    const clearAll = () => {
        onChange([])
        setFilter('')
    }

    const openField = () => {
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
    }

    const showChipArea = open || hasSelection || hasFilter

    return (
        <div ref={rootRef} className="relative">
            {showChipArea ? (
                <>
                    <label
                        className={`pointer-events-none absolute left-[12px] top-0 z-[3] -translate-y-1/2 bg-white px-[6px] text-[12px] font-[Inter-Regular] leading-[1.2] ${open || hasSelection ? 'text-[#DC0000]' : 'text-[#23262A]'
                            }`}
                    >
                        Amenities
                    </label>
                    <div
                        className={`relative min-h-[54px] rounded-[8px] border bg-white px-[10px] pb-[10px] pt-[18px] transition-[border-color] duration-200 ${open ? 'border-[#DC0000]' : 'border-[rgba(143,143,143,0.45)]'
                            }`}
                    >
                        <div className="flex flex-wrap items-center gap-[8px] pr-[56px]">
                            {values.map((v) => (
                                <div key={v} className="inline-flex items-center gap-[6px] rounded-full bg-[#edeeee] px-[10px] py-[5px]">
                                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{v}</span>
                                    <button
                                        type="button"
                                        className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full bg-[#BFC3C9] text-white"
                                        aria-label={`Remove ${v}`}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggle(v)
                                        }}
                                    >
                                        <CloseIcon className="h-[8px] w-[8px]" fill="#fff" fillOpacity="1" />
                                    </button>
                                </div>
                            ))}
                            <input
                                ref={inputRef}
                                type="text"
                                value={filter}
                                onChange={(e) => {
                                    setFilter(e.target.value)
                                    setOpen(true)
                                }}
                                onFocus={() => setOpen(true)}
                                className="min-w-[100px] flex-1 border-0 bg-transparent py-[6px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                aria-label="Filter amenities"
                            />
                        </div>
                        <div className="absolute right-[8px] top-[14px] flex items-center gap-[2px]">
                            {values.length > 0 ? (
                                <button
                                    type="button"
                                    className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] text-[#6B7280]"
                                    aria-label="Clear all amenities"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={clearAll}
                                >
                                    <CloseIcon className="h-[12px] w-[12px]" fill="#6B7280" fillOpacity="1" />
                                </button>
                            ) : null}
                            <button
                                type="button"
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center text-[#6B7280]"
                                aria-expanded={open}
                                aria-label="Toggle amenities list"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setOpen((o) => !o)}
                            >
                                <FormDownArrowIcon className={`h-[20px] w-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    onClick={openField}
                    className="relative flex h-[54px] w-full cursor-pointer items-center rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white px-[14px] text-left transition-[border-color] duration-200 hover:border-[rgba(143,143,143,0.65)]"
                >
                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">Amenities</span>
                    <span className="ml-auto flex items-center gap-[10px] pr-[4px]">
                        <span className="text-[12px] font-[Inter-Regular] text-[#9CA3AF]">*Optional</span>
                        <FormDownArrowIcon className="h-[20px] w-[20px] text-[#6B7280]" />
                    </span>
                </button>
            )}

            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(280px,40vh)] overflow-y-auto rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                    {filtered.length === 0 ? (
                        <p className="px-[14px] py-[12px] text-[14px] font-[Inter-Regular] text-[#9CA3AF]">No matches</p>
                    ) : (
                        filtered.map((opt) => {
                            const active = values.includes(opt)
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => toggle(opt)}
                                    className={`flex w-full cursor-pointer items-center gap-[12px] px-[12px] py-[10px] text-left transition-colors ${active ? 'bg-[#FDF2F2]' : 'bg-white hover:bg-[#f6f7f8]'
                                        }`}
                                >
                                    <div
                                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 ${active ? 'border-[#DC0000] bg-[#DC0000]' : 'border-[#8f8f8f] bg-white'
                                            }`}
                                    >
                                        {active ? <TickIcon className="h-[16px] w-[16px]" fill="#fff" fillOpacity="1" /> : null}
                                    </div>
                                    <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{opt}</span>
                                </button>
                            )
                        })
                    )}
                </div>
            ) : null}
        </div>
    )
}

function CalendarGlyph({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="#6B7280" strokeWidth="1.5" />
            <path d="M3 9h18M8 3v4M16 3v4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

/**
 * Property listing wizard (Place Your Ad) — matches reference steps: intro + media, contact & price, size & rooms, extra fees & furnished.
 */
export default function PropertyForm({
    mainCategoryLabel = 'Residential',
    subCategoryLabel = 'Apartment',
    onBack,
    onComplete,
}) {
    const fileInputRef = useRef(null)
    const uploadTimerRef = useRef(null)
    const [mainPhotoPreview, setMainPhotoPreview] = useState('')
    const [isPhotoUploading, setIsPhotoUploading] = useState(false)

    const [title, setTitle] = useState('')
    const [tour360, setTour360] = useState('')
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [phone, setPhone] = useState(PHONE_PREFIX)
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')

    const [size, setSize] = useState('')
    const [totalClosingFee, setTotalClosingFee] = useState('')
    const [developer, setDeveloper] = useState('')
    const [bedrooms, setBedrooms] = useState('')
    const [bathrooms, setBathrooms] = useState('')

    const [readyBy, setReadyBy] = useState('')
    const [annualCommunityFee, setAnnualCommunityFee] = useState('')
    const [furnished, setFurnished] = useState('')
    const [propertyRefId, setPropertyRefId] = useState('')
    const [sellerTransferFee, setSellerTransferFee] = useState('')
    const [buyerTransferFee, setBuyerTransferFee] = useState('')
    const [maintenanceFee, setMaintenanceFee] = useState('')
    const [occupancyStatus, setOccupancyStatus] = useState('')
    const [amenities, setAmenities] = useState([])
    const [reraLandlordName, setReraLandlordName] = useState('')
    const [reraStatus, setReraStatus] = useState('')
    const [shareWithExpert, setShareWithExpert] = useState(false)

    // Location card (same UX pattern as PlaceAdMotorForm)
    const { isLoaded } = loadGoogleMaps()
    const mapRef = useRef(null)
    const [mapZoom, setMapZoom] = useState(12)
    const [position, setPosition] = useState({ lat: 25.2048, lng: 55.2708 })
    // Start with no saved location so we show “+ Add location”
    const [locationLabel, setLocationLabel] = useState('')
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [locationModalMode, setLocationModalMode] = useState('new')
    const [locationQuery, setLocationQuery] = useState('')
    const [streetQuery, setStreetQuery] = useState('')

    const zoomIn = () => {
        setMapZoom((z) => Math.min(20, z + 1))
        if (mapRef.current) mapRef.current.setZoom(Math.min(20, mapRef.current.getZoom() + 1))
    }

    const zoomOut = () => {
        setMapZoom((z) => Math.max(3, z - 1))
        if (mapRef.current) mapRef.current.setZoom(Math.max(3, mapRef.current.getZoom() - 1))
    }

    const handleMapCoordsSelect = (lat, lng) => {
        void fillLocationFieldsFromMapCoords({
            lat,
            lng,
            setPosition,
            setLocationQuery,
            setStreetQuery,
        })
    }

    const locateMe = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                handleMapCoordsSelect(next.lat, next.lng)
                if (mapRef.current) {
                    mapRef.current.panTo(next)
                    mapRef.current.setZoom(14)
                }
            },
            () => { },
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }

    const handleOpenLocationModal = () => {
        setLocationModalMode('new')
        // Open empty form for a brand new location.
        setLocationQuery('')
        setStreetQuery('')
        setLocationLabel('new')
        setShowLocationModal(true)
    }

    const handleEditLocationModal = () => {
        setLocationModalMode('edit')
        setLocationLabel('home')
        setShowLocationModal(true)
    }

    const handleSaveLocationModal = () => {
        setShowLocationModal(false)
        // If user filled anything, treat it as a saved “Home” card.
        if (String(locationQuery).trim() || String(streetQuery).trim()) {
            setLocationLabel('home')
        } else {
            setLocationLabel('')
        }
    }

    useEffect(() => {
        return () => {
            if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        }
    }, [mainPhotoPreview])

    useEffect(() => {
        return () => {
            if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
        }
    }, [])

    const clearMainPhoto = () => {
        if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current)
            uploadTimerRef.current = null
        }
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)
        setMainPhotoPreview('')
        setIsPhotoUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePhotoInputChange = (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (uploadTimerRef.current) {
            clearTimeout(uploadTimerRef.current)
            uploadTimerRef.current = null
        }
        if (mainPhotoPreview) URL.revokeObjectURL(mainPhotoPreview)

        const previewUrl = URL.createObjectURL(selectedFile)
        setMainPhotoPreview(previewUrl)
        setIsPhotoUploading(true)

        uploadTimerRef.current = setTimeout(() => {
            setIsPhotoUploading(false)
            uploadTimerRef.current = null
        }, 2600)
    }

    const handleNext = () => {
        onComplete?.({
            title,
            tour360,
            youtubeUrl,
            phone,
            price,
            description,
            size,
            totalClosingFee,
            developer,
            bedrooms,
            bathrooms,
            readyBy,
            annualCommunityFee,
            furnished: furnished === 'Furnished' ? 'furnished' : furnished === 'Unfurnished' ? 'unfurnished' : null,
            propertyRefId,
            sellerTransferFee,
            buyerTransferFee,
            maintenanceFee,
            occupancyStatus,
            amenities,
            reraLandlordName,
            reraStatus,
            shareWithExpert,
        })
    }


    return (
        <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
            <div className="mb-[12px] text-center">
                <h1 className="mb-[14px] text-center text-[20px] font-[Inter-Bold] text-[#23262A]">You&apos;re almost there!</h1>
                <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A] w-[380px] mx-auto max-sm:w-full">
                    Include as much details and pictures as possible, and set the right price!
                </p>

            </div>

            <nav className="mb-[16px] flex flex-wrap items-center gap-[6px]" aria-label="Breadcrumb">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="cursor-pointer border-0 bg-transparent p-0 text-[14px] font-[Inter-Regular] text-[#4294ff]"
                    >
                        {mainCategoryLabel}
                    </button>
                ) : (
                    <span className="text-[14px] font-[Inter-Regular] text-[#4294ff]">{mainCategoryLabel}</span>
                )}
                {subCategoryLabel ? (
                    <>
                        <RightArrowIcon className="h-[14px] w-[14px]" />
                        <span className="text-[14px] font-[Inter-Regular] leading-[20px] text-[#23262A]">{subCategoryLabel}</span>
                    </>
                ) : null}
            </nav>

            <div className='flex flex-col gap-[24px]'>

                <FieldInput id="prop-title" label="Title" required value={title} onChange={setTitle} defaultLabelInside />

                <div className="">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handlePhotoInputChange}
                    />
                    {mainPhotoPreview ? (
                        <div className="mb-[16px]">
                            {isPhotoUploading ? (
                                <div className="flex items-center gap-[12px] py-[4px]">
                                    <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[2px] border border-[rgba(143,143,143,0.35)] bg-white p-[3px]">
                                        <img src={mainPhotoPreview} alt="Main photo" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="h-[4px] flex-1 rounded-full bg-[#F3D1D1]">
                                        <div className="h-full w-full animate-pulse rounded-full bg-[#DC0000]" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearMainPhoto}
                                        className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center"
                                        aria-label="Remove photo"
                                    >
                                        <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative mx-auto h-[128px] w-[200px]">
                                    <button
                                        type="button"
                                        onClick={clearMainPhoto}
                                        className="absolute -right-[6px] -top-[6px] z-[2] flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border border-[rgba(35,38,42,0.35)] bg-white"
                                        aria-label="Remove photo"
                                    >
                                        <CloseIcon className="h-[10px] w-[10px]" fill="#6B7280" fillOpacity="1" />
                                    </button>
                                    <div className="h-[120px] w-[200px] overflow-hidden rounded-[2px]">
                                        <img src={mainPhotoPreview} alt="Main photo" className="h-full w-full object-cover" />
                                    </div>
                                    <p className="absolute bottom-0 left-0 right-0 mx-auto w-fit rounded-[6px] border border-[rgba(35,38,42,0.3)] bg-white p-[8px_10px] text-center text-[14px] leading-none text-[#23262A]">
                                        Main photo
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] border border-[#DC0000] bg-white"
                    >
                        <CameraIcon className="h-[24px] w-[24px]" />
                        <p className="text-[14px] font-[Inter-SemiBold] leading-[20px] text-[#DC0000]">Add Pictures</p>
                    </button>
                </div>

                <div>
                    <OptionalInlineField id="prop-360" label="360 Tour URL" value={tour360} onChange={setTour360} />
                    <p className="mt-[8px] mb-[16px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                        <Link href="" className="text-[#3a81ff]">
                            Learn more
                        </Link>{' '}
                        about our accepted 360 tour providers
                    </p>
                </div>

                <OptionalInlineField id="prop-youtube" label="YouTube URL" value={youtubeUrl} onChange={setYoutubeUrl} />

                <PlaceAdPhoneField id="prop-phone" label="Phone number" required value={phone} onChange={setPhone} />
                <FieldInput id="prop-price" label="Price" required value={price} onChange={setPrice} type="text" suffix="AED" inputMode="decimal" defaultLabelInside />
                <FieldTextArea id="prop-desc" label="Describe your property" required value={description} onChange={setDescription} maxLength={DESC_MAX} />

                <FieldInput id="prop-size" label="Size" required value={size} onChange={setSize} defaultLabelInside />
                <FieldInput
                    id="prop-closing-fee"
                    label="Total closing fee"
                    required={false}
                    value={totalClosingFee}
                    onChange={setTotalClosingFee}
                    suffix="AED *Optional"
                    defaultLabelInside
                />
                <ChipRow label="Bedrooms" required options={BEDROOM_OPTIONS} value={bedrooms} onChange={setBedrooms} />
                <ChipRow label="Bathrooms" required={false} options={BATHROOM_OPTIONS} value={bathrooms} onChange={setBathrooms} />
                <FieldInput id="prop-developer" label="Developer" required={false} value={developer} onChange={setDeveloper} suffix="*Optional" defaultLabelInside />
                <OptionalInlineField
                    id="prop-ready"
                    label="Ready by"
                    value={readyBy}
                    onChange={setReadyBy}
                    type="date"
                    trailing={<CalendarGlyph className="shrink-0" />}
                />
                <FieldInput
                    id="prop-community-fee"
                    label="Annual Community Fee"
                    required={false}
                    value={annualCommunityFee}
                    onChange={setAnnualCommunityFee}
                    suffix="AED *Optional"
                    defaultLabelInside
                />
                <ChipRow label="Is it furnished?" required={false} options={FURNISHED_OPTIONS} value={furnished} onChange={setFurnished} />

                <FieldInput
                    id="prop-ref"
                    label="Property Reference ID #"
                    required={false}
                    value={propertyRefId}
                    onChange={setPropertyRefId}
                    suffix="*Optional"
                    defaultLabelInside
                />



                <FieldInput
                    id="prop-buyer-fee"
                    label="Buyer Transfer Fee"
                    required={false}
                    value={buyerTransferFee}
                    onChange={setBuyerTransferFee}
                    suffix="AED *Optional"
                    defaultLabelInside
                />

                <FieldInput
                    id="prop-seller-fee"
                    label="Seller Transfer Fee"
                    required={false}
                    value={sellerTransferFee}
                    onChange={setSellerTransferFee}
                    suffix="AED *Optional"
                    defaultLabelInside
                />
                <FieldInput
                    id="prop-maintenance-fee"
                    label="Maintenance Fee"
                    required={false}
                    value={maintenanceFee}
                    onChange={setMaintenanceFee}
                    suffix="AED *Optional"
                    defaultLabelInside
                />
                <ChipRow label="Occupancy Status" required={false} options={OCCUPANCY_OPTIONS} value={occupancyStatus} onChange={setOccupancyStatus} />
                <AmenitiesMultiSelect options={AMENITIES_OPTIONS} values={amenities} onChange={setAmenities} />

                <div className="rounded-[6px] bg-[#f6f7f8] p-[16px] ">
                    <p className="text-[14px] font-[Inter-Regular] text-[#7b8385] leading-[24px] ">
                        By providing false information below you are subject to account deactivation as well as potential reporting to RERA and/or
                        other authorities.
                        <Image src={infoIcon} alt="info" width={18} height={18} className='inline-flex ml-[4px] opacity-50' />
                    </p>
                </div>

                <FieldInput
                    id="prop-rera-landlord"
                    label="RERA landlord name"
                    required={false}
                    value={reraLandlordName}
                    onChange={setReraLandlordName}
                    suffix="*Optional"
                    defaultLabelInside
                />

                <ChipRow
                    label="RERA property status"
                    required={false}
                    options={RERA_STATUS_OPTIONS}
                    value={reraStatus}
                    onChange={setReraStatus}
                />

                {(() => {
                    return (
                        <div className="rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                            <div className="mb-[10px] flex items-center justify-between">
                                <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">Home</h3>
                                <button
                                    type="button"
                                    onClick={handleEditLocationModal}
                                    className="cursor-pointer flex items-center gap-[8px]"
                                >
                                    <Image src={editIcon} alt="edit" width={14} height={14} />
                                    <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Edit</p>
                                </button>
                            </div>

                            <>
                                <p className="mb-[12px] text-[14px] font-[Inter-Regular] text-[#23262A]">{[streetQuery, locationQuery].map((v) => String(v || '').trim()).filter(Boolean).join(' - ') || 'No location selected'}</p>
                                <div className="relative mb-[14px] h-[350px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-[#f6f7f8]">
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={position}
                                            zoom={mapZoom}
                                            onLoad={(map) => {
                                                mapRef.current = map
                                            }}
                                            options={{
                                                disableDefaultUI: true,
                                                clickableIcons: false,
                                            }}
                                        >
                                            <Marker position={position} />
                                        </GoogleMap>
                                    ) : null}
                                </div>
                            </>

                            <div className="mb-[6px] flex flex-wrap gap-[8px]">
                                <button
                                    type="button"
                                    onClick={handleOpenLocationModal}
                                    className={`cursor-pointer rounded-[8px] border p-[8px_12px] flex items-center gap-[8px] ${String(locationQuery).trim() || String(streetQuery).trim()
                                        ? 'border-[#DC0000] bg-[#FEF2F2]'
                                        : 'border-[#DC0000] bg-white'
                                        }`}
                                >
                                    <Image src={plusicon} alt="plus" width={13} height={13} />
                                    <p className="text-[14px] font-[Inter-Medium] text-[#DC0000]">New Location</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocationLabel('')
                                        setLocationQuery('')
                                        setStreetQuery('')
                                    }}
                                    className={`cursor-pointer flex items-center gap-[8px] rounded-[8px] border p-[8px_12px] flex items-center gap-[8px] ${String(locationQuery).trim() || String(streetQuery).trim()
                                        ? 'border-[rgba(0,0,0,0.08)] bg-[#00000014]'
                                        : 'border-[#23262A] bg-white'
                                        }`}
                                >
                                    <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Home</p>
                                    {String(locationQuery).trim() || String(streetQuery).trim() ? <CloseIcon className="h-[8px] w-[8px]" fill="#6B7280" fillOpacity="1" /> : null}
                                </button>
                            </div>

                        </div>
                    )
                })()}


                <div className="rounded-[6px] bg-[#f7f7f8] p-[16px]">
                    <label className="relative flex cursor-pointer items-center gap-[12px]">
                        <input
                            type="checkbox"
                            checked={shareWithExpert}
                            onChange={(e) => setShareWithExpert(e.target.checked)}
                            className="shrink-0 w-[18px] h-[18px] appearance-none border-2 border-[#23262A] rounded 
                        checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                        />
                        {shareWithExpert ? (
                            <TickIcon
                                className="w-[24px] h-[22px] absolute left-[-1px]"
                                fill="#DC0000"
                            />
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                            I would like to share my details with an expert agent so they can contact me and assist with
                            selling my property.
                        </p>
                    </label>
                </div>

                <div className="rounded-[8px] bg-[#F3F4F6] p-[14px] flex flex-col gap-[6px]">
                    <div className="flex items-start gap-[8px]">
                        <Image src={infoIcon} alt="terminfo" width={24} height={24} />
                        <p className="mb-[8px] text-[14px] font-[Inter-Regular] text-[#6B7280]">
                            Your ad will be rejected if it does not comply with our{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                posting guidelines.
                            </Link>{' '}
                            Got questions?{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                email us.
                            </Link>
                        </p>
                    </div>
                    <div className="flex items-start gap-[8px]">
                        <TermsInfoIcon className="h-[24px] w-[24px] shrink-0" fill="#7b8385" fillOpacity="1" />
                        <p className="text-[14px] font-[Inter-Regular] text-[#6B7280]">
                            By proceeding, I confirm that I have reviewed the information provided above and confirm that such information is complete and accurate.{' '}
                            <Link href="#" className="text-[#3a88ef]">
                                Terms &amp; conditions.
                            </Link>
                        </p>
                    </div>
                </div>

            </div>




            <LocationDetailsModal
                open={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSave={handleSaveLocationModal}
                isLoaded={isLoaded}
                mapRef={mapRef}
                position={position}
                mapZoom={mapZoom}
                setPosition={setPosition}
                setMapZoom={setMapZoom}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                locateMe={locateMe}
                locationLabel={locationLabel}
                setLocationLabel={setLocationLabel}
                locationQuery={locationQuery}
                setLocationQuery={setLocationQuery}
                streetQuery={streetQuery}
                setStreetQuery={setStreetQuery}
                modalMode={locationModalMode}
            />

            <button
                type="button"
                onClick={handleNext}
                className="mt-[24px] w-full cursor-pointer rounded-[8px] bg-[#DC0000] py-[14px] text-center text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95"
            >
                Next
            </button>
        </div>
    )
}
