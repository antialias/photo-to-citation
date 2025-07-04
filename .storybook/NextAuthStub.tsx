export const useSession = () => ({ data: null });
export const signIn = () => {};
export const signOut = () => {};
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
