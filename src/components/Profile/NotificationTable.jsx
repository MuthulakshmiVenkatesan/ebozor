'use client'
import Image from 'next/image';
import { formatDateMonth, isLogin, placeholderImage, t } from '@/utils';
import { getNotificationList } from '@/utils/api';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { useSelector } from 'react-redux';
import { MoreIcon, PaginationPrevIcon, PaginationNextIcon } from '../CustomFile/icons';

const NotificationTable = () => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage, setPerPage] = useState(15);
    const [isLoading, setIsLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);


    const fetchNotificationData = async (page) => {
        try {
            setIsLoading(true);
            const response = await getNotificationList.getNotification({ page });
            const { data } = response.data;
            if (data.error !== true) {
                setNotifications(data.data);
                setTotalPages(data.last_page);
                setTotalItems(data.total);
                setPerPage(data.per_page);
            } else {
                toast.error(data.message);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLogin()) {
            fetchNotificationData(currentPage);
        }
    }, [currentPage]);

    return (
        <div className="w-full ">
            {isLoading ? (
                <div className="flex flex-col gap-[8px]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="h-[72px] bg-[#F5F5F5] rounded-[8px] animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col ">
                    {notifications.map((notification) => {
                        const id = notification.id || notification.key;
                        return (
                            <div
                                key={id}
                                className="cursor-pointer relative flex items-center gap-[16px] p-[16px] border-b border-[rgba(143,143,143,0.12)] hover:bg-[rgba(58,136,239,0.08)] last:border-b-0"
                            >
                                <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-[#F2F2F2] flex-shrink-0">
                                    <Image
                                        src={notification.image || placeholderImage}
                                        alt={notification.title}
                                        width={80}
                                        height={80}
                                        className="w-full h-full rounded-full object-cover"
                                        onErrorCapture={placeholderImage}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[14px] font-[Inter-SemiBold] text-[#DC0000] mb-[8px] max-sm:truncate max-sm:w-[100px]">
                                        {notification.title}
                                    </h4>
                                    <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] leading-[18px] mb-[4px] max-sm:truncate max-sm:w-[100px]">
                                        {notification.message}
                                    </p>
                                    <p className="text-[12px] font-[Inter-Medium] text-[#8F8F8F] max-sm:truncate max-sm:w-[100px]">
                                        {formatDateMonth(notification.created_at)}
                                    </p>
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="cursor-pointer "
                                        onClick={() =>
                                            setOpenMenuId((prev) => (prev === id ? null : id))
                                        }
                                        aria-label="More options"
                                    >
                                        <MoreIcon className="w-[24px] h-[24px]" />
                                    </button>
                                    {openMenuId === id && (
                                        <div className="absolute end-0 top-full mt-1 w-[200px] bg-white border border-[rgba(143,143,143,0.16)] rounded-[4px] z-[10000]">
                                            <button
                                                type="button"
                                                className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5] border-b border-[rgba(143,143,143,0.16)]"
                                                onClick={() => {
                                                    setOpenMenuId(null);
                                                    // TODO: integrate mark-as-read API
                                                }}
                                            >
                                                Mark As Read
                                            </button>
                                            <button
                                                type="button"
                                                className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5]"
                                                onClick={() => {
                                                    setOpenMenuId(null);
                                                    // TODO: integrate remove notification API
                                                }}
                                            >
                                                Remove Notification
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {notifications.length >= 15 || currentPage !== 1 ? (
                        <div className="my-[20px] flex items-center justify-end rtl:justify-start rtl:flex-row-reverse">
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="bg-[rgba(143,143,143,0.12)] rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
                                >
                                    <PaginationPrevIcon
                                    className='rtl:rotate-180'
                                        stroke={currentPage <= 1 ? '#8F8F8F' : '#000'}
                                    />
                                </button>
                                <div className="flex items-center gap-[10px]">
                                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                                        (page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={` rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer text-[12px] font-[Inter-Medium] ${
                                                    currentPage === page
                                                        ? 'bg-[#DE2D33] text-white'
                                                        : 'bg-[rgba(143,143,143,0.12)] text-[#8F8F8F]'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}
                                </div>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="bg-[rgba(143,143,143,0.12)] rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
                                >
                                    <PaginationNextIcon
                                        className='rtl:rotate-180'
                                        stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'}
                                    />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default NotificationTable;
