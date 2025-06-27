"use client";
import { useEffect } from "react";

export default function DisablePinchZoom() {
  useEffect(() => {
    function prevent(e: Event) {
      e.preventDefault();
    }
    document.addEventListener("gesturestart", prevent);
    document.addEventListener("gesturechange", prevent);
    document.addEventListener("gestureend", prevent);
    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
    };
  }, []);
  return null;
}
