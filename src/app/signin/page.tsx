"use client";
import { signIn } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import { log } from "@/lib/logger";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const MARKETING_URL = "https://antialias.github.io/photo-to-citation/website/";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const params = useSearchParams();
  const error = params.get("error");
  const errorMessages: Record<string, string> = {
    Configuration:
      "Configuration error. NEXTAUTH_URL must match the site URL including any base path.",
    Verification: "Sign-in failed. The link may have expired.",
  };
  const message = error
    ? (errorMessages[error] ?? errorMessages.Verification)
    : null;
  return (
    <>
      {message ? (
        <div className="bg-red-100 border border-red-300 text-red-700 p-2 mb-2">
          {message}
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          log("Submitting sign in", email);
          signIn("email", { email, callbackUrl: withBasePath("/") });
        }}
        className="p-4 flex flex-col gap-2"
      >
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Sign In
        </button>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: withBasePath("/") })}
          className="bg-red-500 text-white px-4 py-2 mt-2"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl: withBasePath("/") })}
          className="bg-blue-600 text-white px-4 py-2 mt-2"
        >
          Sign in with Facebook
        </button>
      </form>
      <a href={MARKETING_URL} className="underline mt-2">
        Learn more about Photo to Citation
      </a>
    </>
  );
}
