'use client'
import { useEffect, useRef, useState } from 'react';
import { IoCloseCircleOutline, IoGiftOutline } from "react-icons/io5";
import { IoMdAttach } from "react-icons/io";
import Image from 'next/image';
import ProfileSidebar from "@/components/Profile/ProfileSidebar";
import { BiSend } from "react-icons/bi";
import { t } from "@/utils";
import { addItemReviewApi, blockUserApi, itemOfferApi, sendMessageApi, tipsApi, unBlockUserApi } from '@/utils/api';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import NoChatFound from '@/components/NoDataFound/NoChatFound';
import { Rate } from 'antd';
import ImageViewer from './ImageViewer';
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import NoConvWithSeller from './NoConvWithSeller';
import MakeOfferInChat from './MakeOfferInChat';
import TipsModal from './TipsModal';
import ChatList from './ChatList';
import ChatUserTab from './ChatUserTab';
import ChatMessages from './ChatMessages';
import { saveOfferData } from '@/redux/reuducer/offerSlice';
import { getSocket, disconnectSocket } from '@/utils/socket';
import VerifiedMain from '../GetVerified/VerifiedMain'
import attachment from '../../../../public/assets/img/icons/attachment.svg'
import sendicon from '../../../../public/assets/img/icons/send.svg'


