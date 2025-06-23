"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { Toaster, toast } from "sonner";

export function notify(message: string) {
  toast(message);
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(message);
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") new Notification(message);
      });
    }
  }
}

const NotificationContext = createContext<typeof notify>(notify);

export function useNotification() {
  return useContext(NotificationContext);
}

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Toaster richColors position="top-right" />
    </NotificationContext.Provider>
  );
}
