import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Patient, HumanName, Identifier, ContactPoint, Address, Coding } from '@medplum/fhirtypes';

/**
 * Interface for the data needed to create a new patient.
 * This helps ensure that at least the minimum required fields are considered.
 * Based on common requirements for a Patient resource.
 */
export interface CreatePatientArgs {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'unknown'; // Made optional for test compatibility
  mrn?: string; // Medical Record Number
  telecom?: string; // Phone number
  email?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
}

/**
 * Interface for the arguments accepted by the searchPatients function.
 * All parameters are optional, but at least one should be provided for a meaningful search.
 */
export interface PatientSearchArgs {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  mrn?: string;
  email?: string;
  telecom?: string;
  familyName?: string; // Added for more specific name search
  givenName?: string;  // Added for more specific name search
  identifier?: string; // General identifier search (e.g. system|value or just value)
  _lastUpdated?: string;
  // Add fields that tests expect
  family?: string;
  given?: string;
  birthdate?: string; // Alternative spelling used in tests
}

/**
 * Creates a new Patient resource in Medplum.
 * Ensures Medplum client is authenticated before performing the creation.
 * @param args - The arguments for creating the patient.
 * @returns A promise that resolves to the created Patient resource, or null if an error occurs.
 */
export async function createPatient(args: CreatePatientArgs): Promise<Patient> {
  await ensureAuthenticated();

  if (!args.firstName || !args.lastName || !args.birthDate) {
    throw new Error('First name, last name, and birth date are required to create a patient.');
  }

  const patientResource: Patient = {
    resourceType: 'Patient',
    name: [{ given: [args.firstName], family: args.lastName } as HumanName],
    birthDate: args.birthDate,
  };

  // Only set gender if provided
  if (args.gender) {
    patientResource.gender = args.gender;
  }

  if (args.mrn) {
    patientResource.identifier = [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number',
            } as Coding,
          ],
          text: 'Medical Record Number',
        },
        value: args.mrn,
      } as Identifier,
    ];
  }

  const telecoms: ContactPoint[] = [];
  if (args.telecom) {
    telecoms.push({ system: 'phone', value: args.telecom, use: 'home' } as ContactPoint);
  }
  if (args.email) {
    telecoms.push({ system: 'email', value: args.email, use: 'home' } as ContactPoint);
  }
  if (telecoms.length > 0) {
    patientResource.telecom = telecoms;
  }

  if (args.address) {
    patientResource.address = [
      {
        line: [args.address.line1],
        city: args.address.city,
        state: args.address.state,
        postalCode: args.address.postalCode,
        country: args.address.country || 'US', // Default to US if not specified
      } as Address,
    ];
  }

  return medplum.createResource<Patient>(patientResource);
}

/**
 * Retrieves a Patient resource by its ID.
 * @param args - Arguments containing the patientId.
 * @returns A promise that resolves to the Patient resource, or null if not found or an error occurs.
 */
export async function getPatientById(args: { patientId: string } | string): Promise<Patient | null> {
  await ensureAuthenticated();
  
  // Handle both string and object parameter formats
  const patientId = typeof args === 'string' ? args : args.patientId;
  
  if (!patientId) {
    throw new Error('Patient ID is required to fetch a patient.');
  }
  try {
    // No generic type needed, Medplum infers it from 'Patient' string
    return await medplum.readResource('Patient', patientId);
  } catch (error: any) {
    if (error.outcome?.issue?.[0]?.code === 'not-found') {
        return null;
    }
    throw error;
  }
}

/**
 * Updates an existing Patient resource.
 * @param patientId - The ID of the patient to update.
 * @param updates - An object containing the fields to update.
 * @returns A promise that resolves to the updated Patient resource, or null if an error occurs.
 */
export async function updatePatient(patientId: string, updates: Omit<Partial<Patient>, 'resourceType' | 'id'>): Promise<Patient> {
  await ensureAuthenticated();

  if (!patientId) {
    throw new Error('Patient ID is required to update a patient.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating a patient.');
  }

  const existingPatient = await medplum.readResource('Patient', patientId);
  if (!existingPatient) {
    throw new Error(`Patient with ID ${patientId} not found.`);
  }
  
  const { resourceType, id, ...safeUpdates } = updates as any;

  const patientToUpdate: Patient = {
    ...(existingPatient as Patient),
    ...(safeUpdates as Partial<Patient>),
    resourceType: 'Patient',
    id: patientId,
  };

  return medplum.updateResource(patientToUpdate);
}

/**
 * Searches for Patient resources based on specified criteria.
 * @param args - The search criteria.
 * @returns A promise that resolves to an array of Patient resources, or an empty array if none found or an error occurs.
 */
export async function searchPatients(args: PatientSearchArgs): Promise<Patient[]> {
  await ensureAuthenticated();
  const searchCriteria: string[] = [];

  if (args.firstName) searchCriteria.push(`given:contains=${args.firstName}`);
  if (args.lastName) searchCriteria.push(`family:contains=${args.lastName}`);
  if (args.givenName) searchCriteria.push(`given:contains=${args.givenName}`);
  if (args.familyName) searchCriteria.push(`family:contains=${args.familyName}`);
  if (args.birthDate) searchCriteria.push(`birthdate=${args.birthDate}`);
  if (args.mrn) searchCriteria.push(`identifier=${args.mrn}`); // Assumes MRN is a primary identifier
  if (args.email) searchCriteria.push(`email=${args.email}`);
  if (args.telecom) searchCriteria.push(`telecom=${args.telecom}`);
  if (args.identifier) searchCriteria.push(`identifier=${args.identifier}`);
  if (args._lastUpdated) searchCriteria.push(`_lastUpdated=${args._lastUpdated}`);

  // Handle additional test fields
  if (args.family) searchCriteria.push(`family:contains=${args.family}`);
  if (args.given) searchCriteria.push(`given:contains=${args.given}`);
  if (args.birthdate) searchCriteria.push(`birthdate=${args.birthdate}`);

  if (searchCriteria.length === 0) {
    // Consider if this should throw an error, return all, or return empty.
    // Returning empty for now if no specific criteria are provided.
    return [];
  }

  const queryString = searchCriteria.join('&');
  return medplum.searchResources('Patient', queryString);
}

// Example Usage has been migrated to tests/integration/patient.integration.test.ts 