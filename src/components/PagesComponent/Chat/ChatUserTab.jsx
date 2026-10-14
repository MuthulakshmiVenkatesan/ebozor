'use client'
import { placeholderImage, t } from "@/utils";
import { blockUserApi, unBlockUserApi } from "@/utils/api";
import { Popover } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { MoreIcon } from "@/components/CustomFile/icons";

const ChatUserTab = ({ activeTab, selectedTabData, systemSettingsData, isBlocked, handleBlockUser, handleUnBlockUser, popoverVisible, setPopoverVisible }) => {

    const isBuyingTab = activeTab === 'buying';
    const userData = isBuyingTab ? selectedTabData?.seller : selectedTabData?.buyer;
    const itemData = selectedTabData?.item;
    const profileImage = userData?.profile || systemSettingsData?.data?.data?.placeholder_image;
    const itemImage = itemData?.image || systemSettingsData?.data?.data?.placeholder_image;
    const CurrencySymbol = systemSettingsData?.data?.data?.currency_symbol


    const content = (userId) => (
        <div>
            {isBlocked ? (
                <p onClick={() => handleUnBlockUser(userId)} style={{ cursor: 'pointer' }}>
                    {t("unblock")}
                </p>
            ) : (
                <p onClick={() => handleBlockUser(userId)} style={{ cursor: 'pointer' }}>
                    {t("block")}
                </p>
            )}
        </div>
    );


    return (
        <div className="p-[10px] flex items-center justify-between gap-[10px] border-b border-[rgba(143,143,143,0.2)]">
            <div className="min-w-0 flex flex-1 items-center gap-[16px]">
                <div className="w-[48px] h-[48px] border border-[rgba(143,143,143,0.2)] rounded-full">
                    <Link href={`/seller/${userData?.id}`}>
                        <Image
                            src={profileImage}
                            alt="User"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-full"
                            onErrorCapture={placeholderImage}
                        />
                    </Link>
                    {/* <Image
                        src={itemImage}
                        alt="User"
                        width={24}
                        height={24}
                        className="user_chat_small_img"
                        onErrorCapture={placeholderImage} /> */}
                </div>
                <div className="min-w-0 flex flex-1 flex-col gap-[4px]">
                    <div className="min-w-0 flex items-center gap-[10px]">
                        <Link href={`/seller/${userData?.id}`} className="min-w-0 shrink truncate">
                            <h6 className="truncate text-[16px] font-[Inter-SemiBold] text-[#464c55]" title={userData?.name}>{userData?.name}</h6>
                        </Link>
                        <p className="shrink-0 text-[14px] font-[Inter-Regular] text-[#23262A]">{CurrencySymbol}{selectedTabData?.item?.price}</p>
                    </div>
                    <p className="block w-full truncate text-[14px] font-[Inter-Regular] text-[#23262A]" title={itemData?.name}>{itemData?.name}</p>
                </div>
            </div>
            <div className="shrink-0">
                <Popover content={content(userData?.id)} trigger="click" placement="bottom" visible={popoverVisible} onVisibleChange={setPopoverVisible}>
                    <div style={{ cursor: 'pointer' }}>
                        <MoreIcon className="w-[22px] h-[22px] rotate-90" />
                    </div>
                </Popover>
            </div>
        </div>
    )
}

export default ChatUserTab