"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { EditIcon, CloseIcon, FormDownArrowIcon } from '@/components/CustomFile/icons'
import { loadUpdateUserData, userSignUpData } from "@/redux/reuducer/authSlice";
import { addUserDetailApi } from "@/utils/api";
import user from '../../../../../public/assets/img/user.jpeg'
import verifiedbadge from '../../../../../public/assets/img/icons/verifiedbadge.svg'
import calendarmonth from '../../../../../public/assets/img/icons/calendarmonth.svg'
import regionalspain from '../../../../../public/assets/img/icons/regional-specs.svg'
import usericon from '../../../../../public/assets/img/icons/user.svg'
import { DatePicker } from "../components/DatePicker";
import UpdateProfileModal from "../components/UpdateProfileModal";
import VerifiedMain from '../../GetVerified/VerifiedMain'
import toast from 'react-hot-toast'

const INITIAL_FORM = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
}

const INITIAL_COUNTRY = ''

const COUNTRY_OPTIONS = [
    { value: "Afghanistan", flag: "🇦🇫" },
    { value: "Albania", flag: "🇦🇱" },
    { value: "Algeria", flag: "🇩🇿" },
    { value: "American Samoa", flag: "🇦🇸" },
    { value: "Andorra", flag: "🇦🇩" },
    { value: "Angola", flag: "🇦🇴" },
    { value: "Anguilla", flag: "🇦🇮" },
    { value: "Argentina", flag: "🇦🇷" },
    { value: "Armenia", flag: "🇦🇲" },
    { value: "Australia", flag: "🇦🇺" },
    { value: "Austria", flag: "🇦🇹" },
    { value: "Bahrain", flag: "🇧🇭" },
    { value: "Bangladesh", flag: "🇧🇩" },
    { value: "Belgium", flag: "🇧🇪" },
    { value: "Brazil", flag: "🇧🇷" },
    { value: "Canada", flag: "🇨🇦" },
    { value: "China", flag: "🇨🇳" },
    { value: "Egypt", flag: "🇪🇬" },
    { value: "France", flag: "🇫🇷" },
    { value: "Germany", flag: "🇩🇪" },
    { value: "India", flag: "🇮🇳" },
    { value: "Indonesia", flag: "🇮🇩" },
    { value: "Iraq", flag: "🇮🇶" },
    { value: "Ireland", flag: "🇮🇪" },
    { value: "Italy", flag: "🇮🇹" },
    { value: "Jordan", flag: "🇯🇴" },
    { value: "Kuwait", flag: "🇰🇼" },
    { value: "Lebanon", flag: "🇱🇧" },
    { value: "Malaysia", flag: "🇲🇾" },
    { value: "Nepal", flag: "🇳🇵" },
    { value: "Netherlands", flag: "🇳🇱" },
    { value: "New Zealand", flag: "🇳🇿" },
    { value: "Oman", flag: "🇴🇲" },
    { value: "Pakistan", flag: "🇵🇰" },
    { value: "Philippines", flag: "🇵🇭" },
    { value: "Qatar", flag: "🇶🇦" },
    { value: "Saudi Arabia", flag: "🇸🇦" },
    { value: "Singapore", flag: "🇸🇬" },
    { value: "South Africa", flag: "🇿🇦" },
    { value: "Spain", flag: "🇪🇸" },
    { value: "Sri Lanka", flag: "🇱🇰" },
    { value: "Sweden", flag: "🇸🇪" },
    { value: "Switzerland", flag: "🇨🇭" },
    { value: "Thailand", flag: "🇹🇭" },
    { value: "Turkey", flag: "🇹🇷" },
    { value: "United Arab Emirates", flag: "🇦🇪" },
    { value: "United Kingdom", flag: "🇬🇧" },
    { value: "United States", flag: "🇺🇸" },
];

const SkeletonBlock = ({ className = "" }) => (
    <div className={`animate-pulse rounded-md bg-[#e8eaec] ${className}`} aria-hidden />
);

