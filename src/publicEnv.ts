export interface PublicEnv {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
  NEXT_PUBLIC_BROWSER_DEBUG?: boolean;
  NEXT_PUBLIC_BASE_PATH?: string;
}

export function getPublicEnv(): PublicEnv {
  if (typeof window === "undefined") return {};
  return (window as unknown as { PUBLIC_ENV?: PublicEnv }).PUBLIC_ENV ?? {};
}
