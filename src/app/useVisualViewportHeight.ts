"use client";
import { useEffect, useState } from "react";

export default function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    typeof window === "undefined"
      ? 0
      : (window.visualViewport?.height ?? window.innerHeight),
  );
  useEffect(() => {
    function update() {
      setHeight(window.visualViewport?.height ?? window.innerHeight);
    }
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return height;
}
