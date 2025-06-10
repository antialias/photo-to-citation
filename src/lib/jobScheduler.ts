import Bree from 'bree'
import path from 'path'

export const bree = new Bree({
  root: path.join(process.cwd(), 'src', 'jobs'),
  defaultExtension: 'ts',
  workerOptions: {
    execArgv: ['-r', 'ts-node/register']
  }
})

export function runJob(name: string, data: unknown) {
  bree.add({
    name,
    path: path.join(process.cwd(), 'src', 'jobs', `${name}.ts`),
    worker: {
      workerData: data
    }
  })
  void bree.run(name)
}
