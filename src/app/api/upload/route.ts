import { NextRequest, NextResponse } from 'next/server'
import { createCase } from '@/lib/caseStore'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('photo') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  fs.mkdirSync(uploadDir, { recursive: true })
  const ext = path.extname(file.name || 'jpg') || '.jpg'
  const filename = `${crypto.randomUUID()}${ext}`
  fs.writeFileSync(path.join(uploadDir, filename), buffer)
  const newCase = createCase(`/uploads/${filename}`)
  return NextResponse.json({ caseId: newCase.id })
}
