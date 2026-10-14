'use client';

import React from 'react';
import Image from 'next/image';
import emptydata from '../../../public/assets/img/emptydata.png';
import { placeholderImage } from '@/utils';

/**
 * messages: { id, title, senderName, preview, timestamp, unread?, verified?, avatarUrl?, productImageUrl? }
 * - unread: light row tint, dot, green-ish time if timestampIsTime is true
 * - timestampIsTime: true → show timestamp in green (unread style); false → grey date style
 */
const ChatPopup = ({
    isOpen,
    onClose,
    onViewAll,
    onMarkAllRead,
    onMessageClick,
    messages = [],
}) => {
    if (!isOpen) return null;

    const unreadCount = messages.filter((m) => m.unread).length;
    const hasData = messages.length > 0;

    return (
        <div className="absolute top-full left-0 z-[9998] mt-2">
            <div className="w-[390px] overflow-hidden rounded-[12px] bg-white shadow-[0_0_24px_0px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.24)] p-[20px_16px]">
                    <h3 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                        Messages ({unreadCount > 0 ? unreadCount : messages.length})
                    </h3>
                    {hasData && unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => onMarkAllRead?.()}
                            className="cursor-pointer text-[12px] font-[Inter-Regular] text-[#8F8F8F] hover:text-[#23262A]"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {hasData ? (
                    <div className="max-h-[360px] overflow-y-auto">
                        {messages.map((item) => {
                            const isUnread = Boolean(item.unread);
                            const timeIsClock = item.timestampIsTime !== false && isUnread;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onMessageClick?.(item)}
                                    className={`flex w-full cursor-pointer items-start gap-[10px] border-b border-[rgba(143,143,143,0.24)] p-[12px_14px] text-left last:border-b-0 ${isUnread ? 'bg-[rgba(18,112,236,0.06)]' : 'bg-white hover:bg-[rgba(58,136,239,0.04)]'
                                        }`}
                                >
                                    <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full bg-[#F2F2F2]">
                                        {item.avatarUrl ? (
                                            <Image
                                                src={item.avatarUrl}
                                                width={44}
                                                height={44}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                onError={placeholderImage}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[12px] font-[Inter-Medium] text-[#8F8F8F]">
                                                {(item.senderName || '?').slice(0, 1)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-[4px] flex items-start gap-[6px]">
                                            {isUnread && (
                                                <span
                                                    className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#0f1112]"
                                                    aria-hidden
                                                />
                                            )}
                                            <h4 className="line-clamp-1 text-[13px] font-[Inter-SemiBold] text-[#0f1112]">
                                                {item.title}
                                            </h4>
                                        </div>
                                        <p className="line-clamp-1 text-[12px] font-[Inter-Regular] text-[#23262A]">
                                            <span className="font-[Inter-Medium]">{item.senderName || 'User'}</span>
                                            {item.verified && (
                                                <span className="mx-[4px] inline-block align-middle" title="Verified">
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="inline align-middle"
                                                        aria-hidden
                                                    >
                                                        <path
                                                            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.06 13.54L7.4 10.8l1.41-1.41 1.94 1.94 4.95-4.95 1.41 1.41-6.37 6.35z"
                                                            fill="#1270ec"
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                            <span className="text-[#5c6366]">: {item.preview}</span>
                                        </p>
                                        <p
                                            className={`mt-[4px] text-[11px] font-[Inter-Regular] ${timeIsClock ? 'text-[#0a8f5c]' : 'text-[#8F8F8F]'
                                                }`}
                                        >
                                            {item.timestamp}
                                        </p>
                                    </div>

                                    <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[6px] bg-[#F2F2F2]">
                                        {item.productImageUrl ? (
                                            <Image
                                                src={item.productImageUrl}
                                                width={48}
                                                height={48}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                onError={placeholderImage}
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-[#E8E8E8]" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center p-[20px] text-center">
                        <div className="mb-[10px] h-[140px] w-[140px]">
                            <Image src={emptydata} alt="" className="h-full w-full object-contain" />
                        </div>
                        <h4 className="mb-[6px] text-[16px] font-[Inter-SemiBold] text-[#000]">No messages yet</h4>
                        <p className="max-w-[280px] text-[13px] font-[Inter-Regular] text-[#00000099]">
                            When you start a conversation, it will show up here.
                        </p>
                    </div>
                )}

                <div className="w-full border-t border-[rgba(143,143,143,0.24)] p-[16px]">
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="w-full cursor-pointer text-center text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                    >
                        View All Messages
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPopup;
