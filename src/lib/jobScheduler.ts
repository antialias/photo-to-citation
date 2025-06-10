import { Worker } from 'worker_threads'
import path from 'path'

export function runJob(name: string, jobData: unknown): void {
  const jobPath = path.join(process.cwd(), 'src', 'jobs', `${name}.ts`)
  const wrapper = path.join(process.cwd(), 'src', 'jobs', 'workerWrapper.js')
  const worker = new Worker(wrapper, {
    workerData: { path: jobPath, jobData },
  })
  worker.on('error', (err) => {
    console.error(`${name} worker failed`, err)
  })
}
