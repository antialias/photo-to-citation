import { Case, updateCase } from './caseStore'
import { reverseGeocode, intersectionLookup } from './geocode'

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
  fetchCaseLocation(caseData).catch((err) => console.error(err))
}
