import { analyzeCase } from '../lib/caseAnalysis'
import { parentPort, workerData } from 'worker_threads'

(async () => {
  await analyzeCase(workerData)
  if (parentPort) parentPort.postMessage('done')
})().catch((err) => {
  console.error('analyzeCase job failed', err)
  if (parentPort) parentPort.postMessage('error')
})
