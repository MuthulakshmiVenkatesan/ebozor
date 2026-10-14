'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon } from '@/components/CustomFile/icons';
import JobsHeader from './components/JobsHeader';
import testimonialavatar from '../../../../public/assets/img/jobs/testimonialavatar.png';
import slider1 from '../../../../public/assets/img/jobs/client/1.png';
import slider2 from '../../../../public/assets/img/jobs/client/2.png';
import slider3 from '../../../../public/assets/img/jobs/client/3.png';
import slider4 from '../../../../public/assets/img/jobs/client/4.png';
import slider5 from '../../../../public/assets/img/jobs/client/5.png';
import slider6 from '../../../../public/assets/img/jobs/client/6.png';
import recuriterbg from '../../../../public/assets/img/jobs/recuriterbg.png';

const CV_ACCESS_PLANS = [
    { id: 'quick', name: 'Quick', price: 'AED 449', description: 'Quick 50 CVs for 7 days', popular: false },
    { id: 'super', name: 'Super', price: 'AED 1099', description: 'Super 1000 CVs for 3 months', popular: true },
    { id: 'pro', name: 'Pro', price: 'AED 2099', description: 'Pro 2500 CVs for 6 months', popular: false },
];

const RecuriterPage = () => {
    const [showCvPackages, setShowCvPackages] = useState(false);
    return (
        <div className="w-full mx-auto">
            <JobsHeader />
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                <div className="mt-[70px] mb-[60px]">
                    <div className="relative w-full h-[700px] max-sm:h-[250px] rounded-[12px] overflow-hidden">
                        <Image
                            src={recuriterbg}
                            alt="Creative agency banner"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-[170px] left-[150px] flex items-center max-sm:bottom-auto max-sm:left-[22px] max-sm:top-[174px]">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('available-plans');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="cursor-pointer bg-white text-[#DC0000] font-[Inter-SemiBold] text-[12px] p-[14px_30px] rounded-[12px]"
                            >
                                EXPLORE ALL PLANS
                            </button>
                        </div>
                    </div>
                </div>
                {/* Available plans */}
                <div id="available-plans" className='mb-[60px]'>
                    <div className="text-center mb-[40px]">
                        <h1 className="text-[#000000] font-[Inter-SemiBold] text-[28px] mb-[16px]">
                            Available ad plans
                        </h1>
                        <p className="w_full w-[900px] !mx-auto text-[#000000BF] font-[Inter-Medium] text-[16px] leading-[1.7] max-sm:w-full">
                            Hiring talent made easier and quick with our recruitment solutions. Thousands of
                            candidates are waiting to receive jobs and are actively applying on Ebozor. If you are
                            looking for a single job role to hire, you may post 1 job ad now with a single click.
                            For multiple hirings, we have cost effective job ads packages; send us your inquiry and
                            our account manager will reach out to you to assist you with choosing the best plans.
                        </p>
                    </div>
                    <div className="max-sm:flex-col flex items-center justify-center gap-[30px]">
                        <div className="max-sm:w-full w-[320px] rounded-[16px] border border-[rgba(143,143,143,0.35)] shadow-[0_2px_12px_0_rgba(0,0,0,0.12)] p-[30px_18px] bg-white">
                            <h2 className="text-[#000000] font-[Inter-SemiBold] text-[16px] mb-[14px]">
                                Place a Job Ad
                            </h2>
                            <p className="text-[#000] font-[Inter-Regular] text-[14px] mb-[14px] leading-[34px] mb-[20px]">
                                Post your vacancy with our basic plan. Receive and manage your applicants directly on
                                your jobs dashboard.
                            </p>
                            <ul className="flex flex-col gap-[10px] mb-[30px]">
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Ad packages starting from AED 269 (excluding VAT)</p>
                                </li>
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Ad is Live for 30 Days</p>
                                </li>
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Get 5X more applications when you feature your ad</p>
                                </li>
                            </ul>
                            <div className='text-center'>
                                <button className="cursor-pointer bg-[#DC00000F] text-[#DC0000] font-[Inter-SemiBold] text-[14px] p-[10px_20px] rounded-full">
                                    Post a Job Now
                                </button>
                            </div>
                        </div>

                        <div className="max-sm:w-full w-[320px] rounded-[16px] border border-[rgba(143,143,143,0.35)] shadow-[0_2px_12px_0_rgba(0,0,0,0.12)] p-[30px_18px] bg-white">
                            <h2 className="text-[#000000] font-[Inter-SemiBold] text-[16px] mb-[14px]">
                                Custom Plans
                            </h2>
                            <p className="text-[#000] font-[Inter-Regular] text-[14px] mb-[14px] leading-[34px] mb-[20px]">
                                Hiring multiple candidates throughout the year? Contact an expert to help you find the
                                best hiring solution.
                            </p>
                            <ul className="flex flex-col gap-[10px] mb-[80px]">
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Flexible annual plans</p></li>
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Dedicated account manager</p></li>
                                <li className='flex items-start gap-[14px] border-b border-[rgba(143,143,143,0.24)] p-[14px_0_10px]'>
                                    <div className='bg-[#666666] p-[2px] rounded-full mt-[12px]'></div>
                                    <p className='text-[#666] font-[Inter-Regular] text-[14px] leading-[28px]'>Cost-effective solutions</p>
                                </li>
                            </ul>
                            <div className='text-center'>
                                <button className="cursor-pointer bg-[#DC00000F] text-[#DC0000] font-[Inter-SemiBold] text-[14px] p-[10px_20px] rounded-full">
                                    Request a Call Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div id="cv-section" className="mb-[60px] p-[40px] bg-[#F7FAFF] rounded-[18px]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="flex flex-col items-center justify-center gap-[20px] text-center">
                        <h2 className="text-[#000000] font-[Inter-Medium] text-[28px] ">
                            Want to select candidates yourself?
                        </h2>
                        <p className="w_full mx-auto max-sm:w-full w-[680px] text-[14px] font-[Inter-Regular] leading-[34px] text-[#666]">
                            Search from over 2 million CVs from the jobs database. Get access to more than 8K candidates daily
                            advertising their profiles on Ebozor.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCvPackages((open) => !open)}
                            className="cursor-pointer rounded-full bg-[#DC0000] p-[8px_20px] text-[14px] font-[Inter-SemiBold] text-white"
                        >
                            {showCvPackages ? 'View Packages' : 'View Packages'}
                        </button>
                    </div>

                    {showCvPackages ? (
                        <div
                            id="cv-access-packages"
                            className="mx-auto mt-[40px] flex max-w-[1000px] flex-wrap justify-center gap-[24px] max-sm:mt-[28px]"
                        >
                            {CV_ACCESS_PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="justify-between flex w-full max-w-[280px] flex-col items-center rounded-[12px] bg-white items-center p-[24px] text-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] max-sm:max-w-full cursor-pointer border-[3px] border-transparent hover:border-[#DC0000] hover:bg-[#FFF4F4] transition-all duration-300"
                                >
                                    <div className='w-full border-b border-[rgba(143,143,143,0.24)] pb-[14px]'>
                                        <h3 className="text-[16px] font-[Inter-SemiBold] text-[#000000]">{plan.name}</h3>
                                        <p className="text-[20px] font-[Inter-Regular] text-[#000000]">{plan.price}</p>
                                        <div className="flex items-center justify-center">
                                            {plan.popular ? (
                                                <span className="rounded-full bg-[#000000] px-[8px] py-[2px] text-[12px] font-[Inter-SemiBold] text-white">
                                                    Popular
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className='w-full border-b border-[rgba(143,143,143,0.24)] py-[14px]'>
                                        <p className="text-[22px] font-[Inter-SemiBold] leading-snug text-[#000000]">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <div className='w-full pt-[24px]'>
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-full bg-[#FFF4F4] px-[28px] py-[10px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] transition-opacity hover:opacity-90"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div id="performance" className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] mb-[60px] common_container">
                <div className="text-center mb-[30px]">
                    <h2 className="text-[#000000] font-[Inter-SemiBold] text-[24px] mb-[10px]">
                        Performance of Ebozor jobs
                    </h2>
                    <p className="w_full max-sm:w-full text-[#000000CC] font-[Inter-Regular] text-[14px] w-[750px] mx-auto leading-[26px]">
                        Find the right candidate quickly! Get the visibility you need for your vacancies through a large
                        community of job seekers using Ebozor on a daily basis.
                    </p>
                </div>

                <div className="max-sm:flex-col max-sm:w-full flex flex-wrap justify-center w-[800px] gap-[16px] mx-auto">
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">300,000+</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Active users</p>
                    </div>
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">7 Million+</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Page views</p>
                    </div>
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">2,000+</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Recruiters</p>
                    </div>
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">600,000+</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Candidates</p>
                    </div>
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">500,000+</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Applications</p>
                    </div>
                    <div className="max-sm:w-full rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] w-[220px] p-[40px] border border-[rgba(143,143,143,0.50)] text-center">
                        <p className="text-[#000000] font-[Inter-SemiBold] text-[22px] mb-[8px]">20%</p>
                        <p className="text-[#777777] font-[Inter-Regular] text-[13px]">Senior profiles</p>
                    </div>
                </div>
            </div>

            <div className="w-full bg-[#F5FAFF] py-[30px]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="text-center mb-[30px]">
                        <h2 className="text-[#000000] font-[Inter-SemiBold] text-[24px] mb-[10px]">
                            Join our happy customers
                        </h2>
                    </div>
                    <div className="max-sm:grid-cols-1 grid grid-cols-3 gap-[30px]">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[rgba(143,143,143,0.50)] p-[24px]"
                            >
                                <p className="text-[#000] font-[Inter-Regular] text-[14px] leading-[28px] mb-[30px]">
                                    Ebozor is one of the best recruitment websites as it is very easy to use. Not only for
                                    recruiters, it is also easy for the candidates as they can apply for the job by pressing
                                    one button, which makes more candidates apply on your job ad. Also, the CV access service
                                    is great because it saves your time when you are in urgent position and you have no time
                                    to place an ad and wait for candidates to apply.
                                </p>
                                <div className="mb-[14px] flex gap-[4px]">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <StarIcon key={idx} className="text-[#FFA800] text-[14px]" />
                                    ))}
                                </div>
                                <div className="flex items-center gap-[10px]">
                                    <div>
                                        <Image src={testimonialavatar} alt="testimonial avatar" width={40} height={40} className="rounded-full" />
                                    </div>
                                    <div>
                                        <h4 className="text-[#000000CC] font-[Inter-SemiBold] text-[14px]">
                                            Union Square House Real Estate
                                        </h4>
                                        <p className="text-[#000] font-[Inter-Regular] text-[12px]">
                                            Sujeet Ahuja - CEO
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full bg-white py-[30px]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className="flex items-center gap-[80px] animate-logo-slider">
                        {[slider1, slider2, slider3, slider4, slider5, slider6, slider1, slider2, slider3, slider4, slider5, slider6].map((logo, idx) => (
                            <div key={idx} className="flex-shrink-0">
                                <Image src={logo} alt={`company logo ${idx + 1}`} className="h-[40px] w-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecuriterPage;

