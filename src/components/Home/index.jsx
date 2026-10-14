'use client'
import React, { useEffect, useState } from 'react'
import { FeaturedSectionApi, sliderApi } from '@/utils/api'
import { useDispatch, useSelector } from 'react-redux'
import { setSlider } from '@/redux/reuducer/sliderSlice'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'
import { settingsData } from '@/redux/reuducer/settingSlice'
import FeaturedSectionsSkeleton from '../Skeleton/FeaturedSectionsSkeleton'
import PopularCategories from './PopularCategories'
import FeaturedSections from './FeaturedSections'
import { getKilometerRange } from '@/redux/reuducer/locationSlice'
import Searchbar from '../Layout/Searchbar'
import UnverifiedAccount from '../PagesComponent/GetVerified/UnverifiedAccount'
import ReSubmitAccount from '../PagesComponent/GetVerified/ReSubmitAccount'
import VerifiedAccount from '../PagesComponent/GetVerified/VerifiedAccount'
import VerifiedMain from '../PagesComponent/GetVerified/VerifiedMain'
const normalizeFeaturedResponse = (rawResponse) => {
    const payload = rawResponse?.data
    if (Array.isArray(payload?.data)) return payload.data

    if (typeof payload === 'string') {
        try {
            const clean = payload.split('<script')[0].trim()
            if (!clean) return []
            const parsed = JSON.parse(clean)
            return Array.isArray(parsed?.data) ? parsed.data : []
        } catch {
            return []
        }
    }
    return []
}

const HomePage = () => {

    const dispatch = useDispatch()
    const KmRange = useSelector(getKilometerRange)
    const [IsFeaturedLoading, setIsFeaturedLoading] = useState(false)
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [featuredData, setFeaturedData] = useState([])
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const isDemoMode = settings?.demo_mode
    const cityData = useSelector(state => state?.Location?.cityData);
    useEffect(() => {
        const fetchSliderData = async () => {
            try {
                const response = await sliderApi.getSlider();
                const data = response.data;
                dispatch(setSlider(data.data))
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchSliderData();
    }, []);

    useEffect(() => {
        const fetchFeaturedSectionData = async () => {
            setIsFeaturedLoading(true)
            try {
                if (isDemoMode) {
                    const response = await FeaturedSectionApi.getFeaturedSections({});
                    setFeaturedData(normalizeFeaturedResponse(response));
                } else {
                    const params = {};
                    // Conditionally add city, state, or country based on availability
                    if (cityData?.city) {
                        params.city = cityData.city;
                    } else if (cityData?.state) {
                        params.state = cityData.state;
                    } else if (cityData?.country) {
                        params.country = cityData.country;
                    }
                    const response = await FeaturedSectionApi.getFeaturedSections(params);
                    setFeaturedData(normalizeFeaturedResponse(response));
                }
            } catch (error) {
                console.error('Error:', error);
                setFeaturedData([]);
            } finally {
                setIsFeaturedLoading(false)
            }
        };
        fetchFeaturedSectionData();
    }, [cityData, CurrentLanguage, KmRange]);

    const allEmpty = featuredData?.every((ele) => (ele?.section_data?.length || 0) === 0);

    return (
        <div className=''>
            <Searchbar />
            <PopularCategories />
            <div className="w-full mx-auto mb-[30px] mt-[10px]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <VerifiedMain showTickBadge={false} />
                </div>
            </div>
            {
                IsFeaturedLoading ? (<FeaturedSectionsSkeleton />) : (<FeaturedSections featuredData={featuredData} setFeaturedData={setFeaturedData} cityData={cityData} allEmpty={allEmpty} />)
            }

        </div>
    )
}

export default HomePage
