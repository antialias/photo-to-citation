import { LuAppWindow, LuFileText, LuGlobe } from "react-icons/lu";
import { SiNextdotjs, SiVercel } from "react-icons/si";
import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">Photo To Citation</h1>
      <Link href="/upload" className="text-blue-600 underline">Upload a Photo</Link>
      <Link href="/cases" className="text-blue-600 underline">View Cases</Link>
    </main>
  )
}
