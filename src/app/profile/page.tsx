"use client";
import { apiFetch, queryFn } from "@/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "../useSession";

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: queryFn<{ name?: string; image?: string }>("/api/profile"),
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
    mutationFn: (body: { name: string; image: string }) =>
      apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  if (!session) {
    return <div className="p-8">You are not logged in.</div>;
  }

  return (
    <form
      className="p-8 flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        mutation.mutate({ name, image });
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
