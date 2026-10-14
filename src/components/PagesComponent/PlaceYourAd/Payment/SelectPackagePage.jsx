'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PaymentCardModal from './PaymentCardModal';

const PAGE_BG_STYLE = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,250,255,0.9) 45%, rgba(255,248,248,0.35) 100%)',
};

const FEATURE_OPTIONS = [
    {
        id: '7d',
        title: 'Feature your car for 7 days',
        addonAed: 40,
        includedSummary: 'Ad is live for 30 days, 2x Refresh that takes your ad to the top.',
    },
    {
        id: '14d',
        title: 'Feature your car for 14 days',
        addonAed: 70,
        includedSummary: 'Ad is live for 60 days, 4x Refresh that takes your ad to the top.',
    },
];

/** Shown after “Select Basic” — yellow Premium box, two durations (design ref). */
const PREMIUM_BASIC_OPTIONS = [
    {
        id: 'pb7',
        title: 'Premium Ad for 7 days',
        addonAed: 60,
        bullets: ['Ad is live for 30 days', '2x Refresh that takes your ad to the top'],
    },
    {
        id: 'pb14',
        title: 'Premium Ad for 14 days',
        addonAed: 100,
        bullets: ['Ad is live for 60 days', '4x Refresh that takes your ad to the top'],
    },
];

/** Shown after “Select Extended” — yellow Premium box, single 14-day option (design ref). */
const PREMIUM_EXTENDED_OPTIONS = [
    {
        id: 'pe14',
        title: 'Premium Ad for 14 days',
        addonAed: 70,
        bullets: ['Ad is live for 60 days', '4x Refresh that takes your ad to the top'],
    },
];

const BADGE_OPTIONS = [
    { id: 'no-accidents', label: 'No Accidents', priceAed: 30 },
    { id: 'service-history', label: 'Service History', priceAed: 30 },
    { id: 'in-warranty', label: 'In Warranty', priceAed: 30 },
    { id: 'first-owner', label: 'First Owner', priceAed: 30 },
];

/** Lite row in order summary (struck when user upgraded to Basic / Extended). */
const LITE_TIER_PRICE_AED = 69;

