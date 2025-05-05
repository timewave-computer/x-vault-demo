"use client";
import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  txHash?: string;
  onClose: (id: string) => void;
  duration?: number;
}

const getBgColorByType = (type: ToastType) => {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200";
    case "error":
      return "bg-red-50 border-red-200";
    case "info":
    default:
      return "bg-blue-50 border-blue-200";
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type,
  txHash,
  onClose,
  duration = 5000,
}) => {
  // Auto close toast after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onClose]);

  return (
    <div
      className={`${getBgColorByType(
        type,
      )} border rounded-lg shadow-lg p-5 mb-4 w-full max-w-md transition-all duration-300 ease-in-out transform translate-y-0 opacity-100 flex items-start`}
      role="alert"
    >
      <div className="flex-1">
        <div className="font-bold text-gray-900 text-lg">{title}</div>
        {description && (
          <div className="text-base text-gray-700 mt-1">{description}</div>
        )}
        {txHash && (
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-purple hover:underline mt-2 inline-block"
          >
            View Transaction Details ↗
          </a>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-3 text-gray-500 hover:text-gray-700 focus:outline-none text-xl"
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
};
