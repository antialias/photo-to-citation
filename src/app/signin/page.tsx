"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "../useSession";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    const err = params.get("error");
    if (err === "Verification") {
      setMessage(
        "The sign in link is no longer valid. It may have been used already or it may have expired.",
      );
    } else if (err) {
      setMessage(err);
    }
  }, [params]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await signIn("email", {
          email,
          callbackUrl: "/",
          redirect: false,
        });
        if (res?.error) setMessage(res.error);
        else setMessage("Check your email");
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
      {message && <p className="text-red-600">{message}</p>}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Sign In
      </button>
    </form>
  );
}
