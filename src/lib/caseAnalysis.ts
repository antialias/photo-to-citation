import { analyzeViolation } from './openai'
import { Case, updateCase } from './caseStore'
import { runJob } from './jobScheduler'
import fs from 'fs'
import path from 'path'

export async function analyzeCase(caseData: Case): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public', caseData.photo.replace(/^\/+/, ''))
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    const result = await analyzeViolation(dataUrl)
    updateCase(caseData.id, { analysis: result })
  } catch (err) {
    console.error('Failed to analyze case', caseData.id, err)
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob('analyzeCase', caseData)
}
