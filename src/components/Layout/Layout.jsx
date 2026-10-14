'use client'
import React, { useEffect, useState } from 'react';
import MainHeader from './MainHeader';
import Footer from './Footer';
import Loader from '@/components/Loader/Loader';
import { settingsSucess, settingsData } from '@/redux/reuducer/settingSlice';
import { getLanguageApi, settingsApi } from '@/utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from "next/dynamic";
import { CurrentLanguageData, setCurrentLanguage } from '@/redux/reuducer/languageSlice';
import { applyDocumentDirection } from '@/utils/languageDirection';
const PushNotificationLayout = dynamic(() => import('../firebaseNotification/PushNotificationLayout.jsx'), { ssr: false });
import { store } from '@/redux/store';
import ScrollToTopButton from './ScrollToTopButton';
import { saveCity, setIsBrowserSupported } from '@/redux/reuducer/locationSlice';
import { protectedRoutes } from '@/app/routes/routes';
import Swal from 'sweetalert2';
import { IsLandingPageOn, getDefaultLatLong, getPlaceApiKey, isEmptyObject, isLogin, t } from '@/utils';
import Image from 'next/image';
import UnderMaitenance from '../../../public/assets/something_went_wrong.svg'
import axios from 'axios';
import { rootSignupData } from '@/redux/reuducer/authSlice';

