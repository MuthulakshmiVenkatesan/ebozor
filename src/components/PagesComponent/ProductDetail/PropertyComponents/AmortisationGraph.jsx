/* eslint-disable react/prop-types */
'use client'

import { useMemo } from 'react'

function formatAED(n) {
    return Number(n || 0).toLocaleString('en-US')
}

function formatCompact(n) {
    const num = Number(n || 0)
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${Math.round(num / 1000)}K`
    return `${Math.round(num)}`
}

function formatMonthYear(dateValue) {
    if (!dateValue) return ''
    const d = new Date(dateValue)
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function buildPolylinePath(points) {
    if (!points.length) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

export default function AmortisationGraph({ chartPoints, selectedPointIndex, onPointChange }) {
    const safeIndex = Math.min(selectedPointIndex || 0, Math.max(0, (chartPoints || []).length - 1))
    const currentPoint = (chartPoints || [])[safeIndex]

    const chartModel = useMemo(() => {
        const points = chartPoints || []
        const principalSeries = points.map((p) => Number(p.principalPaid || 0))
        const interestSeries = points.map((p) => Number(p.interestPaid || 0))
        const remainingSeries = points.map((p) => Number(p.remaining || 0))
        const allValues = [...principalSeries, ...interestSeries, ...remainingSeries]
        const maxValue = Math.max(...allValues, 1)

        const width = 680
        const height = 430
        const padTop = 20
        const padRight = 12
        const padBottom = 44
        const padLeft = 90
        const graphW = width - padLeft - padRight
        const graphH = height - padTop - padBottom
        const stepX = points.length > 1 ? graphW / (points.length - 1) : graphW
        const yFromValue = (v) => padTop + graphH - (Number(v || 0) / maxValue) * graphH
        const xAt = (i) => padLeft + i * stepX

        const principalPts = principalSeries.map((v, i) => ({ x: xAt(i), y: yFromValue(v), value: v }))
        const interestPts = interestSeries.map((v, i) => ({ x: xAt(i), y: yFromValue(v), value: v }))
        const remainingPts = remainingSeries.map((v, i) => ({ x: xAt(i), y: yFromValue(v), value: v }))

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + graphH * ratio
            const value = maxValue * (1 - ratio)
            return { y, value }
        })

        return {
            width,
            height,
            padTop,
            padLeft,
            padRight,
            padBottom,
            graphW,
            graphH,
            maxValue,
            principalPts,
            interestPts,
            remainingPts,
            principalPath: buildPolylinePath(principalPts),
            interestPath: buildPolylinePath(interestPts),
            remainingPath: buildPolylinePath(remainingPts),
            gridLines,
        }
    }, [chartPoints])

    const startDate = chartPoints?.[0]?.date
    const endDate = chartPoints?.[chartPoints.length - 1]?.date

    if (!chartPoints?.length) {
        return <p className="text-[14px] text-[#6B7280]">No amortisation data available.</p>
    }

    return (
        <div>
            <div className='mb-[24px]'>
                <h3 className="text-[18px] font-[Inter-Medium] text-[#23262A] mb-[8px]">Amortisation</h3>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Track your repayment progress with a breakdown of interest and principal.
                </p>
            </div>


            <div className="grid grid-cols-[1fr_250px] gap-[24px] max-md:grid-cols-1 max-sm:h-[200px] overflow-auto rounded-[6px]">
                <div className="min-w-0 relative">
                    <svg
                        viewBox={`0 0 ${chartModel.width} ${chartModel.height}`}
                        className="h-[430px] w-full max-w-[680px]"
                        preserveAspectRatio="xMinYMin meet"
                        role="img"
                        aria-label="Amortisation chart"
                    >
                        {chartModel.gridLines.map((line) => (
                            <g key={`grid-${line.y}`}>
                                <line
                                    x1={chartModel.padLeft}
                                    y1={line.y}
                                    x2={chartModel.width - chartModel.padRight}
                                    y2={line.y}
                                    stroke="#E5E7EB"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={chartModel.padLeft - 10}
                                    y={line.y + 4}
                                    textAnchor="end"
                                    fontSize="16"
                                    fill="#666"
                                >
                                    {formatCompact(line.value)}
                                </text>
                            </g>
                        ))}

                        <path d={chartModel.principalPath} fill="none" stroke="#2F80ED" strokeWidth="3" />
                        <path d={chartModel.interestPath} fill="none" stroke="#BFD9F7" strokeWidth="3" />
                        <path d={chartModel.remainingPath} fill="none" stroke="#E07A33" strokeWidth="3" />

                        <circle
                            cx={chartModel.principalPts[safeIndex]?.x ?? chartModel.padLeft}
                            cy={chartModel.principalPts[safeIndex]?.y ?? chartModel.padTop}
                            r="5"
                            fill="#2F80ED"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                        />
                        <circle
                            cx={chartModel.interestPts[safeIndex]?.x ?? chartModel.padLeft}
                            cy={chartModel.interestPts[safeIndex]?.y ?? chartModel.padTop}
                            r="5"
                            fill="#BFD9F7"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                        />
                        <circle
                            cx={chartModel.remainingPts[safeIndex]?.x ?? chartModel.padLeft}
                            cy={chartModel.remainingPts[safeIndex]?.y ?? chartModel.padTop}
                            r="5"
                            fill="#E07A33"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                        />

                        {chartPoints.map((p, i) => {
                            const x = chartModel.principalPts[i]?.x ?? chartModel.padLeft
                            const active = i === safeIndex
                            return (
                                <g key={`hit-${p.label}-${i}`}>
                                    <line
                                        x1={x}
                                        y1={chartModel.padTop}
                                        x2={x}
                                        y2={chartModel.height - chartModel.padBottom}
                                        stroke={active ? '#D1D5DB' : 'transparent'}
                                        strokeWidth="1"
                                    />
                                    <rect
                                        x={x - 14}
                                        y={chartModel.padTop}
                                        width="28"
                                        height={chartModel.graphH}
                                        fill="transparent"
                                        onMouseEnter={() => onPointChange(i)}
                                        onClick={() => onPointChange(i)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </g>
                            )
                        })}

                        {chartPoints.map((p, i) => {
                            const showLabel =
                                i === 0 || i === chartPoints.length - 1 || i === Math.floor((chartPoints.length - 1) / 2)
                            if (!showLabel) return null
                            const x = chartModel.principalPts[i]?.x ?? chartModel.padLeft
                            const textAnchor = i === 0 ? 'start' : i === chartPoints.length - 1 ? 'end' : 'middle'
                            return (
                                <text
                                    key={`x-label-${p.label}`}
                                    x={x}
                                    y={chartModel.height - 8}
                                    textAnchor={textAnchor}
                                    fontSize="16"
                                    fill="#666"
                                >
                                    {formatMonthYear(p.date)}
                                </text>
                            )
                        })}
                    </svg>
                    <div className='absolute bottom-[36px]'>
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                            Loan period is from {formatMonthYear(startDate)} to {formatMonthYear(endDate)}
                        </p>
                    </div>
                </div>

                <div className="pt-[40px]">
                    <h4 className="mb-[18px] text-[16px] leading-[24px] font-[Inter-SemiBold] text-[#23262A]">
                        As of {formatMonthYear(currentPoint?.date)}
                    </h4>

                    <div className="space-y-[12px]">
                        <div>
                            <div className="mb-[6px] flex items-center gap-[10px] ">
                                <div className="inline-block h-[12px] w-[12px] rounded-full bg-[#2F80ED]" />
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Principal Paid</p>
                            </div>
                            <p className="text-[16px] leading-[24px] font-[Inter-SemiBold] text-[#23262A]">
                                AED {formatAED(currentPoint?.principalPaid || 0)}
                            </p>
                            <div className="mt-[16px] h-[1px] w-full bg-[#E5E7EB]" />
                        </div>

                        <div>
                            <div className="mb-[6px] flex items-center gap-[10px] ">
                                <div className="inline-block h-[12px] w-[12px] rounded-full bg-[#BFD9F7]" />
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Interest Paid</p>
                            </div>
                            <p className="text-[16px] leading-[24px] font-[Inter-SemiBold] text-[#23262A]">
                                AED {formatAED(currentPoint?.interestPaid || 0)}
                            </p>
                            <div className="mt-[16px] h-[1px] w-full bg-[#E5E7EB]" />
                        </div>

                        <div>
                            <div className="mb-[6px] flex items-center gap-[10px] ">
                                <div className="inline-block h-[12px] w-[12px] rounded-full bg-[#E07A33]" />
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Remaining</p>
                            </div>
                            <p className="text-[16px] leading-[24px] font-[Inter-SemiBold] text-[#23262A]">
                                AED {formatAED(currentPoint?.remaining || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
