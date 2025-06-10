import { workerData } from 'worker_threads'
import { analyzeViolation } from '../lib/openai'
import { updateCase } from '../lib/caseStore'

async function run() {
  const caseData = workerData
  try {
    const result = await analyzeViolation(`${process.env.NEXT_PUBLIC_BASE_URL || ''}${caseData.photo}`)
    updateCase(caseData.id, { analysis: result })
  } catch (err) {
    console.error('Failed to analyze case', caseData.id, err)
  }
}

run()