const Layout = ({ children }) => {

    const pathname = usePathname()
    const searchParams = useSearchParams()
    const dispatch = useDispatch();
    const cityData = useSelector(state => state?.Location?.cityData);
    const settingsFromStore = useSelector(settingsData);
    const settingsDataSnapshot = store.getState().Settings?.data
    const router = useRouter();
    const [isLoading, setisLoading] = useState(true);
    const lang = useSelector(CurrentLanguageData);
    const requiresAuth = protectedRoutes.some(route => route.test(pathname));
    const isLandingPage = IsLandingPageOn()
    

    const handleNotificationReceived = (data) => {
        console.log('notification received')
    };

    if (Number(settingsDataSnapshot?.data?.maintenance_mode)) {
        return (
            <div className='underMaitenance'>
                <Image src={UnderMaitenance} height={255} width={255} />
                <p className='maintenance_label'>Our website is currently undergoing maintenance and will be temporarily unavailable.</p>
            </div>
        )
    }

    useEffect(() => {
        handleRouteAccess()
    }, [pathname])

    const handleRouteAccess = () => {
        if (requiresAuth && !isLogin()) {
            Swal.fire({
                icon: "error",
                title: t('oops'),
                text: t("loginToAccess"),
                allowOutsideClick: false,
                customClass: {
                    confirmButton: 'Swal-confirm-buttons',
                },

            }).then((result) => {
                if (result.isConfirmed) {
                    router.push("/");
                }
            });
        }
    }

    useEffect(() => {
        const urlLang = (searchParams?.get('lang') || '').trim().toLowerCase()

        if (!lang || isEmptyObject(lang)) {
            if (urlLang === 'ar' || urlLang === 'en') {
                applyDocumentDirection(null, { fallbackCode: urlLang })
                return
            }
            applyDocumentDirection(null, { fallbackCode: 'en' })
            return
        }

        applyDocumentDirection(lang)
    }, [lang, searchParams?.toString()])

    useEffect(() => {
        const q = (searchParams?.get('lang') || '').trim().toLowerCase()
        if (q !== 'ar' && q !== 'en') return

        let cancelled = false
        void (async () => {
            try {
                const res = await getLanguageApi.getLanguage({ language_code: q, type: 'web' })
                if (cancelled || res?.data?.error === true) return

                dispatch(setCurrentLanguage(res?.data?.data))

                const next = new URLSearchParams(searchParams.toString())
                next.delete('lang')
                const qs = next.toString()
                const p = pathname || '/'
                router.replace(qs ? `${p}?${qs}` : p, { scroll: false })
            } catch (error) {
                console.error('Language switch failed:', error)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [searchParams?.toString(), pathname, router, dispatch])

    useEffect(() => {
        const q = (searchParams?.get('lang') || '').trim().toLowerCase()
        if (q === 'ar' || q === 'en') return
        if (!isEmptyObject(lang)) return
        if (!settingsFromStore?.data?.default_language) return

        let cancelled = false
        void (async () => {
            try {
                const res = await getLanguageApi.getLanguage({
                    language_code: settingsFromStore.data.default_language,
                    type: 'web',
                })
                if (cancelled || res?.data?.error === true) return
                dispatch(setCurrentLanguage(res?.data?.data))
            } catch (error) {
                console.error('Default language load failed:', error)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [settingsFromStore?.data?.default_language, searchParams?.toString(), lang, dispatch])
    useEffect(() => {
        const ensureDefaultLanguage = async (settingsPayload) => {
            const currentLang = store.getState()?.CurrentLanguage?.language
            if (!isEmptyObject(currentLang)) return

            const languageCode = settingsPayload?.data?.default_language
            if (!languageCode) return

            try {
                const res = await getLanguageApi.getLanguage({
                    language_code: languageCode,
                    type: 'web',
                })
                if (res?.data?.error !== true && res?.data?.data) {
                    dispatch(setCurrentLanguage(res.data.data))
                }
            } catch (error) {
                console.error('Default language bootstrap failed:', error)
            }
        }

        const getSystemSettings = async () => {
            try {
                const response = await settingsApi.getSettings({
                    type: "" // or remove this line if you don't need to pass the "type" parameter
                });
                const data = response.data;
                dispatch(settingsSucess({ data }));
                await ensureDefaultLanguage(data);
                document.documentElement.style.setProperty('--primary-color', data?.data?.web_theme_color);
                requestLocationPermission(); // Request location after settings are loaded
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setisLoading(false);
            }
        };

        getSystemSettings();

    }, []);


    const getLocationWithoutLanding = async (pos) => {

        const placeApiKey = getPlaceApiKey()

        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.latitude},${pos.longitude}&key=${placeApiKey}`);
            let city = '';
            let state = '';
            let country = '';

            response.data.results.forEach(result => {
                const addressComponents = result.address_components;
                const getAddressComponent = (type) => {
                    const component = addressComponents.find(comp => comp.types.includes(type));
                    return component ? component.long_name : '';
                };
                if (!city) city = getAddressComponent("locality");
                if (!state) state = getAddressComponent("administrative_area_level_1");
                if (!country) country = getAddressComponent("country");
            });

            const locationData = {
                lat: pos.latitude,
                long: pos.longitude,
                city,
                state,
                country
            };

            saveCity(locationData)
        } catch (error) {
            console.log(error)
        }
    }


    const requestLocationPermission = () => {

        const isLanding = IsLandingPageOn();
        const letLong = getDefaultLatLong()

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isSafari) {
            dispatch(setIsBrowserSupported(false));
            return;
        }

        const hasLocationData = cityData?.city === '' && cityData?.state === '' && cityData?.country === ''

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    if (isLanding === 0 && hasLocationData) {
                        getLocationWithoutLanding(locationData)
                    }
                },
                (error) => {
                    if (isLanding === 0 && (error.code === 1 || error.code === 2 || error.code === 3) && hasLocationData) {
                        getLocationWithoutLanding(letLong)
                    }
                }
            );
            dispatch(setIsBrowserSupported(true));
        } else {
            console.error('Geolocation is not supported by this browser.');
            dispatch(setIsBrowserSupported(false))
        }
    };


    useEffect(() => {
        if (isLandingPage === 1) {
            const isBlogPage = pathname.startsWith('/blogs/');
            const isSellerProfile = pathname.startsWith('/seller/');
            const isProductDetailsPage = pathname.startsWith('/product-details/');
            const isStaticPage = ['/about-us', '/contact-us', '/privacy-policy', '/terms-and-condition', '/subscription', '/faqs', '/blogs'].includes(pathname);
            const hasLocationData = cityData?.city === '' && cityData?.state === '' && cityData?.country === '';
            const isProtectedRoute = protectedRoutes.some(route => route.test(pathname));
            const isCategoryPage = pathname.startsWith('/category');
            if (hasLocationData && !isBlogPage && !isProductDetailsPage && !isStaticPage && !isSellerProfile && !isCategoryPage) {
                if (isProtectedRoute) {
                    return;
                }
                // router.push('/home'); // disabled per request; keep for future reference
            }
        }
    }, [cityData, pathname, isLandingPage]);

    const hideChromeForAdListing = pathname === '/ad-listing' || pathname === '/placeyourad'

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    {hideChromeForAdListing ? (
                        // Ad listing should not show global header/footer chrome.
                        <>{children}</>
                    ) : pathname === '/chat' ? (
                        <>
                            <MainHeader />
                            {children}
                            <Footer />
                        </>
                    ) : (
                        <PushNotificationLayout onNotificationReceived={handleNotificationReceived}>
                            <MainHeader />
                            {children}
                            <Footer />
                        </PushNotificationLayout>
                    )}
                    {/* <ScrollToTopButton /> */}
                </>
            )}
        </>
    );
};

export default Layout;