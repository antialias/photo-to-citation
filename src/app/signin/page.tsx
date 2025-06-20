"use client";
import { signIn } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInForm() {
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
          console.log("Submitting sign in", email);
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
      </form>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
