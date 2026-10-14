'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import emptydata from '../../../public/assets/img/emptydata.png';
import { isLogin } from '@/utils';
import { savedSearchApi } from '@/utils/api';

// notifications: array of items { id, title, subtitle, date, image }
const SearchPopup = ({ isOpen, onClose, onViewAll, searches = [], onMarkRead, onRemove }) => {
    const [apiSearches, setApiSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !isLogin()) return;

        const fetchMySearches = async () => {
            try {
                setIsLoading(true);
                const response = await savedSearchApi.getSavedSearches({ page: 1 });
                const list = response?.data?.data?.data || [];
                setApiSearches(list);
            } catch (error) {
                setApiSearches([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMySearches();
    }, [isOpen]);

    const formatDate = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const popupSearches = useMemo(() => {
        if (apiSearches.length > 0) {
            return apiSearches.map((item) => ({
                key: item?.id,
                title: item?.title,
                city: item?.search_state?.city,
                date: formatDate(item?.created_at),
                image: Array.isArray(item?.photos) && item.photos.length > 0 ? item.photos[0] : null,
            }));
        }
        return searches;
    }, [apiSearches, searches]);

    if (!isOpen) return null;

    const hasData = popupSearches.length > 0;

    return (
        <div className="absolute top-full left-0 mt-2 z-[9998]">
            <div className="bg-white rounded-[12px] shadow-[0_0_24px_0px_rgba(0,0,0,0.12)] w-[390px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-[20px_16px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[14px] font-[Inter-Medium] text-[#000]">My Searches</h3>
                    {/* {hasData && (
                        <button
                            type="button"
                            className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]"
                        >
                            Mark all as Read
                        </button>
                    )} */}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="max-h-[360px] overflow-y-auto">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                                // eslint-disable-next-line react/no-array-index-key
                                key={`search-loading-${idx}`}
                                className="flex items-start gap-[10px] p-[14px] border-b border-[rgba(143,143,143,0.24)] last:border-b-0"
                            >
                                <div className="w-[60px] h-[60px] rounded-[8px] bg-[#F2F2F2] animate-pulse flex-shrink-0" />
                                <div className="flex-1 flex flex-col gap-[8px] pt-[2px]">
                                    <div className="h-[14px] w-[70%] bg-[#F2F2F2] rounded-[4px] animate-pulse" />
                                    <div className="h-[12px] w-[40%] bg-[#F2F2F2] rounded-[4px] animate-pulse" />
                                    <div className="h-[12px] w-[50%] bg-[#F2F2F2] rounded-[4px] animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasData ? (
                    <div className="max-h-[360px] overflow-y-auto">
                        {popupSearches.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-start gap-[10px] p-[14px] border-b border-[rgba(143,143,143,0.24)] hover:bg-[rgba(58,136,239,0.08)] cursor-pointer last:border-b-0"
                            >
                                <div className="">
                                    {item.image ? (
                                        <div className="w-[60px] h-[60px] rounded-[8px] overflow-hidden bg-[#F2F2F2] flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                width={60}
                                                height={60}
                                                alt={item.title || 'Saved search'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-[180px] ">
                                            <Image
                                                src={emptydata}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex-col flex gap-[2px]">
                                    <h4 className="text-[14px] font-[Inter-Medium] text-[#000] ">
                                        {item.title}
                                    </h4>
                                    {item.city && (
                                        <p className="text-[12px] font-[Inter-Regular] text-[#000] ">
                                            {item.city}
                                        </p>
                                    )}
                                    {item.date && (
                                        <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                                            saved on : {item.date}
                                        </p>
                                    )}
                                </div>  
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-[20px] flex flex-col items-center text-center">
                        <div className="w-[180px] h-[180px] mb-[10px]">
                            <Image src={emptydata} alt="Empty Data" className="w-full h-full object-cover" />
                        </div>
                        <h4 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[6px]">
                            No Searches...yet!
                        </h4>
                        <p className="text-[14px] font-[Inter-Medium] text-[#000000CC] leading-[20px] max-w-[280px]">
                            View ad recommendations and news by Ebozor, etc.
                        </p>
                    </div>
                )}




                {/* Footer button */}
                <div className='p-[20px_16px] w-full border-t border-[rgba(143,143,143,0.24)]'>
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="w-full cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#E31F1F]"
                    >
                        View All Saved Searches
                    </button>
                </div>


                
            </div>
        </div>
    );
};

export default SearchPopup;

