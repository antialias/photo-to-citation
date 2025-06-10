import { NextResponse } from 'next/server'
import { getCase } from '@/lib/caseStore'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const c = getCase(params.id)
  if (!c) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(c)
}
