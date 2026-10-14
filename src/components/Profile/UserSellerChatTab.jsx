'use client'
import Image from 'next/image'
import { placeholderImage, t } from '@/utils'

const UserSellerChatTab = ({ isActive, chat, handleChatTabClick }) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInDays / 365);

        if (diffInSeconds < 60) {
            return t('now');
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInDays === 1) {
            return t('yesterday');
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else if (diffInWeeks < 4) {
            return `${diffInWeeks}w ago`;
        } else if (diffInMonths < 12) {
            return `${diffInMonths}mo ago`;
        } else {
            return `${diffInYears}y ago`;
        }
    };


    return (
        // Pass the chat ID to the handler
        <div className="" onClick={() => handleChatTabClick(chat)}>
            <div className={`cursor-pointer border-l border-l-[4px] border-l-transparent border-b border-b-[rgba(143,143,143,0.2)] p-[12px_16px_12px_12px] flex items-center gap-[10px] rtl:border-r rtl:border-r-[4px] rtl:border-r-transparent rtl:border-l-0 ${isActive && '!border-l-[#DC0000] rtl:!border-r-[#DC0000] '}`}>
                <div className="w-[80px] h-[80px] border border-[rgba(143,143,143,0.2)] rounded-[8px] flex-shrink-0">
                    <Image src={chat?.buyer?.profile ? chat?.buyer?.profile : placeholderImage} alt="User" width={80} height={80} className="w-full h-full object-cover rounded-[8px]" onErrorCapture={placeholderImage} />
                    {/* <Image src={chat?.item?.image ? chat?.item?.image : placeholderImage} alt="User" width={24} height={24} className="" onErrorCapture={placeholderImage} /> */}
                </div>
                <div className="min-w-0 flex flex-1 items-start justify-between gap-[10px]">
                    <div className="min-w-0 flex flex-1 flex-col gap-[4px]">
                        <h6 className="block w-full truncate text-[14px] font-[Inter-SemiBold] text-[#23262A]" title={chat?.buyer?.name}>
                            {chat?.buyer?.name}
                        </h6>
                        <p className="block w-full truncate text-[14px] font-[Inter-Regular] text-[#23262A]" title={chat?.item?.name}>
                            {chat?.item?.name}
                        </p>
                    </div>
                    {
                        chat?.last_message_time &&
                        <p className="shrink-0 text-[12px] font-[Inter-Regular] text-[#23262A]">{formatTime(chat?.last_message_time)}</p>
                    }
                </div>
            </div>
        </div>
    )
}

export default UserSellerChatTab