function formatMoney(n) {
    const v = Number(n);
    if (Number.isNaN(v)) return '0.00';
    return v.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Secure checkout: listing preview, featured upgrade, optional badges, order summary + pay.
 *
 * @param {{
 *   basePackage?: { name: string; priceAed: number };
 *   listing?: { imageSrc: string; imageAlt?: string; priceLabel: string; breadcrumb: string; description: string; specsLine: string };
 *   onPay?: (payload: { subtotal: number; vat: number; total: number; featureId: string | null; premiumId: string | null; badgeIds: string[]; discountCode: string | null; cardDetails?: { nameOnCard: string; cardNumber: string; expiryDate: string; cvv: string; saveCard: boolean } }) => void;
 *   onEditPackage?: () => void;
 * }} [props]
 */
export default function SelectPackagePage({
    basePackage = { name: 'Lite', priceAed: 69 },
    listing = {
        imageSrc: '/assets/img/classified/1.png',
        imageAlt: 'Listing',
        priceLabel: 'AED 11,111',
        breadcrumb: 'Acura',
        description: 'hi',
        specsLine: '2027',
    },
    onPay,
    onEditPackage,
}) {
    const [featureId, setFeatureId] = useState(null);
    /** Premium add-on when checkout tier is Basic or Extended (separate from Lite “Featured”). */
    const [premiumId, setPremiumId] = useState(null);
    const [badgeIds, setBadgeIds] = useState(() => new Set());
    const [discountCode, setDiscountCode] = useState('');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const toggleBadge = (id) => {
        setBadgeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const badgeCount = badgeIds.size;
    const badgeUnitAed = BADGE_OPTIONS[0]?.priceAed ?? 30;
    const badgesTotalAed = badgeCount * badgeUnitAed;

    const pkgName = String(basePackage?.name ?? 'Lite').trim();
    const pkgNameLower = pkgName.toLowerCase();
    const pkgPriceRaw = Number(basePackage?.priceAed);
    const pkgPriceAed = Number.isFinite(pkgPriceRaw) ? pkgPriceRaw : LITE_TIER_PRICE_AED;
    const isLitePackage =
        pkgNameLower === 'lite' && Math.abs(pkgPriceAed - LITE_TIER_PRICE_AED) < 0.005;
    const isBasicTier = pkgNameLower === 'basic';
    const isExtendedTier = pkgNameLower === 'extended';

    useEffect(() => {
        setFeatureId(null);
        setPremiumId(null);
        setPaymentModalOpen(false);
    }, [pkgNameLower]);

    const { subtotal, vat, total } = useMemo(() => {
        let sub = Number(basePackage?.priceAed);
        if (!Number.isFinite(sub)) sub = 0;
        if (isLitePackage) {
            const feat = FEATURE_OPTIONS.find((f) => f.id === featureId);
            if (feat) sub += feat.addonAed;
        } else if (isBasicTier) {
            const pr = PREMIUM_BASIC_OPTIONS.find((p) => p.id === premiumId);
            if (pr) sub += pr.addonAed;
        } else if (isExtendedTier) {
            const pr = PREMIUM_EXTENDED_OPTIONS.find((p) => p.id === premiumId);
            if (pr) sub += pr.addonAed;
        }
        BADGE_OPTIONS.forEach((b) => {
            if (badgeIds.has(b.id)) sub += b.priceAed;
        });
        const vatVal = Math.round(sub * 0.05 * 100) / 100;
        const totalVal = Math.round((sub + vatVal) * 100) / 100;
        return { subtotal: sub, vat: vatVal, total: totalVal };
    }, [basePackage?.priceAed, featureId, premiumId, badgeIds, isLitePackage, isBasicTier, isExtendedTier]);

    const boostAddon = useMemo(() => {
        if (isLitePackage) return FEATURE_OPTIONS.find((f) => f.id === featureId) ?? null;
        if (isBasicTier) return PREMIUM_BASIC_OPTIONS.find((p) => p.id === premiumId) ?? null;
        if (isExtendedTier) return PREMIUM_EXTENDED_OPTIONS.find((p) => p.id === premiumId) ?? null;
        return null;
    }, [isLitePackage, isBasicTier, isExtendedTier, featureId, premiumId]);

    const buildCheckoutPayload = (cardDetails = null) => ({
        subtotal,
        vat,
        total,
        featureId: isLitePackage ? featureId : null,
        premiumId: isLitePackage ? null : premiumId,
        badgeIds: Array.from(badgeIds),
        discountCode: discountCode.trim() || null,
        ...(cardDetails ? { cardDetails } : {}),
    });

    const handleCardModalPay = (cardDetails) => {
        onPay?.(buildCheckoutPayload(cardDetails));
        setPaymentModalOpen(false);
    };

    return (
        <div className="mx-auto flex max-sm:w-full w-[980px] gap-[24px] py-[36px] max-sm:p-[20px_15px]  max-sm:flex-col">
            <div className='w-full'>
                <h1 className="mb-[50px] text-center text-[18px] font-[Inter-Bold] leading-tight text-[#000000] ">
                    Secure Checkout
                </h1>

                <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-[1fr_380px] lg:gap-[60px]">
                    <div className="">
                        {/* Listing preview */}
                        <div className='border-b border-[rgba(143,143,143,0.35)] pb-[14px] mb-[18px]'>
                            <div className="flex-1 rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[16px] flex items-center gap-[16px]">
                                <div className="relative h-[115px] w-[115px] shrink-0 overflow-hidden rounded-[6px] ">
                                    <Image
                                        src={listing.imageSrc}
                                        alt={listing.imageAlt || 'Listing'}
                                        fill
                                        className="object-cover"
                                        sizes="115px"
                                        unoptimized={
                                            typeof listing.imageSrc === 'string' &&
                                            listing.imageSrc.startsWith('blob:')
                                        }
                                    />
                                </div>
                                <div className="min-w-0 flex-1 flex flex-col gap-[8px]">
                                    <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{listing.priceLabel}</h4>
                                    <div className="flex items-center gap-[12px] flex-wrap">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] after:content-['•'] last:after:content-none after:relative after:right-[-5px]">
                                            {listing.breadcrumb}
                                        </p>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] after:content-['•'] last:after:content-none after:relative after:right-[-5px]">
                                            {listing.breadcrumb}
                                        </p>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] after:content-['•'] last:after:content-none after:relative after:right-[-5px]">
                                            {listing.breadcrumb}
                                        </p>
                                    </div>
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A] truncate">
                                        {listing.description}
                                    </p>
                                    <div className='flex items-center gap-[8px] divide-x divide-[#8f8f8f] flex-wrap'>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] pr-[8px]">{listing.specsLine}</p>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] pr-[8px]">{listing.specsLine}</p>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] pr-[8px]">{listing.specsLine}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-[46px]">
                            <h2 className="mb-[14px] text-[18px] font-[Inter-Bold] text-[#23262A]">Get More Views</h2>

                            {isLitePackage ? (
                                /* Lite → “Select Lite” checkout: Featured (blue) */
                                <div
                                    className="rounded-[6px] border border-[#3a88ef] bg-[linear-gradient(74.42deg,rgba(230,241,255,0.1)_16.95%,rgba(46,142,255,0.1)_98.79%),linear-gradient(0deg,rgb(255,255,255),rgb(255,255,255))] p-[16px]"
                                >
                                    <div className="mb-[4px] flex flex-wrap items-start justify-between gap-[10px]">
                                        <h3 className="text-[20px] font-[Inter-Medium] leading-snug text-[#23262A]">
                                            Upgrade your Ad with Featured Ad!
                                        </h3>
                                        <span className="shrink-0 rounded-[4px] bg-[linear-gradient(94.47deg,rgb(103,167,242)_2.35%,rgb(37,128,235)_95.78%)] px-[8px] py-[4px] text-[10px] font-[Inter-Bold] uppercase tracking-wide text-white">
                                            Featured
                                        </span>
                                    </div>
                                    <p className="mb-[10px] text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
                                        Get up to 4x more views! Featured ads appear above the standard Ads.
                                    </p>
                                    <div className="flex flex-col gap-[12px]">
                                        {FEATURE_OPTIONS.map((opt) => {
                                            const checked = featureId === opt.id;
                                            return (
                                                <label
                                                    key={opt.id}
                                                    className={`flex cursor-pointer flex-col gap-[8px] rounded-[6px] border bg-white p-[16px] transition-colors ${
                                                        checked
                                                            ? 'border-[#DC0000] ring-1 ring-[#DC0000]/15'
                                                            : 'border-[rgba(143,143,143,0.35)]'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-[12px]">
                                                        <div className="relative mt-[4px] flex h-[16px] w-[16px] shrink-0 cursor-pointer items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                name="featured-duration"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setFeatureId((prev) => (prev === opt.id ? null : opt.id))
                                                                }
                                                                className="h-[12px] w-[12px] cursor-pointer appearance-none rounded-full border-2 border-[rgba(143,143,143,0.5)] checked:border-[#DC0000] checked:bg-white"
                                                            />
                                                            {checked ? (
                                                                <span className="pointer-events-none absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC0000]" />
                                                            ) : null}
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 items-start justify-between">
                                                            <div className="flex w-[300px] max-w-full flex-col gap-[2px]">
                                                                <h4 className="text-[14px] font-[Inter-Bold] text-[#23262A]">{opt.title}</h4>
                                                                <h5 className="text-[14px] font-[Inter-Bold] text-[#23262A]">Included:</h5>
                                                                <p className="text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
                                                                    {opt.includedSummary}
                                                                </p>
                                                            </div>
                                                            <p className="shrink-0 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                                + AED {opt.addonAed}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : isBasicTier || isExtendedTier ? (
                                /* Basic / Extended → “Select Basic” / “Select Extended”: Premium (yellow) */
                                <div
                                    className="rounded-[6px] border border-[#f5d684] p-[16px] bg-[linear-gradient(74.42deg,rgba(255,247,226,0.2)_16.95%,rgba(243,176,0,0.2)_98.79%),linear-gradient(0deg,rgb(255,255,255),rgb(255,255,255))]"
                                  
                                >
                                    <div className="mb-[4px] flex flex-wrap items-start justify-between gap-[10px]">
                                        <h3 className="text-[20px] font-[Inter-Medium] leading-snug text-[#23262A]">
                                            Take the top spot with a Premium Ad!
                                        </h3>
                                        <span className="shrink-0 rounded-[4px] bg-[linear-gradient(94.47deg,rgb(255,189,61)_2.35%,rgb(241,162,7)_95.78%)] px-[8px] py-[4px] text-[9px] font-[Inter-Bold] uppercase tracking-wide text-white sm:text-[10px]">
                                            Premium
                                        </span>
                                    </div>
                                    <p className="mb-[10px] text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
                                        Get up to 8x more views! Premium Ads appear above all Ads.
                                    </p>
                                    <div className="flex flex-col gap-[12px]">
                                        {(isBasicTier ? PREMIUM_BASIC_OPTIONS : PREMIUM_EXTENDED_OPTIONS).map((opt) => {
                                            const checked = premiumId === opt.id;
                                            return (
                                                <label
                                                    key={opt.id}
                                                    className={`flex cursor-pointer flex-col gap-[8px] rounded-[6px] border bg-white p-[16px] transition-colors ${
                                                        checked
                                                            ? 'border-[#DC0000] ring-1 ring-[#DC0000]/15'
                                                            : 'border-[rgba(143,143,143,0.35)]'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-[12px]">
                                                        <div className="relative mt-[4px] flex h-[16px] w-[16px] shrink-0 cursor-pointer items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                name="premium-duration"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setPremiumId((prev) => (prev === opt.id ? null : opt.id))
                                                                }
                                                                className="h-[12px] w-[12px] cursor-pointer appearance-none rounded-full border-2 border-[rgba(143,143,143,0.5)] checked:border-[#DC0000] checked:bg-white"
                                                            />
                                                            {checked ? (
                                                                <span className="pointer-events-none absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC0000]" />
                                                            ) : null}
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 items-start justify-between gap-[12px]">
                                                            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                                                                <h4 className="text-[14px] font-[Inter-Bold] text-[#23262A]">{opt.title}</h4>
                                                                <h5 className="text-[14px] font-[Inter-Bold] text-[#23262A]">Included:</h5>
                                                                <ul className="list-none space-y-[4px] pl-0">
                                                                    {opt.bullets.map((line) => (
                                                                        <li
                                                                            key={line}
                                                                            className="text-[14px] font-[Inter-Regular] leading-snug text-[#23262A]"
                                                                        >
                                                                            {line}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <p className="shrink-0 text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                                + AED {opt.addonAed}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Optional badges */}
                        <div>
                            <h2 className="mb-[4px] text-[18px] font-[Inter-Bold] text-[#3b4245]">
                                Make your ad stand out with unique badges
                            </h2>
                            <p className="mb-[26px] text-[14px] font-[Inter-Regular] text-[#6B7280]">
                                You can select multiple badges (Optional)
                            </p>
                            <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                                {BADGE_OPTIONS.map((b) => {
                                    const on = badgeIds.has(b.id);
                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => toggleBadge(b.id)}
                                            className={`cursor-pointer flex w-full items-center justify-between rounded-[6px] border-[2px] p-[12px_8px] text-left transition-colors ${on ? 'border-[#DC0000]' : 'border-[#e5e5e5] bg-white'
                                                }`}
                                        >
                                            <h4 className="text-[14px] font-[Inter-Medium] text-[#23262A]">{b.label}</h4>
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#DC0000]">+ {b.priceAed} AED</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="w-full shrink-0 lg:max-w-[380px]">
                        <h2 className="mb-[12px] text-[20px] font-[Inter-Bold] text-[#000000]">Order Summary</h2>
                        <div className="rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[16px_24px_32px]">
                            <div className="mb-[14px]">
                                {!isLitePackage ? (
                                    <>
                                        <div className="flex items-center justify-between gap-[8px]">
                                            <div className="flex items-center gap-[8px]">
                                                <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A] line-through decoration-[#9CA3AF]">
                                                    Lite
                                                </h4>
                                                {onEditPackage ? (
                                                    <button
                                                        type="button"
                                                        onClick={onEditPackage}
                                                        className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                                    >
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href="/placeyourad"
                                                        className="text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                            </div>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] line-through decoration-[#9CA3AF]">
                                                AED {formatMoney(LITE_TIER_PRICE_AED)}
                                            </p>
                                        </div>
                                        <div className="mt-[16px] flex items-center justify-between gap-[8px]">
                                            <h4
                                                className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${
                                                    premiumId ? 'line-through decoration-[#9CA3AF]' : ''
                                                }`}
                                            >
                                                {pkgName}
                                            </h4>
                                            <p
                                                className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${
                                                    premiumId ? 'line-through decoration-[#9CA3AF]' : ''
                                                }`}
                                            >
                                                AED {formatMoney(pkgPriceAed)}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between gap-[8px]">
                                        <div className="flex items-center gap-[8px]">
                                            <h4
                                                className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${
                                                    featureId
                                                        ? 'line-through decoration-[#9CA3AF]'
                                                        : ''
                                                }`}
                                            >
                                                {pkgName}
                                            </h4>
                                            {onEditPackage ? (
                                                <button
                                                    type="button"
                                                    onClick={onEditPackage}
                                                    className="text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <Link
                                                    href="/placeyourad"
                                                    className="text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                        <p
                                            className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${
                                                featureId ? 'line-through decoration-[#9CA3AF]' : ''
                                            }`}
                                        >
                                            AED {formatMoney(pkgPriceAed)}
                                        </p>
                                    </div>
                                )}

                                {boostAddon ? (
                                    <div className="mt-[4px] flex items-center justify-between gap-[8px]">
                                        <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            {isLitePackage ? 'Featured' : 'Premium'}
                                        </h4>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            + AED {formatMoney(boostAddon.addonAed)}
                                        </p>
                                    </div>
                                ) : null}

                                {badgeCount > 0 ? (
                                    <div className="mt-[10px] flex items-start justify-between gap-[8px]">
                                        <div>
                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">badges</h4>
                                            <p className="mt-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                AED {badgeUnitAed} × {badgeCount}
                                            </p>
                                        </div>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                            AED {formatMoney(badgesTotalAed)}
                                        </p>
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-[8px] mt-[24px]">
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        placeholder="Discount code"
                                        className="p-[12px_30px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                    />
                                    <button
                                        type="button"
                                        disabled={!String(discountCode).trim()}
                                        className={`shrink-0 p-[12px] w-[80px] rounded-[8px] border text-[14px] font-[Inter-SemiBold] ${String(discountCode).trim()
                                            ? 'cursor-pointer border-[#23262A] bg-white text-[#23262A]'
                                            : 'cursor-not-allowed border-[rgba(143,143,143,0.45)] bg-[#fff] text-[rgba(0,0,0,0.26)]'
                                            }`}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[14px] border-b border-t border-[rgba(143,143,143,0.25)] py-[14px]">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">Subtotal</h4>
                                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">AED {formatMoney(subtotal)}</h4>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">VAT 5%</h4>
                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">AED {formatMoney(vat)}</h4>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-[14px]">
                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">Total</h4>
                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">AED {formatMoney(total)}</h4>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPaymentModalOpen(true)}
                                className="mt-[4px] flex w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#DC0000] py-[12px] text-[14px] font-[Inter-SemiBold] text-white transition-opacity hover:opacity-95"
                            >
                                Pay AED {formatMoney(total)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentCardModal
                open={paymentModalOpen}
                total={total}
                onClose={() => setPaymentModalOpen(false)}
                onPay={handleCardModalPay}
            />
        </div>
    );
}
