"use client";
import { useEffect, useState } from "react";

export default function useAltKey() {
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.altKey) setPressed(true);
    };
    const up = () => setPressed(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", up);
    };
  }, []);
  return pressed;
}
