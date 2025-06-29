"use client";
import { useEffect } from "react";

export default function useVisualViewportHeight() {
  useEffect(() => {
    const setHeight = () => {
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${height}px`,
      );
    };
    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, []);
}
