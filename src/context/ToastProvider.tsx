"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastType } from "@/components";
import { v4 as uuidv4 } from "uuid";

interface ToastContextProps {
  showToast: (toast: {
    title: string;
    description?: string;
    type: ToastType;
    txHash?: string;
    duration?: number;
  }) => void;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  txHash?: string;
  duration?: number;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (toast: {
      title: string;
      description?: string;
      type: ToastType;
      txHash?: string;
      duration?: number;
    }) => {
      const id = uuidv4();
      setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
    },
    [],
  );

  const closeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.type}
            txHash={toast.txHash}
            duration={toast.duration}
            onClose={closeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
