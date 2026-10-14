/* eslint-disable react/prop-types */
'use client'

import { useMemo, useState } from 'react'

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function toPlainDescription(raw) {
    if (raw == null) return ''
    const s = typeof raw === 'string' ? raw : String(raw)
    return s
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

const PREVIEW_LEN = 220

function buildFallbackAbout(title) {
    const name = title || 'This project'
    return `${name} in Arjan, Al Barsha South, is a mixed-use development designed to offer a dynamic lifestyle for both families and businesses. Known for its signature architectural style, the development seamlessly blends contemporary design with practical layouts, creating the perfect balance between luxury and functionality. Located at the heart of the community with strong transport links.

Residents enjoy access to amenities including a fitness centre, landscaped green zones, and curated retail — combining privacy, comfort, and modern urban living for families and professionals alike.`
}

export default function NewProjectAbout({ productData = {} }) {
    const [expanded, setExpanded] = useState(false)

    const title = pickString(productData.title, productData.name, 'Project')
    const raw = pickString(
        productData.about,
        productData.about_text,
        productData.description,
        productData.details,
        productData.overview,
        productData.project_description
    )
    const fullText = useMemo(() => {
        const plain = toPlainDescription(raw)
        if (plain) return plain
        return buildFallbackAbout(title)
    }, [raw, title])

    const hasToggle = fullText.length > PREVIEW_LEN
    const previewText = hasToggle ? `${fullText.slice(0, PREVIEW_LEN).trim()}…` : fullText
    const visibleText = hasToggle && !expanded ? previewText : fullText

    const blocks = visibleText.split(/\n\n+/).filter(Boolean)

    return (
        <div className="w-full border-b border-[rgba(143,143,143,0.35)] pb-[40px]">
            <h2 className="mb-[6px] text-[26px] font-[Inter-Bold] text-[#23262A] ">
                About {title}
            </h2>

            <div className="">
                <div
                    className={`mb-[16px] flex flex-col gap-[16px] text-[14px] font-[Inter-Regular] text-[#23262A] ${expanded ? 'text-right' : 'text-left'
                        }`}
                >
                    {blocks.map((para, i) => (
                        <p key={`about-${i}`} className="whitespace-pre-line text-right">
                            {para}
                        </p>
                    ))}
                </div>

                {hasToggle ? (
                    <div className={expanded ? '' : ''}>
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                        >
                            {expanded ? 'Read Less' : 'Read More'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
