import type { ReactNode } from "react";

export default function ChatWidget({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-blue-600 text-white px-2 py-1 rounded mx-1 text-xs space-y-1 ${className}`}
    >
      {children}
    </div>
  );
}
