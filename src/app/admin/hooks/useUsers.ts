import { apiFetch } from "@/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRecord } from "../AdminPageClient";

const USERS_QUERY_KEY = ["/api/users"] as const;

export function useUsers(initialUsers: UserRecord[]) {
  const queryClient = useQueryClient();
  const usersQuery = useQuery<UserRecord[]>({
    queryKey: USERS_QUERY_KEY,
    initialData: initialUsers,
  });

  const invite = useMutation({
    async mutationFn(email: string) {
      await apiFetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const disable = useMutation({
    async mutationFn(id: string) {
      await apiFetch(`/api/users/${id}/disable`, { method: "PUT" });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const changeRole = useMutation({
    async mutationFn({ id, role }: { id: string; role: string }) {
      await apiFetch(`/api/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const remove = useMutation({
    async mutationFn(id: string) {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  return { usersQuery, invite, disable, changeRole, remove };
}
