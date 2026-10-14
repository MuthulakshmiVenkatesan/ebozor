'use client'

import React from 'react'
import Image from 'next/image'
import landlordIcon from '../../../../../public/assets/img/icons/landlord.svg'
import agentIcon from '../../../../../public/assets/img/icons/agent.svg'

export default function RoleSelectionStep({ selectedPropertyRow, onSelectProperty }) {
    return (
        <div className="mx-auto max-sm:w-full w-[480px] px-[16px] py-[28px] sm:py-[36px]">
            <div className="mb-[24px] text-center w-[400px] mx-auto max-sm:w-full">
                <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[8px]">
                    Are you a landlord or an agent?
                </h2>
            </div>

            <div className="flex items-center justify-center gap-[16px]">
                <button
                    type="button"
                    onClick={() => onSelectProperty?.(selectedPropertyRow, { posterType: 'landlord' })}
                    className="cursor-pointer flex flex-col items-center gap-[4px] justify-center rounded-[6px] bg-white w-[144px] h-[144px] shadow-[0_2px_8px_0px_rgba(0,0,0,0.1)]"
                >
                    <div className="">
                        <Image src={landlordIcon} alt="landlord" width={34} height={34} />
                    </div>
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Landlord</p>
                </button>

                <button
                    type="button"
                    onClick={() => onSelectProperty?.(selectedPropertyRow, { posterType: 'agent' })}
                    className="cursor-pointer flex flex-col items-center gap-[4px] justify-center rounded-[6px] bg-white w-[144px] h-[144px] shadow-[0_2px_8px_0px_rgba(0,0,0,0.1)]"
                >
                    <div className="">
                        <Image src={agentIcon} alt="agent" width={34} height={34} />
                    </div>
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Agent</p>
                </button>
            </div>
        </div>
    )
}
