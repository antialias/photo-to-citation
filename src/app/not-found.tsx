import { withBasePath } from "@/basePath";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="mb-4">Sorry, we couldn't find that page.</p>
      <Link href={withBasePath("/")} className="underline">
        Back to home
      </Link>
    </div>
  );
}
