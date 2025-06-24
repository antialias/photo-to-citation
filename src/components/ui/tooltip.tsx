"use client";
import {
  FloatingPortal,
  type Placement,
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { type ReactElement, cloneElement } from "react";
import { useState } from "react";

export default function Tooltip({
  label,
  children,
  placement = "top",
  open: controlledOpen,
  onOpenChange,
  interactive = false,
}: {
  label: ReactElement | string;
  children: ReactElement;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  interactive?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(5), flip(), shift({ padding: 5 })],
    placement,
  });

  const hover = useHover(context, {
    enabled: controlledOpen === undefined,
    move: false,
    handleClose: interactive ? safePolygon() : undefined,
  });
  const focus = useFocus(context, { enabled: controlledOpen === undefined });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 rounded bg-black/80 px-2 py-1 text-xs text-white shadow"
          >
            {label}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
