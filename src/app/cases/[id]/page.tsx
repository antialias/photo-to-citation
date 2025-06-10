import { getCase } from '@/lib/caseStore'
import ClientCasePage from './ClientCasePage'

export const dynamic = 'force-dynamic'

export default async function CasePage({ params }: { params: { id: string } }) {
  const { id } = params
  const c = getCase(id)
  return <ClientCasePage caseId={id} initialCase={c ?? null} />
}
