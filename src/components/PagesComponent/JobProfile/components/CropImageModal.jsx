/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'

const OUTPUT_SIZE = 512

/**
 * Circular crop UI: pan + zoom image under a fixed circle, export PNG circle.
 *
 * @param {{ open: boolean; imageUrl: string | null; onClose: () => void; onComplete: (file: File) => void }} props
 */
export default function CropImageModal({ open, imageUrl, onClose, onComplete }) {
    const containerRef = useRef(null)
    const imgRef = useRef(null)
    const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 })
    const [natural, setNatural] = useState({ w: 0, h: 0 })
    const [box, setBox] = useState({ cw: 560, ch: 520 })
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)

    const measure = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const cw = Math.max(280, Math.floor(el.clientWidth))
        const ch = Math.min(640, Math.max(420, Math.round(cw * 0.88)))
        setBox({ cw, ch })
    }, [])

    useEffect(() => {
        if (!open) return
        setPan({ x: 0, y: 0 })
        setZoom(1)
        setNatural({ w: 0, h: 0 })
        const t = requestAnimationFrame(measure)
        window.addEventListener('resize', measure)
        return () => {
            cancelAnimationFrame(t)
            window.removeEventListener('resize', measure)
        }
    }, [open, imageUrl, measure])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    const onImgLoad = (e) => {
        const t = e.currentTarget
        setNatural({ w: t.naturalWidth, h: t.naturalHeight })
    }

    const { cw, ch } = box
    const nw = natural.w
    const nh = natural.h
    const cover = nw && nh ? Math.max(cw / nw, ch / nh) : 1
    const dispW = nw ? nw * cover * zoom : cw
    const dispH = nh ? nh * cover * zoom : ch
    const ix = (cw - dispW) / 2 + pan.x
    const iy = (ch - dispH) / 2 + pan.y
    const r = Math.min(cw, ch) * 0.38

    const onPointerDown = (e) => {
        if (e.button !== 0) return
        dragRef.current = { active: true, sx: pan.x, sy: pan.y, px: e.clientX, py: e.clientY }
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e) => {
        if (!dragRef.current.active) return
        const { sx, sy, px, py } = dragRef.current
        setPan({ x: sx + (e.clientX - px), y: sy + (e.clientY - py) })
    }

    const onPointerUp = (e) => {
        dragRef.current.active = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
            /* ignore */
        }
    }

    const resetCrop = () => {
        setPan({ x: 0, y: 0 })
        setZoom(1)
    }

    const handleCrop = useCallback(async () => {
        const img = imgRef.current
        if (!img || !nw || !nh || !containerRef.current) return

        const sx0 = ((cw / 2 - r) - ix) / dispW * nw
        const sy0 = ((ch / 2 - r) - iy) / dispH * nh
        const sw0 = (2 * r) / dispW * nw
        const sh0 = (2 * r) / dispH * nh

        let sx = Math.max(0, sx0)
        let sy = Math.max(0, sy0)
        let sw = Math.min(sw0, nw - sx)
        let sh = Math.min(sh0, nh - sy)
        if (sw <= 0 || sh <= 0) return

        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT_SIZE
        canvas.height = OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

        const blob = await new Promise((res) => canvas.toBlob(res, 'image/png', 0.92))
        if (!blob) return
        const file = new File([blob], 'profile-photo.png', { type: 'image/png' })
        onComplete(file)
    }, [nw, nh, cw, ch, ix, iy, dispW, dispH, r, pan, zoom, onComplete])

    if (!open || !imageUrl) return null

    return (
        <div className="fixed inset-0 z-[1270] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="crop-image-modal-title">
            <button type="button" className="absolute inset-0 z-0 bg-black/45" onClick={onClose} aria-label="Close" />
            <div
                className="relative z-[1] flex w-[550px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                    <h2 id="crop-image-modal-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Crop Image
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto ">
                    <div
                        ref={containerRef}
                        className="relative mx-auto w-full max-w-[560px] touch-none select-none overflow-hidden  bg-[#8b9099]"
                        style={{ height: ch }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            alt=""
                            draggable={false}
                            onLoad={onImgLoad}
                            className="pointer-events-none absolute max-w-none"
                            style={{
                                width: dispW,
                                height: dispH,
                                left: ix,
                                top: iy,
                                opacity: nw ? 1 : 0,
                            }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 z-[2] bg-black/55"
                            style={{
                                WebkitMaskImage: `radial-gradient(circle ${r}px at 50% 50%, transparent 99.2%, black 100%)`,
                                maskImage: `radial-gradient(circle ${r}px at 50% 50%, transparent 99.2%, black 100%)`,
                            }}
                        />
                        <div
                            className="pointer-events-none absolute left-1/2 top-1/2 z-[3] box-border rounded-full border-2 border-dashed border-white"
                            style={{
                                width: r * 2,
                                height: r * 2,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </div>

                    {/* <div className="mx-auto mt-[16px] flex w-full max-w-[560px] items-center gap-[12px]">
                        <label htmlFor="crop-zoom" className="shrink-0 text-[13px] font-[Inter-Medium] text-[#23262A]">
                            Zoom
                        </label>
                        <input
                            id="crop-zoom"
                            type="range"
                            min={1}
                            max={3}
                            step={0.02}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="min-w-0 flex-1 accent-[#23262a]"
                        />
                    </div> */}
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[12px]">
                    <div className="flex items-center justify-end gap-[8px]">
                        <button
                            type="button"
                            onClick={resetCrop}
                            className="cursor-pointer rounded-[6px] border border-[#23262a] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262a]"
                        >
                            Clear All
                        </button>
                        <button
                            type="button"
                            onClick={handleCrop}
                            className="cursor-pointer rounded-[6px] bg-[#23262a] p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-white"
                        >
                            Crop
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}
