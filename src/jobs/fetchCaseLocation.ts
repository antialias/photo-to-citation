import { fetchCaseLocation } from '../lib/caseLocation'
import { parentPort, workerData } from 'worker_threads'

(async () => {
  const { jobData } = workerData as { jobData: unknown }
  await fetchCaseLocation(jobData as any)
  if (parentPort) parentPort.postMessage('done')
})().catch((err) => {
  console.error('fetchCaseLocation job failed', err)
  if (parentPort) parentPort.postMessage('error')
})
