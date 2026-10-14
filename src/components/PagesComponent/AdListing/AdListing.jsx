'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { generateSlug, isLogin, t } from '@/utils'
import { addItemApi, categoryApi, getAreasApi, getCitiesApi, getCoutriesApi, getCustomFieldsApi, getStatesApi } from '@/utils/api'
import toast from 'react-hot-toast'
import axios from 'axios'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { settingsData } from '@/redux/reuducer/settingSlice'
import motorsIcon from '../../../../public/assets/img/post/category/motors.svg'
import jobsIcon from '../../../../public/assets/img/post/category/jobs.svg'
import propertySaleIcon from '../../../../public/assets/img/post/category/propertysale.svg'
import propertyRentIcon from '../../../../public/assets/img/post/category/propertyrent.svg'
import communityIcon from '../../../../public/assets/img/post/category/community.svg'
import classifiedsIcon from '../../../../public/assets/img/post/category/classified.svg'
import AdsHeader from './components/AdsHeader'
import MotorsCategories from './Pages/MotorsComponents/MotorsCategories'

const AdListing = () => {

  const searchParams = useSearchParams()
  const section = searchParams.get('section') || ''

  const CurrentLanguage = useSelector(CurrentLanguageData)
  const systemSettingsData = useSelector(settingsData)
  const settings = systemSettingsData?.data
  const [currentPage, setCurrentPage] = useState()
  const [lastPage, setLastPage] = useState()
  const [activeTab, setActiveTab] = useState(1)
  const [IsAdSuccessfulModal, setIsAdSuccessfulModal] = useState(false)
  const [CurrenCategory, setCurrenCategory] = useState([])
  const [CurrentPath, setCurrentPath] = useState([])
  const [CustomFields, setCustomFields] = useState([])
  const [AdListingDetails, setAdListingDetails] = useState({
    title: '',
    slug: '',
    desc: '',
    price: '',
    phonenumber: '',
    link: '',
  })
  const [extraDetails, setExtraDetails] = useState({})
  const [uploadedImages, setUploadedImages] = useState([]);
  const [OtherImages, setOtherImages] = useState([]);
  const [Location, setLocation] = useState({})
  const [Countries, setCountries] = useState([])
  const [States, setStates] = useState([])
  const [Cities, setCities] = useState([])
  const [Area, setArea] = useState([])
  const [SelectedCountry, setSelectedCountry] = useState({})
  const [SelectedState, setSelectedState] = useState({})
  const [SelectedCity, setSelectedCity] = useState({})
  const [SelectedArea, setSelectedArea] = useState({})
  const [CountrySearch, setCountrySearch] = useState('')
  const [StateSearch, setStateSearch] = useState('')
  const [CitySearch, setCitySearch] = useState('')
  const [AreaSearch, setAreaSearch] = useState('')
  const [ActiveLocation, setActiveLocation] = useState('manually')
  const [position, setPosition] = useState([51.505, -0.09]);
  const [Address, setAddress] = useState('')
  const [LocationByMap, setLocationByMap] = useState({})
  const [isAdPlaced, setIsAdPlaced] = useState(false)
  const [CreatedAdSlug, setCreatedAdSlug] = useState('')
  const [DisabledTab, setDisabledTab] = useState({
    selectCategory: false,
    details: true,
    extraDet: true,
    img: true,
    loc: true
  })
  const [IsLoading, setIsLoading] = useState(false)
  const [IsLoadMoreCat, setIsLoadMoreCat] = useState(false)
  const [filePreviews, setFilePreviews] = useState({});


  const getCountriesData = async (search) => {
    try {
      // Fetch countries
      const res = await getCoutriesApi.getCoutries({ search });
      const allCountries = res?.data?.data?.data || [];
      setCountries(allCountries)
    } catch (error) {
      console.error("Error fetching countries data:", error);
    }
  };

  const getStatesData = async (search) => {
    try {
      const res = await getStatesApi.getStates({ country_id: SelectedCountry?.id, search });
      const allStates = res?.data?.data?.data || [];
      setStates(allStates)
    } catch (error) {
      console.error("Error fetching states data:", error);
      return [];
    }
  };

  const getCitiesData = async (search) => {
    try {
      const res = await getCitiesApi.getCities({ state_id: SelectedState?.id, search });
      const allCities = res?.data?.data?.data || [];
      setCities(allCities)
    } catch (error) {
      console.error("Error fetching cities data:", error);
      return [];
    }
  };

  const getAreaData = async (search) => {
    try {
      const res = await getAreasApi.getAreas({ city_id: SelectedCity?.id, search });
      const allArea = res?.data?.data?.data || [];
      setArea(allArea)
    } catch (error) {
      console.error("Error fetching cities data:", error);
      return [];
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getCountriesData(CountrySearch);
    }, 1500);
    return () => {
      clearTimeout(timeout);
    };
  }, [CountrySearch])

  useEffect(() => {
    const timeout = setTimeout(() => {
      getStatesData(StateSearch);
    }, 1500);
    return () => {
      clearTimeout(timeout);
    };
  }, [SelectedCountry?.id, StateSearch])

  useEffect(() => {

    const timeout = setTimeout(() => {
      getCitiesData(CitySearch);
    }, 1500);
    return () => {
      clearTimeout(timeout);
    };

  }, [SelectedState?.id, CitySearch])

  useEffect(() => {
    const timeout = setTimeout(() => {
      SelectedCity?.id && getAreaData(AreaSearch);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };

  }, [SelectedCity?.id, AreaSearch])

  const getLocationWithMap = async (pos) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=${settings?.place_api_key}`);

      if (response.data.error_message) {
        toast.error(response.data.error_message)
        return
      }

      let city = '';
      let state = '';
      let country = '';
      let address = '';

      // Extract address components
      // Loop through all results
      response.data.results.forEach(result => {
        const addressComponents = result.address_components;
        const getAddressComponent = (type) => {
          const component = addressComponents.find(comp => comp.types.includes(type));
          return component ? component.long_name : '';
        };

        if (!city) city = getAddressComponent("locality");
        if (!state) state = getAddressComponent("administrative_area_level_1");
        if (!country) country = getAddressComponent("country");
        if (!address) address = result.formatted_address;
      });

      // Create location data object
      const locationData = {
        lat: pos.lat,
        long: pos.lng,
        city,
        state,
        country,
        address
      };

      // Set the location by map
      setLocationByMap(locationData);
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  }

  const getCurrentLocation = async () => {
    setActiveLocation('locate');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };

            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.latitude},${locationData.longitude}&key=${settings?.place_api_key}`);


            if (response.data.error_message) {
              toast.error(response.data.error_message)
              return
            }

            // Loop through all results
            let city = '';
            let state = '';
            let country = '';
            let address = '';

            response.data.results.forEach(result => {
              const addressComponents = result.address_components;
              const getAddressComponent = (type) => {
                const component = addressComponents.find(comp => comp.types.includes(type));
                return component ? component.long_name : '';
              };

              if (!city) city = getAddressComponent("locality");
              if (!state) state = getAddressComponent("administrative_area_level_1");
              if (!country) country = getAddressComponent("country");
              if (!address) address = result.formatted_address;
            });

            const cityData = {
              lat: locationData.latitude,
              long: locationData.longitude,
              city,
              state,
              country,
              address
            };

            setLocation(cityData);
          } catch (error) {
            console.error('Error fetching location data:', error);
          }
        },
        (error) => {
          toast.error(t('locationNotGranted'));
        }
      );
    } else {
      toast.error(t('geoLocationNotSupported'));
    }
  };


  const allCategoryIdsString = CurrentPath.map(category => category.id).join(',');

  let lastItemId = CurrentPath[CurrentPath.length - 1]?.id;

  const getCategoriesData = async (type) => {
    try {
      setIsLoading(true)
      const res = await categoryApi.getCategory({ category_id: type ? type : lastItemId })
      const data = res?.data?.data?.data
      setCurrenCategory(data)
      setCurrentPage(res?.data?.data?.current_page); // Update the current page
      setLastPage(res?.data?.data?.last_page); // Update the current page
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }
  const getCustomFieldsData = async (id) => {
    try {
      const res = await getCustomFieldsApi.getCustomFields({ category_ids: allCategoryIdsString })
      const data = res?.data?.data
      setCustomFields(data)
      const newExtraDetails = {};
      data.forEach(item => {
        switch (item.type) {
          case 'checkbox':
            newExtraDetails[item.id] = []; // Initialize with an empty array
            break;
          case 'dropdown':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          case 'radio':
            newExtraDetails[item.id] = []; // Initialize with an empty string
            break;
          case 'fileinput':
            newExtraDetails[item.id] = null; // Initialize with null
            break;
          case 'textbox':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          case 'number':
            newExtraDetails[item.id] = null; // Initialize with null
            break;
          case 'text':
            newExtraDetails[item.id] = ''; // Initialize with an empty string
            break;
          default:
            break;
        }
      });
      setExtraDetails(newExtraDetails);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getCategoriesData()
  }, [lastItemId, CurrentLanguage])

  const handleCategoryTabClick = async (category) => {
    setCurrentPath((prevPath) => [...prevPath, category]);
    if (category?.subcategories_count > 0) {
      if (category?.subcategories?.length > 0) {
        setCurrenCategory(category?.subcategories)
      } else {
        await getCategoriesData(category?.id)
      }
    }
    else {
      setActiveTab(2)
      setDisabledTab({
        selectCategory: true,
        details: false,
        extraDet: false,
        img: false,
        loc: false
      });
    }
  }

  useEffect(() => {
    if (activeTab === 2) {
      if (allCategoryIdsString) {
        getCustomFieldsData()
      }
    }
  }, [allCategoryIdsString])

  const handleGoBack = () => {

    setActiveTab((prev) => {

      if (CustomFields.length === 0 && activeTab === 4) {
        return prev - 2
      }
      else {
        return prev - 1;
      }
    })
  }

  const handleSelectedTabClick = (id) => {
    setCustomFields([])
    setAdListingDetails({
      title: '',
      slug: '',
      desc: '',
      price: '',
      phonenumber: '',
      link: '',
    })
    if (activeTab !== 1) {
      setActiveTab(1);
      setDisabledTab({
        selectCategory: false,
        details: true,
        extraDet: true,
        img: true,
        loc: true
      });
    }
    const index = CurrentPath.findIndex(item => item.id === id);
    if (index !== -1) {
      const newPath = CurrentPath.slice(0, index);
      setCurrentPath(newPath);
    }
    if (index === 0) {
      setCurrenCategory([])
      getCategoriesData("")
      setCurrentPath([])
      setCustomFields([])
    }
  };

  const handleAdListingChange = (e) => {
    const { name, value } = e.target;

    setAdListingDetails((prevDetails) => {
      const updatedDetails = {
        ...prevDetails,
        [name]: value,
      };
      if (name === 'title') {
        updatedDetails.slug = generateSlug(value);
      }
      return updatedDetails;
    });
  };

  const handleDetailsSubmit = () => {

    const isValidSlug = /^[a-z0-9-]+$/.test(AdListingDetails.slug.trim());

    if (AdListingDetails.title.trim() == "") {
      toast.error(t('titleRequired'))
      return;
    }
    else if (AdListingDetails.desc.trim() == "") {
      toast.error(t('descriptionRequired'))
      return;
    } else if (AdListingDetails.price == "") {
      toast.error(t('priceRequired'))
      return;
    } else if (AdListingDetails?.price < 0) {
      toast.error(t('enterValidPrice'));
      return
    }
    else if (AdListingDetails.phonenumber == "") {
      toast.error(t('phoneRequired'))
      return;
    } else if (AdListingDetails.slug.trim() && !isValidSlug) {
      toast.error(t('addValidSlug'));
      return;
    }


    if (CustomFields?.length === 0) {
      setActiveTab(4)
    }
    else {
      setActiveTab(3)
    }
  }

  const submitExtraDetails = (e) => {
    if (!validateExtraDetails(CustomFields, extraDetails)) {
      return;
    }
    setActiveTab(4)
  };

  const handleImageSubmit = () => {
    if (uploadedImages.length === 0) {
      toast.error(t('uploadMainPicture'))
      return
    }
    setActiveTab(5)
  }

  const validateExtraDetails = (CustomFields, extraDetails) => {
    for (const field of CustomFields) {

      const { name, type, required, id, min_length, } = field;

      if (required) {
        if (type !== 'checkbox' && type !== 'radio' && type !== 'fileinput' && !(type === 'textbox' ? extraDetails[id]?.trim() : extraDetails[id])) {
          toast.error(`${t('fillDetails')} ${name}.`);
          return false;
        }

        if (type === 'fileinput' && !extraDetails[id] && !filePreviews[id]) {
          toast.error(`${t('fillDetails')} ${name}.`);
          return false
        }

        if ((type === 'checkbox' || type === 'radio') && extraDetails[id].length === 0) {
          toast.error(`${t('selectAtleastOne')} ${name}.`);
          return false;
        }

        // Required field with min_length validation
        if (extraDetails[id] && type === 'textbox' && extraDetails[id].trim().length < min_length) {
          toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('charactersLong')}`);
          return false;
        }
        if (extraDetails[id] && type === 'number' && extraDetails[id].length < min_length) {
          toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('digitLong')}`);
          return false;
        }
      }

      // Non-required field with min_length validation
      if (!required && extraDetails[id] && type === 'textbox' && extraDetails[id].length < min_length) {
        toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('charactersLong')}`);
        return false;
      }

      if (!required && extraDetails[id] && type === 'number' && extraDetails[id].length < min_length) {
        toast.error(`${name} ${t('mustBeAtleast')} ${min_length} ${t('digitLong')}`);
        return false;
      }

    }
    return true;
  };

  const isValidURL = (url) => {
    const pattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return pattern.test(url);
  };

  const postAd = async () => {

    const cat = CurrentPath[CurrentPath.length - 1];
    const catId = cat.id;

    let countryName, stateName, cityName, latitude, longitude, address;

    if (ActiveLocation === 'manually') {
      countryName = SelectedCountry.name;
      stateName = SelectedState.name;
      cityName = SelectedCity.name;
      address = Area.length !== 0 ? SelectedArea.name : Address;
      latitude = SelectedCity.latitude;
      longitude = SelectedCity.longitude;
    } else if (ActiveLocation === 'locate') {
      countryName = Location?.country;
      stateName = Location?.state;
      cityName = Location?.city;
      latitude = Location?.lat;
      longitude = Location?.long;
      address = Location?.address;
    } else {
      countryName = LocationByMap.country;
      stateName = LocationByMap.state;
      cityName = LocationByMap.city;
      latitude = LocationByMap.lat;
      longitude = LocationByMap.long;
      address = LocationByMap.address;
    }


    const transformedCustomFields = {};
    const customFieldFiles = [];
    Object.entries(extraDetails).forEach(([key, value]) => {
      if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
        customFieldFiles.push({ key, files: value });
      } else {
        transformedCustomFields[key] = Array.isArray(value) ? value : [value];
      }
    });

    const show_only_to_premium = 1;
    const allData = {
      name: AdListingDetails.title,
      slug: AdListingDetails.slug.trim(),
      description: AdListingDetails?.desc,
      category_id: catId,
      all_category_ids: allCategoryIdsString,
      price: AdListingDetails.price,
      contact: AdListingDetails.phonenumber,
      video_link: AdListingDetails?.link,
      custom_fields: transformedCustomFields,
      image: uploadedImages[0],
      gallery_images: OtherImages,
      address: address,
      latitude: latitude,
      longitude: longitude,
      custom_field_files: customFieldFiles,
      show_only_to_premium: show_only_to_premium,
      country: countryName,
      state: stateName,
      city: cityName,
      area: ActiveLocation === 'manually' && SelectedArea?.name ? SelectedArea.name : undefined,
      area_id: ActiveLocation === 'manually' && SelectedArea?.id ? SelectedArea.id : undefined,
    }
    try {
      setIsAdPlaced(true)
      const res = await addItemApi.addItem(allData)
      if (res?.data?.error === false) {
        setIsAdSuccessfulModal(true)
        setCreatedAdSlug(res?.data?.data[0]?.slug)
      }
      else {
        toast.error(res?.data?.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsAdPlaced(false)
    }
  }

  const handleFullSubmission = () => {

    if (!isLogin()) {
      toast.error(t('loginFirst'))
      return
    }

    const { title, desc, price, phonenumber, slug, link } = AdListingDetails;

    const isValidSlug = /^[a-z0-9-]+$/.test(slug.trim());

    const cat = CurrentPath[CurrentPath.length - 1];
    const catId = cat?.id;

    if (!catId) {
      toast.error(t('selectCategory'))
      return
    }

    if (!title.trim() || !desc.trim() || !price || !phonenumber) {
      toast.error(t('completeDetails'));
      setActiveTab(2);
      return;
    }


    // Additional validation logic (e.g., format checks) can be added here
    if (price < 0) {
      toast.error(t('enterValidPrice'));
      setActiveTab(2);
      return;
    }

    if (slug.trim() && !isValidSlug) {
      toast.error(t('addValidSlug'));
      setActiveTab(2);
      return;
    }

    if (link && !isValidURL(link)) {
      toast.error(t('enterValidUrl'));
      setActiveTab(2);
      return;
    }

    if (CustomFields.length !== 0 && !validateExtraDetails(CustomFields, extraDetails)) {
      setActiveTab(3);
      return;
    }
    if (uploadedImages.length === 0) {
      toast.error(t('uploadMainPicture'));
      setActiveTab(4);
      return
    }
    if (ActiveLocation === 'manually' && Object.keys(SelectedCountry).length === 0) {
      toast.error(t('selectCountry'));
      return
    }
    if (ActiveLocation === 'manually' && Object.keys(SelectedState).length === 0) {
      toast.error(t('selectState'));
      return
    }
    if (ActiveLocation === 'manually' && Object.keys(SelectedCity).length === 0) {
      toast.error(t('selectCity'));
      return
    }
    if (ActiveLocation === 'manually' && Area.length !== 0 && Object.keys(SelectedArea).length === 0) {
      toast.error(t('selectArea'));
      return
    }
    if (ActiveLocation === 'manually' && Area.length === 0 && !Address) {
      toast.error(t('enterAddress'));
      return
    }

    const isLocation = Location?.city && Location?.country && Location?.state && Location?.lat && Location?.long

    if (ActiveLocation === 'locate' && !isLocation) {
      toast.error(t('locationSetFailed'));
      return
    }
    const isLocationByMap = LocationByMap.country && LocationByMap.state && LocationByMap.city && LocationByMap.address;
    if (ActiveLocation === 'map' && !isLocationByMap) {
      toast.error(t('pleaseSelectLocation'));
      return
    }
    postAd()
  }

  const fetchMoreCategory = async (id) => {
    setIsLoadMoreCat(true)
    try {
      if (currentPage < lastPage) {
        const response = await categoryApi.getCategory({ page: `${currentPage + 1}`, category_id: lastItemId });
        const { data } = response.data;
        if (data && Array.isArray(data.data)) {
          setCurrenCategory(prev => [...prev, ...data.data]);
          setCurrentPage(data?.data?.current_page); // Update the current page
          setLastPage(data?.data?.last_page); // Update the current page
        } else {
          console.error("Error: Data is not an array", data);
          // setIsLoading(false);
        }
      } else {
        return
      }

    } catch (error) {
      // setIsLoading(false)
      console.error("Error:", error);
    } finally {
      setIsLoadMoreCat(false)
    }
  }

  const handleTabClick = (tab) => {
    if (tab === 1 && !DisabledTab.selectCategory) {
      setActiveTab(1);
    } else if (tab === 2 && !DisabledTab.details) {
      setActiveTab(2);
    } else if (tab === 3 && !DisabledTab.extraDet) {
      setActiveTab(3);
    } else if (tab === 4 && !DisabledTab.img) {
      setActiveTab(4);
    } else if (tab === 5 && !DisabledTab.loc) {
      setActiveTab(5);
    }
  }

  const handleDeatilsBack = () => {
    setCustomFields([])
    setAdListingDetails({
      title: '',
      slug: '',
      desc: '',
      price: '',
      phonenumber: '',
      link: '',
    })
    if (activeTab !== 1) {
      setActiveTab(1);
      setDisabledTab({
        selectCategory: false,
        details: true,
        extraDet: true,
        img: true,
        loc: true
      });
    }
    if (CurrentPath.length > 0) {
      CurrentPath.pop();
    }
  }

  // When user comes from the first screen with Motors selected,
  // auto-drill into the Motors root category so we can show its subcategories.
  useEffect(() => {
    if (section !== 'motors') return
    if (!CurrenCategory.length) return
    if (CurrentPath.length > 0) return

    const motorsRoot =
      CurrenCategory.find((c) => String(c.slug).toLowerCase() === 'motors') ||
      CurrenCategory.find((c) =>
        String(c.translated_name || c.name || '').toLowerCase().includes('motor')
      )

    if (!motorsRoot) return

    setCurrentPath([motorsRoot])
    getCategoriesData(motorsRoot.id)
  }, [section, CurrenCategory, CurrentPath.length])

  return (
    <>
      <AdsHeader />
      {section === '' && (
        <div className="w-full mx-auto">
          <div className="max-w-[550px] mx-auto px-[16px] py-[32px] sm:py-[40px]">
            <div className="mb-[32px] text-center">
              <h4 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[8px]">
                {t('helloWhatListingToday') || 'Hello, what are you listing today?'}
              </h4>
              <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                {t('selectBestAreaForAd') || 'Select the area that best suits your ad'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[32px]">
              {[
                { key: 'motors', label: 'Motors', icon: motorsIcon },
                { key: 'jobs', label: 'Jobs', icon: jobsIcon },
                { key: 'property-sale', label: 'Property for Sale', icon: propertySaleIcon },
                { key: 'property-rent', label: 'Property for Rent', icon: propertyRentIcon },
                { key: 'community', label: 'Community', icon: communityIcon },
                { key: 'classifieds', label: 'Classifieds', icon: classifiedsIcon },
              ].map((item) => (
                <Link
                  key={item.key}
                  href={`/ad-listing?section=${encodeURIComponent(item.key)}`}
                  className="group flex flex-col items-center justify-center rounded-[12px] bg-white p-[40px_20px_20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#f7f7f7]"
                >
                  <div className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center">
                    <Image src={item.icon} alt={item.label} width={48} height={48} />
                  </div>
                  <p className="text-[14px] font-[Inter-Bold] text-[#23262A] text-center">
                    {item.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'motors' && (
        <MotorsCategories
          categories={CurrenCategory}
          onSelect={handleCategoryTabClick}
        />
      )}
    </>
  )
}

export default AdListing
