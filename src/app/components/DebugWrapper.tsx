"use client";
import useAltKey from "@/app/useAltKey";
import Tooltip from "@/components/ui/tooltip";
import { getPublicEnv } from "@/publicEnv";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";

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
  availableActions,
  unavailableActions,
  className,
}: {
  data: unknown;
  children: ReactNode;
  availableActions?: string[];
  unavailableActions?: string[];
  className?: string;
}) {
  const { NEXT_PUBLIC_BROWSER_DEBUG } = getPublicEnv();
  const enabled = Boolean(NEXT_PUBLIC_BROWSER_DEBUG);
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
        <div
          className={css({
            fontSize: "xs",
            bg: "blackAlpha.800",
            color: "white",
            p: "2",
            rounded: "md",
            shadow: "md",
            maxW: "sm",
            maxH: "60",
            overflow: "auto",
            position: "relative",
            display: "block",
            "& > * + *": { mt: "1" },
          })}
        >
          {(availableActions?.length || unavailableActions?.length) && (
            <div className={css({ mb: "1", "& > * + *": { mt: "1" } })}>
              {availableActions?.length ? (
                <p>
                  <span className={css({ fontWeight: "semibold" })}>
                    Available:
                  </span>{" "}
                  {availableActions.join(", ")}
                </p>
              ) : null}
              {unavailableActions?.length ? (
                <p>
                  <span className={css({ fontWeight: "semibold" })}>
                    Unavailable:
                  </span>{" "}
                  {unavailableActions.join(", ")}
                </p>
              ) : null}
              <hr />
            </div>
          )}
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className={css({
              position: "absolute",
              top: "1",
              right: "1",
              textDecorationLine: "underline",
            })}
          >
            Copy
          </button>
          <pre
            className={css({
              pt: "4",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            })}
          >
            {tokens}
          </pre>
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
        className={className ?? "inline-block"}
      >
        {children}
      </div>
    </Tooltip>
  );
}
