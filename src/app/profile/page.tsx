"use client";
import { redirect } from "next/navigation";
export default function ProfilePage() {
  redirect("/settings");
  return null;
}
