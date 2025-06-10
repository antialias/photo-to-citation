import { Worker } from 'worker_threads'
import path from 'path'

const jobFiles: Record<string, string> = {
  analyzeCase: path.join(process.cwd(), 'src', 'jobs', 'analyzeCase.ts'),
  fetchCaseLocation: path.join(
    process.cwd(),
    'src',
    'jobs',
    'fetchCaseLocation.ts'
  ),
}

export function runJob(name: string, data: unknown): void {
  const file = jobFiles[name]
  if (!file) throw new Error(`Job "${name}" does not exist`)

  const worker = new Worker(file, {
    workerData: data,
    execArgv: ['-r', 'ts-node/register'],
  })
  worker.on('error', (err) => {
    console.error(`${name} worker failed`, err)
  })
}
