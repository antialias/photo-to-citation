"use client";
import { useEffect } from "react";

export default function useViewportHeight(active: boolean) {
  useEffect(() => {
    if (!active) return;
    function set() {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`,
      );
    }
    set();
    window.addEventListener("resize", set);
    return () => {
      window.removeEventListener("resize", set);
    };
  }, [active]);
}
