import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Practitioner, OperationOutcome } from '@medplum/fhirtypes';
import { normalizeErrorString } from '@medplum/core';

// Interface for searchPractitionersByName (existing function)
interface PractitionerNameSearchParams {
  givenName?: string;
  familyName?: string;
  name?: string; // For a general name search
}

/**
 * Searches for Practitioner resources based on specific name criteria.
 * @param params - The search parameters for the practitioner's name.
 * @returns A promise that resolves to an array of Practitioner resources.
 */
export async function searchPractitionersByName(
  params: PractitionerNameSearchParams
): Promise<Practitioner[]> {
  try {
    // await ensureAuthenticated(); // Assuming ensureAuthenticated is called by a higher-level handler or test setup
    // if (!medplum.getActiveLogin()) {
    //   console.error('Authentication failed. Cannot search practitioners.');
    //   return [];
    // }

    const searchCriteria: Record<string, string> = {};
    if (params.givenName) {
      searchCriteria.given = params.givenName;
    }
    if (params.familyName) {
      searchCriteria.family = params.familyName;
    }
    if (params.name) {
      searchCriteria.name = params.name;
    }

    if (Object.keys(searchCriteria).length === 0) {
      console.warn('No search criteria provided for practitioner name search.');
      return [];
    }

    const practitioners = await medplum.searchResources('Practitioner', searchCriteria);
    console.log(`Found ${practitioners.length} practitioners by name.`);
    return practitioners;
  } catch (error) {
    console.error('Error searching for practitioners by name:', normalizeErrorString(error));
    // Return empty array or throw, depending on desired error handling for the application
    throw new Error(`Failed to search practitioners by name: ${normalizeErrorString(error)}`);
  }
}

// New functions to be added based on IMPLEMENTATION_PLAN.md

export interface CreatePractitionerArgs {
  givenName: string;
  familyName: string;
  identifier?: Practitioner['identifier'];
  telecom?: Practitioner['telecom'];
  address?: Practitioner['address'];
  // Add other relevant fields like gender, birthDate, qualification, etc.
}

/**
 * Creates a new Practitioner resource.
 * @param args - The details for the new practitioner.
 * @returns The created Practitioner resource.
 */
export async function createPractitioner(args: CreatePractitionerArgs): Promise<Practitioner> {
  try {
    const practitionerResource: Practitioner = {
      resourceType: 'Practitioner',
      name: [
        {
          given: [args.givenName],
          family: args.familyName,
        },
      ],
      identifier: args.identifier,
      telecom: args.telecom,
      address: args.address,
    };
    const createdPractitioner = await medplum.createResource(practitionerResource);
    console.log('Practitioner created successfully:', createdPractitioner.id);
    return createdPractitioner;
  } catch (error) {
    console.error('Error creating practitioner:', normalizeErrorString(error));
    throw new Error(`Failed to create practitioner: ${normalizeErrorString(error)}`);
  }
}

/**
 * Retrieves a Practitioner resource by its ID.
 * @param practitionerId - The ID of the practitioner to retrieve.
 * @returns The Practitioner resource, or undefined if not found.
 */
export async function getPractitionerById(practitionerId: string): Promise<Practitioner | undefined> {
  try {
    const practitioner = await medplum.readResource('Practitioner', practitionerId);
    console.log('Practitioner retrieved successfully:', practitioner.id);
    return practitioner;
  } catch (error) {
    const errorString = normalizeErrorString(error);
    console.error(`Error retrieving practitioner ${practitionerId}:`, errorString);
    if (errorString.includes('Not found') || (error as OperationOutcome)?.issue?.[0]?.code === 'not-found') {
        return undefined;
    }
    throw new Error(`Failed to retrieve practitioner ${practitionerId}: ${errorString}`);
  }
}

export interface UpdatePractitionerArgs extends Omit<Partial<CreatePractitionerArgs>, 'givenName' | 'familyName'> {
  // Name updates would typically be handled by providing the full name structure if supported by the API for update
  // For simplicity, we allow updates to fields other than name components here.
  // If name update is needed, it might require specific handling for the name array.
  name?: Practitioner['name']; // Allow full name array update
  active?: boolean;
  // Add other updatable fields as needed
}

/**
 * Updates an existing Practitioner resource.
 * @param practitionerId - The ID of the practitioner to update.
 * @param updates - The partial data to update the practitioner with.
 * @returns The updated Practitioner resource.
 */
export async function updatePractitioner(
  practitionerId: string,
  updates: UpdatePractitionerArgs | Omit<Partial<Practitioner>, 'resourceType' | 'id'>
): Promise<Practitioner> {
  try {
    const existingPractitioner = await getPractitionerById(practitionerId);
    if (!existingPractitioner) {
      throw new Error(`Practitioner with ID ${practitionerId} not found.`);
    }

    // Merge updates with existing resource
    // Note: For complex fields like 'name', ensure the update structure is correct.
    // If `updates.name` is provided, it will overwrite the existing name array.
    // Otherwise, other fields are merged.
    const practitionerToUpdate: Practitioner = {
      ...existingPractitioner,
      ...(updates as any), // Using 'as any' for broader compatibility with Partial<Practitioner>
      id: practitionerId, // Ensure ID is maintained
      resourceType: 'Practitioner', // Ensure resourceType is maintained
    };

    const updatedPractitioner = await medplum.updateResource(practitionerToUpdate);
    console.log('Practitioner updated successfully:', updatedPractitioner.id);
    return updatedPractitioner;
  } catch (error) {
    console.error(`Error updating practitioner ${practitionerId}:`, normalizeErrorString(error));
    throw new Error(`Failed to update practitioner ${practitionerId}: ${normalizeErrorString(error)}`);
  }
}

export interface PractitionerSearchCriteria {
  name?: string; // General name search
  given?: string;
  family?: string;
  specialty?: string;
  identifier?: string;
  // Add other FHIR Practitioner search parameters: https://www.hl7.org/fhir/practitioner.html#search
}

/**
 * Searches for Practitioner resources based on general criteria.
 * @param criteria - The search criteria.
 * @returns An array of Practitioner resources matching the criteria.
 */
export async function searchPractitioners(criteria: PractitionerSearchCriteria): Promise<Practitioner[]> {
  try {
    const searchParams: Record<string, string> = {};
    if (criteria.name) searchParams.name = criteria.name;
    if (criteria.given) searchParams.given = criteria.given;
    if (criteria.family) searchParams.family = criteria.family;
    if (criteria.specialty) searchParams.specialty = criteria.specialty; // Make sure 'specialty' is a valid search param
    if (criteria.identifier) searchParams.identifier = criteria.identifier;

    if (Object.keys(searchParams).length === 0) {
      console.warn('No criteria provided for practitioner search. Returning all practitioners (potentially many).');
      // Potentially dangerous to return all; consider throwing error or returning empty array by default.
      // For now, let it proceed if medplum.searchResources handles it (e.g. returns first page)
    }

    const practitioners = await medplum.searchResources('Practitioner', searchParams);
    console.log(`Found ${practitioners.length} practitioners based on general criteria.`);
    return practitioners;
  } catch (error) {
    console.error('Error searching practitioners:', normalizeErrorString(error));
    throw new Error(`Failed to search practitioners: ${normalizeErrorString(error)}`);
  }
} 