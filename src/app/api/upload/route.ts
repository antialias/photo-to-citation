import { NextRequest, NextResponse } from 'next/server'
import { createCase } from '@/lib/caseStore'
import { analyzeCaseInBackground } from '@/lib/caseAnalysis'
import { fetchCaseLocationInBackground } from '@/lib/caseLocation'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import ExifParser from 'exif-parser'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('photo') as File | null
  const clientId = form.get('caseId') as string | null
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let gps: { lat: number; lon: number } | null = null
  try {
    const parser = ExifParser.create(buffer)
    const result = parser.parse()
    const lat = result.tags.GPSLatitude as number | undefined
    const lon = result.tags.GPSLongitude as number | undefined
    const latRef = result.tags.GPSLatitudeRef as string | undefined
    const lonRef = result.tags.GPSLongitudeRef as string | undefined
    if (typeof lat === 'number' && typeof lon === 'number') {
      const adjLat = latRef === 'S' ? -lat : lat
      const adjLon = lonRef === 'W' ? -lon : lon
      gps = { lat: adjLat, lon: adjLon }
    }
  } catch {
    gps = null
  }
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  fs.mkdirSync(uploadDir, { recursive: true })
  const ext = path.extname(file.name || 'jpg') || '.jpg'
  const filename = `${crypto.randomUUID()}${ext}`
  fs.writeFileSync(path.join(uploadDir, filename), buffer)
  const newCase = createCase(`/uploads/${filename}`, gps, clientId || undefined)
  analyzeCaseInBackground(newCase)
  fetchCaseLocationInBackground(newCase)
  return NextResponse.json({ caseId: newCase.id })
}
