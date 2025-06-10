import { NextResponse } from 'next/server'
import { getCase } from '@/lib/caseStore'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const c = getCase(id)
  if (!c) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(c)
}
