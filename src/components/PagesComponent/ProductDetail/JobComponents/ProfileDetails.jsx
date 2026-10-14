/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { addUserDetailApi, getUserDetailApi } from '@/utils/api'
import BasicInfoModal from './BasicInfoModal'
import DigitalProfileModal from './DigitalProfileModal'
import IntroductionsModal from './IntroductionsModal'
import SkillsModal from './SkillsModal'
import ResumeModal from './ResumeModal'
import ExperienceModal from './ExperienceModal'
import QualificationModal from './QualificationModal'
import basicinfo from '../../../../../public/assets/img/icons/basicinfo.svg'
import work from '../../../../../public/assets/img/icons/work.svg'
import graduatecap from '../../../../../public/assets/img/icons/graduatecap.svg'
import skillsIcon from '../../../../../public/assets/img/profile/skills.svg'
import resumeIcon from '../../../../../public/assets/img/icons/briefcase.svg'
import micIcon from '../../../../../public/assets/img/profile/mic.svg'
import addcircle from '../../../../../public/assets/img/icons/addcircle.svg'

const DEFAULT_STEPS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'qualification', label: 'Qualification' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'resume', label: 'Resume' },
    { id: 'digitalProfile', label: 'Digital Profile' },
]

const hasValue = (v) => {
    if (v == null) return false
    if (Array.isArray(v)) return v.some((x) => hasValue(x))
    return String(v).trim() !== ''
}

const getList = (v) => (Array.isArray(v) ? v : [])

const hasBasicSectionData = (d) => {
    return (
        hasValue(d.email) &&
        hasValue(d.mobile) &&
        hasValue(d.date_of_birth) &&
        hasValue(d.language) &&
        hasValue(d.nationality) &&
        hasValue(d.current_location) &&
        hasValue(d.visa_status) &&
        hasValue(d.career_level) &&
        hasValue(d.desired_salary)
    )
}

const hasQualificationRecord = (item) => {
    const q = item || {}
    return (
        hasValue(q.degree) &&
        hasValue(q.specialization) &&
        hasValue(q.university_name) &&
        hasValue(q.country) &&
        hasValue(q.graduation_from) &&
        hasValue(q.graduation_to)
    )
}

const hasExperienceRecord = (item) => {
    const e = item || {}
    const fresher = Number(e.fresher) === 1
    if (fresher) return true
    const currentlyWorking = Number(e.currently_working) === 1
    return (
        hasValue(e.experience_job_titel) &&
        hasValue(e.experience_job_category) &&
        hasValue(e.experience_industry) &&
        hasValue(e.experience_company) &&
        hasValue(e.experience_country) &&
        hasValue(e.experience_job_description) &&
        hasValue(e.experience_start_date) &&
        (currentlyWorking || hasValue(e.experience_end_date))
    )
}

const isStepComplete = (stepId, data) => {
    const d = data || {}
    if (stepId === 'basic') {
        return hasBasicSectionData(d)
    }
    if (stepId === 'qualification') {
        return hasQualificationRecord(d) || getList(d.user_qualification).some(hasQualificationRecord)
    }
    if (stepId === 'experience') {
        return hasExperienceRecord(d) || getList(d.user_experience).some(hasExperienceRecord)
    }
    if (stepId === 'skills') return hasValue(d.skills)
    if (stepId === 'resume') return hasValue(d.resume)
    if (stepId === 'digitalProfile') {
        return (
            hasValue(d.digital_profile_audio) ||
            hasValue(d.digital_profile_video) ||
            hasValue(d.audio_introduction) ||
            hasValue(d.video_introduction) ||
            hasValue(d.introduction_audio) ||
            hasValue(d.introduction_video) ||
            hasValue(d.audio_intro) ||
            hasValue(d.video_intro) ||
            getList(d.user_portfolio).length > 0 ||
            getList(d.user_reference).length > 0
        )
    }
    return false
}


