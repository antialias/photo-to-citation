"use client";
import { useEffect, useId, useRef, useState } from "react";

export default function EditableText({
  value,
  onSubmit,
  onClear,
  placeholder,
  options,
}: {
  value: string;
  onSubmit: (v: string) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
  placeholder?: string;
  options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    setText(value);
  }, [value]);

  function start() {
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }

  async function finish() {
    setEditing(false);
    if (text !== value) {
      await onSubmit(text);
    }
  }

  if (editing) {
    return (
      <>
        <input
          ref={inputRef}
          type="text"
          value={text}
          placeholder={placeholder}
          list={options ? listId : undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="border p-1 text-sm"
        />
        {options ? (
          <datalist id={listId}>
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        ) : null}
      </>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>{value || placeholder}</span>
      <button type="button" onClick={start} className="text-gray-500">
        ✎
      </button>
      {onClear && value ? (
        <button type="button" onClick={onClear} className="text-gray-500">
          ×
        </button>
      ) : null}
    </span>
  );
}
