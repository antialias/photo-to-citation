import fs from 'fs'
import os from 'os'
import path from 'path'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

let dataDir: string
let caseStore: typeof import('../src/lib/caseStore')

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cases-'))
  process.env.CASE_STORE_FILE = path.join(dataDir, 'cases.json')
  vi.resetModules()
  caseStore = await import('../src/lib/caseStore')
})

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true })
  vi.resetModules()
  delete process.env.CASE_STORE_FILE
})

describe('caseStore', () => {
  it('creates and retrieves a case', () => {
    const { createCase, getCase, getCases, updateCase } = caseStore
    const c = createCase('/foo.jpg', { lat: 10, lon: 20 })
    expect(c.photo).toBe('/foo.jpg')
    expect(c.gps).toEqual({ lat: 10, lon: 20 })
    expect(c.streetAddress).toBeNull()
    expect(c.intersection).toBeNull()
    expect(getCase(c.id)).toEqual(c)
    expect(getCases()).toHaveLength(1)
    const updated = updateCase(c.id, { analysis: { violationType: 'foo', details: 'bar', vehicle: {} } })
    expect(updated?.analysis?.violationType).toBe('foo')
  })

  it('allows providing a custom id', () => {
    const { createCase, getCase } = caseStore
    const c = createCase('/bar.jpg', null, 'custom-id')
    expect(c.id).toBe('custom-id')
    expect(getCase('custom-id')).toEqual(c)
  })
})
