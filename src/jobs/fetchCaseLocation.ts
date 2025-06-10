import { fetchCaseLocation } from '../lib/caseLocation.ts'
import { parentPort, workerData } from 'worker_threads'

(async () => {
  await fetchCaseLocation(workerData)
  if (parentPort) parentPort.postMessage('done')
})().catch((err) => {
  console.error('fetchCaseLocation job failed', err)
  if (parentPort) parentPort.postMessage('error')
})
