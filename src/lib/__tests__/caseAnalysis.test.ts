import { describe, it, expect, vi } from 'vitest'
import { analyzeCaseInBackground } from '../caseAnalysis'
import { bree } from '../bree'

const dummyCase = {
  id: '123',
  photo: '/foo.jpg',
  createdAt: new Date().toISOString(),
  analysis: null,
}

describe('analyzeCaseInBackground', () => {
  it('queues a Bree job', () => {
    const addSpy = vi.spyOn(bree, 'add').mockImplementation(() => {})
    const startSpy = vi
      .spyOn(bree, 'start')
      .mockResolvedValue(undefined as unknown as void)
    analyzeCaseInBackground(dummyCase)
    expect(addSpy).toHaveBeenCalled()
    expect(startSpy).toHaveBeenCalled()
  })
})