const BasicInfo = ({ userDetail, userDetailLoading = false }) => {
    const userData = useSelector(userSignUpData)
    const [form, setForm] = useState(() => ({ ...INITIAL_FORM }));
    const [countryQuery, setCountryQuery] = useState(INITIAL_COUNTRY);
    const [baselineForm, setBaselineForm] = useState(() => ({ ...INITIAL_FORM }))
    const [baselineCountry, setBaselineCountry] = useState(INITIAL_COUNTRY)
    const [profileImage, setProfileImage] = useState('')
    const [saveLoading, setSaveLoading] = useState(false)
    const [profileSaveLoading, setProfileSaveLoading] = useState(false)
    const [countryOpen, setCountryOpen] = useState(false);
    const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
    const countryRef = useRef(null);

    const syncLiveProfileImage = (imageUrl) => {
        const nextImage = String(imageUrl || '').trim()
        if (!nextImage || typeof window === 'undefined') return
        window.dispatchEvent(new CustomEvent('profile-image-updated', {
            detail: { image: nextImage }
        }))
    }

    const displayName = useMemo(() => {
        if (userDetailLoading) return ''
        const full = String(userDetail?.name || '').trim()
        if (full) return full
        const fromForm = [form.firstName, form.lastName].filter(Boolean).join(' ').trim()
        if (fromForm) return fromForm
        return ''
    }, [form.firstName, form.lastName, userDetail?.name, userDetailLoading])

    const joinedLabel = useMemo(() => {
        if (userDetailLoading) return ''
        const raw = userDetail?.created_at
        if (!raw) return ''
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return ''
        return `Joined on ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }, [userDetail?.created_at, userDetailLoading])

    const handleDateOfBirthChange = (value) => {
        setForm({ ...form, dateOfBirth: value });
    };

    useEffect(() => {
        if (!userDetail || typeof userDetail !== 'object') {
            setForm({ ...INITIAL_FORM })
            setBaselineForm({ ...INITIAL_FORM })
            setCountryQuery(INITIAL_COUNTRY)
            setBaselineCountry(INITIAL_COUNTRY)
            return
        }

        const firstName = String(userDetail?.name || '').trim()
        const lastName = String(userDetail?.last_name || '').trim()
        const normalizedGender = String(userDetail?.gender || '').trim().toLowerCase()
        const mappedGender =
            normalizedGender === 'male'
                ? 'Male'
                : normalizedGender === 'female'
                    ? 'Female'
                    : normalizedGender
                        ? 'Prefer not to say'
                        : ''
        const nextForm = {
            firstName,
            lastName,
            dateOfBirth: String(userDetail?.date_of_birth || ''),
            gender: mappedGender,
        }
        const nextCountry = String(userDetail?.nationality || '')
        setForm(nextForm)
        setBaselineForm(nextForm)
        setCountryQuery(nextCountry)
        setBaselineCountry(nextCountry)
        setProfileImage(userDetail?.profile || '')
    }, [userDetail])

    const mapGenderForApi = (value) => {
        if (value === 'Male') return 'male'
        if (value === 'Female') return 'female'
        if (value === 'Prefer not to say') return 'prefer_not_to_say'
        return ''
    }

    const toFileFromAvatar = async (avatarImage) => {
        if (!avatarImage) return null
        const imageSrc = typeof avatarImage === 'string' ? avatarImage : avatarImage?.src
        if (!imageSrc) return null
        const response = await fetch(imageSrc)
        const blob = await response.blob()
        const fileType = blob.type || 'image/png'
        const extension = fileType.split('/')[1] || 'png'
        return new File([blob], `avatar.${extension}`, { type: fileType })
    }

    const parseApiPayload = (payload) => {
        if (typeof payload !== "string") return payload || {}
        const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
        const scriptIndex = payload.indexOf("<script")
        const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
        const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
        try {
            return JSON.parse(jsonText)
        } catch (error) {
            console.error("add-user-detail parse error:", error)
            return {}
        }
    }

    const applyUserDetailToForm = (detail) => {
        if (!detail || typeof detail !== 'object') return
        const normalizedGender = String(detail?.gender || '').trim().toLowerCase()
        const mappedGender =
            normalizedGender === 'male'
                ? 'Male'
                : normalizedGender === 'female'
                    ? 'Female'
                    : normalizedGender
                        ? 'Prefer not to say'
                        : ''
        const nextForm = {
            firstName: String(detail?.name || '').trim(),
            lastName: String(detail?.last_name || '').trim(),
            dateOfBirth: String(detail?.date_of_birth || ''),
            gender: mappedGender,
        }
        const nextCountry = String(detail?.nationality || '')
        setForm(nextForm)
        setBaselineForm(nextForm)
        setCountryQuery(nextCountry)
        setBaselineCountry(nextCountry)
        setProfileImage(detail?.profile || '')
        syncLiveProfileImage(detail?.profile || '')
    }

    const submitUserDetail = async ({ profileFile } = {}) => {
        const userId = userData?.id
        if (!userId) return null
        const response = await addUserDetailApi.addUserDetail({
            user_id: userId,
            name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            date_of_birth: form.dateOfBirth.trim(),
            nationality: countryQuery.trim(),
            gender: mapGenderForApi(form.gender),
            profile: profileFile || undefined,
        })
        const parsed = parseApiPayload(response?.data)
        if (parsed?.data && typeof parsed.data === 'object') {
            const mergedUserData = {
                ...(userData || {}),
                ...parsed.data,
            }
            loadUpdateUserData(mergedUserData)
            applyUserDetailToForm(parsed.data)
        } else {
            setBaselineForm({ ...form })
            setBaselineCountry(countryQuery)
        }
        return parsed
    }

    const filteredCountries = useMemo(() => {
        const q = countryQuery.trim().toLowerCase();
        if (!q) return COUNTRY_OPTIONS;
        return COUNTRY_OPTIONS.filter((country) => country.value.toLowerCase().includes(q));
    }, [countryQuery]);

    const isValid = useMemo(() => {
        return (
            form.firstName.trim() !== '' &&
            form.lastName.trim() !== '' &&
            form.dateOfBirth.trim() !== '' &&
            countryQuery.trim() !== '' &&
            form.gender.trim() !== ''
        );
    }, [form, countryQuery]);

    const isDirty = useMemo(() => {
        return (
            form.firstName !== baselineForm.firstName ||
            form.lastName !== baselineForm.lastName ||
            form.dateOfBirth !== baselineForm.dateOfBirth ||
            form.gender !== baselineForm.gender ||
            countryQuery !== baselineCountry
        );
    }, [baselineCountry, baselineForm.dateOfBirth, baselineForm.firstName, baselineForm.gender, baselineForm.lastName, countryQuery, form.dateOfBirth, form.firstName, form.gender, form.lastName]);


    useEffect(() => {
        if (!countryOpen) return;
        const handleOutside = (event) => {
            if (countryRef.current && !countryRef.current.contains(event.target)) {
                setCountryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [countryOpen]);

    return (
        <div className="w-full">
            <div className="mb-[24px] flex-wrap flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-[22px] font-[Inter-Bold] leading-none text-[#23262A] mb-[4px]">My Profile</h2>
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Update your profile details here</p>
                </div>
                <div className="flex items-center gap-[10px] ">
                    <Link href="/jobprofile" prefetch={false} type="button" className="cursor-pointer text-[#3a88ef] font-[Inter-SemiBold] text-[12px]">
                        Go to Job Profile
                    </Link>
                    <div className="h-[12px] w-[1px] bg-[#8f8f8f]"></div>
                    <Link href="/publicprofile" prefetch={false} type="button" className="cursor-pointer text-[#3a88ef] font-[Inter-SemiBold] text-[12px]">
                        Public Profile
                    </Link>
                </div>
            </div>

            <div
                className="p-[24px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)]"
                aria-busy={userDetailLoading}
            >
                <div className="flex items-start gap-[64px] max-sm:flex-col max-sm:items-start">
                    <div className="relative">
                        <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full">
                            {userDetailLoading ? (
                                <SkeletonBlock className="h-full w-full rounded-full" />
                            ) : (
                                <Image src={profileImage || userDetail?.profile || user} alt="profile" width={120} height={120} />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsUpdateProfileModalOpen(true)}
                            className="cursor-pointer absolute -bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#464c55] border-3 border-[#fff] text-white"
                        >
                            <EditIcon className="w-[15px] h-[15px]" fill="#fff" />
                        </button>
                    </div>

                    <div>
                        {userDetailLoading ? (
                            <>
                                <SkeletonBlock className="mb-[14px] h-[18px] w-[min(220px,55vw)]" />
                                <SkeletonBlock className="h-[14px] w-[min(180px,45vw)]" />
                            </>
                        ) : (
                            <>
                                <h3 className="text-[18px] font-[Inter-SemiBold] leading-none text-[#23262A] mb-[14px]">{displayName}</h3>
                                <p className="text-[14px] font-[Inter-Regular] text-[#666]">{joinedLabel}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* <div className="mt-[20px] w-full bg-[rgba(58,136,239,0.14)] rounded-[10px] p-[20px] flex items-center justify-between gap-[16px] max-sm:flex-col max-sm:items-start max-sm:py-[16px]">
                    <div className="flex items-center gap-[30px] max-sm:flex-wrap">
                        <div className="flex items-center justify-center shrink-0">
                            <Image src={verifiedbadge} alt="verified badge" className="w-[80px] h-[80px]" />
                        </div>
                        <div className="flex gap-[10px] items-center flex-wrap">
                            <p className="text-[16px] font-[Inter-SemiBold] text-[rgba(0,0,0,0.8)]">
                                Got a verified badge yet?
                            </p>
                            <div className='flex items-center gap-[10px]'>
                                <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                    Get more visibility
                                </p>
                                <div className='h-[36px] w-[1px] bg-[#8F8F8F] opacity-60'></div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                    Enhance your credibility
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="p-[6px_40px] rounded-[8px] bg-[#FFF] border border-[rgba(143,143,143,0.22)] text-[#000000CC] text-[14px] font-[Inter-SemiBold] cursor-pointer whitespace-nowrap"
                    >
                        Get Started
                    </button>
                </div> */}
                <div className="mt-[20px]">
                <VerifiedMain showTickBadge={false} />
                </div>
            </div>

            <div className="mt-[30px]">
                {userDetailLoading ? (
                    <>
                        <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-x-8 gap-y-8 max-lg:grid-cols-1 border-b border-[rgba(143,143,143,0.22)] pb-[30px]">
                            <div className="space-y-2">
                                <SkeletonBlock className="h-[16px] w-[110px]" />
                                <SkeletonBlock className="h-[14px] w-[min(220px,70%)]" />
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <SkeletonBlock className="h-[54px] w-full rounded-[6px]" />
                                <SkeletonBlock className="h-[54px] w-full rounded-[6px]" />
                            </div>
                        </div>
                        <div className="py-[30px]">
                            <div className="mb-[30px] space-y-2">
                                <SkeletonBlock className="h-[16px] w-[140px]" />
                                <SkeletonBlock className="h-[14px] w-[min(280px,85%)]" />
                            </div>
                            <div className="flex flex-col gap-[50px]">
                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-5 max-md:grid-cols-1">
                                    <SkeletonBlock className="h-[16px] w-[120px]" />
                                    <SkeletonBlock className="h-[56px] w-full rounded-[8px]" />
                                </div>
                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-5 max-md:grid-cols-1">
                                    <SkeletonBlock className="h-[16px] w-[100px]" />
                                    <SkeletonBlock className="h-[56px] w-full rounded-[8px]" />
                                </div>
                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-5 max-md:grid-cols-1">
                                    <SkeletonBlock className="h-[16px] w-[72px]" />
                                    <SkeletonBlock className="h-[44px] w-full max-w-[360px] rounded-[6px]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex justify-end">
                            <SkeletonBlock className="h-[40px] w-[132px] rounded-[6px]" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-x-8 gap-y-8 max-lg:grid-cols-1 border-b border-[rgba(143,143,143,0.22)] pb-[30px]">
                            <div>
                                <h4 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#23262A] mb-[6px]">Profile Name</h4>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">This is displayed on your profile</p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 ">
                                <label className="relative block">
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                        placeholder=" "
                                        className="peer h-[54px] w-full rounded-[6px] border border-[rgba(143,143,143,0.22)] px-4 text-[14px] text-[#23262A] outline-none focus:border-[#23262A]"
                                    />
                                    <p className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-[14px] text-[#23262A] transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#495365] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[#23262A]">
                                        First Name
                                    </p>
                                </label>
                                <label className="relative block">
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                        placeholder=" "
                                        className="peer h-[54px] w-full rounded-[6px] border border-[rgba(143,143,143,0.22)] px-4 text-[14px] text-[#23262A] outline-none focus:border-[#23262A]"
                                    />
                                    <p className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-[14px] text-[#23262A] transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[#495365] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[#23262A]">
                                        Last Name
                                    </p>
                                </label>
                            </div>


                        </div>

                        <div className="py-[30px]">
                            <div className="mb-[30px]">
                                <h4 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#23262A] mb-[6px]">Account details</h4>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">This is not visible to other users</p>
                            </div>
                            <div className="flex flex-col gap-[50px]">
                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-5 max-md:grid-cols-1">
                                    <div className="flex items-center gap-[6px] ">
                                        <Image src={calendarmonth} alt="calendar month" className="w-[16px] h-[16px]" />
                                        <h4 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#23262A]">Date of birth</h4>
                                    </div>
                                    <label className="relative block">

                                        <DatePicker
                                            label="Date of Birth"
                                            value={form.dateOfBirth}
                                            onChange={handleDateOfBirthChange}
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-5 max-md:grid-cols-1">
                                    <div className="flex items-center gap-[6px] ">
                                        <Image src={regionalspain} alt="regional specs" className="w-[16px] h-[16px]" />
                                        <h4 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#23262A]">Nationality</h4>
                                    </div>
                                    <label ref={countryRef} className="relative block">
                                        <input
                                            type="text"
                                            value={countryQuery}
                                            onChange={(e) => {
                                                setCountryQuery(e.target.value);
                                                setCountryOpen(true);
                                            }}
                                            onFocus={() => setCountryOpen(true)}
                                            className="h-[56px] w-full rounded-[8px] border border-[#23262A] px-[14px] pr-[70px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                        <p className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-[14px] text-[#23262A]">
                                            Search Country
                                        </p>
                                        {countryQuery ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCountryQuery("");
                                                    setCountryOpen(true);
                                                }}
                                                className="cursor-pointer absolute right-[34px] top-1/2 -translate-y-1/2 text-[#8f8f8f]"
                                                aria-label="Clear country"
                                            >
                                                <CloseIcon className="w-[12px] h-[12px]" fill="#8f8f8f" />
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setCountryOpen((prev) => !prev)}
                                            className="cursor-pointer absolute right-[12px] top-1/2 -translate-y-1/2 text-[#8f8f8f]"
                                            aria-label="Toggle country options"
                                        >
                                            <FormDownArrowIcon className={countryOpen ? "rotate-180" : ""} width={20} height={20} />
                                        </button>

                                        {countryOpen ? (
                                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[290px] overflow-y-auto rounded-[8px] bg-white p-[4px_0] shadow-[0px_8px_20px_rgba(0,0,0,0.10)]">
                                                {filteredCountries.length ? (
                                                    filteredCountries.map((country, index) => (
                                                        <button
                                                            key={country.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setCountryQuery(country.value);
                                                                setCountryOpen(false);
                                                            }}
                                                            className={`cursor-pointer flex w-full items-center gap-[10px] px-[16px] py-[10px] text-left hover:bg-[#f8f8f8] ${index === 0 ? "bg-[#f6e5e7]" : "bg-white"
                                                                }`}
                                                        >
                                                            <div>{country.flag}</div>
                                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{country.value}</p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="px-[16px] py-[10px] text-[14px] text-[#8f8f8f]">No country found</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </label>
                                </div>

                                <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-5 max-md:grid-cols-1">
                                    <div className="flex items-center gap-[6px] ">
                                        <Image src={usericon} alt="user icon" className="w-[16px] h-[16px]" />
                                        <h4 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#23262A]">Gender</h4>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex max-w-[360px] flex-wrap items-center gap-x-8 gap-y-4">
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    checked={form.gender === 'Male'}
                                                    onChange={() => setForm((prev) => ({ ...prev, gender: 'Male' }))}
                                                    className="cursor-pointer h-[18px] w-[18px] appearance-none rounded-full border-2 border-[#8f8f8f] bg-white checked:border-[#23262A] checked:bg-[radial-gradient(circle,_#23262A_0_35%,_transparent_38%)]"
                                                />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Male</p>
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    checked={form.gender === 'Female'}
                                                    onChange={() => setForm((prev) => ({ ...prev, gender: 'Female' }))}
                                                    className="cursor-pointer h-[18px] w-[18px] appearance-none rounded-full border-2 border-[#8f8f8f] bg-white checked:border-[#23262A] checked:bg-[radial-gradient(circle,_#23262A_0_35%,_transparent_38%)]"
                                                />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Female</p>
                                            </label>
                                            <label className="flex basis-full cursor-pointer items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    checked={form.gender === 'Prefer not to say'}
                                                    onChange={() => setForm((prev) => ({ ...prev, gender: 'Prefer not to say' }))}
                                                    className="cursor-pointer h-[18px] w-[18px] appearance-none rounded-full border-2 border-[#8f8f8f] bg-white checked:border-[#23262A] checked:bg-[radial-gradient(circle,_#23262A_0_35%,_transparent_38%)]"
                                                />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Prefer not to say</p>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="mt-10 flex justify-end">
                            <button
                                type="button"
                                disabled={saveLoading}
                                onClick={async () => {
                                    if (saveLoading || !isDirty) return
                                    if (!isValid) {
                                        toast.error('Please fill in all required fields.')
                                        return
                                    }
                                    try {
                                        setSaveLoading(true)
                                        const parsed = await submitUserDetail()
                                        if (parsed?.error === false) {
                                            toast.success(parsed?.message || 'Changes saved successfully.')
                                        } else {
                                            toast.error(parsed?.message || 'Failed to save changes.')
                                        }
                                    } catch (error) {
                                        console.error('add-user-detail error:', error)
                                        toast.error('Failed to save changes. Please try again.')
                                    } finally {
                                        setSaveLoading(false)
                                    }
                                }}
                                className={`rounded-[6px] p-[10px_20px] text-[14px] font-[Inter-SemiBold] transition-colors ${
                                    isDirty && !saveLoading
                                        ? "cursor-pointer bg-[#23262A] text-white hover:bg-[#1a1d21]"
                                        : saveLoading
                                            ? "cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]"
                                            : "cursor-pointer bg-[#0000001f] text-[#8f8f8f]"
                                }`}
                            >
                                {saveLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <UpdateProfileModal
                open={isUpdateProfileModalOpen}
                onClose={() => setIsUpdateProfileModalOpen(false)}
                saveLoading={profileSaveLoading}
                currentImage={profileImage || userDetail?.profile || ''}
                onSave={async ({ selectedAvatar, uploadedFile, activeTab }) => {
                    if (profileSaveLoading) return
                    try {
                        setProfileSaveLoading(true)
                        const profileFile =
                            activeTab === 'computer'
                                ? uploadedFile
                                : await toFileFromAvatar(selectedAvatar)
                        if (!profileFile) return
                        const parsed = await submitUserDetail({ profileFile })
                        const persistedProfile = String(parsed?.data?.profile || '').trim()
                        if (persistedProfile) {
                            setProfileImage(persistedProfile)
                            syncLiveProfileImage(persistedProfile)
                        }
                        setIsUpdateProfileModalOpen(false)
                    } catch (error) {
                        console.error('profile update error:', error)
                    } finally {
                        setProfileSaveLoading(false)
                    }
                }}
            />
        </div>
    );
};

export default BasicInfo;
