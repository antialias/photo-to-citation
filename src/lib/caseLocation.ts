import { Case, updateCase } from './caseStore'
import { reverseGeocode, intersectionLookup } from './geocode'
import { runJob } from './jobScheduler'

export async function fetchCaseLocation(caseData: Case): Promise<void> {
  if (!caseData.gps) return
  try {
    const [address, intersection] = await Promise.all([
      reverseGeocode(caseData.gps),
      intersectionLookup(caseData.gps),
    ])
    updateCase(caseData.id, { streetAddress: address, intersection })
  } catch (err) {
    console.error('Failed to fetch location data', err)
  }
}

export function fetchCaseLocationInBackground(caseData: Case): void {
  runJob('fetchCaseLocation', caseData)
}
