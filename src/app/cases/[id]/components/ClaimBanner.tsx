"use client";
import { signIn } from "@/app/useSession";
import { withBasePath } from "@/basePath";

export default function ClaimBanner({
  show,
  onDismiss,
  className,
}: {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}) {
  if (!show) return null;
  return (
    <div
      className={`bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 flex items-center justify-between ${className ?? ""}`}
    >
      <span>
        Sign in to claim this case or it will be lost when the session ends.
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            signIn(undefined, { callbackUrl: withBasePath("/claim") })
          }
          className="underline"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
