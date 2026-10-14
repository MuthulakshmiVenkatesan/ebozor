import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react";
import { GoogleAuthProvider, RecaptchaVerifier, createUserWithEmailAndPassword, getAuth, sendEmailVerification, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import { handleFirebaseAuthError, t } from "@/utils";
import { userSignUpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { Fcmtoken, settingsData } from "@/redux/reuducer/settingSlice";
import { loadUpdateData } from "../../redux/reuducer/userSlice";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import MailSentSucessfully from "./MailSentSucessfully";
import fb from '../../../public/assets/img/login/fb.png'
import google from '../../../public/assets/img/login/google.png'
import apple from '../../../public/assets/img/login/apple.png'
import emailIcon from '../../../public/assets/img/login/email.png'
import Tick from '../../../public/assets/img/icons/tick.svg'
import { CategoryIcon, CloseIcon, EyeIcon, EyeSlashIcon, PaginationPrevIcon, PaginationNextIcon } from "../CustomFile/icons";
import banner1 from '../../../public/assets/img/login/banner1.svg'
import banner2 from '../../../public/assets/img/login/banner2.svg'
import banner3 from '../../../public/assets/img/login/banner3.svg'


const LoginModal = ({ IsLoginModalOpen, setIsRegisterModalOpen, setIsLoginModalOpen, IsMailSentOpen, setIsMailSentOpen, IsRegisterModalOpen, openSentMailModal }) => {


    const auth = getAuth();
    const fetchFCM = useSelector(Fcmtoken);
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const mobile_authentication = Number(settings?.mobile_authentication)
    const google_authentication = Number(settings?.google_authentication)
    const email_authentication = Number(settings?.email_authentication)
    const isDemoMode = settings?.demo_mode
    const [IsLoginScreen, setIsLoginScreen] = useState(true);
    const [IsPasswordScreen, setIsPasswordScreen] = useState(false);
    const [IsOTPScreen, setIsOTPScreen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [number, setNumber] = useState("");
    const [inputType, setInputType] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [showLoader, setShowLoader] = useState(false);
    const [resendOtpLoader, setResendOtpLoader] = useState(false)
    const [IsPasswordVisible, setIsPasswordVisible] = useState(false)
    const [username, setUsername] = useState('')
    const errors = {};

    const OnHide = async () => {
        setIsLoginModalOpen(false);
        setIsLoginScreen(true);
        setIsPasswordScreen(false);
        setIsOTPScreen(false);
        setEmail("");
        setPassword("");
        setInputValue("");
        setUsername('')
        setInputType("");
        setNumber("");
        setOtp("");
        await recaptchaClear()
    };

    // Remove any non-digit characters from the country code
    const countryCodeDigitsOnly = countryCode.replace(/\D/g, '');

    // Check if the entered number starts with the selected country code
    const startsWithCountryCode = number.startsWith(countryCodeDigitsOnly);

    // If the number starts with the country code, remove it
    const formattedNumber = startsWithCountryCode ? number.substring(countryCodeDigitsOnly.length) : number;


    useEffect(() => {
        if (isDemoMode) {
            setInputType("number");
            setInputValue("919876598765");
            setNumber("919876598765");
            setCountryCode("+91");
        }
    }, [isDemoMode, IsLoginModalOpen]);


    const signin = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.length === 0) {
                toast.error(t("userNotFound"))
            } else {
                return userCredential;
            }
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    };

    const handleInputChange = (value, data) => {
        const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const containsOnlyDigits = /^\d+$/.test(value);

        setInputValue(value);

        if (emailRegexPattern.test(value)) {
            setInputType("email");
            setEmail(value);
            setNumber("");
            setCountryCode("");
        } else if (containsOnlyDigits) {
            setInputType("number");
            setNumber(value);
            setCountryCode("+" + (data?.dialCode || ""));
        } else {
            setInputType("");
        }
    };

    const getDeviceName = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;

        let browser = "Unknown Browser";

        if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edge")) browser = "Edge";

        return `${platform} - ${browser}`;
    };

    const Signin = async (e) => {
        e.preventDefault();

        if (IsRegisterModalOpen) {

            if (!email) {
                toast.error(t("emailRequired"))
                return
            } else if (!/\S+@\S+\.\S+/.test(email)) {
                toast.error(t("emailInvalid"))
                return
            }
            if (username?.trim() === '') {
                toast.error(t("usernameRequired"))
                return
            }
            if (!password) {
                errors.password = t("passwordRequired");
                toast.error(t("passwordRequired"))
                return
            } else if (password.length < 6) {
                toast.error(t("passwordTooShort"))
                return
            }

            try {
                setShowLoader(true)
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await sendEmailVerification(user);
                openSentMailModal();
                try {
                    const response = await userSignUpApi.userSignup({
                        name: username ? username : "",
                        email: email ? email : "",
                        firebase_id: user?.uid,
                        fcm_id: fetchFCM ? fetchFCM : "",
                        type: "email",
                        registration: true,
                        device_name: getDeviceName()
                    });
                    OnHide()
                } catch (error) {
                    console.log("error", error);
                }
            } catch (error) {
                const errorCode = error.code;
                handleFirebaseAuthError(errorCode);
            } finally {
                setShowLoader(false)
            }
        } else {
            try {
                setShowLoader(true)
                const userCredential = await signin(email, password);
                const user = userCredential.user;
                if (user.emailVerified) {
                    try {
                        const response = await userSignUpApi.userSignup({
                            name: user?.displayName ? user?.displayName : "",
                            email: user?.email,
                            firebase_id: user?.uid,
                            fcm_id: fetchFCM ? fetchFCM : "",
                            type: "email",
                            device_name: getDeviceName()
                        });

                        const data = response.data;
                        loadUpdateData(data)
                        if (data.error === true) {
                            toast.error(data.message);
                        }
                        else {
                            toast.success(data.message);
                        }
                        OnHide()
                    } catch (error) {
                        console.error("Error:", error);
                    }
                    // Add your logic here for verified users
                } else {
                    toast.error(t('verifyEmailFirst'));
                    await sendEmailVerification(auth.currentUser);
                }
            } catch (error) {
                const errorCode = error.code;
                console.log('Error code:', errorCode);
                handleFirebaseAuthError(errorCode);
            } finally {
                setShowLoader(false)
            }
        }
    };

    const generateRecaptcha = () => {
        // Ensure auth object is properly initialized
        const auth = getAuth();

        if (!window.recaptchaVerifier) {
            // Check if container element exists
            const recaptchaContainer = document.getElementById("recaptcha-container");
            if (!recaptchaContainer) {
                console.error("Container element 'recaptcha-container' not found.");
                return null; // Return null if container element not found
            }

            try {
                // Clear any existing reCAPTCHA instance
                recaptchaContainer.innerHTML = '';

                // Initialize RecaptchaVerifier
                window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                    size: "invisible",
                });
                return window.recaptchaVerifier;
            } catch (error) {
                console.error("Error initializing RecaptchaVerifier:", error.message);
                return null; // Return null if error occurs during initialization
            }
        }
        return window.recaptchaVerifier;
    };

    useEffect(() => {
        generateRecaptcha();

        return () => {
            // Clean up recaptcha container and verifier when component unmounts
            const recaptchaContainer = document.getElementById("recaptcha-container");
            if (recaptchaContainer) {
                recaptchaContainer.innerHTML = "";
            }
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null; // Clear the recaptchaVerifier reference
            }
        };
    }, []); // Empty dependency array ensures this effect runs only once after mount


    const sendOTP = async () => {
        setShowLoader(true)
        const PhoneNumber = `${countryCode}${formattedNumber}`;
        try {
            const appVerifier = generateRecaptcha();
            const confirmation = await signInWithPhoneNumber(auth, PhoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            toast.success(t("otpSentSuccess"));
            if (isDemoMode) {
                setOtp("123456")

            }
            if (resendOtpLoader) {
                setResendOtpLoader(false)
            }
        } catch (error) {
            const errorCode = error.code;
            handleFirebaseAuthError(errorCode);
            if (resendOtpLoader) {
                setResendOtpLoader(false)
            }
        } finally {
            setShowLoader(false);
        }

    };

    const resendOtp = async (e) => {
        e.preventDefault()
        setResendOtpLoader(true)
        const PhoneNumber = `${countryCode}${formattedNumber}`;
        try {
            const appVerifier = generateRecaptcha();
            const confirmation = await signInWithPhoneNumber(auth, PhoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            toast.success(t("otpSentSuccess"));
            setResendOtpLoader(false)
        } catch (error) {
            const errorCode = error.code;
            handleFirebaseAuthError(errorCode);
            setResendOtpLoader(false)
        }
    }

    const verifyOTP = async (e) => {
        e.preventDefault();

        try {
            if (otp === '') {
                toast.error(t('otpmissing'))
                return
            }
            setShowLoader(true)
            const result = await confirmationResult.confirm(otp);
            // Access user information from the result
            const user = result.user;

            try {
                const response = await userSignUpApi.userSignup({
                    mobile: formattedNumber,
                    firebase_id: user.uid, // Accessing UID directly from the user object
                    fcm_id: fetchFCM ? fetchFCM : "",
                    country_code: countryCode,
                    type: "phone",
                    device_name: getDeviceName()
                });

                const data = response.data;
                loadUpdateData(data)
                toast.success(data.message);
                setShowLoader(false)
                OnHide();
            } catch (error) {
                console.error("Error:", error);
                setShowLoader(false)
            }
            // Perform necessary actions after OTP verification, like signing in
        } catch (error) {
            const errorCode = error.code;
            handleFirebaseAuthError(errorCode);
            setShowLoader(false)
        }
    };


    const handleLoginSubmit = (e) => {
        setShowLoader(true)
        e.preventDefault();
        if (inputType === "email") {
            setIsPasswordScreen(true);
            setIsLoginScreen(false);
            setShowLoader(false)
        } else if (inputType === "number") {
            // Perform phone number validation on the formatted number
            if (isValidPhoneNumber(`${countryCode}${formattedNumber}`)) {
                sendOTP();
                setIsOTPScreen(true);
                setIsLoginScreen(false);
            } else {
                // Show an error message indicating that the phone number is not valid
                toast.error(t("invalidPhoneNumber"));
                setShowLoader(false)
            }
        } else {
            setShowLoader(false)
            if (email_authentication === 0 && mobile_authentication === 1) {
                toast.error(t("invalidPhoneNumber"));
            } else {
                toast.error(t("invalidPhoneNumberOrEmail"));
            }

        }
    };

    useEffect(() => {
    }, [inputValue, inputType, IsPasswordScreen, IsOTPScreen, email, password, number])

    useEffect(() => {
        if (inputValue === "" && email_authentication === 1) {
            setInputType("email")
            setNumber("")
        }
    }, [inputValue, inputType])

    const togglePasswordVisible = () => {
        setIsPasswordVisible((prev) => !prev)
    }

    const handleShowLoginPassword = () => {
        setIsPasswordScreen(false)
        setIsOTPScreen(false)
        setIsLoginScreen(true)
    }
    const handleOpenEmailScreen = () => {
        setIsRegisterModalOpen(false)
        setIsPasswordScreen(true)
        setIsOTPScreen(false)
        setIsLoginScreen(false)
        setShowLoader(false)
    }

    const handleOpenSignUpScreen = () => {
        setIsRegisterModalOpen(true)
        setUsername("")
        setEmail("")
        setPassword("")
        setIsPasswordScreen(true)
        setIsOTPScreen(false)
        setIsLoginScreen(false)
        setShowLoader(false)
    }
    const recaptchaClear = async () => {
        const recaptchaContainer = document.getElementById('recaptcha-container')
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = ''
        }
        if (window.recaptchaVerifier) {
            window?.recaptchaVerifier?.recaptcha?.reset()
        }
    }

    const handleGoogleSignup = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const response = await signInWithPopup(auth, provider);
            const user = response.user
            try {
                const response = await userSignUpApi.userSignup({
                    name: user.displayName ? user.displayName : "",
                    email: user?.email,
                    firebase_id: user.uid, // Accessing UID directly from the user object
                    fcm_id: fetchFCM ? fetchFCM : "",
                    type: "google",
                    device_name: getDeviceName()
                });

                const data = response.data;
                loadUpdateData(data)
                if (data.error === true) {
                    toast.error(data.message);
                }
                else {
                    toast.success(data.message);
                }
                OnHide();
            } catch (error) {
                console.error("Error:", error);
            }
        } catch (error) {
            const errorCode = error.code;
            handleFirebaseAuthError(errorCode);
        }
    };


    const handleForgotModal = async e => {
        e.preventDefault()
        const auth = getAuth()
        await sendPasswordResetEmail(auth, email)
            .then(userCredential => {
                toast.success(t('resetPassword'))
                setIsMailSentOpen(true)
                setIsLoginScreen(true)
                setIsPasswordScreen(false)
            })
            .catch(error => {
                const errorCode = error.code;
                handleFirebaseAuthError(errorCode);
            })
    }

    const toggleAuthModal = () => {
        setIsRegisterModalOpen((prev) => !prev);
        if (inputType === 'number') {
            setNumber((prev) => prev.slice(0, countryCodeDigitsOnly.length));
        }
        else {
            setInputValue('')
        }
    };

    const slides = [
        {
            id: 1,
            image: banner1,
            text: "Log in to post an ad",
        },
        {
            id: 2,
            image: banner2,
            text: "Log in to call the seller",
        },
        {
            id: 3,
            image: banner3,
            text: "Log in to favorite an ad",
        },
    ];

    const [current, setCurrent] = useState(0);

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const [passwordErrors, setPasswordErrors] = useState({
        length: false,
        upperLower: false,
        number: false,
        special: false,
        noName: false
    });

    const [strength, setStrength] = useState({
        label: "",
        widthPct: 0,
        barClass: "",
        textClass: ""
    });

    const recomputePasswordValidation = (value, nameForCheck) => {
        const checks = {
            length: value.length >= 7,
            upperLower: /[a-z]/.test(value) && /[A-Z]/.test(value),
            number: /\d/.test(value),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
            noName: nameForCheck
                ? !value.toLowerCase().includes(nameForCheck.toLowerCase())
                : true
        };

        setPasswordErrors(checks);

        const passed = Object.values(checks).filter(Boolean).length;

        let newStrength = {
            label: "",
            widthPct: 0,
            barClass: "",
            textClass: ""
        };

        if (passed <= 2) {
            newStrength = {
                label: "Weak",
                widthPct: 33,
                barClass: "bg-red-500",
                textClass: "text-red-500"
            };
        } else if (passed <= 4) {
            newStrength = {
                label: "Medium",
                widthPct: 66,
                barClass: "bg-yellow-500",
                textClass: "text-yellow-500"
            };
        } else {
            newStrength = {
                label: "Strong",
                widthPct: 100,
                barClass: "bg-green-500",
                textClass: "text-green-600"
            };
        }

        setStrength(newStrength);
    };

    const handlePasswordChange = (value) => {
        setPassword(value);

        // Signup validation only
        if (IsRegisterModalOpen) {
            recomputePasswordValidation(value, username);
        }
    };

    useEffect(() => {
        if (!IsRegisterModalOpen) return;
        if (!password) return;
        recomputePasswordValidation(password, username);
    }, [IsRegisterModalOpen, password, username]);

    const isLoginValid = () => {
        return (
            email &&
            /\S+@\S+\.\S+/.test(email) &&
            password &&
            password.length >= 6
        );
    };

    const isRegisterValid = () => {
        return (
            username.trim() !== "" &&
            email &&
            /\S+@\S+\.\S+/.test(email) &&
            passwordErrors.length &&
            passwordErrors.upperLower &&
            passwordErrors.number &&
            passwordErrors.special &&
            passwordErrors.noName
        );
    };

    return (
        <>
            {IsLoginModalOpen && (
                <div
                    className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 p-[16px]"
                    onClick={OnHide}
                    aria-hidden="true">

                    <div
                        className="relative z-[1] flex overflow-y-auto max-h-[min(640px,90vh)] w-[440px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {IsLoginScreen && (
                            <div className="relative">
                                <button type="button" className="cursor-pointer absolute top-[20px] right-[20px]" onClick={OnHide}>
                                    <CloseIcon width={14} height={14} className="w-[14] h-[14px]" fill="#8F8F8F" fillOpacity="0.8" />
                                </button>
                                <div className="mt-[20px] p-[20px_60px]">
                                    <div className="relative">
                                        <div className="mb-[40px]">
                                            <Image
                                                src={slides[current].image}
                                                alt="slider"
                                                width={150}
                                                height={150}
                                                className="mx-auto h-[150px] object-contain"
                                            />
                                            <h4 className="text-[22px] font-[Inter-Bold] leading-tight text-[#23262A] text-center">
                                                {slides[current].text}
                                            </h4>
                                        </div>
                                        <button
                                            onClick={prevSlide}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            <PaginationPrevIcon width={12} height={12} className="w-[12px] h-[12px] opacity-50" stroke="#8F8F8F" />
                                        </button>
                                        <button
                                            onClick={nextSlide}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            <PaginationNextIcon width={12} height={12} className="w-[12px] h-[12px] opacity-50" stroke="#8F8F8F" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-[12px] mb-[14px]">
                                        {/* <button type="button" className="cursor-pointer border border-[#626465] rounded-[6px] px-[16px] py-[12px] flex items-center gap-[14px]">
                                            <Image src={fb} alt="Facebook" width={24} height={24} />
                                            <p className="text-[14px] font-[Inter-Medium] leading-tight text-[#626465]">Continue with Facebook</p>
                                        </button> */}
                                        {
                                            google_authentication === 1 &&
                                            <button
                                                type="button"
                                                className="cursor-pointer border border-[#626465] rounded-[6px] px-[16px] py-[12px] flex items-center gap-[14px]"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleGoogleSignup();
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <Image src={google} alt="Google" width={24} height={24} />
                                                <p className="text-[14px] font-[Inter-Medium] leading-tight text-[#626465]">Continue with Google</p>
                                            </button>
                                        }
                                        {/* <button type="button" className="cursor-pointer border border-[#626465] rounded-[6px] px-[16px] py-[12px] flex items-center gap-[14px]">
                                            <Image src={apple} alt="Apple" width={24} height={24} />
                                            <p className="text-[14px] font-[Inter-Medium] leading-tight text-[#626465]">Continue with Apple</p>
                                        </button> */}
                                        <button type="button" className="cursor-pointer border border-[#626465] rounded-[6px] px-[16px] py-[12px] flex items-center gap-[14px]" onClick={handleOpenEmailScreen}>
                                            <Image src={emailIcon} alt="Email" width={24} height={24} />
                                            <p className="text-[14px] font-[Inter-Medium] leading-tight text-[#626465]">Continue with Email</p>
                                        </button>
                                    </div>

                                    <p className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#DC0000] text-center mb-[28px] cursor-pointer" onClick={handleOpenSignUpScreen}>
                                        Don&apos;t have an account? Create one
                                    </p>

                                    <div className="text-[12px] font-[Inter-Regular] leading-[24px] text-[#bec0c1] text-center">
                                        {t('agreeSignIn')} {settings?.company_name} <br />
                                        <Link href="/terms-and-condition" className="!text-[#3a88ef] !text-[12px] !font-[Inter-Regular]" onClick={OnHide}>
                                            {t('termsService')}
                                        </Link>{" "}
                                        {t('and')}{" "}
                                        <Link href="/privacy-policy" className="!text-[#3a88ef] !text-[12px] !font-[Inter-Regular]" onClick={OnHide}>
                                            {t('privacyPolicy')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}


                        {IsPasswordScreen && (
                            <div className="p-[20px_0] flex flex-col h-full">
                                <div className="flex items-center justify-between px-[20px] mb-[40px]">
                                    <button type="button" className="cursor-pointer" onClick={handleShowLoginPassword}>
                                        <CategoryIcon width={20} height={20} className="w-[20px] h-[20px] rotate-180" fill="#8F8F8F" />
                                    </button>
                                    <button type="button" className="cursor-pointer" onClick={OnHide}>
                                        <CloseIcon width={14} height={14} className="w-[14] h-[14px]" fill="#8F8F8F" fillOpacity="0.8" />
                                    </button>
                                </div>
                                <div className="px-[20px] mb-[26px] text-center">
                                    <h1 className="text-[22px] font-[Inter-Bold] leading-tight text-[#23262A] ">{IsRegisterModalOpen ? t('signUpWithEmail') : "Log in with your email"}</h1>
                                </div>
                                <form className="p-[0px_60px] min-h-0 flex-1 overflow-y-auto" onSubmit={Signin}>
                                    <div className="flex flex-col gap-[12px] mb-[14px]">
                                        {
                                            IsRegisterModalOpen &&
                                            <div className="">
                                                <input
                                                    type="text"
                                                    placeholder={t("typeUsername")}
                                                    className="w-full border border-[rgba(143,143,143,0.45)] rounded-[6px] px-[16px] py-[16px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] outline-none shadow-none"
                                                    name="username"
                                                    required
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    value={username}
                                                />
                                            </div>
                                        }

                                        <div className="">
                                            <input
                                                type="email"
                                                className="w-full border border-[rgba(143,143,143,0.45)] rounded-[6px] px-[16px] py-[16px] text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] outline-none shadow-none"
                                                placeholder={t("enterEmail")}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="">
                                            <div className="border border-[rgba(143,143,143,0.45)] rounded-[6px] px-[16px] py-[16px] flex items-center justify-between">
                                                <input
                                                    type={IsPasswordVisible ? "text" : "password"}
                                                    className="text-[14px] font-[Inter-Regular] leading-tight text-[#23262A] outline-none shadow-none"
                                                    placeholder={t("enterPassword")}
                                                    id="password"
                                                    name="password"
                                                    value={password}
                                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                                />
                                                <div className="cursor-pointer" onClick={togglePasswordVisible}>
                                                    {IsPasswordVisible ? <EyeIcon width={20} height={20} className="w-[20px] h-[20px]" fill="#8F8F8F" pathfill="#fff" /> : <EyeSlashIcon width={20} height={20} className="w-[20px] h-[20px]" fill="#8F8F8F" pathfill="#8F8F8F" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {IsRegisterModalOpen && password.length > 0 && (
                                        <div>
                                            <div className="mb-[8px] h-[4px] w-full overflow-hidden rounded-full bg-[#FEE2E2]">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-200 ${strength.barClass}`}
                                                    style={{ width: `${strength.widthPct}%` }}
                                                />
                                            </div>
                                            <p className="mb-[6px] text-[12px] text-[#23262A]">
                                                Password Strength:{" "}
                                                <span className={`${strength.textClass}`}>
                                                    {strength.label}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {IsRegisterModalOpen && (

                                        <div className="mb-[22px] rounded-[8px] bg-[#F3F4F6] p-[14px_16px]">
                                            <ul className="flex flex-col gap-[20px]">
                                                <li className={`flex items-center gap-[10px] ${passwordErrors.length ? '' : ''}`}>
                                                    {passwordErrors.length ? <Image src={Tick} alt="Tick" width={12} height={12} className="w-[12px] h-[12px]" /> : <CloseIcon width={8} height={8} className="w-[8px] h-[8px]" fill="#DC0000" />}
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">At least 7 characters long</p>
                                                </li>
                                                <li className={`flex items-center gap-[10px] ${passwordErrors.upperLower ? '' : ''}`}>
                                                    {passwordErrors.upperLower ? <Image src={Tick} alt="Tick" width={12} height={12} className="w-[12px] h-[12px]" /> : <CloseIcon width={8} height={8} className="w-[8px] h-[8px]" fill="#DC0000" />}
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">One upper and one lower case letter</p>
                                                </li>
                                                <li className={`flex items-center gap-[10px] ${passwordErrors.number ? '' : ''}`}>
                                                    {passwordErrors.number ? <Image src={Tick} alt="Tick" width={12} height={12} className="w-[12px] h-[12px]" /> : <CloseIcon width={8} height={8} className="w-[8px] h-[8px]" fill="#DC0000" />}
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">Must contain a number</p>
                                                </li>
                                                <li className={`flex items-center gap-[10px] ${passwordErrors.special ? '' : ''}`}>
                                                    {passwordErrors.special ? <Image src={Tick} alt="Tick" width={12} height={12} className="w-[12px] h-[12px]" /> : <CloseIcon width={8} height={8} className="w-[8px] h-[8px]" fill="#DC0000" />}
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">At least one special character</p>
                                                </li>
                                                <li className={`flex items-center gap-[10px] ${passwordErrors.noName ? '' : ''}`}>
                                                    {passwordErrors.noName ? <Image src={Tick} alt="Tick" width={12} height={12} className="w-[12px] h-[12px]" /> : <CloseIcon width={8} height={8} className="w-[8px] h-[8px]" fill="#DC0000" />}
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">Must not include your name</p>
                                                </li>
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            showLoader ||
                                            (IsRegisterModalOpen ? !isRegisterValid() : !isLoginValid())
                                        }
                                        className={`w-full text-[14px] font-[Inter-SemiBold] rounded-[6px] px-[16px] py-[12px] 
    ${showLoader ||
                                                (IsRegisterModalOpen ? !isRegisterValid() : !isLoginValid())
                                                ? "bg-[#0000001f] text-[#8F8F8F] cursor-not-allowed"
                                                : "bg-[#DC0000] text-white cursor-pointer"
                                            }`}
                                    >
                                        {showLoader ? (
                                            <div className="loader-container-otp">
                                                <div className="loader-otp"></div>
                                            </div>
                                        ) : IsRegisterModalOpen ? (
                                            <span>{t("verifyEmail")}</span>
                                        ) : (
                                            <span>Log In</span>
                                        )}
                                    </button>

                                    {
                                        !IsRegisterModalOpen &&
                                        <div className="mt-[26px] ">
                                            <p className="text-[14px] font-[Inter-SemiBold] leading-tight text-[#DC0000] text-center cursor-pointer" onClick={handleForgotModal}>{t('forgtPassword')}</p>
                                        </div>
                                    }

                                    <div className="mt-[40px] text-[12px] font-[Inter-Regular] leading-[24px] text-[#bec0c1] text-center">
                                        {t('agreeSignIn')} {settings?.company_name} <br />
                                        <Link href="/terms-and-condition" className="!text-[#3a88ef] !text-[12px] !font-[Inter-Regular]" onClick={OnHide}>
                                            {t('termsService')}
                                        </Link>{" "}
                                        {t('and')}{" "}
                                        <Link href="/privacy-policy" className="!text-[#3a88ef] !text-[12px] !font-[Inter-Regular]" onClick={OnHide}>
                                            {t('privacyPolicy')}
                                        </Link>
                                    </div>

                                </form>
                            </div>
                        )}
                        {IsOTPScreen && (
                            <>
                                <div className="register_modal">
                                    <div className="reg_modal_header">
                                        <h1 className="reg_modal_title">{t('verifyOtp')}</h1>
                                        <p className="signin_redirect">
                                            {t('sentTo')} {`+${number}`}{" "}
                                            <span className="main_signin_redirect" onClick={handleShowLoginPassword}>
                                                {t('change')}
                                            </span>
                                        </p>
                                    </div>
                                    <form className="auth_form">
                                        <div className="auth_in_cont">
                                            <label htmlFor="otp" className="auth_label">
                                                {t('otp')}
                                            </label>
                                            <input
                                                type="text"
                                                className="auth_input"
                                                placeholder={t("enterOtp")}
                                                id="otp"
                                                name="otp"
                                                value={otp}
                                                maxLength="6"
                                                onChange={(e) => setOtp(e.target.value)}
                                            />
                                        </div>
                                        <>

                                            {showLoader ? (
                                                <div className="loader-container-otp">
                                                    <div className="loader-otp"></div>
                                                </div>
                                            ) : (
                                                <button type="submit" className="verf_email_add_btn" onClick={verifyOTP}>
                                                    {t('verify')}
                                                </button>
                                            )}

                                            {
                                                resendOtpLoader ? (
                                                    <div className="loader-container-otp">
                                                        <div className="loader-otp"></div>
                                                    </div>
                                                )
                                                    :
                                                    (
                                                        <button type="submit" className="resend_otp_btn" onClick={resendOtp}>
                                                            {t('resendOtp')}
                                                        </button>
                                                    )
                                            }

                                        </>
                                    </form>
                                </div>
                            </>   
                        )}
                    </div >
                </div >
            )}
            <div id="recaptcha-container"></div>
            <MailSentSucessfully IsMailSentOpen={IsMailSentOpen} OnHide={() => setIsMailSentOpen(false)} IsLoginModalOpen={() => setIsLoginModalOpen(true)} />
        </>
    )
}

export default LoginModal