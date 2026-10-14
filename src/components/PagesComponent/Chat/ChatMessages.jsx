'use client'
import { placeholderImage, t } from "@/utils";
import { getMessagesApi } from "@/utils/api";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const ChatMessages = ({ chatMessages, setChatMessages, setOfferPrice, setRating, setSelectedTabData, selectedTabData, openImageViewer, systemSettingsData, defaultSelected }) => {

    const [HasMoreChatMessages, setHasMoreChatMessages] = useState(false)
    const [CurrentMessagesPage, setCurrentMessagesPage] = useState(1)
    const [IsLoadPrevMesg, setIsLoadPrevMesg] = useState(false)
    const isLoggedIn = useSelector((state) => state.UserSignup);
    const userCurrentId = isLoggedIn && isLoggedIn.data ? isLoggedIn.data.data.id : null;

    const fetchChatMessgaes = async (id, page = 1) => {
        try {
            if (page > 1) {
                setIsLoadPrevMesg(true)
            }
            const response = await getMessagesApi.chatMessages({ item_offer_id: id, page });
            const { data } = response.data;

            if (page === 1) {
                setChatMessages(data?.data);
            }
            else {
                setChatMessages((prev) => [...prev, ...data?.data]);
            }
            setCurrentMessagesPage(data?.current_page)

            if (data?.current_page < data?.last_page) {
                setHasMoreChatMessages(true)
            }
            else {
                setHasMoreChatMessages(false)
            }
            setOfferPrice('')
            setRating('')
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoadPrevMesg(false)
        }
    };
    useEffect(() => {
        setSelectedTabData(defaultSelected)
        fetchChatMessgaes(defaultSelected?.id);
    }, [defaultSelected]);

    const formatMessageDate = (dateString) => {
        const messageDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return t('today');
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return t('yesterday');
        } else {
            return messageDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const resolveFileUrl = (message) => {
        if (!message) return "";
        return (
            message?.file ||
            message?.image ||
            message?.attachment ||
            message?.media ||
            message?.file_url ||
            message?.image_url ||
            message?.file?.url ||
            ""
        );
    };


    return (
        <>
            {
                HasMoreChatMessages &&
                <button disabled={IsLoadPrevMesg} className='date-separator loadPrevMessages' onClick={() => fetchChatMessgaes(selectedTabData.id, CurrentMessagesPage + 1)}>
                    {t('loadPrevMesgs')}
                </button>
            }

            {
                chatMessages && chatMessages.length > 0 && Object?.entries(
                    chatMessages.reduce((acc, message) => {
                        const date = formatMessageDate(message.created_at);
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(message);
                        return acc;
                    }, {})

                )
                    .reverse()
                    .map(([date, messages], dateIndex) => (
                        <div key={`date-group-${dateIndex}`} className="relative">
                            <div className="[box-shadow:0px_1px_10px_0px_rgba(0,0,0,0.04),0px_3px_8px_0px_rgba(0,0,0,0.02),0px_4px_8px_-2px_rgba(0,0,0,0.02)] bg-[#fff] rounded-[8px] p-[4px_10px] w-fit mx-auto my-[10px] sticky top-[8px] z-[1]">
                                <p className="text-[12px] font-[Inter-Regular] text-[#00000073]">{date}</p>
                            </div>
                            <div className="chat_render_msgs flex flex-col gap-[10px]">
                                {messages.map((message, messageIndex) => {
                                    const messageType = (message?.message_type || '').toLowerCase();
                                    const fileUrl = resolveFileUrl(message);
                                    const hasFile = Boolean(fileUrl);
                                    const hasAudio = Boolean(message?.audio);
                                    const hasText = Boolean(message?.message);
                                    const isAudioMessage = messageType === "audio" || (!hasFile && hasAudio);
                                    const isFileWithTextMessage = hasFile && hasText;
                                    const isFileOnlyMessage = hasFile && !hasText;
                                    const isTextOnlyMessage = !hasFile && !hasAudio && messageType === "text";

                                    return (
                                    <div key={`message-${dateIndex}-${messageIndex}`}>

                                        {isTextOnlyMessage && (
                                            <div className={`${message.sender_id === userCurrentId ? "bg-[#f4f4f5] rounded-[12px] p-[10px_16px] w-fit ml-auto rtl:ml-0 rtl:mr-auto" : "bg-[#d8e7fc] rounded-[12px] p-[10px_16px] w-fit rtl:mr-0 rtl:ml-auto"}`}>
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                    {message?.message}
                                                </p>
                                                <div className="mt-[10px]">
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">{formatTime(message?.created_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {isFileOnlyMessage && (
                                            <div className={`${message.sender_id === userCurrentId ? "bg-[#f4f4f5] rounded-[12px] p-[10px_16px] w-fit ml-auto rtl:ml-0 rtl:mr-auto" : "bg-[#d8e7fc] rounded-[12px] p-[10px_16px] w-fit rtl:mr-0 rtl:ml-auto"}`}>
                                                <div className="" onClick={() => openImageViewer(fileUrl)}>
                                                    <img
                                                        src={fileUrl || systemSettingsData?.data?.data?.placeholder_image}
                                                        alt='file'
                                                        className='w-[240px] h-[140px] object-contain rounded-[8px]'
                                                        loading='lazy'
                                                        onError={placeholderImage}
                                                    />
                                                </div>
                                                <p className="chat_time">{formatTime(message?.created_at)}</p>
                                            </div>
                                        )}
                                        {isAudioMessage && (
                                            <div className={`${message.sender_id === userCurrentId ? "bg-[#f4f4f5] rounded-[12px] p-[10px_16px] w-fit ml-auto rtl:ml-0 rtl:mr-auto" : "bg-[#d8e7fc] rounded-[12px] p-[10px_16px] w-fit rtl:mr-0 rtl:ml-auto"}`}>
                                                <div className="chat_audio">
                                                    <audio controls>
                                                        <source src={message?.audio} type="audio/mpeg" />
                                                        {t('browserDoesNotSupportAudio')}
                                                    </audio>
                                                </div>
                                                <p className="chat_time">{formatTime(message?.created_at)}</p>
                                            </div>
                                        )}
                                        {isFileWithTextMessage && (
                                            <div className={`${message.sender_id === userCurrentId ? "bg-[#f4f4f5] rounded-[12px] p-[10px_16px] w-fit ml-auto rtl:ml-0 rtl:mr-auto" : "bg-[#d8e7fc] rounded-[12px] p-[10px_16px] w-fit rtl:mr-0 rtl:ml-auto"}`}>
                                                <div className="">
                                                    <div className="" onClick={() => openImageViewer(fileUrl)}>
                                                        <img
                                                            src={fileUrl || systemSettingsData?.data?.data?.placeholder_image}
                                                            alt='file'
                                                            className='w-[240px] h-[140px] object-contain rounded-[8px]'
                                                            loading='lazy'
                                                            onError={placeholderImage}
                                                        />
                                                        <div className="text">
                                                            <span>{message.message}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="chat_time">{formatTime(message?.created_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        </div>
                    ))
            }
        </>
    )
}

export default ChatMessages