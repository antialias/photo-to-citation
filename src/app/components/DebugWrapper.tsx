"use client";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { useState } from "react";
import useAltKey from "../useAltKey";

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
  const enabled = Boolean(process.env.NEXT_PUBLIC_BROWSER_DEBUG);
  const alt = useAltKey();
  const [hovered, setHovered] = useState(false);
  const [tipHovered, setTipHovered] = useState(false);
  if (!enabled) return <>{children}</>;
  const json = JSON.stringify(data, null, 2);
  const tokens = tokenize(json);
  const open = (hovered || tipHovered) && (alt || tipHovered);
  return (
    <Tooltip.Root open={open} delayDuration={0}>
      <Tooltip.Trigger
        asChild
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="inline-block relative">{children}</div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          onMouseEnter={() => setTipHovered(true)}
          onMouseLeave={() => setTipHovered(false)}
          sideOffset={4}
          className="z-50 text-xs bg-black/80 text-white p-2 rounded shadow max-w-[min(100vw-16px,24rem)] max-h-[min(100vh-16px,20rem)] overflow-auto"
        >
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-1 right-1 underline"
          >
            Copy
          </button>
          <pre className="pt-4">{tokens}</pre>
          <Tooltip.Arrow className="fill-black/80" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
