import Bree from 'bree'
import path from 'path'

export const bree = new Bree({
  root: path.join(process.cwd(), 'src/jobs'),
  defaultExtension: 'ts',
  workerMessageHandler: null,
  // Use ts-node to run TypeScript jobs
  nodeArgs: ['--loader', 'ts-node/esm'],
})
