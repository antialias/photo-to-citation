"use client";
import { useEffect } from "react";

export default function useVisualViewportHeight(active = true) {
  useEffect(() => {
    if (!active) return;
    const setHeight = () => {
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${height}px`,
      );
      // prevent the browser from scrolling the page when the keyboard opens
      window.scrollTo({ top: 0 });
    };
    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, [active]);
}
