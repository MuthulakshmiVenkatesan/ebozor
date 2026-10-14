'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { FormDownArrowIcon, JobEmailIcon, GlobeIcon, ImageGalleryIcon } from '@/components/CustomFile/icons'
import { jobDashboardProfileApi } from '@/utils/api'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import twitter from '../../../../../public/assets/img/jobdashboard/social/twitter.svg'
import facebook from '../../../../../public/assets/img/jobdashboard/social/facebook.svg'
import linkedin from '../../../../../public/assets/img/jobdashboard/social/linkedIn.svg'
import instagram from '../../../../../public/assets/img/jobdashboard/social/instagram.svg'
import youtube from '../../../../../public/assets/img/jobdashboard/social/youtube.svg'

const CITY_OPTIONS = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain', 'Al Ain']
const TYPE_OPTIONS = ['Private Company', 'Public Company', 'Government', 'Startup']
const INDUSTRY_OPTIONS = ['Technology', 'Construction', 'Retail', 'Healthcare', 'Education', 'Hospitality']
const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+']

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf('<link')
    const scriptIndex = payload.indexOf('<script')
    let cutIndex = -1
    if (debugAssetIndex >= 0 && scriptIndex >= 0) cutIndex = Math.min(debugAssetIndex, scriptIndex)
    else if (debugAssetIndex >= 0) cutIndex = debugAssetIndex
    else if (scriptIndex >= 0) cutIndex = scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch {
        return {}
    }
}

function resolveUserId(userData, authRoot) {
    return (
        userData?.id ??
        userData?.data?.id ??
        userData?.user?.id ??
        authRoot?.data?.id ??
        authRoot?.data?.data?.id ??
        authRoot?.data?.user?.id ??
        null
    )
}

function Field({ label, required, value, onChange, type = 'text', placeholder = '', disabled = false }) {
    return (
        <div className="relative w-full">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || ' '}
                disabled={disabled}
                className="h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white px-[14px] text-[16px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#a3a6aa] focus:border-[#1270ec] disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
            />
            <label className="pointer-events-none absolute left-[10px] top-[-8px] bg-[#fff] px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]">
                {label}
                {required ? '*' : ''}
            </label>
        </div>
    )
}

