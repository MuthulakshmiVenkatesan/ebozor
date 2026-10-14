'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import emptydata from '../../../public/assets/img/emptydata.png';
import data from '../../../public/assets/img/data.png';
import batterylow from '../../../public/assets/img/icons/batterylow.png';
import batteryfill from '../../../public/assets/img/icons/batteryfill.png';

// notifications: array of items { id, title, subtitle, date, image }
const FavouritesPopup = ({ isOpen, onClose, onViewAll, searches = [], onMarkRead, onRemove }) => {
    if (!isOpen) return null;

    const hasData = searches.length > 0;
    const [openMenuId, setOpenMenuId] = useState(null);

    return (
        <div className="absolute top-full left-0 mt-2 z-[9998]">
            <div className="bg-white rounded-[12px] shadow-[0_0_24px_0px_rgba(0,0,0,0.12)] w-[390px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-[20px_16px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[14px] font-[Inter-Medium] text-[#000]">Favourites (03)</h3>

                </div>

                {/* Content */}
                {hasData ? (
                    <div className="max-h-[360px] overflow-y-auto">
                        {searches.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-start gap-[10px] p-[14px] border-b border-[rgba(143,143,143,0.24)] hover:bg-[rgba(58,136,239,0.08)] cursor-pointer last:border-b-0"
                            >
                                <div className="">

                                    <div className="w-[48px] h-[48px] rounded-[8px] overflow-hidden bg-[#F2F2F2] flex-shrink-0">
                                        <Image
                                            src={data}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                </div>
                                <div className="flex-1 flex-col flex gap-[10px]">
                                    <h4 className="text-[14px] font-[Inter-Medium] text-[#000] ">
                                        Your Favorites is Empty
                                    </h4>
                                    <div className='flex items-center gap-[6px]'>
                                        <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] ">
                                            AED 2,500
                                        </p>
                                        <div className='border-r h-[14px] border-[#8F8F8F]'></div>
                                        <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] ">
                                            in Dubai
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-[20px] flex flex-col items-start gap-[10px]">
                        <div className='flex items-center gap-[10px]'>
                            <Image src={batterylow} alt="Battery Low" className='w-[26px] h-[26px]'/>
                            <h4 className="text-[18px] font-[Inter-SemiBold] text-[#000]">Your Favorites is Empty</h4>
                        </div>
                        <div className='flex items-center gap-[10px]'>
                            <Image src={batteryfill} alt="Battery Low" className='w-[26px] h-[26px]'/>
                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000]">
                                To Fill Your Favorites , click the “ Add to Favorites” Buttons While  Viewing an ad
                            </h4>
                        </div>
                    </div>
                )}






                {/* Footer button */}
                <div className='p-[20px_16px] w-full border-t border-[rgba(143,143,143,0.24)]'>
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="w-full cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#E31F1F]"
                    >
                        View All Favorites
                    </button>
                </div>



            </div>
        </div>
    );
};

export default FavouritesPopup;

