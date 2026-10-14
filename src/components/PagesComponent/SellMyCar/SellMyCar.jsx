'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { PaginationPrevIcon, PaginationNextIcon, StarIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import Header from './components/Header'
import Footer from './components/Footer'
import effort1 from '../../../../public/assets/img/sellcar/effort1.jpg'
import effort2 from '../../../../public/assets/img/sellcar/effort2.jpg'
import effort3 from '../../../../public/assets/img/sellcar/effort3.jpg'
import multiplecar from '../../../../public/assets/img/sellcar/multiplecar.png'
import greenrating from '../../../../public/assets/img/icons/greenrating.svg'
import reviewquote from '../../../../public/assets/img/icons/reviewquote.svg'
import sellcarbanner from '../../../../public/assets/img/sellcar/sellcarbanner.png'
import sellcarbg from '../../../../public/assets/img/sellcar/sellcarbg.jpg'

const sellMyCarTestimonials = [
    {
        name: 'Momin Mehmood',
        date: 'July 30, 2024',
        text: 'I recently bought a new car and requested an inspection before finalizing the purchase. Amjad conducted the inspection, and I was happier with the experience. The report was thorough and helped me make a confident decision.',
    },
    {
        name: 'Sarah Al Mansoori',
        date: 'March 12, 2024',
        text: 'Selling through ebozor was straightforward. The team kept me updated at every step and the offer matched what we discussed after inspection.',
    },
    {
        name: 'James Porter',
        date: 'January 8, 2024',
        text: 'Professional service from listing to handover. I would recommend ebozor Cars to anyone who wants a hassle-free sale.',
    },
]

const whySellStats = [
    { stat: '40,000', label: 'Cars listed every month' },
    { stat: '600,000', label: 'Buyers search for cars every month' },
    { stat: '15 Million', label: 'Ad views every month' },
    { stat: '2-4 Weeks', label: 'Time within which most users sell their cars' },
]

const sellMyCarHowToSellUaeAnswer = (
    <div className="text-[14px] font-[Inter-Regular] leading-[26px] text-[#23262A]">
        <ol className="ml-[0.35rem] list-decimal space-y-[14px] pl-[14px]">
            <li>
                <span className="font-[Inter-Bold]">Set your price:</span>{' '}
                Research similar cars on ebozor Cars to understand market rates. Set a price that reflects your
                car&apos;s condition and mileage, and leave a little room for negotiation.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Choose how to sell with ebozor Cars:</span>
                <ul className="mt-[8px] list-[circle] space-y-[8px] pl-[22px]">
                    <li>
                        <span className="font-[Inter-Bold]">Post an ad:</span> Create a detailed ad to attract the right
                        buyers.
                    </li>
                    <li>
                        <span className="font-[Inter-Bold]">Let ebozor Cars sell it for you:</span> Skip the effort—ebozor
                        Cars will handle the entire selling process, from advertising to buyer negotiations.
                    </li>
                    <li>
                        <span className="font-[Inter-Bold]">Sell your car to ebozor Cars:</span> Need a quick sale? ebozor
                        Cars can provide a fast offer after inspection.
                    </li>
                </ul>
            </li>
            <li>
                <span className="font-[Inter-Bold]">Advertise without stickers:</span>{' '}
                In the UAE, using &apos;For Sale&apos; stickers on vehicles is prohibited and could lead to fines or
                impoundment. Stick to legal and effective methods by advertising through ebozor Cars&apos; trusted
                platform.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Negotiate smartly:</span>{' '}
                Take your time and negotiate confidently. Highlight your car&apos;s key features, and justify your asking
                price. Buyers often look for value and transparency, so patience is key.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Prepare your documents:</span>
                <ul className="mt-[8px] list-[circle] space-y-[8px] pl-[22px]">
                    <li>Your original Emirates ID or a copy of your passport if ID is unavailable.</li>
                    <li>Clear all outstanding fines and mortgage payments.</li>
                </ul>
            </li>
            <li>
                <span className="font-[Inter-Bold]">Meet the buyer at a vehicle registration centre:</span>{' '}
                Complete the sale by transferring ownership at a registration centre, where the car will be tested and
                officially transferred to the buyer.
            </li>
        </ol>
    </div>
)

