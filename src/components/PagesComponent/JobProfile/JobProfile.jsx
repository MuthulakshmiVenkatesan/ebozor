'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { EditIcon, FileIcon, GraduationIcon, MicIcon, PersonalUserIcon, PlusIcon, PortfolioIcon, SkillsIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import AddSectionModal from './components/AddSectionModal'
import BasicInfoModal from '../ProductDetail/JobComponents/BasicInfoModal'
import CommonBasicModal from './components/CommonBasicModal'
import DigitalProfileModal from '../ProductDetail/JobComponents/DigitalProfileModal'
import EditProfileModal from './components/EditProfileModal'
import ExperienceModal from '../ProductDetail/JobComponents/ExperienceModal'
import IntroductionsModal from '../ProductDetail/JobComponents/IntroductionsModal'
import LicensesCertificatesModal from './components/LicensesCertificatesModal'
import PortfolioModal from './components/PortfolioModal'
import ProfileJobSidebar from './components/ProfileJobSidebar'
import QualificationModal from '../ProductDetail/JobComponents/QualificationModal'
import ReferenceModal from './components/ReferenceModal'
import ResumeModal from '../ProductDetail/JobComponents/ResumeModal'
import EditModal from './components/EditModal'
import SkillsModal from '../ProductDetail/JobComponents/SkillsModal'
import email from '../../../../public/assets/img/profile/email.svg'
import call from '../../../../public/assets/img/profile/call.svg'
import visa from '../../../../public/assets/img/profile/visa.svg'
import user from '../../../../public/assets/img/profile/user.svg'
import language from '../../../../public/assets/img/profile/language.svg'
import nation from '../../../../public/assets/img/profile/nation.svg'
import calendar from '../../../../public/assets/img/profile/calendar.svg'
import graduatecap from '../../../../public/assets/img/profile/graduatecap.svg'
import work from '../../../../public/assets/img/profile/work.svg'
import resume from '../../../../public/assets/img/resume.svg'
import workgrey from '../../../../public/assets/img/profile/workgrey.svg'
import license from '../../../../public/assets/img/profile/license.svg'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { addUserDetailApi, getUserDetailApi } from '@/utils/api'

function isEmptyBasicField(value) {
    if (value == null) return true
    return String(value).trim() === ''
}

function displayBasicValue(value, emptyLabel = 'N/A') {
    return isEmptyBasicField(value) ? emptyLabel : String(value).trim()
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-[18px]">
            <div
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#edf0ff]"
                aria-hidden
            >
                {icon}
            </div>
            <div className="min-w-0 flex-1 flex flex-col gap-[2px] pt-[2px]">
                <h4 className="text-[12px] font-[Inter-Regular] leading-tight text-[#666b72]">{label}</h4>
                <p className="text-[14px] font-[Inter-Regular] leading-snug text-[#23262A] break-words">{value}</p>
            </div>
        </div>
    )
}

/** Placeholder profile — replace with API / props when wired. Empty strings / null show “Add …” links (Basic Info). */
const SAMPLE_BASIC_INFO = {
    email: 'lakshmivenkat1810@gmail.com',
    phone: '',
    visaStatus: '',
    languages: '',
    gender: '',
    nationality: '',
    dateOfBirth: '',
    currentLocation: '',
    careerLevel: '',
    desiredSalary: '',
}

function BasicInfoAddLink({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center gap-[0px] rounded-[6px] text-left transition-opacity hover:opacity-90"
        >
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center" aria-hidden>
                <PlusIcon width={18} height={18} fill="#1270EC" className="h-[18px] w-[18px]" />
            </div>
            <p className="text-[16px] font-[Inter-SemiBold] leading-tight text-[#1872ee]">{label}</p>
        </button>
    )
}

/**
 * Sections outside Basic Info — when arrays are empty / resume is null / digitalProfile is null,
 * the empty-state CTA cards from design are shown.
 * Populate from API to switch to the filled layouts.
 */
// Filled example: qualifications: [{ title, subtitle }], experience: [...], skills: ['...'], resume: { fileName, href }, digitalProfile: {}
const SAMPLE_PROFILE_EXTENSIONS = {
    qualifications: [],
    experience: [],
    skills: [],
    resume: null,
    digitalProfile: null,
}

const EMPTY_COPY = {
    qualifications:
        'Add your academic qualification details such as School, Undergrad and Post graduation degree.',
    experience: 'Add your current and past work experiences.',
    skills: 'Add your technical or soft skills such as Salesforce, Communication skills etc.',
    resume: 'Upload your most recent resume.',
    digitalProfile: 'Add your audio and video introduction to grab potential employers attention.',
}

