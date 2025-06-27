"use client";
import { useEffect } from "react";

export default function DisablePinchZoom() {
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    if (!mql.matches) return;
    function prevent(e: Event) {
      e.preventDefault();
    }
    document.addEventListener("gesturestart", prevent, { passive: false });
    document.addEventListener("gesturechange", prevent, { passive: false });
    document.addEventListener("gestureend", prevent, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
    };
  }, []);
  return null;
}
