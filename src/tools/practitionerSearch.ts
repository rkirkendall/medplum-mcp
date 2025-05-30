import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Practitioner } from '@medplum/fhirtypes';

interface PractitionerSearchParams {
  givenName?: string;
  familyName?: string;
  name?: string; // For a general name search
}

/**
 * Searches for Practitioner resources based on name criteria.
 * Ensures Medplum client is authenticated before performing the search.
 * @param params - The search parameters for the practitioner's name.
 * @returns A promise that resolves to an array of Practitioner resources, or an empty array if none found or an error occurs.
 */
export async function searchPractitionersByName(
  params: PractitionerSearchParams
): Promise<Practitioner[]> {
  try {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      console.error('Authentication failed. Cannot search practitioners.');
      return [];
    }

    const searchCriteria: Record<string, string> = {};
    if (params.givenName) {
      searchCriteria.given = params.givenName;
    }
    if (params.familyName) {
      searchCriteria.family = params.familyName;
    }
    if (params.name) {
      // If a general name is provided, use it for the 'name' search parameter.
      // This often searches across given, family, prefix, suffix, etc.
      searchCriteria.name = params.name;
    }

    if (Object.keys(searchCriteria).length === 0) {
      console.warn('No search criteria provided for practitioner search.');
      return [];
    }

    console.log(`Searching for Practitioners with criteria: ${JSON.stringify(searchCriteria)}`);

    // Note: The Medplum SDK searchResources method might have slightly different parameter naming
    // e.g., it might expect `given` instead of `givenName` directly.
    // We are using standard FHIR search parameters here (e.g., 'name', 'given', 'family').
    const practitioners = await medplum.searchResources('Practitioner', searchCriteria);
    console.log(`Found ${practitioners.length} practitioners.`);
    return practitioners;
  } catch (error) {
    console.error('Error searching for practitioners:', error);
    return [];
  }
}

// Example Usage (for testing directly, can be removed later):
// The testSearch function and its call have been moved to the integration test suite. 