const sellMyCarFaqItems = [
    {
        question: 'How to sell a car in the UAE?',
        answer: sellMyCarHowToSellUaeAnswer,
    },
    {
        question: 'How can I sell my car for a good price?',
        answer:
            'Compare your car with similar listings on ebozor Cars, keep service history and condition documentation ready, use clear photos, and price slightly above your minimum so you have room to negotiate. Highlight genuine extras and a clean RTA history when speaking with buyers.',
    },
    {
        question: 'Where can I sell my used car in the UAE?',
        answer:
            'You can sell through licensed online marketplaces such as ebozor Cars, work with dealers or car-buying services, or use consignment and inspection-led sale options. Always complete ownership transfer at an official RTA registration centre.',
    },
    {
        question: 'Can I sell a car with an outstanding auto loan in the UAE?',
        answer:
            'Yes, but the bank&apos;s mortgage on the vehicle must be released before ownership can transfer to the buyer. This usually means settling the loan or the buyer&apos;s bank coordinating a settlement letter. Contact your bank early to understand payoff, clearance timelines, and any early-settlement fees.',
    },
    {
        question: 'How can I sell my car online?',
        answer:
            'Create a detailed listing with accurate mileage and specs, upload quality photos, respond promptly to enquiries, agree on price and payment method, then meet at an RTA centre to transfer ownership. ebozor Cars offers listing, managed sale, and instant-cash routes depending on how quickly you want to sell.',
    },
    {
        question: 'How to get the power of attorney to sell a car?',
        answer:
            'Visit an authorised typing centre or notary public with your Emirates ID, vehicle registration (Mulkiya), and the representative&apos;s ID. A vehicle sale POA allows someone else to complete RTA procedures on your behalf; requirements and fees can vary slightly by emirate, so confirm the latest checklist before your visit.',
    },
    {
        question: 'How long will it take to sell my car on ebozor Cars?',
        answer:
            'Timing depends on make, model, mileage, price, and demand. Many sellers find a buyer within a few weeks when the car is priced competitively. If you need a faster exit, explore instant cash or dealer-offer options after inspection.',
    },
]

