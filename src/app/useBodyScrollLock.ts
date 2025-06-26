"use client";
import { useEffect } from "react";

export default function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (window.innerWidth >= 640) return;
    const { style } = document.body;
    const overflow = style.overflow;
    const touch = style.touchAction;
    const overscroll = style.overscrollBehavior;
    style.overflow = "hidden";
    style.touchAction = "none";
    style.overscrollBehavior = "contain";
    return () => {
      style.overflow = overflow;
      style.touchAction = touch;
      style.overscrollBehavior = overscroll;
    };
  }, [active]);
}
