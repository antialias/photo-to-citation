import fs from 'fs'
import path from 'path'

export interface Case {
  id: string
  photo: string
  createdAt: string
}

const dataFile = path.join(process.cwd(), 'data', 'cases.json')

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
  }
  cases.push(newCase)
  saveCases(cases)
  return newCase
}
