import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="bg-gray-900 text-white py-4 px-8 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold hover:text-gray-300">Photo To Citation</Link>
      <div className="flex gap-6 text-sm">
        <Link href="/upload" className="hover:text-gray-300">Upload</Link>
        <Link href="/cases" className="hover:text-gray-300">Cases</Link>
      </div>
    </nav>
  )
}
