/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { DownArrowIcon, PaginationPrevIcon, PaginationNextIcon } from '@/components/CustomFile/icons'
import calendarIcon from '../../../../../public/assets/img/icons/calendarmonth.svg'

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

function formatDisplayMMMDDYYYY(iso) {
    const d = parseISODate(iso)
    if (!d) return ''
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
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

const currentYear = new Date().getFullYear()
const MIN_YEAR = currentYear - 100
const MAX_YEAR = currentYear

/**
 * Date of Birth style field: shows MM/DD/YYYY, opens custom calendar (popover via portal).
 * `value` / `onChange` use ISO `YYYY-MM-DD`.
 */
export function DatePicker({ label, value, onChange, placeholder = 'DD/MM/YYYY' }) {
    const [open, setOpen] = useState(false)
    const [focused, setFocused] = useState(false)
    const [monthMenuOpen, setMonthMenuOpen] = useState(false)
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())

    const anchorRef = useRef(null)
    const popoverRef = useRef(null)
    const [popoverStyle, setPopoverStyle] = useState({ top: 0, left: 0, width: 0 })

    const selected = parseISODate(value)

    const syncViewFromValue = useCallback(() => {
        if (selected) {
            setViewYear(selected.getFullYear())
            setViewMonth(selected.getMonth())
        }
    }, [selected])

    useEffect(() => {
        if (open) syncViewFromValue()
    }, [open, syncViewFromValue])

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
        if (!open) return
        updatePopoverPosition()
        const onWin = () => updatePopoverPosition()
        window.addEventListener('resize', onWin)
        window.addEventListener('scroll', onWin, true)
        return () => {
            window.removeEventListener('resize', onWin)
            window.removeEventListener('scroll', onWin, true)
        }
    }, [open, updatePopoverPosition])

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (anchorRef.current?.contains(e.target)) return
            if (popoverRef.current?.contains(e.target)) return
            setOpen(false)
            setMonthMenuOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onEsc = (e) => {
            if (e.key !== 'Escape') return
            e.stopPropagation()
            setOpen(false)
            setMonthMenuOpen(false)
        }
        window.addEventListener('keydown', onEsc, true)
        return () => window.removeEventListener('keydown', onEsc, true)
    }, [open])

    const ring = focused || open ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    const grid = getMonthGrid(viewYear, viewMonth)

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

    const atMinMonth = viewYear <= MIN_YEAR && viewMonth <= 0
    const atMaxMonth = viewYear >= MAX_YEAR && viewMonth >= 11

    const pickDay = (day) => {
        onChange(toISO(viewYear, viewMonth, day))
        setOpen(false)
        setMonthMenuOpen(false)
    }

    const display = formatDisplayMMMDDYYYY(value)

    const calendar = open && typeof document !== 'undefined'
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
                                <DownArrowIcon className="h-[20px] w-[20px] shrink-0" stroke="#8f8f8f" />
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
                                        className={`cursor-pointer rounded-[6px] py-[8px] text-center text-[12px] font-[Inter-Medium] ${i === viewMonth ? 'bg-[#DBEAFE] text-[#23262a]' : 'text-[#23262a] hover:bg-[#F3F4F6]'
                                            }`}
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
                            if (day == null) {
                                return <div key={`e-${idx}`} className="h-[36px]" />
                            }
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
                                        className={`cursor-pointer flex h-[32px] w-[32px] items-center justify-center rounded-full text-[13px] font-[Inter-Regular] transition-colors ${isSel
                                            ? 'border border-[#DC0000] bg-[#DC0000] font-[Inter-SemiBold] text-[#fff]'
                                            : 'text-[#23262a] hover:bg-[#F3F4F6]'
                                            }`}
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
            <div ref={anchorRef} className={`relative rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                <div className="relative flex items-stretch">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen((o) => !o)
                            setMonthMenuOpen(false)
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="min-w-0 flex-1 rounded-[6px] bg-transparent p-[16px] pr-[44px] text-left text-[14px] font-[Inter-Regular] outline-none"
                    >
                        <p className={display ? 'text-[#23262a]' : 'text-[#666]'}>
                            {display || placeholder}
                        </p>
                    </button>
                    <div className="cursor-pointer  absolute right-[14px] top-1/2 z-[2] -translate-y-1/2">
                        <Image src={calendarIcon} alt="" width={17} height={20} />
                    </div>
                </div>
                {label ? (
                    <p className="pointer-events-none absolute left-[12px] top-0 z-[3] -translate-y-1/2 bg-white px-[4px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                        {label}
                    </p>
                ) : null}
            </div>
            {calendar}
        </>
    )
}
