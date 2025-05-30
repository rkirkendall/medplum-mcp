import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Patient } from '@medplum/fhirtypes';

/**
 * Interface for the data needed to create a new patient.
 * This helps ensure that at least the minimum required fields are considered.
 * Based on common requirements for a Patient resource.
 */
export interface CreatePatientArgs {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'unknown';
  // Add other essential fields as needed, e.g., address, contact, identifiers
}

/**
 * Creates a new Patient resource in Medplum.
 * Ensures Medplum client is authenticated before performing the creation.
 * @param patientDetails - The details for the new patient.
 * @returns A promise that resolves to the created Patient resource, or null if an error occurs.
 */
export async function createPatient(
  patientDetails: CreatePatientArgs
): Promise<Patient | null> {
  try {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      console.error('Authentication failed. Cannot create patient.');
      return null;
    }

    // Construct the Patient FHIR resource from the input arguments
    const patientResource: Patient = {
      resourceType: 'Patient',
      name: [
        {
          given: [patientDetails.firstName],
          family: patientDetails.lastName,
        },
      ],
      birthDate: patientDetails.birthDate,
    };

    if (patientDetails.gender) {
      patientResource.gender = patientDetails.gender;
    }

    // Add any other necessary fields to patientResource from patientDetails
    // For example, address, telecom, identifier, etc.

    console.log(
      `Attempting to create Patient with details: ${JSON.stringify(
        patientResource,
        null,
        2
      )}`
    );

    const createdPatient = await medplum.createResource<Patient>(patientResource);
    console.log(
      `Successfully created Patient with ID: ${createdPatient.id}`,
      createdPatient
    );
    return createdPatient;
  } catch (error) {
    console.error('Error creating patient:', error);
    return null;
  }
}

/**
 * Retrieves a Patient resource by its ID.
 * @param patientId The ID of the patient to retrieve.
 * @returns A promise that resolves to the Patient resource, or null if not found or an error occurs.
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
  try {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      console.error('Authentication failed. Cannot get patient.');
      return null;
    }
    console.log(`Attempting to retrieve Patient with ID: ${patientId}`);
    // @ts-ignore
    const patient = await medplum.readResource<Patient>('Patient', patientId) as Patient;
    console.log(`Successfully retrieved Patient with ID: ${patient.id}`);
    return patient;
  } catch (error) {
    console.error(`Error retrieving patient with ID ${patientId}:`, error);
    return null;
  }
}

/**
 * Updates an existing Patient resource.
 * @param patientId The ID of the patient to update.
 * @param updates A partial Patient resource containing the fields to update.
 *                Important: This should not include 'id' or 'resourceType' in the updates object itself,
 *                as these are fixed or handled by the function.
 * @returns A promise that resolves to the updated Patient resource, or null if an error occurs.
 */
export async function updatePatient(
  patientId: string,
  updates: Omit<Partial<Patient>, 'resourceType' | 'id'>
): Promise<Patient | null> {
  try {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      console.error('Authentication failed. Cannot update patient.');
      return null;
    }

    console.log(`Attempting to update Patient with ID: ${patientId} with updates:`, updates);

    // Medplum's updateResource typically expects the full resource with modifications.
    // However, to ensure we don't overwrite unintended fields or miss metadata,
    // it's safer to read, merge, and then update, especially if 'updates' is truly partial.
    // For simpler cases or if the Medplum SDK handles partial updates well, this might be simplified.
    // Let's assume for now that medplum.updateResource can take a resource with an ID and apply changes.

    const patientToUpdate: Patient = {
        resourceType: 'Patient',
        id: patientId,
        ...updates,
    };

    const updatedPatient = await medplum.updateResource<Patient>(patientToUpdate);
    console.log(`Successfully updated Patient with ID: ${updatedPatient.id}`);
    return updatedPatient;
  } catch (error) {
    console.error(`Error updating patient with ID ${patientId}:`, error);
    return null;
  }
}

/**
 * Interface for the arguments accepted by the searchPatients function.
 * All parameters are optional, but at least one should be provided for a meaningful search.
 */
export interface PatientSearchArgs {
  name?: string;
  family?: string;
  given?: string;
  birthdate?: string; // YYYY-MM-DD
  identifier?: string;
  email?: string;
  phone?: string;
  // Add other relevant FHIR Patient search parameters as needed
}

/**
 * Searches for Patient resources based on specified criteria.
 * @param searchArgs An object containing direct search parameters like name, family, given, etc.
 * @returns A promise that resolves to an array of Patient resources, or an empty array if none found or an error occurs.
 */
export async function searchPatients(
  searchArgs: PatientSearchArgs
): Promise<Patient[]> {
  try {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      console.error('Authentication failed. Cannot search patients.');
      return [];
    }

    // Convert searchArgs to the Record<string, string> format expected by Medplum SDK
    // by filtering out undefined properties.
    const medplumSearchCriteria: Record<string, string> = {};
    for (const key in searchArgs) {
      if (Object.prototype.hasOwnProperty.call(searchArgs, key)) {
        const value = (searchArgs as any)[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          medplumSearchCriteria[key] = String(value);
        }
      }
    }

    if (Object.keys(medplumSearchCriteria).length === 0) {
      console.log('No valid search criteria provided for patient search. Returning empty array.');
      return []; // Avoid searching for all patients if no criteria given
    }

    console.log(`Searching for Patients with criteria: ${JSON.stringify(medplumSearchCriteria)}`);
    // @ts-ignore
    const patients = await medplum.searchResources<Patient>('Patient', medplumSearchCriteria);
    console.log(`Found ${patients.length} patients.`);
    return patients;
  } catch (error) {
    console.error('Error searching for patients:', error);
    return [];
  }
}

// Example Usage has been migrated to tests/integration/patient.integration.test.ts 