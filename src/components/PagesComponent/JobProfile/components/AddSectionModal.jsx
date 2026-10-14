'use client'

import React from 'react'
import { CloseIcon, PersonalUserIcon, PlusIcon, PortfolioIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'
import award from '../../../../../public/assets/img/profile/award.svg'


function SectionOption({ icon, title, description, onAdd }) {
    return (
        <div className="flex items-center justify-between gap-[12px] border-b border-[rgba(143,143,143,0.35)] py-[18px] last:border-b-0">
            <div className="flex items-start gap-[18px]">
                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] bg-[#f7f7f8]">{icon}</div>
                <div>
                    <h4 className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#23262A]">{title}</h4>
                    <p className="mt-[4px] max-w-[350px] text-[14px] font-[Inter-Regular] leading-[1.35] text-[#3a3f47]">{description}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={onAdd}
                className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
            >
                <PlusIcon width={18} height={18} fill="#6B7280" className="h-[18px] w-[18px]" />
                Add
            </button>
        </div>
    )
}

export default function AddSectionModal({ open, onClose, onSectionClick, hidePortfolio = false, hideLicenses = false, hideReference = false }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(0,0,0,0.48)] p-[16px]">
            <div className="w-[500px] max-sm:w-full overflow-hidden rounded-[6px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.35)] p-[18px_24px]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">Add More Sections</h3>
                    <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Close add sections modal">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#8f8f8f" width={12} height={12} />
                    </button>
                </div>

                <div className="p-[14px_24px]">
                    {!hideLicenses ? (
                        <SectionOption
                            icon={<Image src={award} alt="award" width={20} height={20} />}
                            title="Licences or Certificates"
                            description="Add your skill based certifications eg: Safety Licence."
                            onAdd={() => onSectionClick?.('licenses')}
                        />
                    ) : null}
                    {!hidePortfolio ? (
                        <SectionOption
                            icon={<PortfolioIcon width={20} height={20} fill="#666B72" />}
                            title="Portfolio"
                            description="Add links to your online work projects."
                            onAdd={() => onSectionClick?.('portfolio')}
                        />
                    ) : null}
                    {!hideReference ? (
                        <SectionOption
                            icon={<PersonalUserIcon width={20} height={20} fill="#666B72" />}
                            title="Reference"
                            description="Add details of your previous employer for background and experience check."
                            onAdd={() => onSectionClick?.('reference')}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )
}
