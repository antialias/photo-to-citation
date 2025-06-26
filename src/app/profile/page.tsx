"use client";
import { apiFetch } from "@/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "../useSession";

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data } = useQuery<{ name?: string; image?: string }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiFetch("/api/profile");
      return (await res.json()) as { name?: string; image?: string };
    },
    enabled: !!session,
  });
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setImage(data.image ?? "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  if (!session) {
    return <div className="p-8">You are not logged in.</div>;
  }

  return (
    <form
      className="p-8 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h1 className="text-xl font-bold mb-4">User Profile</h1>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2"
      />
      <label htmlFor="image">Image URL</label>
      <input
        id="image"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="border p-2"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Save
      </button>
    </form>
  );
}
