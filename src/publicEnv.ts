export interface PublicEnv {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
  NEXT_PUBLIC_BROWSER_DEBUG?: boolean;
  NEXT_PUBLIC_BASE_PATH?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
  NEXT_PUBLIC_APP_COMMIT?: string;
  NEXT_PUBLIC_DEPLOY_TIME?: string;
}

export function getPublicEnv(): PublicEnv {
  if (typeof window === "undefined") {
    return {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      NEXT_PUBLIC_BROWSER_DEBUG:
        process.env.NEXT_PUBLIC_BROWSER_DEBUG === "true",
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_APP_COMMIT: process.env.NEXT_PUBLIC_APP_COMMIT,
      NEXT_PUBLIC_DEPLOY_TIME: process.env.NEXT_PUBLIC_DEPLOY_TIME,
    };
  }
  return (window as unknown as { PUBLIC_ENV?: PublicEnv }).PUBLIC_ENV ?? {};
}
