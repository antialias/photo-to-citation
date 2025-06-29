import { apiFetch } from "@/apiClient";
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const path = Array.isArray(queryKey)
            ? String(queryKey[0])
            : String(queryKey);
          const res = await apiFetch(path);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        },
      },
    },
  });
}

const queryClient = makeQueryClient();
export default queryClient;