function SelectField({ label, required, value, onChange, options, disabled = false }) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    const selectedText = value || `${label}${required ? '*' : ''}`

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`h-[48px] w-full rounded-[8px] border bg-white px-[14px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] outline-none ${isOpen ? 'border-[#1270ec]' : 'border-[rgba(143,143,143,0.45)]'
                    } ${value ? 'text-[#23262A]' : 'text-[#88909c]'} disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]`}
            >
                {selectedText}
            </button>
            <label className="pointer-events-none absolute left-[10px] top-[-8px] bg-[#fff] px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]">
                {label}
                {required ? '*' : ''}
            </label>
            <div className={`pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                <FormDownArrowIcon className="h-[20px] w-[20px] " />
            </div>
            {isOpen && !disabled ? (
                <div className="absolute left-0 top-[52px] z-[99] max-h-[250px] w-full overflow-y-auto rounded-[8px] bg-[#fff] py-[6px] shadow-[0px_6px_14px_rgba(15,23,42,0.15)]">
                    {options.map((option) => {
                        const isSelected = option === value
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option)
                                    setIsOpen(false)
                                }}
                                className={`cursor-pointer block w-full px-[16px] py-[8px] text-left text-[14px] font-[Inter-Regular] ${isSelected ? 'bg-[#f5f6f8] text-[#1f2937]' : 'bg-white text-[#2d3139]'
                                    }`}
                            >
                                {option}
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

function SocialField({ label, value, onChange, placeholder, Icon, disabled = false }) {
    const isSvgComponent = typeof Icon === 'function'

    return (
        <div className="relative w-full">
            <div className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2">
                {isSvgComponent ? (
                    <Icon className="h-[20px] w-[20px]" fill="#0000008a" />
                ) : (
                    <Image src={Icon} alt={label} className="h-[20px] w-[20px]" />
                )}
            </div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white pl-[38px] pr-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] focus:border-[#1270ec] disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
            />
            <label className="pointer-events-none absolute left-[10px] top-[-8px] bg-[#fff] px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]">{label}</label>
        </div>
    )
}

function CompanyProfileSkeleton() {
    return (
        <div className="animate-pulse rounded-[6px] bg-white p-[64px] [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] max-sm:p-[24px]">
            <div className="grid grid-cols-1 gap-[32px] lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                    <div className="mb-[16px] h-[20px] w-[120px] rounded bg-[#eef1f4]" />
                    <div className="mb-[14px] h-[150px] w-[150px] rounded-[6px] bg-[#eef1f4]" />
                    <div className="h-[20px] w-[130px] rounded bg-[#eef1f4]" />
                </div>
                <div>
                    <div className="mb-[24px] h-[20px] w-[140px] rounded bg-[#eef1f4]" />
                    <div className="grid grid-cols-2 gap-[24px] max-sm:grid-cols-1">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={`company-skel-details-${idx}`} className="h-[48px] rounded-[8px] bg-[#eef1f4]" />
                        ))}
                    </div>
                    <div className="mt-[24px] h-[150px] rounded-[8px] bg-[#eef1f4]" />
                    <div className="mt-[24px] grid grid-cols-2 gap-[24px] max-sm:grid-cols-1">
                        {Array.from({ length: 7 }).map((_, idx) => (
                            <div key={`company-skel-social-${idx}`} className="h-[48px] rounded-[8px] bg-[#eef1f4]" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-[16px] flex justify-end">
                <div className="h-[40px] min-w-[100px] rounded-[8px] bg-[#eef1f4]" />
            </div>
        </div>
    )
}

const CompanyProfile = () => {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const fileRef = useRef(null)
    const [logoName, setLogoName] = useState('')
    const [logoPreview, setLogoPreview] = useState('')
    const [logoFile, setLogoFile] = useState(null)
    const [hasObjectLogo, setHasObjectLogo] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [form, setForm] = useState({
        companyName: '',
        companyType: '',
        city: '',
        industry: '',
        tradeLicense: '',
        companySize: '',
        description: '',
        contactName: '',
        phoneNumber: '',
        website: '',
        youtube: '',
        communicationEmail: '',
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: '',
    })

    useEffect(() => {
        const userId = resolveUserId(userData, authRoot)
        let cancelled = false

        const run = async () => {
            if (!userId) {
                setPageLoading(false)
                return
            }
            try {
                const response = await jobDashboardProfileApi.getJobDashboardProfile({ user_id: userId, type: 'company' })
                const parsed = parseApiPayload(response?.data)
                const row = parsed?.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) ? parsed.data : null
                if (cancelled) return
                if (row) {
                    setForm({
                        companyName: String(row.company_name ?? '').trim(),
                        companyType: String(row.company_type ?? '').trim(),
                        city: String(row.city ?? '').trim(),
                        industry: String(row.industry ?? '').trim(),
                        tradeLicense: String(row.license_no ?? '').trim(),
                        companySize: String(row.company_size ?? '').trim(),
                        description: String(row.description ?? ''),
                        contactName: String(row.contact_name ?? '').trim(),
                        phoneNumber: String(row.phone_number ?? '').trim(),
                        website: String(row.website ?? '').trim(),
                        youtube: String(row.youtube ?? '').trim(),
                        communicationEmail: String(row.email ?? '').trim(),
                        facebook: String(row.facebook ?? '').trim(),
                        twitter: String(row.twitter ?? '').trim(),
                        linkedin: String(row.linkedin ?? '').trim(),
                        instagram: String(row.instagram ?? '').trim(),
                    })
                    const logoUrl = String(row.company_logo ?? '').trim()
                    setLogoPreview(logoUrl)
                    setLogoName(logoUrl ? logoUrl.split('/').pop() || '' : '')
                    setLogoFile(null)
                    setHasObjectLogo(false)
                } else {
                    setForm({
                        companyName: '',
                        companyType: '',
                        city: '',
                        industry: '',
                        tradeLicense: '',
                        companySize: '',
                        description: '',
                        contactName: '',
                        phoneNumber: '',
                        website: '',
                        youtube: '',
                        communicationEmail: '',
                        facebook: '',
                        twitter: '',
                        linkedin: '',
                        instagram: '',
                    })
                    setLogoPreview('')
                    setLogoName('')
                    setLogoFile(null)
                    setHasObjectLogo(false)
                }
            } catch {
                if (!cancelled) {
                    setLogoPreview('')
                    setLogoName('')
                    setLogoFile(null)
                    setHasObjectLogo(false)
                }
            } finally {
                if (!cancelled) setPageLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id])

    const setValue = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

    const canSave = useMemo(() => (
        form.companyName.trim() &&
        form.companyType &&
        form.industry &&
        form.tradeLicense.trim() &&
        form.description.trim() &&
        form.contactName.trim() &&
        form.phoneNumber.trim()
    ), [form])

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (hasObjectLogo && logoPreview) {
            URL.revokeObjectURL(logoPreview)
        }
        const previewUrl = URL.createObjectURL(file)
        setLogoPreview(previewUrl)
        setLogoName(file.name)
        setLogoFile(file)
        setHasObjectLogo(true)
    }

    useEffect(() => {
        return () => {
            if (hasObjectLogo && logoPreview) {
                URL.revokeObjectURL(logoPreview)
            }
        }
    }, [hasObjectLogo, logoPreview])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaveError('')
        if (!canSave) return

        const userId = resolveUserId(userData, authRoot)
        if (!userId) {
            setSaveError('You need to be signed in to save your company profile.')
            return
        }

        setSaveLoading(true)
        try {
            const response = await jobDashboardProfileApi.addCompanyProfile({
                user_id: userId,
                company_name: form.companyName,
                company_type: form.companyType,
                company_logo: logoFile ?? null,
                city: form.city,
                industry: form.industry,
                license_no: form.tradeLicense,
                company_size: form.companySize,
                description: form.description,
                contact_name: form.contactName,
                phone_number: form.phoneNumber,
                website: form.website,
                youtube: form.youtube,
                email: form.communicationEmail,
                facebook: form.facebook,
                twitter: form.twitter,
                linkedin: form.linkedin,
                instagram: form.instagram,
            })
            const parsed = parseApiPayload(response?.data)
            const ok =
                parsed &&
                (parsed.error === false || parsed.error === 'false' || parsed.error == null) &&
                (parsed.code == null || Number(parsed.code) === 200)
            if (!ok) {
                setSaveError(String(parsed?.message || 'Could not save. Please try again.'))
                return
            }
            router.push('/jobdashboard')
        } catch (err) {
            const raw = err?.response?.data
            const parsedErr = typeof raw === 'string' ? parseApiPayload(raw) : raw && typeof raw === 'object' ? raw : {}
            setSaveError(String(parsedErr?.message || err?.message || 'Could not save. Please try again.'))
        } finally {
            setSaveLoading(false)
        }
    }

    return (
        <div className="p-[0_24px]">
            <h1 className="mb-[20px] text-[20px] font-[Inter-Bold] text-[#23262A]">Company Profile</h1>

            {pageLoading ? (
                <CompanyProfileSkeleton />
            ) : (
                <form onSubmit={handleSave} className="rounded-[6px] bg-white p-[64px] [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] max-sm:p-[24px]">
                    <div className="grid grid-cols-1 gap-[32px] lg:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
                            <h3 className="mb-[16px] text-[16px] font-[Inter-Bold] text-[#23262A]">Company Logo</h3>
                            <div className="mb-[14px] flex h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-[6px] bg-[#edf0ff]">
                                <div className="flex h-full w-full items-center justify-between bg-[#f0f2ff] px-[18px] justify-center">
                                    <div className="flex h-full w-full items-end justify-center overflow-hidden ">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-[56px] w-[56px] rounded-full bg-[#c9cee3]" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="mb-[16px] text-[12px] font-[Inter-Regular] leading-[1.7] text-[#464c55]">
                                Upload a .png or .jpg (dimensions 260*260) of Max 1 MB.
                            </p>
                            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleLogoUpload} />
                            <button
                                type="button"
                                disabled={saveLoading}
                                onClick={() => fileRef.current?.click()}
                                className="cursor-pointer p-[8px_16px] inline-flex items-center justify-center gap-[8px] rounded-[6px] border border-[#1270ec] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <ImageGalleryIcon className="h-[16px] w-[16px]" />
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#1270ec]">Upload Logo</p>
                            </button>
                            {logoName ? <p className="mt-[8px] max-w-[180px] truncate text-[11px] text-[#1270ec]">{logoName}</p> : null}
                        </div>

                        <div>
                            <h3 className="mb-[24px] text-[16px] font-[Inter-Bold] text-[#23262A]">Company Details</h3>
                            <div className='flex flex-col gap-[24px]'>
                                <div className="grid grid-cols-2 gap-[24px] max-sm:grid-cols-1">
                                    <Field label="Company Name" required value={form.companyName} onChange={setValue('companyName')} disabled={saveLoading} />
                                    <SelectField label="Company Type" required value={form.companyType} onChange={setValue('companyType')} options={TYPE_OPTIONS} disabled={saveLoading} />
                                    <SelectField label="City" value={form.city} onChange={setValue('city')} options={CITY_OPTIONS} disabled={saveLoading} />
                                    <SelectField label="Industry" required value={form.industry} onChange={setValue('industry')} options={INDUSTRY_OPTIONS} disabled={saveLoading} />
                                    <Field label="Trade License No." required value={form.tradeLicense} onChange={setValue('tradeLicense')} disabled={saveLoading} />
                                    <SelectField label="Company Size" value={form.companySize} onChange={setValue('companySize')} options={SIZE_OPTIONS} disabled={saveLoading} />
                                </div>
                                <div className="relative">
                                    <label className="pointer-events-none absolute z-[2] left-[10px] top-[-8px] bg-[#fff] px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]">
                                        Description*
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setValue('description')(e.target.value.slice(0, 5000))}
                                            rows={4}
                                            disabled={saveLoading}
                                            className="min-h-[150px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] focus:border-[#1270ec] resize-none disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
                                            placeholder="Description*"
                                        />
                                        <div className="pointer-events-none bottom-[12px] absolute right-[10px] ">
                                            <p className="text-[12px] font-[Inter-Regular] text-[#7b8385]">{form.description.length} / 5000</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[24px] max-sm:grid-cols-1">
                                    <Field label="Contact Name" required value={form.contactName} onChange={setValue('contactName')} disabled={saveLoading} />
                                    <Field label="Phone Number" required value={form.phoneNumber} onChange={setValue('phoneNumber')} disabled={saveLoading} />
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-[24px] mt-[22px] text-[16px] font-[Inter-Bold] text-[#23262A]">Social Profile</h3>
                                <div className="grid grid-cols-2 gap-[24px] max-sm:grid-cols-1">
                                    <SocialField label="Website" value={form.website} onChange={setValue('website')} placeholder="Enter your website page" Icon={GlobeIcon} disabled={saveLoading} />
                                    <SocialField label="Youtube" value={form.youtube} onChange={setValue('youtube')} placeholder="Enter your YouTube page" Icon={youtube} disabled={saveLoading} />
                                    <SocialField label="Communication Email" value={form.communicationEmail} onChange={setValue('communicationEmail')} placeholder="Enter your Communication Email" Icon={JobEmailIcon} disabled={saveLoading} />
                                    <SocialField label="Facebook" value={form.facebook} onChange={setValue('facebook')} placeholder="Enter your Facebook page" Icon={facebook} disabled={saveLoading} />
                                    <SocialField label="Twitter" value={form.twitter} onChange={setValue('twitter')} placeholder="Enter your Twitter page" Icon={twitter} disabled={saveLoading} />
                                    <SocialField label="LinkedIn" value={form.linkedin} onChange={setValue('linkedin')} placeholder="Enter your LinkedIn page" Icon={linkedin} disabled={saveLoading} />
                                    <SocialField label="Instagram" value={form.instagram} onChange={setValue('instagram')} placeholder="Enter your Instagram page" Icon={instagram} disabled={saveLoading} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[16px] flex justify-end">
                        {saveError ? <p className="mr-auto text-[13px] font-[Inter-Regular] text-[#b91c1c]">{saveError}</p> : null}
                        <button
                            type="submit"
                            disabled={!canSave || saveLoading}
                            className={`h-[40px] min-w-[100px] rounded-[8px] px-[20px] text-[14px] font-[Inter-Bold] ${canSave && !saveLoading ? 'cursor-pointer bg-[#DC0000] text-white' : 'cursor-not-allowed bg-[#e5e7eb] text-[#9ca3af]'
                                }`}
                        >
                            {saveLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default CompanyProfile
