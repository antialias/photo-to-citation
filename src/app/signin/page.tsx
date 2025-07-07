"use client";
import { signIn } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import { log } from "@/lib/logger";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

const MARKETING_URL = "https://antialias.github.io/photo-to-citation/website/";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const { data: providers = [] } = useQuery<
    Array<{ id: string; enabled: boolean }>
  >({
    queryKey: ["/api/oauth-providers"],
  });
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
        <div
          className={css({
            bg: "red.100",
            borderWidth: "1px",
            borderColor: "red.300",
            color: "red.700",
            p: "2",
            mb: "2",
          })}
        >
          {message}
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          log("Submitting sign in", email);
          signIn("email", { email, callbackUrl: withBasePath("/") });
        }}
        className={css({
          p: "4",
          display: "flex",
          flexDirection: "column",
          gap: "2",
        })}
      >
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={css({ borderWidth: "1px", p: "2" })}
        />
        <button
          type="submit"
          className={css({ bg: "blue.500", color: "white", px: "4", py: "2" })}
        >
          Sign In
        </button>
        {providers.some((p) => p.id === "google" && p.enabled) && (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: withBasePath("/") })}
            className={css({
              bg: "red.500",
              color: "white",
              px: "4",
              py: "2",
              mt: "2",
            })}
          >
            Sign in with Google
          </button>
        )}
        {providers.some((p) => p.id === "facebook" && p.enabled) && (
          <button
            type="button"
            onClick={() =>
              signIn("facebook", { callbackUrl: withBasePath("/") })
            }
            className={css({
              bg: "blue.600",
              color: "white",
              px: "4",
              py: "2",
              mt: "2",
            })}
          >
            Sign in with Facebook
          </button>
        )}
      </form>
      <a
        href={MARKETING_URL}
        className={css({ textDecorationLine: "underline", mt: "2" })}
      >
        Learn more about Photo to Citation
      </a>
    </>
  );
}