function SectionAction({ icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex cursor-pointer items-center gap-[6px] text-[16px] font-[Inter-Medium] text-[#23262A]"
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}

function PlaceholderRow({ icon, title, subtitle, subtitleHref }) {
    return (
        <div className="flex items-center gap-[16px]">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center bg-[#edf0ff]" aria-hidden>
                {icon}
            </div>
            <div className="flex min-w-0 flex-col">
                <h4 className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#23262A] truncate">{title}</h4>
                {subtitle ? (
                    subtitleHref ? (
                        <Link
                            href={subtitleHref}
                            className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate underline"
                            title={subtitle}
                        >
                            {subtitle}
                        </Link>
                    ) : (
                        <p className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate">{subtitle}</p>
                    )
                ) : null}
            </div>
        </div>
    )
}

function SkillChip({ label }) {
    return (
        <button
            type="button"
            className="cursor-pointer rounded-[8px] border border-[#23262A] bg-white p-[6px_12px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A]"
        >
            {label}
        </button>
    )
}

function EmptyProfileSection({ title, description, icon, onAddClick }) {
    return (
        <div className="rounded-[16px] bg-white p-[28px_24px]">
            <div className="mb-[18px] flex items-center justify-between gap-[12px]">
                <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">{title}</h2>
                <SectionAction
                    label="Add"
                    onClick={onAddClick}
                    icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                />
            </div>
            <div className="flex items-center gap-[12px]">
                <div className="shrink-0 " aria-hidden>
                    {icon}
                </div>
                <p className="text-[16px] font-[Inter-Regular] text-[#666b72]">{description}</p>
            </div>
        </div>
    )
}

const SkeletonBlock = ({ className = '' }) => (
    <div className={`animate-pulse rounded-md bg-[#e8eaec] ${className}`} aria-hidden />
)

const JobProfile = () => {
    const userData = useSelector(userSignUpData)
    const [basicInfo, setBasicInfo] = useState(() => ({ ...SAMPLE_BASIC_INFO }))
    const [ext, setExt] = useState(() => ({ ...SAMPLE_PROFILE_EXTENSIONS }))
    const [profileLoading, setProfileLoading] = useState(false)
    const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
    const [basicModalField, setBasicModalField] = useState(null)
    const [basicInfoEditOpen, setBasicInfoEditOpen] = useState(false)
    const [editProfileOpen, setEditProfileOpen] = useState(false)
    const [sidebarDisplayName, setSidebarDisplayName] = useState('Muthulakshmi')
    const [sidebarAvailability, setSidebarAvailability] = useState('')
    const [sidebarProfileImage, setSidebarProfileImage] = useState('')
    const [profileSummaryDraft, setProfileSummaryDraft] = useState('')
    const [sectionModal, setSectionModal] = useState(null)
    const [profileSectionModal, setProfileSectionModal] = useState(null)
    const [editSectionModal, setEditSectionModal] = useState(null)
    const [qualificationEditMode, setQualificationEditMode] = useState(false)
    const [experienceEditMode, setExperienceEditMode] = useState(false)
    const [editingQualificationId, setEditingQualificationId] = useState(null)
    const [editingExperienceId, setEditingExperienceId] = useState(null)
    const [introModalVariant, setIntroModalVariant] = useState(null)
    const [portfolioList, setPortfolioList] = useState([])
    const [licensesList, setLicensesList] = useState([])
    const [referenceList, setReferenceList] = useState([])
    const [editingPortfolioId, setEditingPortfolioId] = useState(null)
    const [editingLicenseId, setEditingLicenseId] = useState(null)
    const [editingReferenceId, setEditingReferenceId] = useState(null)

    const parseApiPayload = (payload) => {
        if (typeof payload !== 'string') return payload || {}
        const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
        const scriptIndex = payload.indexOf('<script')
        const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
        const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
        try {
            return JSON.parse(jsonText)
        } catch (error) {
            console.error('get-user-detail parse error:', error)
            return {}
        }
    }

    const fetchUserDetail = useCallback(async () => {
        const userId = userData?.id
        if (!userId) return
        try {
            setProfileLoading(true)
            const response = await getUserDetailApi.getUserDetail({ user_id: userId })
            const parsed = parseApiPayload(response?.data)
            const detail = parsed?.data && typeof parsed.data === 'object' ? parsed.data : null
            if (!detail) return

            const name = String(detail?.name || '').trim()
            const lastName = String(detail?.last_name || '').trim()
            setSidebarDisplayName([name, lastName].filter(Boolean).join(' ').trim() || name || 'Muthulakshmi')
            setSidebarProfileImage(String(detail?.profile || '').trim())
            setSidebarAvailability(String(detail?.job_status || '').trim())
            setProfileSummaryDraft(String(detail?.profile_summary || '').trim())

            setBasicInfo((prev) => ({
                ...prev,
                email: String(detail?.email || '').trim(),
                phone: String(detail?.mobile || '').trim(),
                visaStatus: String(detail?.visa_status || '').trim(),
                languages: String(detail?.language || '').trim(),
                gender: String(detail?.gender || '').trim(),
                nationality: String(detail?.nationality || '').trim(),
                dateOfBirth: String(detail?.date_of_birth || '').trim(),
                currentLocation: String(detail?.current_location || '').trim(),
                careerLevel: String(detail?.career_level || '').trim(),
                desiredSalary: String(detail?.desired_salary || '').trim(),
            }))

            const skills = String(detail?.skills || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)

            const apiQualifications = Array.isArray(detail?.user_qualification) ? detail.user_qualification : []
            const apiExperiences = Array.isArray(detail?.user_experience) ? detail.user_experience : []
            const qualificationRows = apiQualifications.length > 0 ? apiQualifications : [detail]
            const experienceRows = apiExperiences.length > 0 ? apiExperiences : [detail]
            const hasFresherExperienceFromApi =
                experienceRows.some((row) => Number(row?.fresher) === 1) || Number(detail?.fresher) === 1

            const resumeUrl = String(detail?.resume || '').trim()
            const resumeName = resumeUrl ? resumeUrl.split('/').pop() || 'Resume' : 'Resume'
            const apiLicenses = Array.isArray(detail?.licenses_certificates) ? detail.licenses_certificates : []
            const apiPortfolio = Array.isArray(detail?.user_portfolio) ? detail.user_portfolio : []
            const apiReference = Array.isArray(detail?.user_reference) ? detail.user_reference : []

            const mappedExperienceRows = hasFresherExperienceFromApi
                ? (() => {
                    const fresherRow =
                        experienceRows.find((row) => Number(row?.fresher) === 1) ||
                        (Number(detail?.fresher) === 1 ? detail : null)
                    if (!fresherRow) return []
                    return [
                        {
                            id: fresherRow?.id ?? null,
                            fresher: 1,
                            experience_job_titel: '',
                            experience_job_category: '',
                            experience_industry: '',
                            experience_company: '',
                            experience_country: '',
                            experience_job_description: '',
                            experience_start_date: '',
                            experience_end_date: '',
                            currently_working: 0,
                            title: 'Fresher',
                            subtitle: '',
                        },
                    ]
                })()
                : experienceRows
                    .map((row = {}) => {
                        const title = String(row?.experience_job_titel || '').trim()
                        const subtitle = [row?.experience_company, row?.experience_industry]
                            .filter(Boolean)
                            .join(', ')
                            .trim()
                        if (!title) return null
                        return {
                            id: row?.id ?? null,
                            fresher: Number(row?.fresher) === 1 ? 1 : 0,
                            experience_job_titel: String(row?.experience_job_titel || '').trim(),
                            experience_job_category: String(row?.experience_job_category || '').trim(),
                            experience_industry: String(row?.experience_industry || '').trim(),
                            experience_company: String(row?.experience_company || '').trim(),
                            experience_country: String(row?.experience_country || '').trim(),
                            experience_job_description: String(row?.experience_job_description || '').trim(),
                            experience_start_date: String(row?.experience_start_date || '').trim(),
                            experience_end_date: String(row?.experience_end_date || '').trim(),
                            currently_working: Number(row?.currently_working) === 1 ? 1 : 0,
                            title,
                            subtitle,
                        }
                    })
                    .filter(Boolean)

            setExt({
                qualifications: qualificationRows
                    .map((row = {}) => {
                        const title = [row?.degree, row?.specialization].filter(Boolean).join(' - ').trim()
                        const subtitle = [row?.university_name, row?.country].filter(Boolean).join(', ').trim()
                        if (!title) return null
                        return {
                            id: row?.id ?? null,
                            degree: String(row?.degree || '').trim(),
                            specialization: String(row?.specialization || '').trim(),
                            university_name: String(row?.university_name || '').trim(),
                            country: String(row?.country || '').trim(),
                            graduation_from: String(row?.graduation_from || '').trim(),
                            graduation_to: String(row?.graduation_to || '').trim(),
                            title,
                            subtitle,
                        }
                    })
                    .filter(Boolean),
                experience: mappedExperienceRows,
                skills,
                resume: resumeUrl ? { fileName: resumeName, href: resumeUrl } : null,
                digitalProfile: null,
            })
            setLicensesList(
                apiLicenses.map((row = {}, index) => ({
                    id: row?.id ?? `license-${index}`,
                    courseName: String(row?.course_name || '').trim(),
                    issuingOrganization: String(row?.issuing_organization || '').trim(),
                }))
            )
            setPortfolioList(
                apiPortfolio.map((row = {}, index) => ({
                    id: row?.id ?? `portfolio-${index}`,
                    name: String(row?.portfolio_name || row?.name || '').trim(),
                    link: String(row?.portfolio_link || row?.link || '').trim(),
                }))
            )
            setReferenceList(
                apiReference.map((row = {}, index) => ({
                    id: row?.id ?? `reference-${index}`,
                    refName: String(row?.reference_name || row?.name || '').trim(),
                    companyName: String(row?.reference_company_name || row?.company_name || '').trim(),
                    email: String(row?.reference_email || row?.email || '').trim(),
                }))
            )
        } catch (error) {
            console.error('get-user-detail error:', error)
        } finally {
            setProfileLoading(false)
        }
    }, [userData?.id])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            await fetchUserDetail()
        }
        run()
        return () => {
            cancelled = true
        }
    }, [fetchUserDetail])

    const submitUserDetail = useCallback(async (payload = {}) => {
        const userId = userData?.id
        if (!userId) return
        await addUserDetailApi.addUserDetail({
            user_id: userId,
            ...payload,
        })
        await fetchUserDetail()
    }, [fetchUserDetail, userData?.id])

    const hasQualifications = ext.qualifications.length > 0
    const hasExperience = ext.experience.length > 0
    const hasFresherExperience = ext.experience.some((row) => Number(row?.fresher) === 1)
    const hasSkills = ext.skills.length > 0
    const hasResume = ext.resume != null
    const hasDigitalProfile = ext.digitalProfile != null
    const hasPortfolio = portfolioList.length > 0
    const hasLicense = licensesList.length > 0
    const hasReference = referenceList.length > 0
    const editingPortfolio = portfolioList.find((row) => String(row?.id) === String(editingPortfolioId)) || null
    const editingLicense = licensesList.find((row) => String(row?.id) === String(editingLicenseId)) || null
    const editingReference = referenceList.find((row) => String(row?.id) === String(editingReferenceId)) || null
    const editingQualification = ext?.qualifications?.find((row) => String(row?.id) === String(editingQualificationId)) || null
    const editingExperience = ext?.experience?.find((row) => String(row?.id) === String(editingExperienceId)) || null
    const qualificationInitialData = useMemo(() => ({
        degree: editingQualification?.degree || '',
        specialization: editingQualification?.specialization || '',
        university_name: editingQualification?.university_name || '',
        country: editingQualification?.country || '',
        graduation_from: editingQualification?.graduation_from || '',
        graduation_to: editingQualification?.graduation_to || '',
    }), [editingQualification])
    const emptyQualificationInitialData = useMemo(() => ({
        degree: '',
        specialization: '',
        university_name: '',
        country: '',
        graduation_from: '',
        graduation_to: '',
    }), [])
    const experienceInitialData = useMemo(() => ({
        fresher: editingExperience?.fresher ?? 0,
        experience_job_titel: editingExperience?.experience_job_titel || '',
        experience_job_category: editingExperience?.experience_job_category || '',
        experience_industry: editingExperience?.experience_industry || '',
        experience_company: editingExperience?.experience_company || '',
        experience_country: editingExperience?.experience_country || '',
        experience_job_description: editingExperience?.experience_job_description || '',
        experience_start_date: editingExperience?.experience_start_date || '',
        experience_end_date: editingExperience?.experience_end_date || '',
        currently_working: editingExperience?.currently_working ?? 0,
    }), [editingExperience])
    const emptyExperienceInitialData = useMemo(() => ({
        fresher: 0,
        experience_job_titel: '',
        experience_job_category: '',
        experience_industry: '',
        experience_company: '',
        experience_country: '',
        experience_job_description: '',
        experience_start_date: '',
        experience_end_date: '',
        currently_working: 0,
    }), [])
    const missingSections = useMemo(() => {
        const sections = []
        if (!hasQualifications) sections.push('qualification')
        if (!hasExperience) sections.push('experience')
        if (!hasSkills) sections.push('skills')
        if (!hasResume) sections.push('resume')
        if (!hasDigitalProfile) sections.push('digitalProfile')
        if (!hasLicense) sections.push('licenses')
        if (!hasPortfolio) sections.push('portfolio')
        if (!hasReference) sections.push('reference')
        return sections
    }, [hasQualifications, hasExperience, hasSkills, hasResume, hasDigitalProfile, hasLicense, hasPortfolio, hasReference])

    return (
        <div className="w-full bg-[#f7f7f8b3] py-[28px] max-sm:py-[20px] mt-[-30px]">
            <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container">
                <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-[380px_1fr]">
                    <div className="lg:sticky lg:top-[90px] lg:self-start">
                        {profileLoading ? (
                            <aside className="overflow-visible rounded-[12px] bg-white p-[24px]">
                                <div className="flex flex-col items-center">
                                    <SkeletonBlock className="h-[130px] w-[130px] rounded-full" />
                                    <SkeletonBlock className="mt-[16px] h-[24px] w-[180px]" />
                                    <SkeletonBlock className="mt-[10px] h-[14px] w-[120px]" />
                                </div>
                                <div className="mt-[24px] rounded-[12px] bg-[#f5f9fe] p-[16px]">
                                    <SkeletonBlock className="h-[20px] w-[170px]" />
                                    <SkeletonBlock className="mt-[12px] h-[8px] w-full rounded-full" />
                                    <div className="mt-[14px] flex flex-col gap-[8px]">
                                        <SkeletonBlock className="h-[56px] w-full" />
                                        <SkeletonBlock className="h-[56px] w-full" />
                                        <SkeletonBlock className="h-[56px] w-full" />
                                    </div>
                                </div>
                            </aside>
                        ) : (
                            <ProfileJobSidebar
                                displayName={sidebarDisplayName}
                                availabilityLabel={sidebarAvailability}
                                subtitle={profileSummaryDraft}
                                profileImageSrc={sidebarProfileImage}
                                missingSections={missingSections}
                                onEditProfile={() => setEditProfileOpen(true)}
                                onSectionClick={(section) => {
                                    if (section === 'portfolio' || section === 'licenses' || section === 'reference') {
                                    if (section === 'portfolio') setEditingPortfolioId(null)
                                    if (section === 'licenses') setEditingLicenseId(null)
                                    if (section === 'reference') setEditingReferenceId(null)
                                        setSectionModal(section)
                                        return
                                    }
                                    setProfileSectionModal(section)
                                }}
                            />
                        )}
                    </div>
                    <div className='flex flex-col gap-[20px]'>
                        {profileLoading ? (
                            <>
                                <div className="rounded-[16px] bg-white p-[28px_24px]">
                                    <SkeletonBlock className="h-[24px] w-[180px]" />
                                    <div className="mt-[22px] grid grid-cols-1 gap-[16px] lg:grid-cols-2">
                                        <SkeletonBlock className="h-[40px] w-full" />
                                        <SkeletonBlock className="h-[40px] w-full" />
                                        <SkeletonBlock className="h-[40px] w-full" />
                                        <SkeletonBlock className="h-[40px] w-full" />
                                    </div>
                                </div>
                                <div className="rounded-[16px] bg-white p-[28px_24px]">
                                    <SkeletonBlock className="h-[24px] w-[160px]" />
                                    <SkeletonBlock className="mt-[20px] h-[18px] w-[90%]" />
                                    <SkeletonBlock className="mt-[10px] h-[18px] w-[70%]" />
                                </div>
                            </>
                        ) : (
                            <>
                        <div className="rounded-[16px] bg-white p-[28px_24px]">
                            <div className="mb-[30px] flex items-center justify-between gap-[12px]">
                                <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Basic Info</h2>
                                <button
                                    type="button"
                                    onClick={() => setBasicInfoEditOpen(true)}
                                    className="inline-flex cursor-pointer items-center gap-[6px] text-[16px] font-[Inter-Medium] text-[#23262A]"
                                >
                                    <EditIcon className="h-[20px] w-[20px] shrink-0" fill="#6B7280" width={20} height={20} />
                                    Edit
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-x-[48px] gap-y-[22px] lg:grid-cols-2">
                                <div className="flex flex-col gap-[30px]">
                                    <InfoRow
                                        icon={<Image src={email} alt="email" width={20} height={20} className="h-[20px] w-[20px]" />}
                                        label="Email"
                                        value={displayBasicValue(basicInfo.email, 'N/A')}
                                    />
                                    {isEmptyBasicField(basicInfo.visaStatus) ? (
                                        <BasicInfoAddLink
                                            label="Add Visa Status"
                                            onClick={() => setBasicModalField('visaStatus')}
                                        />
                                    ) : (
                                        <InfoRow
                                            icon={<Image src={visa} alt="visa" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            label="Visa Status"
                                            value={basicInfo.visaStatus}
                                        />
                                    )}
                                    {isEmptyBasicField(basicInfo.languages) ? (
                                        <BasicInfoAddLink label="Add Languages" onClick={() => setBasicModalField('languages')} />
                                    ) : (
                                        <InfoRow
                                            icon={<Image src={language} alt="language" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            label="Languages"
                                            value={basicInfo.languages}
                                        />
                                    )}
                                    {isEmptyBasicField(basicInfo.dateOfBirth) ? (
                                        // <BasicInfoAddLink label="Add Date of Birth" onClick={() => setBasicModalField('dateOfBirth')} />
                                        <></>
                                    ) : (
                                        <InfoRow
                                            icon={<Image src={calendar} alt="calendar" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            label="Date of Birth"
                                            value={basicInfo.dateOfBirth}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-[30px]">
                                    <InfoRow
                                        icon={<Image src={call} alt="call" width={20} height={20} className="h-[20px] w-[20px]" />}
                                        label="Phone"
                                        value={displayBasicValue(basicInfo.phone, 'N/A')}
                                    />
                                    {isEmptyBasicField(basicInfo.gender) ? (
                                        <BasicInfoAddLink label="Add Gender" onClick={() => setBasicModalField('gender')} />
                                    ) : (
                                        <InfoRow
                                            icon={<Image src={user} alt="user" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            label="Gender"
                                            value={basicInfo.gender}
                                        />
                                    )}
                                    {isEmptyBasicField(basicInfo.nationality) ? (
                                        <BasicInfoAddLink label="Add Nationality" onClick={() => setBasicModalField('nationality')} />
                                    ) : (
                                        <InfoRow
                                            icon={<Image src={nation} alt="nation" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            label="Nationality"
                                            value={basicInfo.nationality}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {!hasQualifications ? (
                            <EmptyProfileSection
                                title="Qualifications"
                                description={EMPTY_COPY.qualifications}
                                icon={<GraduationIcon width={22} height={22} fill="#6B7280" />}
                                onAddClick={() => {
                                    setQualificationEditMode(false)
                                    setEditingQualificationId(null)
                                    setProfileSectionModal('qualification')
                                }}
                            />
                        ) : (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[30px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Qualifications</h2>
                                    <div className="flex items-center gap-[28px]">
                                        <SectionAction
                                            label="Add"
                                            onClick={() => {
                                                setQualificationEditMode(false)
                                                setEditingQualificationId(null)
                                                setProfileSectionModal('qualification')
                                            }}
                                            icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                        />
                                        <SectionAction
                                            label="Edit"
                                            onClick={() => setEditSectionModal('qualification')}
                                            icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-[14px] max-sm:grid-cols-1'>
                                    {ext.qualifications.map((row, i) => (
                                        <PlaceholderRow
                                            key={i}
                                            icon={<Image src={graduatecap} alt="" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            title={row.title}
                                            subtitle={row.subtitle}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasExperience ? (
                            <EmptyProfileSection
                                title="Experience"
                                description={EMPTY_COPY.experience}
                                icon={<Image src={workgrey} alt="" width={22} height={22} className="h-[22px] w-[22px]" />}
                                onAddClick={() => {
                                    setExperienceEditMode(false)
                                    setEditingExperienceId(null)
                                    setProfileSectionModal('experience')
                                }}
                            />
                        ) : (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[30px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Experience</h2>
                                    <div className="flex items-center gap-[28px]">
                                        {!hasFresherExperience ? (
                                            <SectionAction
                                                label="Add"
                                                onClick={() => {
                                                    setExperienceEditMode(false)
                                                    setEditingExperienceId(null)
                                                    setProfileSectionModal('experience')
                                                }}
                                                icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                            />
                                        ) : null}
                                        <SectionAction
                                            label="Edit"
                                            onClick={() => {
                                                if (hasFresherExperience) {
                                                    const fresherRow =
                                                        ext.experience.find((row) => Number(row?.fresher) === 1) || null
                                                    setExperienceEditMode(true)
                                                    setEditingExperienceId(fresherRow?.id ?? null)
                                                    setProfileSectionModal('experience')
                                                    return
                                                }
                                                setEditSectionModal('experience')
                                            }}
                                            icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
                                    {ext.experience.map((row, i) => (
                                        <PlaceholderRow
                                            key={i}
                                            icon={<Image src={work} alt="" width={20} height={20} className="h-[20px] w-[20px]" />}
                                            title={row.title}
                                            subtitle={row.subtitle}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasSkills ? (
                            <EmptyProfileSection
                                title="Skills"
                                description={EMPTY_COPY.skills}
                                icon={<SkillsIcon width={22} height={22} fill="#6B7280" />}
                                onAddClick={() => setProfileSectionModal('skills')}
                            />
                        ) : (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[20px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Skills</h2>
                                    <SectionAction
                                        label="Edit"
                                        onClick={() => setEditSectionModal('skills')}
                                        icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-[10px]">
                                    {ext.skills.map((label) => (
                                        <SkillChip key={label} label={label} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasResume ? (
                            <EmptyProfileSection
                                title="Resume"
                                description={EMPTY_COPY.resume}
                                icon={<FileIcon width={22} height={22} fill="#6B7280" />}
                                onAddClick={() => setProfileSectionModal('resume')}
                            />
                        ) : (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[20px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Resume</h2>
                                    <SectionAction
                                        label="Edit"
                                        onClick={() => setEditSectionModal('resume')}
                                        icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                    />
                                </div>
                                <div className="w-[50%] max-sm:w-full overflow-hidden rounded-[6px] bg-[#d8e2ff]">
                                    <div className="relative flex items-center justify-center rounded-[6px] bg-[#d8e2ff] p-[14px_0_10px]">
                                        <Image src={resume} alt="resume" width={80} height={80} className="h-auto w-auto" />
                                    </div>
                                    <div className="relative z-[9] flex items-center justify-between gap-[12px] bg-[#f5f9fe] p-[8px_16px]">
                                        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                                            <div className="shrink-0">
                                                <FileIcon className="h-[28px] w-[28px]" fill="#3a88ef" width={28} height={28} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="mb-[2px] text-[14px] font-[Inter-Regular] text-[#23262A]">Resume</h4>
                                                {/*
                                                 * Guard against partial resume payloads so UI doesn't crash
                                                 * when fileName/href are missing.
                                                 */}
                                                <p
                                                    className="truncate text-[12px] font-[Inter-Regular] text-[#23262A]"
                                                    title={ext.resume?.fileName || 'Resume'}
                                                >
                                                    {ext.resume?.fileName || 'Resume'}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={ext.resume?.href || '#'}
                                            className="flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-[rgba(143,143,143,0.25)] p-[8px_16px] text-[13px] font-[Inter-Medium] text-[#23262A] transition-colors hover:bg-[#F3F4F6]"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!hasDigitalProfile ? (
                            <EmptyProfileSection
                                title="Digital Profile"
                                description={EMPTY_COPY.digitalProfile}
                                icon={<MicIcon width={22} height={22} fill="#6B7280" fillOpacity="1" />}
                                onAddClick={() => setProfileSectionModal('digitalProfile')}
                            />
                        ) : (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[24px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Digital Profile</h2>
                                    <SectionAction
                                        label="Add"
                                        onClick={() => setProfileSectionModal('digitalProfile')}
                                        icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                    />
                                </div>
                                <div className="flex items-center gap-[10px]">
                                    <MicIcon fillOpacity="1" className="h-[24px] w-[24px]" width={24} height={24} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#666B72]">{EMPTY_COPY.digitalProfile}</p>
                                </div>
                            </div>
                        )}
                        {hasPortfolio ? (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[18px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Portfolio</h2>
                                    <div className="flex items-center gap-[28px]">
                                        <SectionAction
                                            label="Add"
                                            onClick={() => {
                                                setEditingPortfolioId(null)
                                                setSectionModal('portfolio')
                                            }}
                                            icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                        />
                                        <SectionAction
                                            label="Edit"
                                            onClick={() => setEditSectionModal('portfolio')}
                                            icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-[14px] max-sm:grid-cols-1'>
                                    {portfolioList.map((row) => (
                                        <PlaceholderRow
                                            key={`portfolio-${row.id}`}
                                            icon={
                                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#EDF0FF]">
                                                    <PortfolioIcon width={18} height={18} fill="#3A88EF" />
                                                </div>
                                            }
                                            title={row.name}
                                            subtitle={row.link}
                                            subtitleHref={row.link}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {hasReference ? (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[18px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Reference</h2>
                                    <div className="flex items-center gap-[28px]">
                                        <SectionAction
                                            label="Add"
                                            onClick={() => {
                                                setEditingReferenceId(null)
                                                setSectionModal('reference')
                                            }}
                                            icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                        />
                                        <SectionAction
                                            label="Edit"
                                            onClick={() => setEditSectionModal('reference')}
                                            icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-[14px] max-sm:grid-cols-1'>
                                    {referenceList.map((row) => (
                                        <div key={`reference-${row.id}`} className="flex items-start gap-[14px]">
                                            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#EDF0FF]">
                                                <PersonalUserIcon width={18} height={18} fill="#3A88EF" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#23262A] truncate">
                                                    {row.refName}
                                                </h4>
                                                <p className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate">
                                                    {row.companyName}
                                                </p>
                                                <p className="mt-[4px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] truncate">
                                                    {row.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {hasLicense ? (
                            <div className="rounded-[16px] bg-white p-[28px_24px]">
                                <div className="mb-[18px] flex items-center justify-between gap-[12px]">
                                    <h2 className="text-[20px] font-[Inter-Bold] leading-tight text-[#23262A]">Licenses or Certificates</h2>
                                    <div className="flex items-center gap-[28px]">
                                        <SectionAction
                                            label="Add"
                                            onClick={() => {
                                                setEditingLicenseId(null)
                                                setSectionModal('licenses')
                                            }}
                                            icon={<PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />}
                                        />
                                        <SectionAction
                                            label="Edit"
                                            onClick={() => setEditSectionModal('licenses')}
                                            icon={<EditIcon className="h-[20px] w-[20px]" fill="#6B7280" width={20} height={20} />}
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-[14px] max-sm:grid-cols-1'>
                                    {licensesList.map((row) => (
                                        <PlaceholderRow
                                            key={`license-${row.id}`}
                                            icon={
                                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#EDF0FF]">
                                                    <Image src={license} alt="license" width={12} height={12} />
                                                </div>
                                            }
                                            title={row.courseName}
                                            subtitle={row.issuingOrganization}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {!(hasPortfolio && hasReference && hasLicense) ? (
                            <button
                                type="button"
                                onClick={() => setIsAddSectionModalOpen(true)}
                                className="flex w-full cursor-pointer items-center justify-center gap-[8px] text-[16px] font-[Inter-SemiBold] text-[#23262A]"
                            >
                                <PlusIcon className="h-[20px] w-[20px]" width={20} height={20} fill="#6B7280" />
                                Add More Sections
                            </button>
                        ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <CommonBasicModal
                open={basicModalField != null}
                field={basicModalField}
                initialValue={basicModalField ? basicInfo[basicModalField] ?? '' : ''}
                onClose={() => setBasicModalField(null)}
                onSave={(key, value) => setBasicInfo((b) => ({ ...b, [key]: value }))}
            />
            <BasicInfoModal
                open={basicInfoEditOpen}
                onClose={() => setBasicInfoEditOpen(false)}
                initialData={{
                    email: basicInfo.email,
                    mobile: basicInfo.phone,
                    gender: basicInfo.gender,
                    date_of_birth: basicInfo.dateOfBirth,
                    language: basicInfo.languages,
                    nationality: basicInfo.nationality,
                    current_location: basicInfo.currentLocation,
                    visa_status: basicInfo.visaStatus,
                    career_level: basicInfo.careerLevel,
                    desired_salary: basicInfo.desiredSalary,
                }}
                onSave={(form) =>
                    submitUserDetail({
                        email_id: form?.email,
                        mobile: form?.phone,
                        gender: form?.gender,
                        date_of_birth: form?.dateOfBirth,
                        language: form?.language,
                        nationality: form?.nationality,
                        current_location: form?.currentLocation,
                        visa_status: form?.visa,
                        career_level: form?.careerLevel,
                        desired_salary: form?.desiredSalary,
                    })
                }
            />
            <AddSectionModal
                open={isAddSectionModalOpen}
                onClose={() => setIsAddSectionModalOpen(false)}
                hidePortfolio={hasPortfolio}
                hideLicenses={hasLicense}
                hideReference={hasReference}
                onSectionClick={(section) => {
                    setIsAddSectionModalOpen(false)
                    setSectionModal(section)
                }}
            />
            <QualificationModal
                open={profileSectionModal === 'qualification'}
                onClose={() => {
                    setProfileSectionModal(null)
                    setQualificationEditMode(false)
                    setEditingQualificationId(null)
                }}
                initialData={qualificationEditMode ? qualificationInitialData : emptyQualificationInitialData}
                onSave={(form) => {
                    submitUserDetail({
                        ...(qualificationEditMode && editingQualificationId ? { qualification_id: editingQualificationId } : {}),
                        degree: form?.degree,
                        specialization: form?.specialization,
                        university_name: form?.university,
                        country: form?.country,
                        graduation_from: form?.graduationYearPrimary,
                        graduation_to: form?.graduationYearSecondary,
                    })
                    setQualificationEditMode(false)
                    setEditingQualificationId(null)
                }}
            />
            <ExperienceModal
                open={profileSectionModal === 'experience'}
                onClose={() => {
                    setProfileSectionModal(null)
                    setExperienceEditMode(false)
                    setEditingExperienceId(null)
                }}
                initialData={experienceEditMode ? experienceInitialData : emptyExperienceInitialData}
                onSave={(form) => {
                    const isFresher = form?.mode === 'fresher'
                    submitUserDetail({
                        ...(experienceEditMode && editingExperienceId ? { experience_id: editingExperienceId } : {}),
                        fresher: isFresher ? 1 : 0,
                        experience_job_titel: isFresher ? '' : form?.jobTitle,
                        experience_job_category: isFresher ? '' : form?.jobCategory,
                        experience_industry: isFresher ? '' : form?.industry,
                        experience_company: isFresher ? '' : form?.company,
                        experience_country: isFresher ? '' : form?.country,
                        experience_job_description: isFresher ? '' : form?.description,
                        experience_start_date: isFresher ? '' : form?.startDate,
                        experience_end_date: isFresher ? '' : form?.endDate,
                        currently_working: isFresher ? 0 : form?.currentlyWorking ? 1 : 0,
                    })
                    setExperienceEditMode(false)
                    setEditingExperienceId(null)
                }}
            />
            <SkillsModal
                open={profileSectionModal === 'skills'}
                onClose={() => setProfileSectionModal(null)}
                initialSkills={ext.skills || []}
                onSave={(skills) => {
                    const skillsValue = Array.isArray(skills) ? skills.filter(Boolean).join(', ') : ''
                    submitUserDetail({ skills: skillsValue })
                }}
            />
            <ResumeModal
                open={profileSectionModal === 'resume'}
                onClose={() => setProfileSectionModal(null)}
                initialFileUrl={ext.resume?.href || ''}
                onSave={(file) => {
                    if (!file) return
                    submitUserDetail({ resume: file })
                }}
            />
            <DigitalProfileModal
                open={profileSectionModal === 'digitalProfile'}
                onClose={() => setProfileSectionModal(null)}
                onAddAudio={() => {
                    setProfileSectionModal(null)
                    setIntroModalVariant('audio')
                }}
                onAddVideo={() => {
                    setProfileSectionModal(null)
                    setIntroModalVariant('video')
                }}
            />
            <IntroductionsModal
                open={introModalVariant != null}
                variant={introModalVariant || 'video'}
                onClose={() => setIntroModalVariant(null)}
                onSave={() => setIntroModalVariant(null)}
            />
            <EditModal
                open={editSectionModal != null}
                title={
                    editSectionModal === 'qualification'
                        ? 'Qualifications'
                        : editSectionModal === 'experience'
                            ? 'Experience'
                            : editSectionModal === 'skills'
                                ? 'Skills'
                                : editSectionModal === 'resume'
                                    ? 'Resume'
                                    : editSectionModal === 'digitalProfile'
                                        ? 'Digital Profile'
                                        : editSectionModal === 'portfolio'
                                            ? 'Portfolio'
                                            : editSectionModal === 'reference'
                                                ? 'Reference'
                                                : 'Licenses or Certificates'
                }
                onClose={() => setEditSectionModal(null)}
            >
                {editSectionModal === 'portfolio' ? (
                    portfolioList.map((row) => (
                        <EditModal.Row
                            key={`edit-portfolio-${row.id}`}
                            icon={<PortfolioIcon width={18} height={18} fill="#3A88EF" />}
                            title={row.name || 'N/A'}
                            subtitle={row.link}
                            subtitleHref={row.link}
                            onDelete={async () => {
                                await submitUserDetail({
                                    type: 'user_portfolio',
                                    user_portfolio_id: row.id,
                                })
                            }}
                            onEdit={() => {
                                setEditingPortfolioId(row.id)
                                setEditSectionModal(null)
                                setSectionModal('portfolio')
                            }}
                        />
                    ))
                ) : null}
                {editSectionModal === 'reference' ? (
                    referenceList.map((row) => (
                        <EditModal.Row
                            key={`edit-reference-${row.id}`}
                            icon={<PersonalUserIcon width={18} height={18} fill="#3A88EF" />}
                            title={row.refName || 'N/A'}
                            subtitle={`${row.companyName}${row.email ? ` ${row.email}` : ''}`.trim()}
                            onDelete={async () => {
                                await submitUserDetail({
                                    type: 'user_reference',
                                    user_reference_id: row.id,
                                })
                            }}
                            onEdit={() => {
                                setEditingReferenceId(row.id)
                                setEditSectionModal(null)
                                setSectionModal('reference')
                            }}
                        />
                    ))
                ) : null}
                {editSectionModal === 'licenses' ? (
                    licensesList.map((row) => (
                        <EditModal.Row
                            key={`edit-license-${row.id}`}
                            icon={<Image src={license} alt="license" width={12} height={12} />}
                            title={row.courseName || 'N/A'}
                            subtitle={row.issuingOrganization}
                            onDelete={async () => {
                                await submitUserDetail({
                                    type: 'licenses_certificates',
                                    licenses_certificates_id: row.id,
                                })
                            }}
                            onEdit={() => {
                                setEditingLicenseId(row.id)
                                setEditSectionModal(null)
                                setSectionModal('licenses')
                            }}
                        />
                    ))
                ) : null}
                {editSectionModal === 'qualification' ? (
                    ext.qualifications.map((row) => (
                        <EditModal.Row
                            key={`edit-qualification-${row.id}`}
                            icon={<Image src={graduatecap} alt="graduatecap" width={16} height={16} />}
                            title={row.title || 'N/A'}
                            subtitle={row.subtitle || ''}
                            onDelete={async () => {
                                if (!row?.id) {
                                    setEditSectionModal(null)
                                    return
                                }
                                await submitUserDetail({
                                    type: 'user_qualification',
                                    qualification_id: row.id,
                                })
                                setEditSectionModal(null)
                            }}
                            onEdit={() => {
                                setEditSectionModal(null)
                                setQualificationEditMode(true)
                                setEditingQualificationId(row.id)
                                setProfileSectionModal('qualification')
                            }}
                        />
                    ))
                ) : null}
                {editSectionModal === 'experience' ? (
                    ext.experience.map((row) => (
                        <EditModal.Row
                            key={`edit-experience-${row.id}`}
                            icon={<Image src={work} alt="work" width={16} height={16} />}
                            title={row.title || 'N/A'}
                            subtitle={row.subtitle || ''}
                            onDelete={async () => {
                                if (!row?.id) {
                                    setEditSectionModal(null)
                                    return
                                }
                                await submitUserDetail({
                                    type: 'user_experience',
                                    experience_id: row.id,
                                })
                                setEditSectionModal(null)
                            }}
                            onEdit={() => {
                                setEditSectionModal(null)
                                setExperienceEditMode(true)
                                setEditingExperienceId(row.id)
                                setProfileSectionModal('experience')
                            }}
                        />
                    ))
                ) : null}
                {editSectionModal === 'skills' ? (
                    <EditModal.Row
                        icon={<SkillsIcon width={16} height={16} fill="#3A88EF" fillOpacity="1" />}
                        title={ext.skills?.[0] || 'N/A'}
                        subtitle=""
                        onDelete={() => setEditSectionModal(null)}
                        onEdit={() => {
                            setEditSectionModal(null)
                            setProfileSectionModal('skills')
                        }}
                    />
                ) : null}
                {editSectionModal === 'resume' ? (
                    <EditModal.Row
                        icon={<FileIcon width={16} height={16} fill="#3A88EF" fillOpacity="1" />}
                        title={ext.resume?.fileName || 'Resume'}
                        subtitle=""
                        onDelete={() => setEditSectionModal(null)}
                        onEdit={() => {
                            setEditSectionModal(null)
                            setProfileSectionModal('resume')
                        }}
                    />
                ) : null}
                {editSectionModal === 'digitalProfile' ? (
                    <EditModal.Row
                        icon={<MicIcon width={16} height={16} fill="#3A88EF" fillOpacity="1" />}
                        title="Digital Profile"
                        subtitle="Add your introduction"
                        onDelete={() => setEditSectionModal(null)}
                        onEdit={() => {
                            setEditSectionModal(null)
                            setProfileSectionModal('digitalProfile')
                        }}
                    />
                ) : null}
            </EditModal>
            <EditProfileModal
                open={editProfileOpen}
                onClose={() => setEditProfileOpen(false)}
                initialName={sidebarDisplayName}
                initialSummary={profileSummaryDraft}
                initialAvailability={sidebarAvailability}
                initialAvatarUrl={sidebarProfileImage}
                onSave={({ name, availability, summary, profileFile }) => {
                    setSidebarDisplayName(String(name).trim())
                    setSidebarAvailability(String(availability ?? '').trim())
                    setProfileSummaryDraft(String(summary ?? '').trim())
                    submitUserDetail({
                        name: String(name || '').trim(),
                        job_status: String(availability ?? '').trim(),
                        profile_summary: String(summary ?? '').trim(),
                        ...(profileFile ? { profile: profileFile } : {}),
                    })
                }}
            />
            <PortfolioModal
                open={sectionModal === 'portfolio'}
                onClose={() => {
                    setSectionModal(null)
                    setEditingPortfolioId(null)
                }}
                initialName={editingPortfolio?.name || ''}
                initialLink={editingPortfolio?.link || ''}
                onSave={async (form) => {
                    await submitUserDetail({
                        ...(editingPortfolioId ? { user_portfolio_id: editingPortfolioId } : {}),
                        portfolio_name: form?.name,
                        portfolio_link: form?.link,
                    })
                    setEditingPortfolioId(null)
                }}
            />
            <LicensesCertificatesModal
                open={sectionModal === 'licenses'}
                onClose={() => {
                    setSectionModal(null)
                    setEditingLicenseId(null)
                }}
                initialCourseName={editingLicense?.courseName || ''}
                initialOrganization={editingLicense?.issuingOrganization || ''}
                onSave={async (form) => {
                    await submitUserDetail({
                        ...(editingLicenseId ? { licenses_certificates_id: editingLicenseId } : {}),
                        course_name: form?.courseName,
                        issuing_organization: form?.issuingOrganization,
                    })
                    setEditingLicenseId(null)
                }}
            />
            <ReferenceModal
                open={sectionModal === 'reference'}
                onClose={() => {
                    setSectionModal(null)
                    setEditingReferenceId(null)
                }}
                initialRefName={editingReference?.refName || ''}
                initialCompanyName={editingReference?.companyName || ''}
                initialEmail={editingReference?.email || ''}
                onSave={async (form) => {
                    await submitUserDetail({
                        ...(editingReferenceId ? { user_reference_id: editingReferenceId } : {}),
                        reference_name: form?.refName,
                        reference_company_name: form?.companyName,
                        reference_email: form?.email,
                    })
                    setEditingReferenceId(null)
                }}
            />
        </div>
    )
}

export default JobProfile
