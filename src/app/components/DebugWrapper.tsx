"use client";
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
  if (!enabled) return <>{children}</>;
  const json = JSON.stringify(data, null, 2);
  const tokens = tokenize(json);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative inline-block"
    >
      {children}
      {hovered && alt ? (
        <div className="absolute z-50 text-xs bg-black/80 text-white p-2 rounded shadow max-w-sm max-h-60 overflow-auto">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-1 right-1 underline"
          >
            Copy
          </button>
          <pre className="pt-4">{tokens}</pre>
        </div>
      ) : null}
    </div>
  );
}