const SellMyCar = () => {
    const [testimonialIndex, setTestimonialIndex] = useState(0)
    const [openSellFaq, setOpenSellFaq] = useState(null)
    const maxTestimonialIndex = sellMyCarTestimonials.length - 1
    const activeTestimonial = sellMyCarTestimonials[testimonialIndex]

    return (
        <div>
            <Header />
            <div className="bg-[#fff] pb-[80px]">
                <div className="mx-auto max-w-[1170px] px-[15px] common_container">
                    <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[20px] items-center rounded-[8px] p-[60px] max-sm:p-[20px]" style={{ backgroundImage: `url(${sellcarbg.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="flex flex-col gap-[24px]">
                            <h4 className="text-[40px] leading-[50px] font-[Inter-Medium] text-[#fff] max-sm:text-[24px] max-sm:leading-[30px]">Sell your car with ebozor anywhere in the UAE the Easy Way!</h4>
                            <p className="text-[18px] leading-[28px] font-[Inter-Regular] text-[#fff] max-sm:text-[14px] max-sm:leading-[20px]">
                                ebozor Cars offers a wide range of car services that simplify the car buying and selling experience for everyone.                            </p>
                            <button className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] bg-[#fff] p-[10px_20px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] transition">
                                Explore Services
                            </button>
                        </div>
                        <div>
                            <Image src={sellcarbanner} alt="Sell your car with ebozor anywhere in the UAE the Easy Way!" width={1000} height={1000} className="h-full w-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-[#d9d9d980] p-[80px_0]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className="mb-[40px]">
                        <h2 className="text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222222]">Three Convenient Ways for Effortless Car Selling</h2>
                    </div>
                    <div className="flex flex-col gap-[60px]">
                        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]">
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Let ebozor sell your car
                                </h2>
                                <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                    Our team of experts will handle everything, from posting your ad to
                                    negotiating with buyers and completing paperwork. With our data-driven
                                    pricing and deep market knowledge, we&apos;ll secure the highest possible
                                    price for your car.
                                </p>
                                <button
                                    type="button"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    Sell It For Me
                                </button>
                            </div>

                            <div className="overflow-hidden">
                                <Image
                                    src={effort1}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]">
                            <div className="overflow-hidden">
                                <Image
                                    src={effort2}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Get Instant Cash for Your Car
                                </h2>
                                <div className="flex flex-col gap-[10px]">
                                    <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                        Skip the wait. Book your inspection with ebozor Cars and get instant cash offers from trusted dealers, right from our branch or your doorstep.
                                    </p>
                                    <p>
                                        No listings. No hassle. Just a smooth inspection, the best offers, and fast payment within 48 hours.
                                    </p>
                                </div>
                                <p className="text-[12px] font-[Inter-Regular] text-[#222] italic">*Available for eligible cars in Abu Dhabi, Dubai, and Sharjah only.</p>
                                <button
                                    type="button"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    Get Instant Cash
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]">
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Place an Ad on ebozor Cars
                                </h2>
                                <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                    Sell your car quickly by advertising your car on the largest car marketplace in the UAE and reach thousands of buyers.
                                </p>
                                <button
                                    type="button"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    List your car on ebozor
                                </button>
                            </div>

                            <div className="overflow-hidden">
                                <Image
                                    src={effort3}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className='bg-[#fff] p-[80px_0]'>
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className='grid grid-cols-2 max-sm:grid-cols-1 gap-[20px] items-center bg-[#F5F9FE] rounded-[6px] p-[40px_80px] max-sm:p-[20px]'>
                        <div className="flex flex-col gap-[14px]">
                            <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                Selling Multiple Cars?
                            </h2>
                            <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                Let your car buying and selling business grow with ebozor Cars. Sign up and enjoy the exclusive perks that offer more value and control.                                </p>
                            <button
                                type="button"
                                className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                            >
                                Learn more
                            </button>
                        </div>
                        <div className="overflow-hidden">
                            <Image
                                src={multiplecar}
                                alt="Sell my car promotion"
                                width={900}
                                height={520}
                                className="h-full w-full object-cover rounded-[8px]"
                                priority
                            />
                        </div>
                    </div>
                    <div className="bg-[#fff] py-[80px]">
                        <div className="mb-[40px]">
                            <h2 className="mb-[14px] text-[32px] leading-[1.25] font-[Inter-Medium] text-[#222222] max-sm:text-[24px]">
                                Why Sell Your Car with ebozor Cars?
                            </h2>
                            <p className="text-[14px] leading-[1.7] font-[Inter-Regular] text-[#222]">
                                With ebozor Cars, finding the right buyer for your car is easier than ever. Get instant exposure to a vast community of car buyers who trust ebozor Cars as their go-to platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-4 max-sm:grid-cols-1 gap-[40px]">
                            {whySellStats.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-col gap-[14px] items-center justify-center rounded-[8px] bg-white p-[28px] text-center shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)]"
                                >
                                    <h4 className="text-[22px] leading-tight font-[Inter-Bold] text-[#222222] ">
                                        {item.stat}
                                    </h4>
                                    <p className="text-[14px] leading-[1.5] font-[Inter-Regular] text-[#222]">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#fff] py-[80px]">
                        <div className="mb-[40px] text-center">
                            <h2 className="mb-[12px] text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222]">
                                Join our happy customers
                            </h2>
                            <p className="text-[14px] font-[Inter-Regular] text-[#222]">
                                Google rating score: 3.9 of 5, based on 466 reviews
                            </p>
                        </div>

                        <div className="relative mx-auto flex max-w-[920px] items-center justify-center gap-[8px] max-sm:flex-col max-sm:gap-[16px]">
                            <button
                                type="button"
                                aria-label="Previous testimonial"
                                onClick={() => setTestimonialIndex((i) => Math.max(0, i - 1))}
                                disabled={testimonialIndex === 0}
                                className="z-[2] flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-35 max-sm:order-2 max-sm:absolute max-sm:left-0 max-sm:top-[36%]"
                            >
                                <PaginationPrevIcon className="h-[22px] w-[22px] rtl:rotate-180" stroke="currentColor" />
                            </button>

                            <div className="relative min-w-0 flex-1 px-[4px] max-sm:order-1 max-sm:w-full">
                                <div className="absolute left-[-70px] top-[-60px]">
                                    <Image src={reviewquote} alt="Review quote" width={100} height={100} className="h-[100px] w-[100px]" />
                                </div>
                                <div className="relative z-[1] mx-auto rounded-[4px] bg-white p-[20px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] border border-[#f4f4f4]">
                                    <p className="mb-[20px] text-left text-[14px] leading-[1.75] font-[Inter-Regular] text-[#000000] h-[100px] max-sm:h-[100%]">
                                        {activeTestimonial.text}
                                    </p>
                                    <div className="mb-[10px] flex gap-[4px]">
                                        {Array.from({ length: 5 }).map((_, idx) => (
                                            <Image src={greenrating} alt="Green rating" width={18} height={18} className="h-[18px] w-[18px]" />
                                        ))}
                                    </div>
                                    <h4 className="mb-[2px] text-[14px] font-[Inter-Bold] text-[#000000]">{activeTestimonial.name}</h4>
                                    <p className="text-[12px] font-[Inter-Regular] text-[#000] opacity-50">{activeTestimonial.date}</p>
                                </div>
                                <div className="absolute right-[-70px] bottom-[-60px] rotate-180">
                                    <Image src={reviewquote} alt="Review quote" width={100} height={100} className="h-[100px] w-[100px]" />
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Next testimonial"
                                onClick={() => setTestimonialIndex((i) => Math.min(maxTestimonialIndex, i + 1))}
                                disabled={testimonialIndex === maxTestimonialIndex}
                                className="z-[2] flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-35 max-sm:order-3 max-sm:absolute max-sm:right-0 max-sm:top-[36%]"
                            >
                                <PaginationNextIcon className="h-[22px] w-[22px] rtl:rotate-180" stroke="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>



            <div className="bg-[#F5F9FE] py-[80px]">
                <div className="mx-auto max-w-[850px] px-[15px] common_container">
                    <h2 className="mb-[24px] text-left text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222]">
                        Frequently Asked Questions
                    </h2>
                    <div className="flex flex-col gap-[14px]">
                        {sellMyCarFaqItems.map((item, index) => {
                            const isOpen = openSellFaq === index
                            return (
                                <div
                                    key={item.question}
                                    className="overflow-hidden rounded-[8px] bg-white p-[16px_32px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenSellFaq((prev) => (prev === index ? null : index))}
                                        className="flex w-full cursor-pointer items-center justify-between gap-[14px] text-left cursor-pointer"
                                        aria-expanded={isOpen}
                                    >
                                        <h4 className="text-[18px] font-[Inter-Regular] leading-[24px] text-[#000000]">
                                            {item.question}
                                        </h4>
                                        <div
                                            className={`inline-flex shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                            aria-hidden
                                        >
                                            <DownArrowIcon className="h-[24px] w-[24px]" stroke="#000000" />
                                        </div>
                                    </button>
                                    {isOpen ? (
                                        <div className="mt-[20px] ml-[20px]">
                                            {typeof item.answer === 'string' ? (
                                                <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] leading-[26px] text-[#23262A]">
                                                    {item.answer}
                                                </p>
                                            ) : (
                                                item.answer
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default SellMyCar
