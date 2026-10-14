/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, DownArrowIcon, TickIcon } from '@/components/CustomFile/icons'

export const PHONE_DIAL_CODES = ['+971', '+91', '+44', '+1', '+92', '+63', '+966']

export function useOnClickOutside(ref, handler, enabled) {
    useEffect(() => {
        if (!enabled) return
        const listener = (e) => {
            const el = ref.current
            if (!el || el.contains(e.target)) return
            handler()
        }
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)
        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler, enabled])
}

export function FloatingOutlinedInput({ label, required, value, onChange, type = 'text', autoComplete, placeholder }) {
    const [focused, setFocused] = useState(false)
    const hasValue = String(value ?? '').trim() !== ''
    const isFloated = hasValue || focused
    const ring = focused ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    const labelClass = isFloated
        ? 'top-0 -translate-y-1/2 text-[12px] leading-tight text-[#3a3f47]'
        : 'top-1/2 -translate-y-1/2 text-[14px] leading-snug text-[#3a3f47]'

    const fieldPad = isFloated ? 'px-[16px] py-[18px]' : 'px-[16px] py-[18px]'

    return (
        <div className={`relative min-h-[56px] rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
            <label
                className={`pointer-events-none absolute left-[11px] z-[2] max-w-[calc(100%-16px)] truncate bg-white px-[4px] font-[Inter-Regular] transition-all duration-200 ease-out ${labelClass}`}
            >
                {label}
                {required ? <span className=""> *</span> : null}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={autoComplete}
                placeholder={isFloated ? placeholder : ''}
                className={`w-full rounded-[6px] bg-transparent text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#9CA3AF] ${fieldPad}`}
            />
        </div>
    )
}

export function FloatingOutlinedInputWithActions({ label, required, value, onChange, type = 'text', showClear, showDialMenu }) {
    const [focused, setFocused] = useState(false)
    const [dialOpen, setDialOpen] = useState(false)
    const wrapRef = useRef(null)
    const ring = focused || dialOpen ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    useOnClickOutside(wrapRef, () => setDialOpen(false), dialOpen)

    return (
        <div ref={wrapRef} className="relative">
            <div className={`relative flex items-stretch rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                <label className="pointer-events-none absolute left-[11px] top-0 z-[1] -translate-y-1/2 bg-white px-[4px] text-[12px] font-[Inter-Regular] leading-tight text-[#3a3f47]">
                    {label}
                    {required ? <span className="text-[#3a3f47]"> *</span> : null}
                </label>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full rounded-[6px] bg-transparent p-[16px] text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
                />
                <div className="flex shrink-0 items-center gap-[2px] pr-[8px]">
                    {showClear && value ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onChange('')}
                            className="flex cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                            aria-label="Clear"
                        >
                            <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                        </button>
                    ) : null}
                    {showDialMenu ? (
                        <div className="relative">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setDialOpen((o) => !o)}
                                className="flex cursor-pointer items-center justify-center rounded-md text-[#23262a] hover:bg-[#F3F4F6]"
                                aria-expanded={dialOpen}
                                aria-haspopup="listbox"
                                aria-label="Country code"
                            >
                                <DownArrowIcon className="h-[24px] w-[24px]" stroke="#8f8f8f" />
                            </button>
                            {dialOpen ? (
                                <ul
                                    className="absolute right-0 top-full z-[40] mt-[6px] max-h-[200px] min-w-[140px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-[4px] shadow-lg"
                                    role="listbox"
                                >
                                    {PHONE_DIAL_CODES.map((code) => (
                                        <li key={code}>
                                            <button
                                                type="button"
                                                className="w-full px-[12px] py-[8px] text-left rtl:text-right text-[13px] font-[Inter-Regular] text-[#23262a] hover:bg-[#F3F4F6]"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    const rest = value.replace(/^\+\d{1,4}\s*/, '').trim()
                                                    onChange(rest ? `${code} ${rest}` : code)
                                                    setDialOpen(false)
                                                }}
                                            >
                                                {code}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/** Searchable combobox: filter in the field when open; floating label; list portaled to body so modals cannot clip it. */
export function FloatingSearchSelect({ label, required, value, onChange, options, emptyPlaceholder = 'Select' }) {
    const rootRef = useRef(null)
    const listPortalRef = useRef(null)
    const inputRef = useRef(null)
    const listId = useRef(`search-select-${Math.random().toString(36).slice(2, 9)}`)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const [listBox, setListBox] = useState({ top: 0, left: 0, width: 0 })

    const selectedLabel = useMemo(() => {
        const o = options.find((x) => String(x.value) === String(value))
        return o?.label ?? ''
    }, [value, options])

    const hasValue = selectedLabel.length > 0
    const isFloated = hasValue || open || focused

    const updateListPosition = useCallback(() => {
        const el = rootRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        setListBox({ top: r.bottom + 4, left: r.left, width: r.width })
    }, [])

    useEffect(() => {
        if (!open) {
            setFocused(false)
            setListBox({ top: 0, left: 0, width: 0 })
        }
    }, [open])

    useLayoutEffect(() => {
        if (!open) return
        updateListPosition()
    }, [open, updateListPosition])

    useEffect(() => {
        if (!open) return
        const onReposition = () => updateListPosition()
        window.addEventListener('resize', onReposition)
        window.addEventListener('scroll', onReposition, true)
        return () => {
            window.removeEventListener('resize', onReposition)
            window.removeEventListener('scroll', onReposition, true)
        }
    }, [open, updateListPosition])

    useEffect(() => {
        if (!open) return
        setQuery(selectedLabel)
        const t = requestAnimationFrame(() => {
            const el = inputRef.current
            if (el) {
                el.focus()
                el.select()
            }
        })
        return () => cancelAnimationFrame(t)
    }, [open, selectedLabel])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter((o) => {
            const lab = String(o.label ?? '').toLowerCase()
            const val = String(o.value ?? '').toLowerCase()
            return lab.includes(q) || val.includes(q)
        })
    }, [options, query])

    useEffect(() => {
        if (!open) return
        const close = () => {
            setOpen(false)
            setQuery('')
            setFocused(false)
        }
        const listener = (e) => {
            const root = rootRef.current
            const pop = listPortalRef.current
            if ((root && root.contains(e.target)) || (pop && pop.contains(e.target))) return
            close()
        }
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)
        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [open])

    const ring = open || focused ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'
    const showClearClosed = hasValue && !open
    const showClearOpen = open && query.length > 0

    const labelClass = isFloated
        ? 'top-0 -translate-y-1/2 text-[12px] leading-tight text-[#3a3f47]'
        : 'top-1/2 -translate-y-1/2 text-[14px] leading-snug text-[#3a3f47]'

    const fieldPad = isFloated ? 'px-[16px] py-[18px]' : 'px-[16px] py-[18px]'

    const maxListHeight =
        typeof window !== 'undefined' && open && listBox.top > 0
            ? Math.min(220, Math.max(120, window.innerHeight - listBox.top - 12))
            : 220

    const listPanel =
        open && typeof document !== 'undefined' && listBox.width > 0 ? (
            <div
                ref={listPortalRef}
                className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                style={{
                    position: 'fixed',
                    top: listBox.top,
                    left: listBox.left,
                    width: Math.max(listBox.width, 1),
                    zIndex: 1300,
                }}
            >
                <ul
                    id={listId.current}
                    className="overflow-y-auto py-[4px]"
                    style={{ maxHeight: maxListHeight }}
                    role="listbox"
                >
                    {filtered.length === 0 ? (
                        <li className="px-[12px] py-[10px] text-[13px] font-[Inter-Regular] text-[#9CA3AF]">No options</li>
                    ) : (
                        filtered.map((o) => {
                            const isSel = String(o.value) === String(value)
                            return (
                                <li key={String(o.value)}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={isSel}
                                        className={`flex w-full cursor-pointer items-center justify-between gap-[8px] px-[12px] py-[10px] text-left rtl:text-right transition-colors ${isSel ? 'bg-[#DBEAFE] text-[#23262a]' : 'text-[#23262a] hover:bg-[#F3F4F6]'
                                            }`}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            onChange(o.value)
                                            setOpen(false)
                                            setQuery('')
                                            setFocused(false)
                                        }}
                                    >
                                        <p className="min-w-0 truncate text-[14px] font-[Inter-Regular]">{o.label}</p>
                                        {isSel ? (
                                            <TickIcon className="h-[20px] w-[20px]" fill="#23262A" />
                                        ) : null}
                                    </button>
                                </li>
                            )
                        })
                    )}
                </ul>
            </div>
        ) : null

    return (
        <div ref={rootRef} className="relative">
            <div className={`relative flex min-h-[52px] items-stretch rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                <label
                    className={`pointer-events-none absolute left-[11px] z-[2] max-w-[calc(100%-56px)] truncate bg-white px-[4px] font-[Inter-Regular] transition-all duration-200 ease-out ${labelClass}`}
                >
                    {label}
                    {required ? <span className=""> *</span> : null}
                </label>

                <div className="flex min-w-0 flex-1 items-stretch">
                    {open ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            aria-expanded={open}
                            aria-controls={listId.current}
                            aria-autocomplete="list"
                            role="combobox"
                            autoComplete="off"
                            className={`w-full min-w-0 rounded-[6px] bg-transparent text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f] ${fieldPad}`}
                        />
                    ) : (
                        <button
                            type="button"
                            className={`flex min-w-0 flex-1 items-center text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262a] outline-none ${fieldPad}`}
                            onClick={() => setOpen(true)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            aria-haspopup="listbox"
                            aria-expanded={false}
                        >
                            {isFloated ? (
                                <span className={`min-w-0 truncate ${hasValue ? '' : 'text-[#9CA3AF]'}`}>
                                    {hasValue ? selectedLabel : emptyPlaceholder}
                                </span>
                            ) : (
                                <span className="min-h-[1em] select-none text-transparent" aria-hidden>
                                    &nbsp;
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-[2px] pr-[8px]">
                    {showClearClosed ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange('')
                                setQuery('')
                            }}
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                            aria-label="Clear selection"
                        >
                            <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                        </button>
                    ) : null}
                    {showClearOpen ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setQuery('')}
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                            aria-label="Clear search"
                        >
                            <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            if (open) {
                                setOpen(false)
                                setQuery('')
                                setFocused(false)
                            } else {
                                setOpen(true)
                            }
                        }}
                        className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#23262a] hover:bg-[#F3F4F6]"
                        aria-label={open ? 'Close list' : 'Open list'}
                    >
                        <DownArrowIcon
                            className={`h-[24px] w-[24px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                            stroke="#8f8f8f"
                        />
                    </button>
                </div>
            </div>

            {listPanel ? createPortal(listPanel, document.body) : null}
        </div>
    )
}

/** Outlined combobox with visible floating label (matches job profile modals). */
export function FloatingLabeledNativeSelect({
    label,
    required,
    value,
    onChange,
    options,
    clearable = false,
    allowEmpty = false,
    emptyPlaceholder = 'Select',
    className = '',
}) {
    const rootRef = useRef(null)
    const inputRef = useRef(null)
    const listId = useRef(`combo-list-${Math.random().toString(36).slice(2, 9)}`)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const selectedLabel = useMemo(() => {
        if (allowEmpty && (value === '' || value == null)) return ''
        const o = options.find((x) => String(x.value) === String(value))
        return o?.label ?? ''
    }, [value, options, allowEmpty])

    useEffect(() => {
        if (!open) return
        setQuery(selectedLabel)
        const t = requestAnimationFrame(() => {
            const el = inputRef.current
            if (el) {
                el.focus()
                el.select()
            }
        })
        return () => cancelAnimationFrame(t)
    }, [open, selectedLabel])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter((o) => o.label.toLowerCase().includes(q))
    }, [options, query])

    useOnClickOutside(
        rootRef,
        () => {
            setOpen(false)
            setQuery(selectedLabel)
        },
        open
    )

    const ring = open ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    const showClearClosed = clearable && value !== '' && value != null && !open
    const showClearOpen = open && query.length > 0

    return (
        <div ref={rootRef} className={`relative min-w-0 ${className}`}>
            <div className={`relative rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
                <label className="pointer-events-none absolute left-[11px] top-0 z-[1] -translate-y-1/2 bg-white px-[4px] text-[12px] font-[Inter-Regular] leading-tight text-[#3a3f47]">
                    {label}
                    {required ? <span className="text-[#3a3f47]"> *</span> : null}
                </label>
                <div className="flex items-stretch">
                    {open ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-expanded={open}
                            aria-controls={listId.current}
                            aria-autocomplete="list"
                            role="combobox"
                            className="w-full rounded-[6px] bg-transparent p-[16px] text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#8f8f8f]"
                        />
                    ) : (
                        <button
                            type="button"
                            className="w-full rounded-[6px] bg-transparent p-[16px] text-left rtl:text-right text-[14px] font-[Inter-Regular] text-[#23262a] outline-none"
                            onClick={() => setOpen(true)}
                            aria-expanded={false}
                            aria-haspopup="listbox"
                        >
                            <span className={!selectedLabel ? 'text-[#23262a]' : 'text-[#23262a]'}>
                                {selectedLabel || emptyPlaceholder}
                            </span>
                        </button>
                    )}

                    <div className="flex shrink-0 items-center gap-[2px] pr-[8px]">
                        {showClearClosed ? (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(allowEmpty ? '' : options[0]?.value ?? '')
                                    setQuery('')
                                }}
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                                aria-label="Clear"
                            >
                                <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                            </button>
                        ) : null}
                        {showClearOpen ? (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setQuery('')}
                                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#666666] hover:bg-[#F3F4F6]"
                                aria-label="Clear search"
                            >
                                <CloseIcon className="h-[10px] w-[10px]" fill="#666666" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                if (open) {
                                    setOpen(false)
                                    setQuery(selectedLabel)
                                } else {
                                    setOpen(true)
                                }
                            }}
                            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md text-[#23262a] hover:bg-[#F3F4F6]"
                            aria-label={open ? 'Close list' : 'Open list'}
                        >
                            <DownArrowIcon
                                className={`h-[24px] w-[24px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                stroke="#8f8f8f"
                            />
                        </button>
                    </div>
                </div>
            </div>

            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[40] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
                    <ul id={listId.current} className="max-h-[260px] overflow-y-auto py-[4px]" role="listbox">
                        {filtered.length === 0 ? (
                            <li className="px-[12px] py-[10px] text-[13px] text-[#9CA3AF]">No matches</li>
                        ) : (
                            filtered.map((o) => {
                                const isSel = String(o.value) === String(value)
                                return (
                                    <li key={String(o.value)}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isSel}
                                            className={`flex w-full cursor-pointer items-center justify-between gap-[8px] px-[12px] py-[10px] text-left rtl:text-right transition-colors ${isSel ? 'bg-[#DBEAFE] text-[#23262a]' : 'text-[#23262a] hover:bg-[#F3F4F6]'
                                                }`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                onChange(o.value)
                                                setOpen(false)
                                                setQuery(o.label)
                                            }}
                                        >
                                            <p className="min-w-0 truncate text-[14px] font-[Inter-Regular]">{o.label}</p>
                                            {isSel ? (
                                                <TickIcon className="h-[20px] w-[20px]" fill="#23262A" />
                                            ) : null}
                                        </button>
                                    </li>
                                )
                            })
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}

