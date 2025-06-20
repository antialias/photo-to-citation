"use client";
import useAltKey from "@/app/useAltKey";
import { config } from "@/lib/config";
import Tippy from "@tippyjs/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

function tokenize(json: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const regex =
    /(\"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\\"])*\"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
  let last = 0;
  json.replace(regex, (match, _p1, offset) => {
    if (last < offset) tokens.push(json.slice(last, offset));
    let cls = "json-number";
    if (/^\"/.test(match)) {
      cls = /:$/.test(match) ? "json-key" : "json-string";
    } else if (/true|false/.test(match)) {
      cls = "json-boolean";
    } else if (/null/.test(match)) {
      cls = "json-null";
    }
    tokens.push(
      <span key={tokens.length} className={cls}>
        {match}
      </span>,
    );
    last = offset + match.length;
    return "";
  });
  if (last < json.length) tokens.push(json.slice(last));
  return tokens;
}

export default function DebugWrapper({
  data,
  children,
}: {
  data: unknown;
  children: ReactNode;
}) {
  const enabled = Boolean(config.NEXT_PUBLIC_BROWSER_DEBUG);
  const alt = useAltKey();
  const [refHover, setRefHover] = useState(false);
  const [tipHover, setTipHover] = useState(false);
  const [open, setOpen] = useState(false);
  const enterRef = useRef<(() => void) | null>(null);
  const leaveRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!enabled) return;
    import("tippy.js/dist/tippy.css");
  }, [enabled]);
  useEffect(() => {
    if (alt && refHover) setOpen(true);
  }, [alt, refHover]);
  useEffect(() => {
    if (!refHover && !tipHover) setOpen(false);
  }, [refHover, tipHover]);
  const json = JSON.stringify(data, null, 2);
  const tokens = tokenize(json);
  if (!enabled) return <>{children}</>;
  const show = (alt && refHover) || open || tipHover;
  return (
    <Tippy
      content={
        <div className="text-xs bg-black/80 text-white p-2 rounded shadow max-w-sm max-h-60 overflow-auto relative">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-1 right-1 underline"
          >
            Copy
          </button>
          <pre className="pt-4">{tokens}</pre>
        </div>
      }
      visible={show}
      interactive
      placement="auto"
      onMount={(i) => {
        enterRef.current = () => {
          setTipHover(true);
        };
        leaveRef.current = () => {
          setTipHover(false);
          if (!refHover) setOpen(false);
        };
        if (enterRef.current)
          i.popper.addEventListener("mouseenter", enterRef.current);
        if (leaveRef.current)
          i.popper.addEventListener("mouseleave", leaveRef.current);
      }}
      onHide={(i) => {
        if (enterRef.current)
          i.popper.removeEventListener("mouseenter", enterRef.current);
        if (leaveRef.current)
          i.popper.removeEventListener("mouseleave", leaveRef.current);
      }}
    >
      <div
        onMouseEnter={() => {
          setRefHover(true);
          if (alt) setOpen(true);
        }}
        onMouseLeave={() => {
          setRefHover(false);
          if (!tipHover) setOpen(false);
        }}
        className="inline-block"
      >
        {children}
      </div>
    </Tippy>
  );
}
