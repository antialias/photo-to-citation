import Image from 'next/image'
import { getCase } from '@/lib/caseStore'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CasePage({ params }: any) {
  const c = getCase(params.id)
  if (!c) return notFound()
  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Case {c.id}</h1>
      <Image src={c.photo} alt="uploaded" width={600} height={400} />
      <p className="text-sm text-gray-500">Created {new Date(c.createdAt).toLocaleString()}</p>
    </div>
  )
}