const Chat = ({ setActiveTab, activeTab, chatMessages, setChatMessages, selectedTabData, setSelectedTabData, defaultSelected }) => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const systemSettingsData = useSelector((state) => state?.Settings)
    const CurrencySymbol = systemSettingsData?.data?.data?.currency_symbol
    const authState = useSelector((state) => state.UserSignup);
    const currentUserId = authState?.data?.data?.id;
    const [blockedUsersList, setBlockedUsersList] = useState([]);
    const [blockPopoverVisible, setBlockPopoverVisible] = useState(false);
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [isUserOffer, setIsUSerOffer] = useState(false); // State to store selected chat IDD
    const [messageInput, setMessageInput] = useState(''); // State to store text message
    const [selectedFile, setSelectedFile] = useState(null); // State to store selected file
    const [selectedFilePreview, setSelectedFilePreview] = useState(null);
    const [selectedAudio, setSelectedAudio] = useState(null);
    const [isPeerTyping, setIsPeerTyping] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false); // State to hold
    const [viewerImage, setViewerImage] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [Rating, setRating] = useState('')
    const [IsTopMakeOffer, setIsTopMakeOffer] = useState(true)
    const [IsMakeOfferInChat, setIsMakeOfferInChat] = useState(false)
    const [OfferPrice, setOfferPrice] = useState('')
    const [Review, setReview] = useState('')
    const [IsTipsOpen, setIsTipsOpen] = useState(false)
    const [tipsData, setTipsData] = useState([])
    const normalizedItemStatus = String(selectedTabData?.item?.status || '').trim().toLowerCase().replace(/_/g, ' ')
    const makeUnableToChat =
        normalizedItemStatus === "review" ||
        normalizedItemStatus === "rejected" ||
        normalizedItemStatus === "sold out" ||
        normalizedItemStatus === "inactive"
    const isBuyingTab = activeTab === 'buying'
    const isDealClosed = normalizedItemStatus === "sold out"
    const rawReview = selectedTabData?.item?.review
    const hasReview =
        rawReview !== null &&
        rawReview !== undefined &&
        String(rawReview).trim() !== '' &&
        String(rawReview).trim().toLowerCase() !== 'null'
    const IsShowRating = isBuyingTab && isDealClosed
    const IsDealClosedReviewPending = IsShowRating && !hasReview
    const IsShowMakeOfferOnTop = IsTopMakeOffer && chatMessages?.length > 0 && !selectedTabData?.amount && !makeUnableToChat && activeTab === 'buying'
    const IsShowInitialMakeOffer = chatMessages?.length === 0 && !selectedTabData?.amount && !IsMakeOfferInChat && activeTab === 'buying' && !makeUnableToChat
    const IsShowOfferInput = IsMakeOfferInChat && activeTab === 'buying' && !selectedTabData?.amount && !makeUnableToChat
    const chatMessagesRef = useRef(null);
    const [IsSubmittingOffer, setIsSubmittingOffer] = useState(false)
    const [buyerChatList, setBuyerChatList] = useState([]);
    const socketRef = useRef(null);
    const presenceIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingIndicatorTimeoutRef = useRef(null);


    useEffect(() => {
        if (activeTab === "buying") {
            setIsUSerOffer(true)
        } else {
            setIsUSerOffer(false)
        }
    }, [activeTab]);


    // this is for the chat to open to bottom to get the latest mesg
    useEffect(() => {
        if (selectedTabData && chatMessagesRef.current && chatMessages?.length > 0) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [selectedTabData, chatMessages])

    // Function to fetch blocked users

    const handleUnBlockUser = async (id) => {
        try {
            const response = await unBlockUserApi.unBlockUser({ blocked_user_id: id });
            if (response?.data.error === false) {
                setSelectedTabData((prevData) => ({
                    ...prevData,
                    user_blocked: false
                }));
                setBlockedUsersList(prevUsers => prevUsers.filter(user => user.id !== id));
                setIsBlocked(false);

                // close popovers
                setBlockPopoverVisible(false)
                setPopoverVisible(false)


                toast.success(response?.data?.message);
            } else {
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsBlocked(true);
            console.log(error);
        }
    };

    const handleBlockUser = async (id) => {
        try {
            const response = await blockUserApi.blockUser({ blocked_user_id: id });
            if (response?.data?.error === false) {
                setIsBlocked(true);
                setSelectedTabData((prevData) => ({
                    ...prevData,
                    user_blocked: true
                }));
                setPopoverVisible(false);
                setBlockPopoverVisible(false)
                toast.success(response?.data?.message);
            }
            else {
                toast.error(response?.data?.message);
            }
        } catch (error) {
            setIsBlocked(false);
            console.log(error);
        }
    };

    const fetchTipsData = async () => {
        try {
            const response = await tipsApi.tips({})
            const { data } = response.data
            if (data.length > 0) {
                setTipsData(data)
            }

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!selectedTabData?.amount) {
            fetchTipsData()
        }
    }, [])

    useEffect(() => {
        if (selectedTabData?.user_blocked === true) {
            setIsBlocked(true)
        } else {
            setIsBlocked(false)
        }

    }, [selectedTabData])

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (validTypes.includes(file.type)) {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                // Reset the input field
                e.target.value = null;
                setSelectedFilePreview(null);
                // Show an error message
                toast.error(t('selectValidImage'));
            }
        } else {
            // Reset the input field
            e.target.value = null;
            setSelectedFilePreview(null);
        }
    };



    const openImageViewer = (imageSrc) => {
        setViewerImage(imageSrc);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default behavior (new line)
            sendMessage();
        } else {
            emitTypingStart();
        }
    };


    const emitTypingStart = () => {
        if (!socketRef.current || !selectedTabData?.id) return;
        socketRef.current.emit("typing:start", { offerId: selectedTabData.id });
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("typing:stop", { offerId: selectedTabData.id });
        }, 1500);
    };

    /*
    // Previous REST-based sendMessage (kept for reference):
    // const sendMessage = async (audio) => {
    //     if (selectedFile || audio || selectedAudio) {
    //         setIsSending(true);
    //         try {
    //             const response = await sendMessageApi.sendMessage({
    //                 item_offer_id: selectedTabData?.id,
    //                 message: messageInput ? messageInput : "",
    //                 file: selectedFile ? selectedFile : "",
    //                 audio: audio ? audio : ""
    //             });
    //             const { data } = response.data;
    //             if (response?.data?.error === false) {
    //                 setChatMessages((prevMessages) => [data, ...prevMessages]);
    //                 setMessageInput('');
    //                 setSelectedFile(null);
    //                 setSelectedAudio(null);
    //                 setSelectedFilePreview(null);
    //                 if (!selectedTabData?.amount) {
    //                     setIsTopMakeOffer(true)
    //                 }
    //             } else {
    //                 toast.error(response?.data?.message)
    //             }
    //         } catch (error) {
    //             console.log(error);
    //         } finally {
    //             setIsSending(false);
    //         }
    //         return;
    //     }
    // };
    */

    const sendMessage = async () => {
        const offerId = selectedTabData?.id;
        if (!offerId) {
            toast.error(t('somethingWentWrong'));
            return;
        }

        const messagePayload = messageInput?.trim() || '';

        // Handle media via REST to support file/audio uploads (allow file-only)
        if (selectedFile || selectedAudio) {
            const clientTempId = `temp-${Date.now()}`;
            if (selectedFilePreview) {
                const tempMessage = {
                    id: clientTempId,
                    clientTempId,
                    message: messagePayload,
                    file: selectedFilePreview,
                    message_type: selectedFile && messagePayload ? 'file_and_text' : 'file',
                    sender_id: currentUserId,
                    created_at: new Date().toISOString(),
                    pending: true,
                };
                setChatMessages((prev) => [tempMessage, ...prev]);
            }

            setIsSending(true);
            socketRef.current?.emit("typing:stop", { offerId });
            try {
                const response = await sendMessageApi.sendMessage({
                    item_offer_id: offerId,
                    message: messagePayload,
                    file: selectedFile,
                    audio: selectedAudio
                });
                const { data } = response.data;
                if (response?.data?.error === false) {
                    setChatMessages((prevMessages) => {
                        const filtered = prevMessages.filter((msg) => msg?.clientTempId !== clientTempId);
                        return [data, ...filtered];
                    });
                    setMessageInput('');
                    setSelectedFile(null);
                    setSelectedAudio(null);
                    setSelectedFilePreview(null);
                    const fileInput = document.getElementById('file_attach');
                    if (fileInput) fileInput.value = null;
                    if (!selectedTabData?.amount) {
                        setIsTopMakeOffer(true);
                    }
                } else {
                    toast.error(response?.data?.message || t('somethingWentWrong'));
                    setChatMessages((prevMessages) => prevMessages.filter((msg) => msg?.clientTempId !== clientTempId));
                }
            } catch (error) {
                console.log(error);
                toast.error(t('somethingWentWrong'));
                setChatMessages((prevMessages) => prevMessages.filter((msg) => msg?.clientTempId !== clientTempId));
            } finally {
                setIsSending(false);
            }
            return;
        }

        // Websocket path for plain text
        if (!socketRef.current) {
            toast.error(t('somethingWentWrong'));
            return;
        }
        if (!messagePayload) {
            return;
        }
        setIsSending(true);
        socketRef.current.emit("typing:stop", { offerId });
        socketRef.current.emit("message", { offerId, message: messagePayload }, () => {
            setIsSending(false);
        });
        // optimistic clear; new message will be appended via socket listener
        setMessageInput('');
        setIsSending(false);
    };

    const handleRatingChange = (value) => {
        setRating(value)
    }

    const handleMakeOfferInStart = () => {

        if (tipsData.length > 0) {
            setIsTipsOpen(true)
        }
        else {
            setIsMakeOfferInChat(true)
        }
    }

    const handleOfferLaterClick = () => {
        setIsMakeOfferInChat(false)
        if (chatMessages?.length > 0 && !selectedTabData?.amount) {
            setIsTopMakeOffer(true)
        }
    }

    const handleTopMakeOfferClick = () => {
        if (tipsData.length > 0) {
            setIsTipsOpen(true)
        }
        else {
            setIsMakeOfferInChat(true)
            setIsTopMakeOffer(false)
        }
    }

    const handleSendOffer = async () => {
        // Ensure the offer price is a valid number
        const offerAmount = parseFloat(OfferPrice);

        if (isNaN(offerAmount) || offerAmount <= 0) {
            toast.error(t('offerPricePositiveError')); // Set an error message if the offer price is not valid
            return;
        }

        if (offerAmount > selectedTabData?.item?.price) {
            toast.error(t('offerPriceError')); // Set an error message if the offer price is too high
            return;
        }

        try {
            setIsSubmittingOffer(true)
            const response = await itemOfferApi.offer({
                item_id: Number(selectedTabData.item_id),
                amount: offerAmount
            });
            const { data } = response.data;

            if (response?.data?.error === false) {
                toast.success(response?.data?.message);
                setIsMakeOfferInChat(false)
                setBuyerChatList((prev) =>
                    prev.map((item) => {
                        if (Number(item.id) === Number(response?.data?.data?.id)) {
                            return response?.data?.data; // Update the matching item
                        }
                        return item; // Keep other items unchanged
                    })
                );
                saveOfferData(data)
                setSelectedTabData(data)
                setIsUSerOffer(true)
            }

        } catch (error) {
            console.log(error);
            toast.error(t('offerSendError')); // Handle error during offer sending
        } finally {
            setIsSubmittingOffer(false)
        }
    };


    const handleReviewSubmit = async () => {
        if (Rating === '') {
            toast.error(t('provideRating'))
            return
        }
        if (Review.trim() === '') {
            toast.error(t('provideReview'))
            return
        }
        try {
            const res = await addItemReviewApi.addItemReview({ item_id: selectedTabData?.item_id, review: Review, ratings: Rating })
            if (res?.data?.error === false) {
                toast.success(res?.data?.message)

                setSelectedTabData((prev) => ({
                    ...prev,
                    item: {
                        ...prev.item,
                        review: res?.data?.data,
                    },
                }));

                setBuyerChatList((prev) =>
                    prev.map(chatItem =>
                        chatItem?.item?.id === Number(res?.data?.data?.item_id) // Match item_id correctly
                            ? {
                                ...chatItem,
                                item: {
                                    ...chatItem.item, // Preserve the other properties of the item
                                    review: res?.data?.data?.review // Set review from the response
                                }
                            }
                            : chatItem
                    )
                );
                setReview('')
                setRating('')
            }
            else {
                toast.error(t('failedToSubmitReview'))
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleReviewChange = (e) => {
        setReview(e.target.value)
    }

    const handleRemoveFile = () => {
        setSelectedFilePreview(null);
        setSelectedFile(null);
        // Reset the input value to allow re-uploading the same file
        document.getElementById('file_attach').value = null;
    };

    // socket setup
    useEffect(() => {
        const token = authState?.data?.token;
        const socket = getSocket(token);
        socketRef.current = socket;

        const handleConnect = () => {
            if (selectedTabData?.id) {
                socket.emit("join", { offerId: selectedTabData.id });
            }
            if (!presenceIntervalRef.current) {
                presenceIntervalRef.current = setInterval(() => {
                    socket.emit("presence:ping");
                }, 60000);
            }
        };

        const handleMessage = (payload) => {
            setChatMessages((prev) => [payload, ...prev]);
            if (!selectedTabData?.amount) {
                setIsTopMakeOffer(true)
            }
        };

        const handleJoined = () => { };
        const handleTyping = (payload) => {
            const payloadOfferId = Number(payload?.offerId ?? payload?.offer_id ?? payload?.item_offer_id ?? payload?.item_offer);
            const currentOfferId = Number(selectedTabData?.id);
            // log for troubleshooting backend payload shape
            console.debug('typing event', { payloadOfferId, currentOfferId, raw: payload });
            const senderId = Number(payload?.sender_id ?? payload?.user_id ?? payload?.userId);
            if (currentUserId && senderId && senderId === Number(currentUserId)) {
                return; // ignore self typing echoes
            }
            if (currentOfferId && payloadOfferId && payloadOfferId !== currentOfferId) return;
            setIsPeerTyping(true);
            if (typingIndicatorTimeoutRef.current) {
                clearTimeout(typingIndicatorTimeoutRef.current);
            }
            typingIndicatorTimeoutRef.current = setTimeout(() => {
                setIsPeerTyping(false);
            }, 3000);
        };
        const handlePresence = () => { };
        const handleError = (err) => {
            console.error(err);
        };

        socket.on("connect", handleConnect);
        socket.on("joined", handleJoined);
        socket.on("message", handleMessage);
        socket.on("typing", handleTyping);
        socket.on("presence:update", handlePresence);
        socket.on("error", handleError);

        socket.connect();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("joined", handleJoined);
            socket.off("message", handleMessage);
            socket.off("typing", handleTyping);
            socket.off("presence:update", handlePresence);
            socket.off("error", handleError);
            if (presenceIntervalRef.current) {
                clearInterval(presenceIntervalRef.current);
                presenceIntervalRef.current = null;
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            if (typingIndicatorTimeoutRef.current) {
                clearTimeout(typingIndicatorTimeoutRef.current);
                typingIndicatorTimeoutRef.current = null;
            }
            disconnectSocket();
        };
    }, [selectedTabData?.id, authState?.data?.token]);


    // re-join when chat changes
    useEffect(() => {
        if (socketRef.current && selectedTabData?.id) {
            socketRef.current.emit("join", { offerId: selectedTabData.id });
        }
        setIsPeerTyping(false);
    }, [selectedTabData?.id]);


    return (
        <>

            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="mb-[20px]">
                        <VerifiedMain showTickBadge={false} />
                    </div>

                    <div className=''>

                        <div className="">

                            <div className="">
                                <div className="">
                                    <div className="grid min-w-0 grid-cols-[400px_1fr] overflow-hidden border border-[rgba(143,143,143,0.2)] rounded-[8px] max-sm:grid-cols-1">
                                        <div className="min-w-0 border-r rtl:border-l rtl:border-r-0 border-[rgba(143,143,143,0.2)]">
                                            <ChatList systemSettingsData={systemSettingsData} selectedTabData={selectedTabData} setSelectedTabData={setSelectedTabData} activeTab={activeTab} setActiveTab={setActiveTab} setBlockedUsersList={setBlockedUsersList} blockPopoverVisible={blockPopoverVisible} setBlockPopoverVisible={setBlockPopoverVisible} blockedUsersList={blockedUsersList} handleUnBlockUser={handleUnBlockUser} setReview={setReview} setRating={setRating} buyerChatList={buyerChatList} setBuyerChatList={setBuyerChatList} />
                                        </div>
                                        <div className="min-w-0 overflow-hidden relative">
                                            {!selectedTabData || selectedTabData?.length <= 0 ? (
                                                <NoChatFound />
                                            ) : (
                                                <div className="min-w-0 overflow-hidden ">

                                                    <ChatUserTab activeTab={activeTab} selectedTabData={selectedTabData} systemSettingsData={systemSettingsData} isBlocked={isBlocked} handleBlockUser={handleBlockUser} handleUnBlockUser={handleUnBlockUser} popoverVisible={popoverVisible} setPopoverVisible={setPopoverVisible} />

                                                    <div className=''>
                                                        {
                                                            IsShowMakeOfferOnTop &&
                                                            <div className='topMakeOffer'>
                                                                <h1 className='submitProposal'>{t('submitProposal')}</h1>
                                                                <button className="makeOfferCont" onClick={handleTopMakeOfferClick}>
                                                                    <span><IoGiftOutline size={20} /></span>
                                                                    <span>{t('makeOffer')}</span>
                                                                </button>
                                                            </div>
                                                        }


                                                        <>
                                                            {
                                                                IsShowInitialMakeOffer &&
                                                                <NoConvWithSeller handleMakeOfferInStart={handleMakeOfferInStart} />
                                                            }
                                                            {
                                                                (chatMessages?.length > 0 || selectedTabData?.amount) &&
                                                                <div className='p-[16px] bg-[#fff] relative h-[calc(100vh-100px)] overflow-y-auto' ref={chatMessagesRef}>

                                                                    {
                                                                        selectedTabData?.amount &&
                                                                        <div className={`${isUserOffer ? "" : ""}`}>
                                                                            <div className="">
                                                                                <div className="bg-[#d8e7fc] rounded-[12px] p-[10px_16px] w-fit mb-[10px]">
                                                                                    {isUserOffer ? (
                                                                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{t('yourOffer')}</p>
                                                                                    ) : (
                                                                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{t('offer')}</p>
                                                                                    )}
                                                                                    <h5 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{CurrencySymbol}{selectedTabData?.amount}</h5>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                    }

                                                                    <ChatMessages chatMessages={chatMessages} setChatMessages={setChatMessages} setOfferPrice={setOfferPrice} setRating={setRating} setSelectedTabData={setSelectedTabData} selectedTabData={selectedTabData} openImageViewer={openImageViewer} systemSettingsData={systemSettingsData} defaultSelected={defaultSelected} />

                                                                </div>
                                                            }
                                                        </>

                                                        {
                                                            IsShowOfferInput &&
                                                            <MakeOfferInChat handleOfferLaterClick={handleOfferLaterClick} OfferPrice={OfferPrice} setOfferPrice={setOfferPrice} handleSendOffer={handleSendOffer} IsSubmittingOffer={IsSubmittingOffer} />
                                                        }



                                                        {
                                                            IsDealClosedReviewPending &&
                                                            <div className='rateSellerWrap'>
                                                                <div className='rateSellerCont'>
                                                                    <h6 className='rateSellerHeading'>{t('rateSeller')}</h6>
                                                                    <div className="rateExpCont">
                                                                        <p className='rateYourExp'>{t('rateYourExp')}</p>
                                                                        <Rate defaultValue={0} value={Rating} className='ratingStars' onChange={handleRatingChange} />
                                                                        <textarea value={Review} onChange={handleReviewChange} className='auth_input no-resize' id="" cols="30" rows="5" placeholder={t('writeReview')}></textarea>
                                                                        <button className='reviewSubmitBtn' onClick={handleReviewSubmit}>{t('submit')}</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>

                                                    {makeUnableToChat ? (
                                                        <div className='itemStatus'>
                                                            {IsDealClosedReviewPending ? (
                                                                <p>{t("thisitem")} {selectedTabData?.item?.status}. {t('rateSeller')}</p>
                                                            ) : (
                                                                <p>{t("thisitem")} {selectedTabData?.item?.status}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="absolute bottom-[0] left-[0] right-[0] bg-[#fff] p-[16px] border-t border-[rgba(143,143,143,0.2)] flex items-center justify-between gap-[10px] w-full" style={{ padding: isBlocked ? "" : "" }}>
                                                            {isPeerTyping && (
                                                                <div className='typingIndicator aboveInput'>
                                                                    {t('typing') || 'Typing...'}
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                id="file_attach"
                                                                className="chat_file_input"
                                                                onChange={handleFileChange}
                                                                accept="image/jpeg,image/png,image/jpg"
                                                                style={{ display: 'none' }}
                                                                disabled={IsShowRating}
                                                            />
                                                            {selectedFilePreview && (
                                                                <div className="file_preview_container">
                                                                    <img src={selectedFilePreview} alt="File Preview" className="file_preview_image" />
                                                                    <button className="remove_button" onClick={handleRemoveFile}>
                                                                        <IoCloseCircleOutline size={18} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {isBlocked && (
                                                                <div className='blockedText'>
                                                                    {activeTab === 'buying' ? (

                                                                        <span>
                                                                            {t("youhaveblocked")}{" "}
                                                                            <span className='tap' onClick={() => handleUnBlockUser(selectedTabData?.seller?.id)}>
                                                                                {t("unblock")}.
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span>
                                                                            {t("youhaveblocked")}{" "}
                                                                            <span className='tap' onClick={() => handleUnBlockUser(selectedTabData?.buyer?.id)}>
                                                                                {t("unblock")}.
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="[box-shadow:0px_1px_4px_0px_rgba(0,0,0,0.1)] rounded-full border border-[#e0e1e3] p-[16px_16px] flex items-center justify-between gap-[10px] w-full">

                                                                <input
                                                                    name="chatmessage"
                                                                    id="chatmessage"
                                                                    className="text-[14px] font-[Inter-Regular] text-[#23262A] outline-none resize-none w-full"
                                                                    placeholder={IsShowRating ? t("chatIsDisable") : t("typeMessageHere")}
                                                                    value={messageInput}
                                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                                    onKeyDown={handleKeyDown}
                                                                    disabled={IsShowRating}
                                                                />
                                                                <div className="flex items-center justify-between gap-[10px]">
                                                                    {/* {!IsRecording ? (
                                                                <button onClick={handleStartRecording}>
                                                                    <MdKeyboardVoice size={24} color="#595B6C" />
                                                                </button>
                                                            ) : (
                                                                <button onClick={stopRecording}>
                                                                    <BsFillMicMuteFill size={24} color="#595B6C" />
                                                                </button>
                                                            )} */}
                                                                    <label
                                                                        htmlFor="file_attach"
                                                                        className={`${isBlocked || IsShowRating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isBlocked ? 'disabled' : ''}`}
                                                                    >
                                                                        <Image src={attachment} alt="attachment" width={20} height={20} />
                                                                    </label>
                                                                    <button
                                                                        className="bg-[#DC0000] rounded-full p-[10px] flex items-center justify-center cursor-pointer"
                                                                        onClick={sendMessage}
                                                                        disabled={isBlocked || isSending || (!messageInput && !selectedFile)}
                                                                        style={{ opacity: (isBlocked || isSending || (!messageInput && !selectedFile)) ? 0.5 : 1 }}
                                                                    >
                                                                        <Image src={sendicon} alt="send" width={14} height={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div >
                        {viewerImage && (
                            <ImageViewer
                                src={viewerImage}
                                alt="Full size image"
                                onClose={() => setViewerImage(null)}
                            />
                        )
                        }
                    </div >
                    <TipsModal IsTipsOpen={IsTipsOpen} OnHide={() => setIsTipsOpen(false)} setIsMakeOfferInChat={setIsMakeOfferInChat} tipsData={tipsData} setIsTopMakeOffer={setIsTopMakeOffer} />
                </div>
            </div>
        </>
    )
}

export default Chat;
