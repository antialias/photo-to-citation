export function createAuthHelpers(
  api: (path: string, opts?: RequestInit) => Promise<Response>,
  server: { url: string },
) {
  async function signIn(email: string) {
    const csrf = await api("/api/auth/csrf").then((r) => r.json());
    await api("/api/auth/signin/email", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: csrf.csrfToken,
        email,
        callbackUrl: server.url,
      }),
    });
    const ver = await api("/api/test/verification-url").then((r) => r.json());
    return await api(
      `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
    );
  }

  async function signOut() {
    const csrf = await api("/api/auth/csrf").then((r) => r.json());
    await api("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: csrf.csrfToken,
        callbackUrl: server.url,
      }),
    });
  }

  async function setUserRoleAndLogIn({
    email,
    role,
    promoted_by,
  }: {
    email: string;
    role: string;
    promoted_by: string;
  }) {
    await signOut();
    await signIn(promoted_by);
    const users = (await api("/api/users").then((r) => r.json())) as Array<{
      id: string;
      email: string;
    }>;
    const found = users.find((u) => u.email === email);
    if (!found) throw new Error(`User not found: ${email}`);
    await api(`/api/users/${found.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await signOut();
    await signIn(email);
  }

  return { signIn, signOut, setUserRoleAndLogIn };
}
