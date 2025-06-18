"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "../useSession";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const params = useSearchParams();
  const error = params.get("error");
  return (
    <>
      {error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 p-2 mb-2">
          Sign-in failed. The link may have expired.
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signIn("email", { email, callbackUrl: "/" });
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
