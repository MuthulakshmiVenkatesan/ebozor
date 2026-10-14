'use client'

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { getDevicesApi, getUserDetailApi } from "@/utils/api";
import ProfileSidebar from "./components/ProfileSidebar";
import BasicInfo from "./pages/BasicInfo";
import MyAddress from "./pages/MyAddress";
import Phonenumber from "./pages/Phonenumber";
import Security from "./pages/Security";

const PROFILE_SECTIONS = ["basic-info", "my-addresses", "phone-numbers", "security"];

const ProfileSetting = () => {
    const userData = useSelector(userSignUpData)
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeSubItem, setActiveSubItem] = useState("basic-info");
    const [userDetail, setUserDetail] = useState(null)
    const [userDetailLoading, setUserDetailLoading] = useState(false)
    const [devices, setDevices] = useState([])
    const [devicesLoading, setDevicesLoading] = useState(false)

    const parseApiPayload = (payload) => {
        if (typeof payload !== "string") return payload || {}
        const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
        const scriptIndex = payload.indexOf("<script")
        const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
        const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
        try {
            return JSON.parse(jsonText)
        } catch (error) {
            console.error("get-user-detail parse error:", error)
            return {}
        }
    }

    useEffect(() => {
        const section = searchParams.get("section");
        setActiveSubItem(section && PROFILE_SECTIONS.includes(section) ? section : "basic-info");
    }, [searchParams]);

    useEffect(() => {
        const userId = userData?.id
        if (!userId) {
            setUserDetail(null)
            setUserDetailLoading(false)
            return
        }
        let cancelled = false
        setUserDetailLoading(true)
        const loadUserDetail = async () => {
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                if (!cancelled) setUserDetail(parsed?.data && typeof parsed.data === "object" ? parsed.data : null)
            } catch (error) {
                if (!cancelled) setUserDetail(null)
            } finally {
                if (!cancelled) setUserDetailLoading(false)
            }
        }
        loadUserDetail()
        return () => {
            cancelled = true
        }
    }, [userData?.id])

    const formatLastUsedAt = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return `Added on ${date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })}`
    }

    useEffect(() => {
        const userId = userData?.id
        if (!userId) {
            setDevices([])
            setDevicesLoading(false)
            return
        }
        let cancelled = false
        const loadDevices = async () => {
            setDevicesLoading(true)
            try {
                const response = await getDevicesApi.getDevices()
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = rows.map((item = {}, index) => ({
                    id: item?.id ?? `idx-${index}`,
                    title: String(item?.device_name || '').trim() || 'Unknown Device',
                    country: String(item?.platform || '').trim(),
                    date: formatLastUsedAt(item?.last_used_at),
                    current: Boolean(item?.is_current),
                }))
                const currentDevices = mapped.filter((device) => device.current)
                const otherDevices = mapped.filter((device) => !device.current)
                if (!cancelled) setDevices([...currentDevices, ...otherDevices])
            } catch (error) {
                if (!cancelled) setDevices([])
            } finally {
                if (!cancelled) setDevicesLoading(false)
            }
        }
        loadDevices()
        return () => {
            cancelled = true
        }
    }, [userData?.id])

    const handleSubItemClick = (id) => {
        setActiveSubItem(id);
        if (id === "basic-info") {
            router.replace(pathname, { scroll: false });
        } else if (PROFILE_SECTIONS.includes(id)) {
            router.replace(`${pathname}?section=${encodeURIComponent(id)}`, { scroll: false });
        }
    };

    return (
        <div className="w-full mx-auto">
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                <div className="mb-[24px]">
                    <h3 className="text-[28px] font-[Inter-SemiBold] text-[#23262A]">Profile Settings</h3>
                </div>
                <div className="grid grid-cols-[270px_minmax(0,1fr)] items-start gap-[28px] max-lg:grid-cols-1 products_grid">
                    <div className="min-w-0">
                        <ProfileSidebar activeSubItem={activeSubItem} onSubItemClick={handleSubItemClick} />
                    </div>

                    <div className="w-[70%] mx-auto max-sm:w-full mb-[30px]">
                        {activeSubItem === "basic-info" ? (
                            <BasicInfo userDetail={userDetail} userDetailLoading={userDetailLoading} />
                        ) : activeSubItem === "my-addresses" ? (
                            <MyAddress />
                        ) : activeSubItem === "phone-numbers" ? (
                            <Phonenumber userDetail={userDetail} userDetailLoading={userDetailLoading} />
                        ) : activeSubItem === "security" ? (
                            <Security
                                userDetail={userDetail}
                                userDetailLoading={userDetailLoading}
                                devices={devices}
                                devicesLoading={devicesLoading}
                                onRemoveDevice={(deviceId) => {
                                    setDevices((prev) => prev.filter((d) => d.id !== deviceId))
                                }}
                            />
                        ) : (
                            <div className="rounded-xl border border-[#efefef] bg-white p-8 text-[#23262A] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)]">
                                <h2 className="text-[28px] font-semibold">{activeSubItem.replace("-", " ")}</h2>
                                <p className="mt-3 text-[16px] font-[Inter-Regular]">This section UI is not added yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetting;