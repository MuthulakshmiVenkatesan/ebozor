'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { LaptopIcon, PersonalUserIcon, DragAndDropIcon, CategoryIcon, CloseIcon, UploadIcon } from '@/components/CustomFile/icons'
import user from '../../../../../public/assets/img/user.jpeg'
import avatar1 from '../../../../../public/assets/img/avatar/1.png'
import avatar2 from '../../../../../public/assets/img/avatar/2.png'
import avatar3 from '../../../../../public/assets/img/avatar/3.png'
import avatar4 from '../../../../../public/assets/img/avatar/4.png'
import avatar5 from '../../../../../public/assets/img/avatar/5.png'
import avatar6 from '../../../../../public/assets/img/avatar/6.png'
import avatar7 from '../../../../../public/assets/img/avatar/7.png'
import avatar8 from '../../../../../public/assets/img/avatar/8.png'
import avatar9 from '../../../../../public/assets/img/avatar/9.png'
import avatar10 from '../../../../../public/assets/img/avatar/10.png'
import avatar11 from '../../../../../public/assets/img/avatar/11.png'
import avatar12 from '../../../../../public/assets/img/avatar/12.png'
import avatar13 from '../../../../../public/assets/img/avatar/13.png'


const AVATAR_OPTIONS = [
    { id: 'a1', image: avatar1 },
    { id: 'a2', image: avatar2 },
    { id: 'a3', image: avatar3 },
    { id: 'a4', image: avatar4 },
    { id: 'a5', image: avatar5 },
    { id: 'a6', image: avatar6 },
    { id: 'a7', image: avatar7 },
    { id: 'a8', image: avatar8 },
    { id: 'a9', image: avatar9 },
    { id: 'a10', image: avatar10 },
    { id: 'a11', image: avatar11 },
    { id: 'a12', image: avatar12 },
    { id: 'a13', image: avatar13 },
]

export default function UpdateProfileModal({ open = true, onClose = () => { }, onSave = () => { }, saveLoading = false, currentImage = '' }) {
    const [activeTab, setActiveTab] = useState('computer')
    const [selectedAvatar, setSelectedAvatar] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [uploadedPreview, setUploadedPreview] = useState('')

    const canSave = useMemo(() => {
        if (activeTab === 'computer') return !!uploadedFile
        return !!selectedAvatar
    }, [activeTab, uploadedFile, selectedAvatar])

    useEffect(() => {
        if (!uploadedFile) {
            setUploadedPreview('')
            return
        }
        const previewUrl = URL.createObjectURL(uploadedFile)
        setUploadedPreview(previewUrl)
        return () => URL.revokeObjectURL(previewUrl)
    }, [uploadedFile])

    const selectedAvatarImage = useMemo(
        () => AVATAR_OPTIONS.find((item) => item.id === selectedAvatar)?.image,
        [selectedAvatar]
    )

    const previewImage = activeTab === 'computer'
        ? (uploadedPreview || selectedAvatarImage || currentImage || user)
        : (selectedAvatarImage || uploadedPreview || currentImage || user)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-[600px] max-sm:w-full overflow-hidden rounded-[8px] bg-white shadow-xl">
                <div className="flex items-center justify-between px-6 py-5">
                    <button type="button" onClick={onClose} className="cursor-pointer text-[#6b7280]">
                        <CategoryIcon className="w-[18px] h-[18px] rotate-180" fill="#8f8f8f" />
                    </button>
                    <h3 className="text-[18px] font-[Inter-SemiBold] leading-none text-[#23262A]">Update profile picture</h3>
                    <button type="button" onClick={onClose} className="cursor-pointer text-[#6b7280]">
                        <CloseIcon className="w-[12px] h-[12px]" fill="#8f8f8f" />
                    </button>
                </div>

                <div>
                    <div className="max-h-[calc(86vh-86px)] overflow-y-auto px-[24px] ">
                        <div className="mx-auto mb-5 mt-1 h-[120px] w-[120px] overflow-hidden rounded-full">
                            <Image src={previewImage} alt="Profile" className="h-full w-full object-cover" width={120} height={120} />
                        </div>

                        <div className="mb-4 grid grid-cols-2 border-b border-[rgba(143,143,143,0.25)]">
                            <button
                                type="button"
                                onClick={() => setActiveTab('computer')}
                                className={`cursor-pointer border-b-2 pb-3 pt-2 text-center flex flex-col items-center gap-[6px] ${activeTab === 'computer' ? 'border-[#DC0000]' : 'border-transparent '}`}
                            >
                                <LaptopIcon className="" fill={activeTab === 'computer' ? '#23262A' : '#6b7280'} />
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">From Computer</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('avatars')}
                                className={`cursor-pointer border-b-2 pb-3 pt-2 text-center flex flex-col items-center gap-[6px] ${activeTab === 'avatars' ? 'border-[#DC0000]' : 'border-transparent '}`}
                            >
                                <PersonalUserIcon className="" fill={activeTab === 'avatars' ? '#23262A' : '#6b7280'} />
                                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Avatars</p>
                            </button>
                        </div>

                        {activeTab === 'avatars' ? (
                            <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-2">
                                {AVATAR_OPTIONS.map((avatar) => (
                                    <div key={avatar.id} className={`p-[4px] cursor-pointer rounded-[12px] w-[116px] h-[116px] border-[2px] ${selectedAvatar === avatar.id ? 'border-[#23262A]' : 'border-[#fff]'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAvatar(avatar.id)}
                                            className={`cursor-pointer overflow-hidden rounded-[12px]`}
                                        >
                                            <Image src={avatar.image} alt={avatar.id} className="h-full w-full object-cover rounded-[12px]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[8px] border border-dashed border-[rgba(143,143,143,0.25)] p-[20px] text-center">
                                <div className="mx-auto mb-3 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#e000001f]">
                                    <DragAndDropIcon className="w-[20px] h-[20px]" />
                                </div>
                                <p className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">Drag and drop</p>
                                <div className='flex items-center my-[10px] gap-[10px] justify-center'>
                                    <div className='bg-[#8f8f8f] w-[12px] h-[1px]'></div>
                                    <p className='text-[14px] font-[Inter-Medium] text-[#8f8f8f]'>or</p>
                                    <div className='bg-[#8f8f8f] w-[12px] h-[1px]'></div>
                                </div>
                                <label className="mb-[10px] inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-[#23262A] p-[6px_12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                    <UploadIcon className="w-[20px] h-[20px]" />
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            setUploadedFile(e.target.files?.[0] || null)
                                            setActiveTab('computer')
                                        }}
                                    />
                                </label>
                                <p className="font-[Inter-Regular] text-[12px] text-[#8f8f8f]">Image will be resized to 140 x 140</p>
                            </div>
                        )}


                    </div>

                    <div className="flex justify-end p-[24px]">
                        <button
                            type="button"
                            onClick={() => canSave && !saveLoading && onSave({ selectedAvatar: selectedAvatarImage, uploadedFile, activeTab })}
                            disabled={!canSave || saveLoading}
                            className={`rounded-[6px] p-[10px_20px] text-[14px] font-[Inter-SemiBold] ${canSave && !saveLoading ? 'cursor-pointer bg-[#23262A] text-white' : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'}`}
                        >
                            {saveLoading ? 'Saving...' : 'Save Profile Picture'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
