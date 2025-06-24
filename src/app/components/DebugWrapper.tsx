"use client";
import useAltKey from "@/app/useAltKey";
import Tooltip from "@/components/ui/tooltip";
import { config } from "@/lib/config";
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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (alt && refHover) setOpen(true);
  }, [alt, refHover]);
  const json = JSON.stringify(data, null, 2);
  const tokens = tokenize(json);
  if (!enabled) return <>{children}</>;
  const show = (alt && refHover) || open;
  return (
    <Tooltip
      label={
        <div className="text-xs bg-black/80 text-white p-2 rounded shadow max-w-sm max-h-60 overflow-auto relative">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-1 right-1 underline"
          >
            Copy
          </button>
          <pre className="pt-4 whitespace-pre-wrap break-words">{tokens}</pre>
        </div>
      }
      open={show}
      onOpenChange={setOpen}
      interactive
      closeDelay={200}
    >
      <div
        onMouseEnter={() => {
          setRefHover(true);
          if (alt) setOpen(true);
        }}
        onMouseLeave={() => {
          setRefHover(false);
        }}
        className="inline-block"
      >
        {children}
      </div>
    </Tooltip>
  );
}
