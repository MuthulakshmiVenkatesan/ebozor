/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, PlusIcon } from '@/components/CustomFile/icons'

const SKILL_INPUT_LABEL = 'Enter skills you use at work eg. Good Communication'

const SUGGESTED_SKILLS = [
    'Account Statement Reports',
    'VAT return',
    'Cash Flow',
    'Book Keeping',
    'Reconciliation',
]

/** Stable default so `useEffect` deps don’t change every render (inline `[]` breaks controlled input). */
const DEFAULT_INITIAL_SKILLS = []

/** Extra options for autocomplete (e.g. typing "tax" → Tax). */
const AUTOCOMPLETE_OPTIONS = [
    'Tax',
    'Communication skills',
    'Salesforce',
    'Microsoft Excel',
    'Project Management',
    'Bookkeeping',
    ...SUGGESTED_SKILLS,
]

function normalizeSkill(s) {
    return s.trim().replace(/\s+/g, ' ')
}

function useOnClickOutside(ref, handler, enabled) {
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

function SkillsFloatingInput({ label, value, onChange, onKeyDown, placeholder }) {
    const [focused, setFocused] = useState(false)
    const ring = focused ? 'border border-[#23262a]' : 'border border-[#D0D0D0]'

    return (
        <div className={`relative rounded-lg bg-white ${ring} transition-[border-width] duration-150`}>
          
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full rounded-[6px] bg-transparent p-[16px] text-[14px] font-[Inter-Regular] text-[#23262a] outline-none placeholder:text-[#23262a]"
            />
        </div>
    )
}

/**
 * Skills dialog: floating skill input with autocomplete, chips, suggested +tags, Clear All / Save.
 */
export default function SkillsModal({ open, onClose, onSave, initialSkills = DEFAULT_INITIAL_SKILLS }) {
    const [draft, setDraft] = useState('')
    const [selectedSkills, setSelectedSkills] = useState([])
    const [attemptedSave, setAttemptedSave] = useState(false)
    const [listDismissed, setListDismissed] = useState(false)
    const comboRef = useRef(null)
    const wasOpenRef = useRef(false)

    useEffect(() => {
        const justOpened = open && !wasOpenRef.current
        wasOpenRef.current = open
        if (!justOpened) return
        setDraft('')
        setAttemptedSave(false)
        setListDismissed(false)
        setSelectedSkills(Array.isArray(initialSkills) ? [...initialSkills] : [])
    }, [open, initialSkills])

    useEffect(() => {
        setListDismissed(false)
    }, [draft])

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

    const lowerSelected = useMemo(
        () => new Set(selectedSkills.map((s) => s.toLowerCase())),
        [selectedSkills]
    )

    const autocompleteMatches = useMemo(() => {
        const q = draft.trim().toLowerCase()
        if (q.length < 1) return []
        const seen = new Set()
        return AUTOCOMPLETE_OPTIONS.filter((opt) => {
            const o = opt.toLowerCase()
            if (!o.includes(q) || lowerSelected.has(o)) return false
            if (seen.has(o)) return false
            seen.add(o)
            return true
        }).slice(0, 8)
    }, [draft, lowerSelected])

    const showAutocomplete =
        !listDismissed && draft.trim().length > 0 && autocompleteMatches.length > 0

    useOnClickOutside(comboRef, () => setListDismissed(true), showAutocomplete)

    const addSkill = useCallback(
        (raw) => {
            const s = normalizeSkill(raw)
            if (!s) return
            if (lowerSelected.has(s.toLowerCase())) {
                setDraft('')
                return
            }
            setSelectedSkills((prev) => [...prev, s])
            setDraft('')
            setListDismissed(true)
            setAttemptedSave(false)
        },
        [lowerSelected]
    )

    const removeSkill = useCallback((skill) => {
        setSelectedSkills((prev) => prev.filter((x) => x !== skill))
    }, [])

    const clearAll = useCallback(() => {
        setSelectedSkills([])
        setDraft('')
        setAttemptedSave(false)
        setListDismissed(false)
    }, [])

    const canSave = selectedSkills.length > 0

    const handleSave = useCallback(() => {
        if (!canSave) {
            setAttemptedSave(true)
            return
        }
        onSave?.([...selectedSkills])
        onClose()
    }, [canSave, onSave, onClose, selectedSkills])

    const showBlankError = attemptedSave && selectedSkills.length === 0

    const onInputKeyDown = useCallback(
        (e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            e.stopPropagation()
            const t = draft.trim()
            if (!t) return
            const lower = t.toLowerCase()
            const exact = autocompleteMatches.find((m) => m.toLowerCase() === lower)
            if (exact) {
                addSkill(exact)
                return
            }
            if (autocompleteMatches.length === 1) {
                addSkill(autocompleteMatches[0])
                return
            }
            addSkill(t)
        },
        [draft, autocompleteMatches, addSkill]
    )

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="skills-modal-title">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex max-h-[min(640px,90vh)] w-full max-w-[480px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="skills-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Skills
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex cursor-pointer items-center justify-center p-[4px]"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[20px] py-[20px]">
                    <p className="mb-[16px] text-[14px] font-[Inter-Regular] leading-snug text-[#000]">
                        Add your technical or soft skills such as Salesforce, Communication skills etc.
                    </p>

                    <div ref={comboRef} className="relative">
                        <SkillsFloatingInput
                            label={SKILL_INPUT_LABEL}
                            value={draft}
                            onChange={(v) => {
                                setDraft(v)
                                setAttemptedSave(false)
                            }}
                            onKeyDown={onInputKeyDown}
                            placeholder={SKILL_INPUT_LABEL}
                        />
                        {showAutocomplete ? (
                            <ul
                                className="absolute left-0 right-0 top-[calc(100%+4px)] z-[30] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-[4px] shadow-[0px_4px_14px_rgba(0,0,0,0.08)]"
                                role="listbox"
                            >
                                {autocompleteMatches.map((opt) => (
                                    <li key={opt}>
                                        <button
                                            type="button"
                                            role="option"
                                            className="w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262a] hover:bg-[#F3F4F6]"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => addSkill(opt)}
                                        >
                                            {opt}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>

                    <div className="mt-[8px] ">
                        {showBlankError ? (
                            <p className="text-[12px] font-[Inter-Regular] text-[#DC0000]" role="alert">
                                This field can not be blank
                            </p>
                        ) : null}
                    </div>

                    {selectedSkills.length > 0 ? (
                        <div className="mb-[20px] mt-[10px] flex flex-wrap gap-[8px]">
                            {selectedSkills.map((skill) => (
                                <p
                                    key={skill}
                                    className="inline-flex items-center gap-[8px] rounded-[6px] border border-[#23262a] bg-white text-[12px] font-[Inter-Medium] text-[#23262a] p-[6px_12px]"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#23262a] hover:opacity-90"
                                        aria-label={`Remove ${skill}`}
                                    >
                                        <CloseIcon className="h-[7px] w-[7px]" fill="#ffffff" />
                                    </button>
                                </p>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-[12px]" />
                    )}

                    <p className="mb-[12px] text-[14px] font-[Inter-Medium] text-[#666]">Suggested Skills</p>
                    <div className="flex flex-wrap gap-[10px]">
                        {SUGGESTED_SKILLS.map((name) => {
                            const taken = lowerSelected.has(name.toLowerCase())
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    disabled={taken}
                                    onClick={() => addSkill(name)}
                                    className={`inline-flex items-center gap-[6px] rounded-[8px] border border-[#23262a] px-[12px] py-[8px] text-left text-[13px] font-[Inter-Regular] text-[#23262a] transition-colors ${taken ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-[#F9FAFB]'
                                        }`}
                                >
                                    <PlusIcon className="h-[14px] w-[14px]" fill="#23262A" />
                                    {name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                    <div className="flex items-center justify-end gap-[12px]">
                        <button
                            type="button"
                            onClick={clearAll}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_12px] text-[14px] font-[Inter-SemiBold] text-white ${
                                canSave ? 'cursor-pointer bg-[#23262a]' : 'cursor-pointer bg-[#8f8f8f]'
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
