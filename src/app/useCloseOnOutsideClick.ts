import { useEffect } from "react";
import type { RefObject } from "react";

export default function useCloseOnOutsideClick(
  ref: RefObject<HTMLDetailsElement | null>,
) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const el = ref.current;
      if (el?.open && e.target instanceof Node && !el.contains(e.target)) {
        el.removeAttribute("open");
      }
    }
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [ref]);
}
