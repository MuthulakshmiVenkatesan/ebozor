'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import emptydata from '../../../public/assets/img/emptydata.png';
import data from '../../../public/assets/img/data.png';
import { MoreIcon } from '../CustomFile/icons';
import { isLogin, placeholderImage } from '@/utils';
import { getNotificationList } from '@/utils/api';

// notifications: array of items { id, title, subtitle, date, image }
const NotificationPopup = ({ isOpen, onClose, onViewAll, notifications = [], onMarkRead, onRemove }) => {
  const [apiNotifications, setApiNotifications] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!isOpen || !isLogin()) return;

    const fetchNotifications = async () => {
      try {
        const response = await getNotificationList.getNotification({ page: 1 });
        const list = response?.data?.data?.data || [];
        setApiNotifications(list);
      } catch (error) {
        setApiNotifications([]);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const popupNotifications = useMemo(() => {
    if (apiNotifications.length > 0) {
      return apiNotifications.map((item) => ({
        id: item?.id,
        title: item?.title || '',
        subtitle: item?.message || '',
        date: formatDate(item?.created_at),
        image: item?.image || '',
      }));
    }
    return notifications;
  }, [apiNotifications, notifications]);

  if (!isOpen) return null;

  const hasData = popupNotifications.length > 0;

  return (
    <div className="absolute top-full left-0 mt-2 z-[9998]">
      <div className="bg-white rounded-[12px] shadow-[0_0_24px_0px_rgba(0,0,0,0.12)] w-[390px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-[20px_16px] border-b border-[rgba(143,143,143,0.24)]">
          <h3 className="text-[14px] font-[Inter-Medium] text-[#000]">Notifications</h3>
          {/* {hasData && (
            <button
              type="button"
              className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]"
            >
              Mark all as Read
            </button>
          )} */}
        </div>

        {/* Content */}
        {hasData ? (
          <div className="max-h-[360px] overflow-y-auto">
            {popupNotifications.map((item) => (
              <div
                key={item.id}
                onClick={onViewAll}
                className="flex items-start gap-[10px] p-[14px] border-b border-[rgba(143,143,143,0.24)] hover:bg-[rgba(58,136,239,0.08)] cursor-pointer last:border-b-0"
              >
                <div className="">
                  {item.image ? (
                    <div className="w-[60px] h-[60px] rounded-[8px] overflow-hidden bg-[#F2F2F2] flex-shrink-0">
                      <Image
                        src={item.image}
                        width={60}
                        height={60}
                        alt={item.title || 'Notification'}
                        onError={placeholderImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-[8px] overflow-hidden bg-[#F2F2F2] flex-shrink-0">
                      <Image
                        src={placeholderImage}
                        alt="Notification"
                        onError={placeholderImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex-col flex gap-[2px]">
                  <h4 className="text-[14px] font-[Inter-Medium] text-[#000] ">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-[12px] font-[Inter-Regular] text-[#000] ">                      {item.subtitle}
                    </p>
                  )}
                  {item.date && (
                    <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                      saved on : {item.date}
                    </p>
                  )}
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="cursor-pointer"
                    aria-label="More options"
                    onClick={() =>
                      setOpenMenuId((prev) => (prev === item.id ? null : item.id))
                    }
                  >
                    ⋯
                  </button>
                  {openMenuId === item.id && (
                    <div className="absolute end-0 top-full mt-1 w-[200px] bg-white border border-[rgba(143,143,143,0.16)] rounded-[4px] z-[10000]">
                      <button
                        type="button"
                        className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5] border-b border-[rgba(143,143,143,0.16)]"
                        onClick={() => {
                          setOpenMenuId(null);
                          onMarkRead && onMarkRead(item);
                        }}
                      >
                        Mark As Read
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5]"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRemove && onRemove(item);
                        }}
                      >
                        Remove Notification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-[20px] flex flex-col items-center text-center">
            <div className="w-[180px] h-[180px] mb-[10px]">
              <Image src={emptydata} alt="Empty Data" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-[18px] font-[Inter-SemiBold] text-[#000] mb-[6px]">
              No notifications...yet!
            </h4>
            <p className="text-[14px] font-[Inter-Medium] text-[#000000CC] leading-[20px] max-w-[280px]">
              View ad recommendations and news by Ebozor, etc.
            </p>
          </div>
        )}



        {/* Footer button */}
        <div className='p-[20px_16px] w-full border-t border-[rgba(143,143,143,0.24)]'>
          <button
            type="button"
            onClick={onViewAll}
            className="w-full cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#E31F1F]"
          >
            View All Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;

