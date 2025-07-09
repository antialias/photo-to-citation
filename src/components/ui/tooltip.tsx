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
import { css } from "styled-system/css";

export default function Tooltip({
  label,
  children,
  placement = "top",
  open: controlledOpen,
  onOpenChange,
  interactive = false,
  closeDelay = 0,
}: {
  label: ReactElement | string;
  children: ReactElement;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  interactive?: boolean;
  closeDelay?: number;
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
    delay: { close: closeDelay },
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

  const referenceProps = getReferenceProps({ ref: refs.setReference });

  return (
    <>
      {cloneElement(children, referenceProps as Record<string, unknown>)}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={css({
              zIndex: "var(--z-tooltip)",
              borderRadius: "md",
              backgroundColor: "rgba(0,0,0,0.8)",
              px: "2",
              py: "1",
              fontSize: "xs",
              color: "white",
              shadow: "md",
            })}
          >
            {label}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
