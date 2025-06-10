import fs from 'fs'
import path from 'path'

import { ViolationReport } from './openai'

export interface Case {
  id: string
  photo: string
  createdAt: string
  analysis?: ViolationReport | null
}

const dataFile = process.env.CASE_STORE_FILE
  ? path.resolve(process.env.CASE_STORE_FILE)
  : path.join(process.cwd(), 'data', 'cases.json')

function loadCases(): Case[] {
  if (!fs.existsSync(dataFile)) {
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Case[]
  } catch {
    return []
  }
}

function saveCases(cases: Case[]) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(cases, null, 2))
}

export function getCases(): Case[] {
  return loadCases()
}

export function getCase(id: string): Case | undefined {
  return loadCases().find((c) => c.id === id)
}

export function createCase(photo: string): Case {
  const cases = loadCases()
  const newCase: Case = {
    id: Date.now().toString(),
    photo,
    createdAt: new Date().toISOString(),
    analysis: null,
  }
  cases.push(newCase)
  saveCases(cases)
  return newCase
}

export function updateCase(id: string, updates: Partial<Case>): Case | undefined {
  const cases = loadCases()
  const idx = cases.findIndex((c) => c.id === id)
  if (idx === -1) return undefined
  cases[idx] = { ...cases[idx], ...updates }
  saveCases(cases)
  return cases[idx]
}