/**
 * Job profile completion card: strength headline, progress, current step row, prev/next.
 * @param {number} [stepsRemaining] — Override headline count; default derives from `steps` and current index.
 */
export default function ProfileDetails({
    className = '',
    stepsRemaining,
    strengthLabel = 'Beginner',
    progressPercent = 12,
    steps = DEFAULT_STEPS,
    initialStepIndex = 0,
    onStepChange,
    onAddSection,
    onBasicInfoSave,
    onSkillsSave,
    onDigitalProfileSave,
    onResumeSave,
    onExperienceSave,
    brandName = 'ebozor',
}) {
    const userData = useSelector(userSignUpData)
    const [stepIndex, setStepIndex] = useState(initialStepIndex)
    const [basicInfoOpen, setBasicInfoOpen] = useState(false)
    const [skillsOpen, setSkillsOpen] = useState(false)
    const [digitalProfileOpen, setDigitalProfileOpen] = useState(false)
    const [introductionsOpen, setIntroductionsOpen] = useState(false)
    const [resumeOpen, setResumeOpen] = useState(false)
    const [experienceOpen, setExperienceOpen] = useState(false)
    const [qualificationOpen, setQualificationOpen] = useState(false)
    const [introductionVariant, setIntroductionVariant] = useState('video')
    const [jobApplicationInfo, setJobApplicationInfo] = useState(null)

    const fetchJobApplicationInfo = useCallback(async () => {
        const userId = userData?.id
        if (!userId) {
            setJobApplicationInfo(null)
            return
        }
        try {
            const response = await getUserDetailApi.getUserDetail({ user_id: userId })
            const payload = response?.data
            const data =
                payload?.data && typeof payload?.data === 'object'
                    ? payload.data
                    : null
            setJobApplicationInfo(data)
        } catch (e) {
            setJobApplicationInfo(null)
        }
    }, [userData])

    useEffect(() => {
        fetchJobApplicationInfo()
    }, [fetchJobApplicationInfo])

    const skillsInitial = useMemo(() => {
        const raw = jobApplicationInfo?.skills
        if (Array.isArray(raw)) return raw.filter(Boolean).map((x) => String(x))
        if (typeof raw === 'string') {
            return raw
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
        }
        return []
    }, [jobApplicationInfo])

    const activeSteps = useMemo(
        () => (Array.isArray(steps) ? steps : []).filter((s) => !isStepComplete(s?.id, jobApplicationInfo)),
        [steps, jobApplicationInfo]
    )

    const total = activeSteps.length
    const current = activeSteps[stepIndex] || null

    useEffect(() => {
        if (stepIndex <= total - 1) return
        setStepIndex(Math.max(0, total - 1))
    }, [stepIndex, total])

    const remainingTitle =
        typeof stepsRemaining === 'number' ? stepsRemaining : Math.max(0, total)

    const currentIcon =
        current?.id === 'basic'
            ? basicinfo
            : current?.id === 'experience'
            ? work
            : current?.id === 'qualification'
            ? graduatecap
            : current?.id === 'skills'
            ? skillsIcon
            : current?.id === 'resume'
            ? resumeIcon
            : current?.id === 'digitalProfile'
            ? micIcon
            : basicinfo

    const goPrev = useCallback(() => {
        setStepIndex((i) => {
            const next = Math.max(0, i - 1)
            onStepChange?.(next, activeSteps[next])
            return next
        })
    }, [onStepChange, activeSteps])

    const goNext = useCallback(() => {
        setStepIndex((i) => {
            const next = Math.min(total - 1, i + 1)
            onStepChange?.(next, activeSteps[next])
            return next
        })
    }, [onStepChange, activeSteps, total])

    const atStart = stepIndex <= 0
    const atEnd = stepIndex >= total - 1
    const pct = Math.min(100, Math.max(0, progressPercent))

    const submitUserDetail = useCallback(
        async (payload) => {
            const userId = userData?.id
            if (!userId) return
            await addUserDetailApi.addUserDetail({ user_id: userId, ...(payload || {}) })
            await fetchJobApplicationInfo()
        },
        [userData, fetchJobApplicationInfo]
    )

    const handleSaveBasicInfo = useCallback(
        async (form) => {
            await submitUserDetail({
                email_id: form?.email,
                mobile: form?.phone,
                date_of_birth: form?.dateOfBirth,
                language: form?.language,
                nationality: form?.nationality,
                current_location: form?.currentLocation,
                visa_status: form?.visa,
                career_level: form?.careerLevel,
                desired_salary: form?.desiredSalary,
            })
            onBasicInfoSave?.(form)
        },
        [submitUserDetail, onBasicInfoSave]
    )

    const handleSaveQualification = useCallback(
        async (form) => {
            await submitUserDetail({
                degree: form?.degree,
                specialization: form?.specialization,
                university_name: form?.university,
                country: form?.country,
                graduation_from: form?.graduationYearPrimary,
                graduation_to: form?.graduationYearSecondary,
            })
        },
        [submitUserDetail]
    )

    const handleSaveSkills = useCallback(
        async (skillsList) => {
            const skills = Array.isArray(skillsList) ? skillsList.filter(Boolean).join(', ') : ''
            await submitUserDetail({ skills })
            onSkillsSave?.(skillsList)
        },
        [submitUserDetail, onSkillsSave]
    )

    const handleSaveExperience = useCallback(
        async (form) => {
            const isFresher = form?.mode === 'fresher'
            await submitUserDetail({
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
            onExperienceSave?.(form)
        },
        [submitUserDetail, onExperienceSave]
    )

    const handleSaveResume = useCallback(
        async (file) => {
            if (!file) return
            await submitUserDetail({ resume: file })
            onResumeSave?.(file)
        },
        [submitUserDetail, onResumeSave]
    )

    const handleSaveDigitalProfile = useCallback(
        (payload) => {
            const variant = payload?.variant
            if (variant === 'audio') {
                setJobApplicationInfo((prev) => ({ ...(prev || {}), digital_profile_audio: 'recorded' }))
            } else if (variant === 'video') {
                setJobApplicationInfo((prev) => ({ ...(prev || {}), digital_profile_video: 'recorded' }))
            }
            onDigitalProfileSave?.(payload)
        },
        [onDigitalProfileSave]
    )

    if (!total) return null

    return (
        <div
            className={`rounded-[12px] border border-[#d8e7fc] bg-[#f5f9fe] p-[16px] ${className}`.trim()}
        >
            <div className="flex flex-col gap-[4px] mb-[20px]">
                <h3 className="text-[16px] font-[Inter-SemiBold] leading-snug text-[#23262A] ">
                    {remainingTitle} more steps to get hired faster
                </h3>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Your Profile strength: {strengthLabel}
                </p>
            </div>

            <div className="mb-[20px] h-[10px] overflow-hidden rounded-full bg-[#DCE8FC]">
                <div
                    className="h-full rounded-full bg-[#3A88EF] transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Profile completion"
                />
            </div>

            {current ? (
                <div
                    onClick={() => {
                        if (current.id === 'basic') setBasicInfoOpen(true)
                        if (current.id === 'skills') setSkillsOpen(true)
                        if (current.id === 'digitalProfile') setDigitalProfileOpen(true)
                        if (current.id === 'resume') setResumeOpen(true)
                        if (current.id === 'experience') setExperienceOpen(true)
                        if (current.id === 'qualification') setQualificationOpen(true)
                    }}
                    aria-haspopup={
                        current.id === 'basic' ||
                        current.id === 'skills' ||
                        current.id === 'digitalProfile' ||
                        current.id === 'resume' ||
                        current.id === 'experience' ||
                        current.id === 'qualification'
                            ? 'dialog'
                            : undefined
                    }
                    className={`mb-[20px] flex items-center gap-[14px] rounded-[6px] bg-white p-[10px] shadow-[0px_1px_3px_rgba(0,0,0,0.06)] ${
                        current.id === 'basic' ||
                        current.id === 'skills' ||
                        current.id === 'digitalProfile' ||
                        current.id === 'resume' ||
                        current.id === 'experience' ||
                        current.id === 'qualification'
                            ? 'cursor-pointer transition-colors hover:bg-[#FAFCFF]'
                            : ''
                    }`}
                >
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] bg-[#f5f9fe]">
                        <Image src={currentIcon} alt={current.label} width={20} height={20} />
                    </div>
                    <p className="min-w-0 flex-1 text-left text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                        {current.label}
                    </p>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (current.id === 'basic') setBasicInfoOpen(true)
                            else if (current.id === 'skills') setSkillsOpen(true)
                            else if (current.id === 'digitalProfile') setDigitalProfileOpen(true)
                            else if (current.id === 'resume') setResumeOpen(true)
                            else if (current.id === 'experience') setExperienceOpen(true)
                            else if (current.id === 'qualification') setQualificationOpen(true)
                            else onAddSection?.(current, stepIndex)
                        }}
                        className="flex shrink-0 cursor-pointer items-center justify-center cursor-pointer"
                        aria-label={`Add ${current.label}`}
                    >
                        <Image src={addcircle} alt="addcircle" width={20} height={20} />
                    </button>
                </div>
            ) : null}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    disabled={atStart}
                    onClick={goPrev}
                    className={`flex items-center gap-[8px] text-[14px] font-[Inter-Medium] ${atStart
                        ? 'cursor-not-allowed text-[#8f8f8f]'
                        : 'cursor-pointer text-[#23262A]'
                        }`}
                >
                    <PaginationPrevIcon className="h-[10px] w-[10px]" stroke={atStart ? '#B8C0CA' : '#9CA3AF'} />
                    Previous
                </button>
                <button
                    type="button"
                    disabled={atEnd}
                    onClick={goNext}
                    className={`flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] ${atEnd
                        ? 'cursor-not-allowed text-[#8f8f8f]'
                        : 'cursor-pointer text-[#23262A]'
                        }`}
                >
                    Next
                    <PaginationNextIcon className="h-[10px] w-[10px]" stroke={atEnd ? '#B8C0CA' : '#23262a'} />
                </button>
            </div>

            <BasicInfoModal
                open={basicInfoOpen}
                onClose={() => setBasicInfoOpen(false)}
                brandName={brandName}
                onSave={handleSaveBasicInfo}
                initialData={jobApplicationInfo}
            />
            <SkillsModal
                open={skillsOpen}
                onClose={() => setSkillsOpen(false)}
                onSave={handleSaveSkills}
                initialSkills={skillsInitial}
            />
            <DigitalProfileModal
                open={digitalProfileOpen}
                onClose={() => setDigitalProfileOpen(false)}
                onAddAudio={() => {
                    setDigitalProfileOpen(false)
                    setIntroductionVariant('audio')
                    setIntroductionsOpen(true)
                }}
                onAddVideo={() => {
                    setDigitalProfileOpen(false)
                    setIntroductionVariant('video')
                    setIntroductionsOpen(true)
                }}
            />
            <IntroductionsModal
                open={introductionsOpen}
                onClose={() => setIntroductionsOpen(false)}
                variant={introductionVariant}
                onSave={handleSaveDigitalProfile}
            />
            <ResumeModal
                open={resumeOpen}
                onClose={() => setResumeOpen(false)}
                onSave={handleSaveResume}
                initialFileUrl={jobApplicationInfo?.resume || ''}
            />
            <ExperienceModal
                open={experienceOpen}
                onClose={() => setExperienceOpen(false)}
                onSave={handleSaveExperience}
                initialData={jobApplicationInfo}
            />
            <QualificationModal
                open={qualificationOpen}
                onClose={() => setQualificationOpen(false)}
                onSave={handleSaveQualification}
                initialData={jobApplicationInfo}
            />
        </div>
    )
}
