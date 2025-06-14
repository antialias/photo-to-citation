import { useEffect } from "react";

export default function useDragReset(reset: () => void) {
  useEffect(() => {
    function handleDragEnd() {
      reset();
    }
    function handleDragLeave(e: DragEvent) {
      if (!e.relatedTarget) {
        reset();
      }
    }
    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("drop", handleDragEnd);
    window.addEventListener("dragleave", handleDragLeave);
    return () => {
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("drop", handleDragEnd);
      window.removeEventListener("dragleave", handleDragLeave);
    };
  }, [reset]);
}
