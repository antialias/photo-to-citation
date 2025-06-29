"use client";
import { useEffect } from "react";

export default function useViewportHeight(
  ref: React.RefObject<HTMLElement>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    function setHeight() {
      const height = window.visualViewport?.height ?? window.innerHeight;
      el.style.height = `${height}px`;
    }
    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, [ref, enabled]);
}
