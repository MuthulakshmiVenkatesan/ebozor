'use client'
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { loadGoogleMaps } from "@/utils";
import Homepin from '../../../../../public/assets/img/icons/homepin.svg'

function parseCoordinate(v) {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}

const MapComponent = (props) => {
    const [showMap, setShowMap] = useState(() => Boolean(props?.initialExpanded));
    const suppressToggleButton = Boolean(props?.suppressToggleButton);
    const previewHeight = props?.previewHeight ?? "120px";
    const expandedHeight = props?.height ?? "320px";
    const fullWidth = Boolean(props?.fullWidth);
    const closedWidthClass = props?.closedWidthClass ?? "w-[300px]";
    const openWidthClass = props?.openWidthClass ?? "w-[800px]";
    const toggleButtonClassName = props?.toggleButtonClassName ?? "cursor-pointer absolute top-[32%] left-0 right-0 justify-center items-center w-full";
    const toggleButtonInnerClassName =
        props?.toggleButtonInnerClassName ?? "inline-flex items-center gap-[8px] rounded-full bg-white p-[6px_20px] shadow-[0_4px_14px_rgba(0,0,0,0.12)]";
    const toggleButtonTextClassName =
        props?.toggleButtonTextClassName ?? "text-[14px] font-[Inter-SemiBold] text-[#3A88EF]";
    const mapHeight = showMap ? expandedHeight : previewHeight;
    const containerStyle = useMemo(
        () => ({
            width: "100%",
            height: mapHeight,
        }),
        [mapHeight]
    );

    const { isLoaded } = loadGoogleMaps();

    useEffect(() => {
        if (window.google && isLoaded) {
            // Initialize any Google Maps API-dependent logic here
        }
    }, [isLoaded]);

    const center = useMemo(() => {
        const lat = parseCoordinate(props?.latitude);
        const lng = parseCoordinate(props?.longitude);
        if (lat === null || lng === null) return null;
        return { lat, lng };
    }, [props?.latitude, props?.longitude]);

    const handleToggleMap = () => {
        setShowMap((prev) => {
            const next = !prev;
            props?.onToggleShowMap?.(next);
            return next;
        });
    };

    return (
        <div className="relative">
            <div
                className={`relative rounded-[6px] overflow-hidden max-sm:w-full ${fullWidth ? 'w-full' : showMap ? `map-preview--open ${openWidthClass}` : closedWidthClass}`}
                style={{ height: mapHeight }}
            >
                {center && isLoaded ? (
                    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
                        <Marker position={center} />
                    </GoogleMap>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f5f6f8] text-[12px] text-[#666]">Map preview</div>
                )}
            </div>
            {!suppressToggleButton ? (
                <button
                    type="button"
                    onClick={handleToggleMap}
                    className={`${toggleButtonClassName} ${showMap ? 'hidden' : 'flex'}`}
                >
                    <div className={toggleButtonInnerClassName}>
                        <Image src={Homepin} alt="Homepin" width={24} height={24} />
                        <p className={toggleButtonTextClassName}>{showMap ? 'Hide Map' : 'Show Map'}</p>
                    </div>
                </button>
            ) : null}
        </div>
    );
};

export default MapComponent;
