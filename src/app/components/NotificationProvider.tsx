"use client";

import { createContext, useContext, useEffect } from "react";
import { type ToastOptions, Toaster, toast } from "react-hot-toast";

type Notify = (message: string, opts?: ToastOptions) => void;

const NotifyContext = createContext<Notify>(() => {});

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const notify: Notify = (message, opts) => {
    toast(message, {
      className: "bg-gray-800 text-gray-100",
      ...opts,
    });
    if (
      typeof window !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(message);
    }
  };

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <Toaster toastOptions={{ className: "bg-gray-800 text-gray-100" }} />
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
