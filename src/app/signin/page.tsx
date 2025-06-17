"use client";
import { useState } from "react";
import { signIn } from "../useSession";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  return (
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
  );
}
