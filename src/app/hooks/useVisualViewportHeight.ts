"use client";
import { useEffect, useState } from "react";

export default function useVisualViewportHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    function update() {
      setHeight(
        typeof window.visualViewport?.height === "number"
          ? window.visualViewport.height
          : window.innerHeight,
      );
    }
    update();
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return height;
}
