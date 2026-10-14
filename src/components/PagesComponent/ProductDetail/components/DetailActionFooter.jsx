"use client";

import React from "react";

const DetailActionFooter = ({ onEdit, onDeactivate, onUpgrade }) => {
  return (
    <div className="w-full fixed bottom-0 left-0 right-0 bg-[#eef0f1a1] p-[16px_0px] z-[99]">
      <div className="flex items-center justify-center gap-[20px]">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[6px] bg-[#fff] border border-[#23262a] text-[#000] p-[8px_24px] cursor-pointer hover:shadow-[rgba(0,0,0,0.1)_0px_2px_4px,rgba(0,0,0,0.06)_0px_4px_8px]
"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          className="rounded-[6px] bg-[#fff] border border-[#23262a] text-[#000] p-[8px_24px] cursor-pointer hover:shadow-[rgba(0,0,0,0.1)_0px_2px_4px,rgba(0,0,0,0.06)_0px_4px_8px]
"
        >
          Deactivate
        </button>
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-[6px] bg-[#fff] border border-[#23262a] text-[#000] p-[8px_24px] cursor-pointer hover:shadow-[rgba(0,0,0,0.1)_0px_2px_4px,rgba(0,0,0,0.06)_0px_4px_8px]
"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
};

export default DetailActionFooter;
