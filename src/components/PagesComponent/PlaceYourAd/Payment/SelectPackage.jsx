'use client';

import React from 'react';
import { TickIcon } from '@/components/CustomFile/icons';
import recommended from '../../../../../public/assets/img/recommended.png';

const PACKAGES = [
    {
        id: 'lite',
        name: 'Lite',
        price: 69,
        recommended: false,
        tone: 'default',
        included: ['Ad is live for 30 days', '1x Refresh that takes your ad to the top'],
        compare: null,
        buttonLabel: 'Select Lite',
        buttonVariant: 'red',
    },
    {
        id: 'basic',
        name: 'Basic',
        price: 109,
        recommended: true,
        tone: 'featured',
        included: [
            'Ad is live for 30 days',
            'Featured for 7 days',
            '2x Refresh that takes your ad to the top',
        ],
        compare: {
            title: 'Why Basic?',
            items: ['20% more views vs Lite', '20% more leads vs Lite'],
        },
        buttonLabel: 'Select Basic',
        buttonVariant: 'black',
    },
    {
        id: 'extended',
        name: 'Extended',
        price: 139,
        recommended: false,
        tone: 'default',
        included: [
            'Ad is live for 60 days',
            'Featured for 14 days',
            '4x Refresh that takes your ad to the top',
        ],
        compare: {
            title: 'Why Extended?',
            items: ['53% more views vs Basic', '33% more leads vs Basic'],
        },
        buttonLabel: 'Select Extended',
        buttonVariant: 'red',
    },
];


function PackageCheck({ tone }) {
    const isPink = tone === 'featured';
    return (
        <div
            className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full ${isPink ? 'bg-[#ffcccc]' : 'bg-[#23262a4d]'
                }`}
            aria-hidden
        >
            <TickIcon className='w-[18px] h-[18px]' />
        </div>
    );
}

function FeatureList({ items, tone }) {
    return (
        <ul className="flex flex-col gap-[12px]">
            {items.map((text) => (
                <li key={text} className="flex items-start gap-[10px]">
                    <PackageCheck tone={tone} />
                    <p className="text-left text-[14px] font-[Inter-Regular] leading-snug text-[#23262A] ">
                        {text}
                    </p>
                </li>
            ))}
        </ul>
    );
}

/**
 * Classified “Lite / Basic / Extended” package picker (marketing layout).
 *
 * @param {{ (packageId: string): void }} [onSelectPackage]
 * @param {string} [className] — inner content wrapper
 * @param {string} [shellClassName] — outer shell (e.g. `!px-0 !py-0` when parent already pads)
 */
export default function SelectPackage({ onSelectPackage, className = '', shellClassName = '' }) {
    return (
        <div className={`mx-auto w-full max-w-[1170px] px-[16px] py-[28px] sm:py-[36px] ${shellClassName}`.trim()}>
            <div className={`w-full ${className}`.trim()}>
                <h2 className="mb-[20px] text-center text-[22px] font-[Inter-Bold] leading-tight text-[#000000]">
                    Select a package that works for you
                </h2>

                <div className="mx-auto flex max-w-[1100px] flex-col gap-[20px] lg:flex-row lg:items-stretch lg:justify-center lg:gap-[24px]">
                    {PACKAGES.map((pkg) => {
                        const isFeatured = pkg.tone === 'featured';
                        return (
                            <div
                                key={pkg.id}
                                className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#e0e0e0] p-[16px] lg:max-w-[340px] ${isFeatured ? 'border-[#ffcdd2]' : 'border-[rgba(143,143,143,0.28)] bg-white'
                                    }`}
                                style={
                                    isFeatured
                                        ? {
                                            backgroundImage: `linear-gradient(2.46deg, rgba(255,255,255,0.6) 39.06%, rgba(255,204,204,0.3) 90%), url(${recommended.src})`,
                                            backgroundSize: '100% 100%, auto',
                                            backgroundPosition: '0 0, 120px -100px',
                                            backgroundRepeat: 'no-repeat, no-repeat',
                                        }
                                        : {
                                            backgroundImage: `url(${recommended.src})`,
                                            backgroundSize: '100%',
                                            backgroundPositionY: '-100px',
                                            backgroundPositionX: '120px',
                                            backgroundRepeat: 'no-repeat',
                                        }
                                }
                            >

                                {pkg.recommended ? (
                                    <span className="absolute right-[16px] top-[16px] z-[1] rounded-full bg-[#000000] px-[10px] py-[6px] text-[10px] font-[Inter-Bold] uppercase tracking-[0.06em] text-white sm:text-[10px]">
                                        Recommended
                                    </span>
                                ) : null}

                                <div className="">
                                    <div className='border-b border-[rgba(143,143,143,0.28)] pb-[20px] mb-[20px]'>
                                        <h3 className="mb-[20px] text-[20px] font-[Inter-Bold] text-[#000000] ">{pkg.name}</h3>
                                        <p className="text-[28px] font-[Inter-Bold] leading-none text-[#000000] ">
                                            AED <span className="text-[34px]">{pkg.price}</span>
                                        </p>
                                    </div>


                                    <div className='mb-[20px]'>
                                        <p className="mb-[14px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                            What&apos;s included
                                        </p>
                                        <FeatureList items={pkg.included} tone={pkg.tone} />
                                    </div>

                                    {pkg.compare ? (
                                        <div className='mb-[20px]'>
                                            <p className="mb-[14px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                                {pkg.compare.title}
                                            </p>
                                            <FeatureList items={pkg.compare.items} tone={pkg.tone} />
                                        </div>
                                    ) : null}

                                    <div className="mt-auto flex flex-1 flex-col justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onSelectPackage?.(pkg.id)}
                                            className={`w-full cursor-pointer rounded-[8px] py-[12px] text-[14px] font-[Inter-SemiBold] transition-opacity hover:opacity-95 ${pkg.buttonVariant === 'black'
                                                ? 'bg-[#000000] text-white'
                                                : 'bg-[#DC0000] text-white'
                                                }`}
                                        >
                                            {pkg.buttonLabel}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p className="mx-auto mt-[24px] max-w-[640px] text-center text-[12px] font-[Inter-Regular] text-[#6B7280]">
                    *5% VAT will be charged in addition to the prices mentioned
                </p>
            </div>
        </div>
    );
}
