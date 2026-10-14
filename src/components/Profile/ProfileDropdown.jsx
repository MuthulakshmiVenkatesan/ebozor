'use client'
import { userSignUpData } from "@/redux/reuducer/userSlice"
import { getUserDetailApi } from "@/utils/api"
import { isLogin, placeholderImage, t, truncate } from "@/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { BsPatchCheckFill } from "react-icons/bs"
import { FaAngleDown } from "react-icons/fa6"
import { useSelector } from "react-redux"
import GetVerifiedModal from "@/components/PagesComponent/GetVerified/GetVerifiedModal"
import VerifiedBusinessModal from "@/components/PagesComponent/VerifiedBusiness/VerifiedBusinessModal"
import { getVerificationStatusApi, verifiedBusinessApi } from "@/utils/api"

const ProfileDropdown = ({ closeDrawer, settings, handleLogout, isDrawer }) => {

    const router = useRouter()
    const UserData = useSelector(userSignUpData)
    const isUserLoggedIn = useSelector((state) => !!state?.UserSignup?.data?.token)
    const [isOpen, setIsOpen] = useState(false)
    const [liveProfileImage, setLiveProfileImage] = useState('')
    const [isGetVerifiedModalOpen, setIsGetVerifiedModalOpen] = useState(false)
    const [isVerifiedBusinessModalOpen, setIsVerifiedBusinessModalOpen] = useState(false)
    const [verificationStatus, setVerificationStatus] = useState('not_applied')
    const [verifiedBusinessStatus, setVerifiedBusinessStatus] = useState('not_applied')
    const [verifiedBusinessRejection, setVerifiedBusinessRejection] = useState('')
    const dropdownRef = useRef(null)

    const parseApiPayload = (payload) => {
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

    const items = [
        {
            key: 1,
            href: '/jobdashboard',
            label: 'Job Dashboard'
        },
        {
            key: 2,
            href: '/jobdashboard/candidates',
            label: 'Candidate Search'
        },
        {
            key: 3,
            href: '/jobapplication',
            label: 'My Job Application'
        },
        {
            key: 4,
            href: '/profilesetting',
            label: t('myProfile')
        },
        {
            key: 5, 
            href: '/jobprofile',
            label: 'My Job Profile'
        },
        {
            key: 6, 
            href: '/jobdashboard/companyprofile',
            label: 'My Recuriter Profile'
        },
        {
            key: 7,
            href: `/publicprofile?user_id=${encodeURIComponent(String(UserData?.id || ''))}`,
            label: 'My Public Profile'
        },
        {
            key: 8,
            href: '/myads',
            label: 'My Ads'
        },
        {
            key: 9,
            action: 'get_verified',
            label: 'Get Verified',
            verified: true
        },
        {
            key: 9.5,
            action: 'verified_business',
            label: 'Verified Business',
        },
        {
            key: 10,
            href: '/chat',
            label: t('chat')
        },
        {
            key: 11,
            href: '/favourites',
            label: t('favorites')
        },
        {
            key: 12,
            href: '/mysearch',
            label: 'My Searches'
        },
        {
            key: 13,
            href: '/carappointment',
            label: 'Car Appointments',
            badge: 'NEW'
        },
        {
            key: 14,
            href: '/carinception',
            label: 'Car Inspections',
            badge: 'NEW'
        },
        {
            key: 15,
            href: '/bookmarks',
            label: 'Bookmarks'
        },
        {
            key: 16,
            href: '/profilesetting?section=security',
            label: 'Account Settings'
        },
        {
            key: 17,
            signOut: true,
            label: t('signOut')
        },
    ]

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleProfileImageUpdated = (event) => {
            const nextImage = String(event?.detail?.image || '').trim()
            if (nextImage) setLiveProfileImage(nextImage)
        }
        window.addEventListener('profile-image-updated', handleProfileImageUpdated)
        return () => window.removeEventListener('profile-image-updated', handleProfileImageUpdated)
    }, [])

    useEffect(() => {
        if (!isUserLoggedIn) {
            setVerificationStatus('not_applied')
            setVerifiedBusinessStatus('not_applied')
            setVerifiedBusinessRejection('')
            return
        }
        let cancelled = false
        const run = async () => {
            try {
                const res = await getVerificationStatusApi.getVerificationStatus()
                if (cancelled) return
                if (res?.data?.error === true) {
                    setVerificationStatus('not_applied')
                    return
                }
                const status = String(res?.data?.data?.status || '').trim().toLowerCase()
                setVerificationStatus(status || 'not_applied')
            } catch {
                if (!cancelled) setVerificationStatus('not_applied')
            }
        }
        const runBusiness = async () => {
            try {
                const res = await verifiedBusinessApi.getStatus()
                if (cancelled) return
                if (res?.data?.error === true) {
                    setVerifiedBusinessStatus('not_applied')
                    setVerifiedBusinessRejection('')
                    return
                }
                const status = String(res?.data?.data?.status || '').trim().toLowerCase()
                setVerifiedBusinessStatus(status || 'not_applied')
                setVerifiedBusinessRejection(String(res?.data?.data?.rejection_reason || ''))
            } catch {
                if (!cancelled) {
                    setVerifiedBusinessStatus('not_applied')
                    setVerifiedBusinessRejection('')
                }
            }
        }
        run()
        runBusiness()
        return () => {
            cancelled = true
        }
    }, [isUserLoggedIn])

    useEffect(() => {
        const immediateProfile =
            String(UserData?.profile || '').trim() ||
            String(UserData?.data?.profile || '').trim() ||
            String(UserData?.user?.profile || '').trim()
        if (immediateProfile) {
            setLiveProfileImage(immediateProfile)
            return
        }

        const userId = UserData?.id ?? UserData?.data?.id ?? UserData?.user?.id ?? null
        if (!userId) return

        let cancelled = false
        const run = async () => {
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const profile = String(parsed?.data?.profile || '').trim()
                if (!cancelled && profile) setLiveProfileImage(profile)
            } catch {
                // keep current/fallback image
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [UserData?.id, UserData?.data?.id, UserData?.user?.id, UserData?.profile, UserData?.data?.profile, UserData?.user?.profile])

    const handleMenuClick = (item) => {
        closeDrawer?.()
        setIsOpen(false)
        if (item.signOut) {
            handleLogout?.()
            return
        }
        if (item.action === 'get_verified') {
            setIsGetVerifiedModalOpen(true)
            return
        }
        if (item.action === 'verified_business') {
            setIsVerifiedBusinessModalOpen(true)
            return
        }
        if (item.href) {
            router.push(item.href)
            return
        }
        console.error('No navigation or sign-out action for menu item:', item.label)
    }

    const isVerifiedUser =
        Number(
            UserData?.is_verified ??
                UserData?.data?.is_verified ??
                UserData?.user?.is_verified ??
                UserData?.data?.data?.is_verified ??
                UserData?.user?.data?.is_verified ??
                0
        ) === 1 || verificationStatus === 'approved'
    const isVerifiedBusinessUser =
        UserData?.verified_business === true ||
        UserData?.data?.verified_business === true ||
        UserData?.user?.verified_business === true ||
        Number(
            UserData?.verified_business ??
                UserData?.data?.verified_business ??
                UserData?.user?.verified_business ??
                0
        ) === 1 || verifiedBusinessStatus === 'approved'
    const visibleItems = items.filter((i) => {
        if (isVerifiedUser && i.action === 'get_verified') return false
        return true
    })

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-2 rounded-md bg-transparent p-0 text-left"
                id="dropdown-basic"
            >
                <Image
                    src={liveProfileImage || UserData?.profile || settings?.placeholder_image}
                    alt={UserData?.name}
                    width={32}
                    height={32}
                    onErrorCapture={placeholderImage}
                    className='profile_img_div'
                />
                <div className='username_header'>
                    {isLogin() ? (
                        UserData.name !== null && UserData.name !== "null" ? (
                            isDrawer ? truncate(UserData.name, 27) : truncate(UserData.name, 12)
                        ) : UserData.email !== "null" || UserData.email !== null ? (
                            isDrawer ? truncate(UserData.email, 27) : truncate(UserData.email, 12)
                        ) : UserData.mobile !== "undefined" ? (
                            UserData.mobile
                        ) : "Hello"
                    ) : null}
                </div>
                <FaAngleDown className={`prof_down_arrow transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-[999] mt-2 w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-96 overflow-y-auto">
                        {visibleItems.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleMenuClick(item)}
                                className="cursor-pointer block w-full border-b border-gray-100 p-[10px_14px] transition-colors hover:bg-gray-50 last:border-b-0"
                            >
                                <div className="flex items-center gap-[4px]">
                                    <p className=" text-left text-[14px] text-[#23262A] ">{item.label}</p>
                                    {item.verified ? (
                                        <BsPatchCheckFill className="text-[14px] text-[#1d7dfa]" />
                                    ) : null}
                                    {item.action === 'verified_business' && isVerifiedBusinessUser ? (
                                        <BsPatchCheckFill className="text-[14px] text-[#059f01]" />
                                    ) : null}
                                    {item.badge ? (
                                        <span className="rounded-full bg-[#DC0000] p-[2px_4px] text-[10px] font-[Inter-SemiBold] leading-none text-white">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <GetVerifiedModal
                isOpen={isGetVerifiedModalOpen}
                onClose={() => setIsGetVerifiedModalOpen(false)}
                onMaybeLater={() => setIsGetVerifiedModalOpen(false)}
                nextModalType="safety"
                onVerifiedSuccess={() => {
                    setIsGetVerifiedModalOpen(false)
                }}
            />
            <VerifiedBusinessModal
                isOpen={isVerifiedBusinessModalOpen}
                onClose={() => setIsVerifiedBusinessModalOpen(false)}
                status={isVerifiedBusinessUser ? 'approved' : verifiedBusinessStatus}
                rejectionReason={verifiedBusinessRejection}
                onSubmitted={() => {
                    setVerifiedBusinessStatus('pending')
                    setVerifiedBusinessRejection('')
                }}
            />
        </div>
    )
}

export default ProfileDropdown