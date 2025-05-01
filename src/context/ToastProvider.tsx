"use client";
import React, { createContext, useState, useCallback } from "react";
import * as Toast from "@radix-ui/react-toast";
import { cn } from "@/lib";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (inputs: {
    title: string;
    description?: React.ReactNode;
    type?: ToastType;
    txHash?: string;
  }) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<React.ReactNode>("");
  const [type, setType] = useState<ToastType>("info");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const showToast = useCallback(
    (
      title: string,
      body: React.ReactNode,
      type: ToastType = "info",
      txHash?: string,
    ) => {
      setTitle(title);
      setBody(body);
      setType(type);
      setTxHash(txHash);
      setOpen(true);
    },
    [],
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast: ({ title, description, type, txHash }) =>
          showToast(title, description, type, txHash),
      }}
    >
      <Toast.Provider>
        {children}
        <Toast.Root
          className={cn(
            "fixed bottom-4 right-4 z-50 flex w-full max-w-md items-center justify-between rounded-lg border p-4 shadow-lg",
            getToastStyles(type),
          )}
          open={open}
          onOpenChange={setOpen}
        >
          <div className="flex flex-col gap-1">
            <Toast.Title className="font-medium">{title}</Toast.Title>
            {body && (
              <Toast.Description className="text-sm opacity-90">
                {body}
              </Toast.Description>
            )}

            {txHash && (
              <a
                href={`https://etherscan.io/8545/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-90 hover:underline mt-1"
              >
                View Transaction Details ↗
              </a>
            )}
          </div>
          <Toast.Close className="ml-4 rounded-full p-1 hover:bg-black/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Toast.Close>
        </Toast.Root>
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};
