'use client'

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
import { settingsData } from "@/redux/reuducer/settingSlice"
import { t } from "@/utils"
import { contactUsApi } from "@/utils/api"
import toast from "react-hot-toast"
import { useSelector } from "react-redux"
import { DownArrowIcon, RightArrowIcon, UploadLinkIcon, CloseIcon } from '@/components/CustomFile/icons'
import ArticleSearchInput from '@/components/Search/ArticleSearchInput'
import ContactHeader from './components/ContactHeader'
import ContactFooter from './components/ContactFooter'
const ContactUs = () => {
    const [query, setQuery] = useState('')
    const [selectedForm, setSelectedForm] = useState('-')
    const [email, setEmail] = useState('')
    const [helpTopic, setHelpTopic] = useState('-')
    const [subject, setSubject] = useState('')
    const [category, setCategory] = useState('-')
    const [businessId, setBusinessId] = useState('')
    const [hasTradeLicense, setHasTradeLicense] = useState(false)
    const [mobileNumber, setMobileNumber] = useState('')
    const [description, setDescription] = useState('')
    const [attachments, setAttachments] = useState([])
    const fileRef = useRef(null)

    const trendingArticles = useMemo(
        () => ['Posting issue with listing', 'Payment and billing support', 'Report suspicious user', 'Account login help'],
        []
    )

    const onPickFiles = (files) => {
        const next = Array.from(files || [])
        if (next.length === 0) return
        setAttachments((prev) => [...prev, ...next].slice(0, 5))
    }

    const onDrop = (e) => {
        e.preventDefault()
        onPickFiles(e.dataTransfer.files)
    }

    const onSubmit = (e) => {
        e.preventDefault()
        // UI-only for now (no API wired)
    }

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const [IsLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }))
    }

    const validateForm = () => {
        const { name, email, subject, message } = formData

        if (!name) {
            toast.error(t("nameRequired"))
            return false
        }

        if (!email) {
            toast.error(t("emailRequired"))
            return false
        }

        if (!subject) {
            toast.error(t("subjectRequired"))
            return false
        }

        if (!message) {
            toast.error(t("messageRequired"))
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setIsLoading(true)
            const res = await contactUsApi.contactUs(formData)
            if (res?.data?.error === false) {
                toast.success(t("thankForContacting"))
            }
            else {
                toast.error(t("errorOccurred"))
            }

            // Clear form after successful submission
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            })
            // You might want to show a success message to the user here
        } catch (error) {
            console.log(error)
            toast.error(t("errorOccurred"))
            // You might want to show an error message to the user here
        }
        finally {
            setIsLoading(false)
        }
    }
    
    return (
        <>
            <ContactHeader />
            <div className="bg-[#fafafa] py-[26px] sm:py-[38px]">
                <div className="mx-auto w-full max-w-[1000px] px-[16px]">
                    <h1 className="mb-[16px] text-center text-[34px] font-[Inter-Regular] leading-tight text-[#666]">
                        How can we help you?
                    </h1>

                    <div className="mx-auto mb-[40px] w-full max-w-[770px]">
                        <ArticleSearchInput value={query} onChange={setQuery} />
                    </div>

                    <div className="mb-[34px] flex items-center gap-[2px] border border-[rgba(143,143,143,0.45)] rounded-[6px] w-fit">
                        <Link
                            href="/help"
                            className="inline-flex items-center gap-[8px] bg-[#fff] p-[8px_14px] rounded-[6px_0_0_6px] border-r border-[rgba(143,143,143,0.45)]"
                        >
                            <RightArrowIcon className="h-[16px] w-[16px] rotate-180" stroke="#6F7783" />
                            <p className='text-[12px] font-[Inter-Regular] text-[#999]'>Help Center</p>
                        </Link>
                        <button
                            type="button"
                            className="inline-flex items-center bg-[#f3f3f3] p-[8px_16px] text-[12px] font-[Inter-SemiBold] text-[#6f7783] rounded-[6px]"
                        >
                            Submit a request
                        </button>
                    </div>

                    <h2 className="mb-[8px] text-[30px] font-[Inter-Regular] text-[#000]">
                        Help us help you faster!
                    </h2>
                    <div className="mb-[28px] h-[1px] w-full bg-[#d9dde2]" />

                    <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1fr_340px]">
                        <div className="border border-[rgba(143,143,143,0.45)] bg-white p-[20px_30px]">
                            <p className="mb-[30px] text-[14px] font-[Inter-Regular] leading-[1.45] text-[#3b4245] ">
                                Accurately selecting your specific issue from the drop-down lists below will enable us to direct
                                your message to the right deparment. Once you select your issue, you will be able to contact us.
                            </p>

                            <p className="mb-[10px] text-[16px] font-[Inter-Regular] text-[#3b4245]">
                                How can we help? Select a form that best meets your needs:
                            </p>

                            {/* <div className="relative mb-[24px]">
                                <select
                                    value={selectedForm}
                                    onChange={(e) => setSelectedForm(e.target.value)}
                                    className=" w-full appearance-none border border-[rgba(143,143,143,0.45)] bg-white p-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none cursor-pointer"
                                >
                                    <option value="-">-</option>
                                    <option value="customer-support">Customer Support</option>
                                    <option value="verified-business">Verified Business</option>
                                    <option value="become-a-verified-business">Become a Verified Business</option>
                                    <option value="holiday-homes">Holiday Homes</option>
                                </select>
                                <DownArrowIcon
                                    className="pointer-events-none absolute right-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2"
                                    stroke="#9CA3AF"
                                />
                            </div>

                            {selectedForm !== '-' ? (
                                <form onSubmit={onSubmit} className="mt-[10px]">
                                    <div className="mb-[18px]">
                                        <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            Your email address<span className="text-[#DC0000]"> *</span>
                                        </label>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>

                                    {selectedForm !== 'become-a-verified-business' ? (
                                        <div className="mb-[18px]">
                                            <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                {selectedForm === 'holiday-homes' ? 'Which best describes you?' : 'How can we help you?'}
                                                <span className="text-[#DC0000]"> *</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={helpTopic}
                                                    onChange={(e) => setHelpTopic(e.target.value)}
                                                    className="p-[8px] w-full cursor-pointer appearance-none rounded-[2px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] pr-[40px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                                >
                                                    <option value="-">-</option>
                                                    {selectedForm === 'holiday-homes' ? (
                                                        <>
                                                            <option value="landlord">Landlord / Host</option>
                                                            <option value="agency">Agency</option>
                                                            <option value="tenant">Tenant / Guest</option>
                                                            <option value="other">Other</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="account">Account</option>
                                                            <option value="ads">Ads</option>
                                                            <option value="payments">Payments</option>
                                                            <option value="trust">Trust & Safety</option>
                                                        </>
                                                    )}
                                                </select>
                                                <DownArrowIcon
                                                    className="pointer-events-none absolute right-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2"
                                                    stroke="#9CA3AF"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-[10px]">
                                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    Do you have a valid trade license or freelance permit to do business in the UAE?
                                                </p>
                                            </div>
                                            <div className="mb-[16px] flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={hasTradeLicense}
                                                    onChange={(e) => setHasTradeLicense(e.target.checked)}
                                                    className="h-[14px] w-[14px] cursor-pointer rounded border border-[rgba(143,143,143,0.6)]"
                                                />
                                            </div>
                                            <div className="mb-[18px]">
                                                <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    Active Mobile Number
                                                </label>
                                                <input
                                                    value={mobileNumber}
                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                    type="text"
                                                    className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                                />
                                                <p className="mt-[6px] text-[11px] font-[Inter-Regular] text-[#b0b4ba]">
                                                    Example - +9715xxxxxxxx
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="mb-[18px]">
                                        <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            Subject<span className="text-[#DC0000]"> *</span>
                                        </label>
                                        <input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            type="text"
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>

                                    {selectedForm === 'verified-business' ? (
                                        <div className="mb-[18px]">
                                            <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                Business ID<span className="text-[#DC0000]"> *</span>
                                            </label>
                                            <input
                                                value={businessId}
                                                onChange={(e) => setBusinessId(e.target.value)}
                                                type="text"
                                                className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                            />
                                        </div>
                                    ) : selectedForm === 'become-a-verified-business' || selectedForm === 'holiday-homes' ? null : (
                                        <div className="mb-[18px]">
                                            <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                Category<span className="text-[#DC0000]"> *</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    className="p-[8px] w-full cursor-pointer appearance-none rounded-[2px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] pr-[40px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                                >
                                                    <option value="-">-</option>
                                                    <option value="general">General</option>
                                                    <option value="technical">Technical issue</option>
                                                    <option value="billing">Billing</option>
                                                    <option value="report">Report user</option>
                                                </select>
                                                <DownArrowIcon
                                                    className="pointer-events-none absolute right-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2"
                                                    stroke="#9CA3AF"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-[10px]">
                                        <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            Description<span className="text-[#DC0000]"> *</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={5}
                                            className="w-full resize-none rounded-[2px] border border-[rgba(143,143,143,0.45)] p-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                        <p className="mt-[8px] text-[11px] font-[Inter-Regular] text-[#b0b4ba]">
                                            Please enter the details of your request. A member of our support staff will respond as soon as possible.
                                        </p>
                                    </div>

                                    <div className="mt-[14px]">
                                        <p className="mb-[10px] text-[16px] font-[Inter-Regular] text-[#23262A]">Attachments</p>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => onPickFiles(e.target.files)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={onDrop}
                                            className="flex h-[62px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[2px] border border-dashed border-[#DC0000] bg-white text-[14px] font-[Inter-Regular] text-[#23262A]"
                                        >
                                            <UploadLinkIcon className="h-[18px] w-[18px]" fill="#DC0000" />
                                            <span>Add file or drop files here</span>
                                        </button>

                                        {attachments.length > 0 ? (
                                            <div className="mt-[10px] space-y-[6px]">
                                                {attachments.map((f, idx) => (
                                                    <div key={`${f.name}-${idx}`} className="flex items-center gap-[10px] text-[12px]">
                                                        <p className="truncate font-[Inter-Regular] text-[#666]">{f.name}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                                            className="cursor-pointer"
                                                        >
                                                            <CloseIcon className="h-[6px] w-[6px]" fill="#8f8f8f" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="submit"
                                        className="mt-[26px] w-full cursor-pointer rounded-[2px] bg-[#DC0000] py-[10px] text-[16px] font-[Inter-Regular] text-white transition hover:bg-[#c10000]"
                                    >
                                        Submit
                                    </button>

                                    <p className="mt-[14px] text-[12px] font-[Inter-Regular] text-[#8b929e]">
                                        <span className="mr-[4px] text-[#DC0000]">*</span>
                                        Mandatory fields
                                    </p>
                                </form>
                            ) : null} */}

                            {/* <p className="text-[12px] font-[Inter-Regular] text-[#8b929e]">
                                <span className="mr-[4px] text-[#DC0000]">*</span>
                                Mandatory Fields
                            </p> */}

                            <div>
                                <form className="" onSubmit={handleSubmit}>

                                    <div className="mb-[18px]">
                                        <label htmlFor="name" className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            {t('name')}
                                        </label>
                                        <input
                                            type="text"
                                            id='name'
                                            name='name'
                                            placeholder={t("enterName")}
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>
                                    <div className="mb-[18px]"  >
                                        <label htmlFor="email" className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            {t('email')}
                                        </label>
                                        <input
                                            type="email"
                                            id='email'
                                            name='email'
                                            placeholder={t("enterEmail")}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>
                                    <div className="mb-[18px]"  >
                                        <label htmlFor="subject" className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            {t('subject')}
                                        </label>
                                        <input
                                            type="text"
                                            id='subject'
                                            name='subject'
                                            placeholder={t("enterSubject")}
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>
                                    <div className="mb-[18px]"  >
                                        <label htmlFor="message" className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                            {t('message')}
                                        </label>
                                        <textarea
                                            placeholder={t("enterMessage")}
                                            name="message"
                                            id="message"
                                            rows="5"
                                            className="p-[8px] w-full rounded-[2px] border border-[rgba(143,143,143,0.45)]  text-[14px] font-[Inter-Regular] text-[#23262A] outline-none resize-none"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                        ></textarea>
                                    </div>
                                    <button
                                        type={IsLoading ? 'button' : 'submit'}
                                        className="mt-[16px] w-full cursor-pointer rounded-[2px] bg-[#DC0000] py-[10px] text-[16px] font-[Inter-Regular] text-white transition hover:bg-[#c10000]"
                                    >
                                        {IsLoading ? 'Loading...' : t('submit')}
                                    </button>

                                </form>
                            </div>
                        </div>

                        <aside className="border border-[#d7dce1] bg-white">
                            <h3 className="relative border-b border-[#eceff2] px-[16px] py-[16px] text-center text-[18px] font-[Inter-SemiBold] text-[#23262A] max-sm:text-[30px]">
                                Trending articles
                                <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#fff]" />
                            </h3>
                            <div className='p-[35px_25px_20px] bg-[#f3f3f3]'>
                                <div className='w-full'>
                                    <Link
                                        href="/blogs"
                                        className='flex justify-center items-center w-full cursor-pointer rounded-[2px] bg-[#DC0000] py-[10px] text-[16px] font-[Inter-Regular] text-white transition'>
                                        Read Articles
                                    </Link>
                                </div>
                            </div>

                        </aside>
                    </div>
                </div>
            </div>
            <ContactFooter />
        </>
    )
}

export default ContactUs