import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Grid } from '@mui/material';
const FeaturedSectionsSkeleton = () => {
    const skeletonCards = Array.from({ length: 4 }, (_, index) => (
        <div className="" key={index}>
            <div className="bg-gray-300 h-[170px] rounded mb-[10px] w-full object-cover max-sm:h-[130px] product_card_img">
            </div>
            <div className=''>
                <h4 className="bg-gray-300 rounded h-[20px] w-[200px] mb-[4px]"> 
                </h4>
                <p className="bg-gray-300 rounded h-[20px] w-[200px] mb-[4px]"> 

                </p>
                <div className="flex items-center gap-[4px]">
                    <div className="bg-gray-300 rounded h-[20px] w-[200px]"> 
                    </div>
                </div>
            </div>
        </div>
    ));

    return (
        <div className="w-full mx-auto">
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                {/* <SkeletonTheme baseColor="lightgray" highlightColor="#e0e0e0"> */}
                    <div className="">
                        <div className="mb-[30px] animate-pulse">
                            <h4 className="bg-gray-300 rounded h-[30px] w-[250px]"> 

                            </h4>
                        </div>
                        <div className="grid grid-cols-5 gap-[14px] max-sm:grid-cols-2">
                            {skeletonCards}
                        </div>
                    </div>
                {/* </SkeletonTheme> */}
            </div>
        </div>
    );
};

export default FeaturedSectionsSkeleton;