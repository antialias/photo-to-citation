import { analyzeViolation } from './openai'
import { Case, updateCase } from './caseStore'

export async function analyzeCase(caseData: Case): Promise<void> {
  try {
    const result = await analyzeViolation(`${process.env.NEXT_PUBLIC_BASE_URL || ''}${caseData.photo}`)
    updateCase(caseData.id, { analysis: result })
  } catch (err) {
    console.error('Failed to analyze case', caseData.id, err)
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  analyzeCase(caseData).catch((err) => console.error(err))
}
