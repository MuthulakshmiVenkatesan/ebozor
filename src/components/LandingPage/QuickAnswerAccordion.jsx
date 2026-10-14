'use client';

import React, { useState, useEffect } from 'react';
import { DownArrowIcon } from '../CustomFile/icons';

const QuickAnswerAccordion = ({ Faq }) => {
    const list = Array.isArray(Faq) ? Faq : [];
    const [openKey, setOpenKey] = useState(null);

    useEffect(() => {
        const arr = Array.isArray(Faq) ? Faq : [];
        if (!arr.length) {
            setOpenKey(null);
            return;
        }
        setOpenKey((prev) => {
            if (prev != null && arr.some((x) => String(x?.id) === prev)) return prev;
            return String(arr[0].id);
        });
    }, [Faq]);

    const toggle = (key) => {
        setOpenKey((prev) => (prev === key ? null : key));
    };

    if (!list.length) return null;

    return (
        <div className="flex flex-col divide-y divide-[rgba(143,143,143,0.2)] bg-white overflow-hidden">
            {list.map((item) => {
                const key = item?.id != null ? String(item.id) : '';
                const isOpen = openKey === key;
                return (
                    <div key={key || item?.question} className="bg-white">
                        <button
                            type="button"
                            onClick={() => toggle(key)}
                            className="cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[rgba(0,0,0,0.02)] md:px-5 md:py-5"
                            aria-expanded={isOpen}
                        >
                            <h4 className=" min-w-0 flex-1 text-[14px] font-[Inter-Medium] text-[#23262A] ">
                                {item?.question}
                            </h4>
                            <div className="cursor-pointer shrink-0 text-[#23262A]" aria-hidden>
                                {isOpen ? (
                                    <DownArrowIcon className="w-[22px] h-[22px] rotate-180" stroke="#23262A" />
                                ) : (
                                    <DownArrowIcon className="w-[22px] h-[22px] " stroke="#23262A" />
                                )}
                            </div>
                        </button>
                        <div
                            className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                            <div className="min-h-0 overflow-hidden">
                                <div className="border-t border-[rgba(143,143,143,0.12)] px-4 pb-4 pt-0 md:px-5 md:pb-5">
                                    <p className="pt-3 text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
                                        {item?.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default QuickAnswerAccordion;
