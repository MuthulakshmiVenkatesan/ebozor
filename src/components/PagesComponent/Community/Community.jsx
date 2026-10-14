'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import anothercar from '../../../../public/assets/img/anothercar.png'
import communitybg from '../../../../public/assets/img/communitybg.png'
import { SearchIcon, CloseIcon } from '@/components/CustomFile/icons'
import VerifiedMain from '../GetVerified/VerifiedMain'


const Community = () => {
    const searchWrapRef = useRef(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)

    const suggestionItems = useMemo(
        () => [
            { label: 'Motors', adsCount: 1 },
            { label: 'Rental Cars', adsCount: 1 },
            { label: 'Used Cars', adsCount: 1 },
            { label: 'Motorcycles', adsCount: 1 },
            { label: 'Auto Accessories & Parts', adsCount: 1 },
        ],
        []
    )

    const filteredSuggestions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return []
        return suggestionItems.filter((s) => s.label.toLowerCase().includes(q))
    }, [searchQuery, suggestionItems])

    useEffect(() => {
        const onMouseDown = (e) => {
            if (!searchWrapRef.current) return
            if (searchWrapRef.current.contains(e.target)) return
            setShowSearchDropdown(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [])

    return (
        <>
            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    {/* Hero Banner */}
                    <div className="w-full h-[320px] rounded-[10px] overflow-visible" style={{ backgroundImage: `url(${communitybg.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
                        {/* Background layers (placeholder composition using existing assets) */}
                        <div className="relative h-full px-[18px] flex flex-col items-center justify-center gap-[8px] text-center">
                            <h2 className="w-[600px] max-sm:w-full text-center text-[30px] font-[Inter-Bold] text-[#fff]">
                                From movers to tutors, help is one click away
                            </h2>

                            <div ref={searchWrapRef} className="relative max-sm:w-full w-[600px] flex items-center justify-between bg-[#FFF] rounded-[6px] p-[10px_16px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.1)]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setShowSearchDropdown(Boolean(e.target.value.trim()))
                                    }}
                                    placeholder="Search for community"
                                    className="outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                                    onFocus={() => setShowSearchDropdown(Boolean(searchQuery.trim()))}
                                />
                                <button
                                    type="button"
                                    aria-label={showSearchDropdown ? 'Close' : 'Search'}
                                    onClick={() => setShowSearchDropdown(false)}
                                    className="cursor-pointer flex items-center justify-center"
                                >
                                    {showSearchDropdown ? (
                                        <CloseIcon className="w-[10px] h-[10px]" />
                                    ) : (
                                        <SearchIcon stroke="#8F8F8F" />
                                    )}
                                </button>

                                {showSearchDropdown ? (
                                    <div className="absolute left-0 right-0 top-[56px] bg-white rounded-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.14)] border border-[rgba(143,143,143,0.18)] overflow-hidden z-[999]">
                                        <div className="p-[12px_14px] border-b border-[rgba(143,143,143,0.18)]">
                                            <p className="text-left text-[14px] font-[Inter-Regular] text-[#000] truncate">
                                                {searchQuery.trim()}
                                            </p>
                                        </div>

                                        {filteredSuggestions.length ? (
                                            <div className="max-h-[260px] overflow-y-auto">
                                                {filteredSuggestions.map((s) => (
                                                    <button
                                                        key={s.label}
                                                        type="button"
                                                        className="w-full flex items-center justify-between gap-[12px] px-[14px] py-[12px] hover:bg-[#F5F5F5] cursor-pointer"
                                                        onClick={() => {
                                                            setSearchQuery(s.label)
                                                            setShowSearchDropdown(false)
                                                        }}
                                                    >
                                                        <h4 className="text-[14px] font-[Inter-Regular] text-[#000] truncate">{s.label}</h4>
                                                        <p className="text-[14px] font-[Inter-Regular] text-[#3A88EF] whitespace-nowrap">
                                                            {s.adsCount} Ads
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No results
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>



                    {/* Top category counters */}
                    <div className="flex items-stretch gap-[10px] overflow-x-auto whitespace-nowrap hide_scrollbar py-[18px]">
                        {[
                            { label: 'Movers & Removals', value: '26,702' },
                            { label: 'Home Maintenance', value: '5,298' },
                            { label: 'Tutors & Classes', value: '2,356' },
                            { label: 'Consultancy Services', value: '494' },
                            { label: 'Other Services', value: '439' },
                            { label: 'Freelancers', value: '141' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-center gap-[12px] flex-col flex-shrink-0 bg-white rounded-[8px] shadow-[0px_3px_5px_-1px_rgba(0,0,0,0.1),0px_5px_8px_rgba(0,0,0,0.07),0px_1px_14px_rgba(0,0,0,0.06)] min-w-[186px] p-[14px]"
                            >
                                <p className="text-[12px] font-[Inter-SemiBold] text-[rgba(0,0,0,0.6)] tracking-[0.2px] uppercase">
                                    {item.label}
                                </p>
                                <h3 className="text-[20px] font-[Inter-Medium] text-[#000] opacity-60 ">
                                    {item.value}
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* Verified Badge Banner */}
                    <div className="mb-[10px]">
                        <VerifiedMain showTickBadge={false} />
                    </div>

                    {/* Featured Listings */}
                    <div className="mb-[30px]">
                        <div className="mb-[14px]">
                            <h3 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">
                                Featured Listings
                            </h3>
                        </div>

                        <div className="grid grid-cols-5 gap-[8px] max-sm:grid-cols-2">
                            {[
                                {
                                    id: 1,
                                    image: anothercar,
                                    title: 'V8 Range Rover Sport Supercha...',
                                    location: 'Barsha Heights (Tecom)',
                                    time: '15 minutes ago',
                                },
                                {
                                    id: 2,
                                    image: anothercar,
                                    title: '2013 Range Rover Sport Top 5...',
                                    location: 'Dubai Festival City',
                                    time: '26 minutes ago',
                                },
                                {
                                    id: 3,
                                    image: anothercar,
                                    title: '2022 Chevrolet Camaro SS Nav...',
                                    location: 'Dubai Festival City',
                                    time: '26 minutes ago',
                                },
                                {
                                    id: 4,
                                    image: anothercar,
                                    title: '2021 Chevrolet Captiva GCC 7-s...',
                                    location: 'Dubai Festival City',
                                    time: '26 minutes ago',
                                },
                                {
                                    id: 5,
                                    image: anothercar,
                                    title: '2018 Lincoln MKX ALL NEW TY...',
                                    location: 'Dubai Festival City',
                                    time: '26 minutes ago',
                                },
                            ].map((card) => (
                                <div
                                    key={card.id}
                                    className="flex-shrink-0 bg-white overflow-hidden cursor-pointer hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] p-[6px] rounded-[6px] transition-all duration-300"
                                >
                                    <div className="relative w-full h-[150px] mb-[6px]">
                                        <Image src={card.image} alt={card.title} className="object-cover rounded-[6px] max-sm:h-[130px] product_card_img" />
                                    </div>

                                    <div className="">
                                        <p className="text-[14px] font-[Inter-Medium] text-[#000000] mb-[4px] truncate">
                                            {card.title}
                                        </p>
                                        <div className="flex items-center justify-between gap-[8px] mt-[6px]">
                                            <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">{card.location}</p>
                                            <p className="text-[12px] font-[Inter-Regular] text-[#666] truncate">{card.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}

export default Community