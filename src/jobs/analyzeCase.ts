import { analyzeCase } from '../lib/caseAnalysis'
import { parentPort, workerData } from 'worker_threads'

(async () => {
  const { jobData } = workerData as { jobData: unknown }
  await analyzeCase(jobData as any)
  if (parentPort) parentPort.postMessage('done')
})().catch((err) => {
  console.error('analyzeCase job failed', err)
  if (parentPort) parentPort.postMessage('error')
})
