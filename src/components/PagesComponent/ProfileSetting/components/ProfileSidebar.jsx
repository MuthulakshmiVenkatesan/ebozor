'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DownArrowIcon } from '@/components/CustomFile/icons'
import user from '../../../../../public/assets/img/icons/user.svg'
import settings from '../../../../../public/assets/img/icons/settings.svg'
import lock from '../../../../../public/assets/img/icons/lock.svg'

const menuItems = [
  {
    id: "profile",
    label: "Profile",
    icon: user,
    children: [
      { id: "basic-info", label: "Basic Info" },
      { id: "my-addresses", label: "My Addresses" },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: settings,
    children: [{ id: "phone-numbers", label: "Phone numbers" }],
  },
  { id: "security", label: "Security", icon: lock, children: [] },
];

const ProfileSidebar = ({ activeSubItem = "basic-info", onSubItemClick }) => {
  const [expandedItems, setExpandedItems] = useState(["profile"]);

  const toggleSection = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="w-full max-w-[270px] rounded-xl bg-white shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)] overflow-hidden p-[6px_0]">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isExpanded = expandedItems.includes(item.id);
        const hasChildren = item.children.length > 0;
        const isActiveRoot = !hasChildren && activeSubItem === item.id;

        return (
          <div key={item.id} className="">
            <button
              type="button"
              onClick={() => {
                if (hasChildren) {
                  toggleSection(item.id)
                } else {
                  onSubItemClick?.(item.id)
                }
              }}
              className={`cursor-pointer flex w-full items-center justify-between p-[16px_24px] text-left transition-colors shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)] overflow-hidden ${
                isActiveRoot ? "border-l-2 border-[#DC0000] bg-[#f3f3f3]" : "bg-[#fff]"
              }`}
            >
              <div className="flex items-center gap-[14px]">
                <Image src={Icon} alt={item.label} width={22} height={22} className="w-[22px] h-[22px]" />
                <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A] leading-none">{item.label}</h4>
              </div>

              {hasChildren &&
                (isExpanded ? (
                  <DownArrowIcon className="w-[22px] h-[22px] rotate-180" stroke="#23262A" />
                ) : (
                  <DownArrowIcon className="w-[22px] h-[22px] " stroke="#23262A" />
                ))}
            </button>

            {hasChildren && isExpanded && (
              <div className="bg-white flex flex-col ">
                {item.children.map((child) => {
                  const isActive = activeSubItem === child.id;

                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSubItemClick?.(child.id)}
                      className={`cursor-pointer w-full text-[14px] font-[Inter-Regular] text-[#23262A] leading-none p-[16px_24px_20px_60px] text-left rtl:text-right rtl:p-[16px_60px_20px_24px] transition-colors ${
                        isActive
                          ? "border-l-2 border-[#DC0000] bg-[#f3f3f3] "
                          : "bg-white hover:bg-[#f8f8f8]"
                      }`}
                    >
                     {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSidebar;
