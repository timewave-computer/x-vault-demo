"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import * as Toast from "@radix-ui/react-toast";
import { cn } from "@/lib";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (title: string, body: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<
    | {
        title: string;
        body?: string;
        type: ToastType;
      }
    | undefined
  >();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<ToastType>("info");

  const showToast = useCallback(
    (title: string, body: string, type: ToastType = "info") => {
      setTitle(title);
      setBody(body);
      setType(type);
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
    <ToastContext.Provider value={{ showToast }}>
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
            <Toast.Description className="text-sm opacity-90">
              {body}
            </Toast.Description>
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
