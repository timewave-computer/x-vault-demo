"use client";

import { useState, ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children?: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children || (
          <div className="flex items-center justify-center w-4 h-4 text-xs text-gray-500 bg-transparent border border-gray-400 rounded-full">
            ?
          </div>
        )}
      </div>

      {isVisible && (
        <div className="absolute z-10 w-64 p-3 text-sm text-left text-gray-700 bg-white rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="absolute w-3 h-3 bg-white transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </div>
  );
}
