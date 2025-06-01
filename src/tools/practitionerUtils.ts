import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Practitioner, OperationOutcome, HumanName, Identifier, ContactPoint } from '@medplum/fhirtypes';
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
  await ensureAuthenticated();

  const searchCriteria: string[] = [];
  if (params.givenName) {
    searchCriteria.push(`given:contains=${params.givenName}`);
  }
  if (params.familyName) {
    searchCriteria.push(`family:contains=${params.familyName}`);
  }
  if (params.name) {
    searchCriteria.push(`name:contains=${params.name}`);
  }

  if (searchCriteria.length === 0) {
    return [];
  }
  const queryString = searchCriteria.join('&');
  return medplum.searchResources('Practitioner', queryString);
}

// New functions to be added based on IMPLEMENTATION_PLAN.md

export interface CreatePractitionerArgs {
  family?: string;
  given?: string[]; 
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  // phone?: string; // Deprecate in favor of telecom array
  // email?: string; // Deprecate in favor of telecom array
  telecom?: ContactPoint[]; // Added for FHIR alignment and test compatibility
  qualification?: string;
  identifier?: Identifier[];
  active?: boolean; // Allow setting active status on create
  // Backward compatibility fields
  givenName?: string;
  familyName?: string;
}

/**
 * Creates a new Practitioner resource.
 * @param args - The details for the new practitioner.
 * @returns The created Practitioner resource.
 */
export async function createPractitioner(args: CreatePractitionerArgs): Promise<Practitioner> {
  await ensureAuthenticated();

  // Handle backward compatibility
  let family = args.family;
  let given = args.given;
  
  if (args.familyName && !family) {
    family = args.familyName;
  }
  if (args.givenName && (!given || given.length === 0)) {
    given = [args.givenName];
  }

  if (!family) {
    throw new Error('Family name is required to create a practitioner.');
  }
  if (!given || given.length === 0) {
    throw new Error('At least one given name is required to create a practitioner.');
  }

  const practitionerResource: Practitioner = {
    resourceType: 'Practitioner',
    name: [{
      family: family,
      given: given,
    }],
    active: true,
  };

  // Handle identifier (now an array)
  if (args.identifier && args.identifier.length > 0) {
    practitionerResource.identifier = args.identifier;
  }

  // Handle telecom directly if provided
  if (args.telecom && args.telecom.length > 0) {
    practitionerResource.telecom = args.telecom;
  }

  // Handle other fields
  if (args.gender) {
    practitionerResource.gender = args.gender;
  }
  if (args.birthDate) {
    practitionerResource.birthDate = args.birthDate;
  }
  if (args.qualification) {
    practitionerResource.qualification = [{ code: { text: args.qualification } }];
  }

  // Allow setting active status on create
  if (typeof args.active === 'boolean') {
    practitionerResource.active = args.active;
  } else {
    practitionerResource.active = true; // Default to true if not specified
  }

  return medplum.createResource<Practitioner>(practitionerResource);
}

export interface GetPractitionerByIdArgs {
  practitionerId: string;
}

/**
 * Retrieves a Practitioner resource by its ID.
 * @param practitionerId - The ID of the practitioner to retrieve.
 * @returns The Practitioner resource, or undefined if not found.
 */
export async function getPractitionerById(args: GetPractitionerByIdArgs | string): Promise<Practitioner | null> {
  await ensureAuthenticated();
  
  // Handle both string and object parameter formats
  const practitionerId = typeof args === 'string' ? args : args.practitionerId;
  
  if (!practitionerId) {
    throw new Error('Practitioner ID is required to fetch a practitioner.');
  }
  try {
    // No generic type needed, Medplum infers it from 'Practitioner' string
    return await medplum.readResource('Practitioner', practitionerId);
  } catch (error: any) {
    if (error.outcome?.issue?.[0]?.code === 'not-found') {
      return null;
    }
    throw error;
  }
}

export interface UpdatePractitionerArgs extends Omit<Partial<Practitioner>, 'resourceType' | 'id'> {
  // Add simplified fields if LLM struggles with full FHIR structure
}

/**
 * Updates an existing Practitioner resource.
 * @param practitionerId - The ID of the practitioner to update.
 * @param updates - The partial data to update the practitioner with.
 * @returns The updated Practitioner resource.
 */
export async function updatePractitioner(practitionerId: string, updates: UpdatePractitionerArgs): Promise<Practitioner> {
  await ensureAuthenticated();

  if (!practitionerId) {
    throw new Error('Practitioner ID is required to update a practitioner.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating a practitioner.');
  }

  const existingPractitioner = await medplum.readResource('Practitioner', practitionerId);
  if (!existingPractitioner) {
    throw new Error(`Practitioner with ID ${practitionerId} not found.`);
  }
  
  const { resourceType, id, ...safeUpdates } = updates as any; 

  const practitionerToUpdate: Practitioner = {
    ...existingPractitioner,
    ...safeUpdates,
    resourceType: 'Practitioner', 
    id: practitionerId, 
  };
  
  return medplum.updateResource(practitionerToUpdate);
}

export interface PractitionerSearchCriteria {
  identifier?: string; // Search by identifier (e.g., NPI)
  name?: string;       // General name search
  givenName?: string;
  familyName?: string;
  addressCity?: string;
  addressState?: string;
  telecom?: string;
  _lastUpdated?: string;
  // Add other relevant criteria as needed
}

/**
 * Searches for Practitioner resources based on general criteria.
 * @param criteria - The search criteria.
 * @returns An array of Practitioner resources matching the criteria.
 */
export async function searchPractitioners(criteria: PractitionerSearchCriteria): Promise<Practitioner[]> {
  await ensureAuthenticated();
  const searchParams: string[] = [];

  if (criteria.identifier) searchParams.push(`identifier=${criteria.identifier}`);
  if (criteria.name) searchParams.push(`name:contains=${criteria.name}`);
  if (criteria.givenName) searchParams.push(`given:contains=${criteria.givenName}`);
  if (criteria.familyName) searchParams.push(`family:contains=${criteria.familyName}`);
  if (criteria.addressCity) searchParams.push(`address-city:contains=${criteria.addressCity}`);
  if (criteria.addressState) searchParams.push(`address-state:contains=${criteria.addressState}`);
  if (criteria.telecom) searchParams.push(`telecom=${criteria.telecom}`);
  if (criteria._lastUpdated) searchParams.push(`_lastUpdated=${criteria._lastUpdated}`);
  
  if (searchParams.length === 0) {
    return [];
  }

  const queryString = searchParams.join('&');
  return medplum.searchResources('Practitioner', queryString);
} 