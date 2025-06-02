import {
  Medication,
  CodeableConcept,
  Identifier,
  OperationOutcome,
  Reference,
  Organization,
  Resource,
} from '@medplum/fhirtypes';
import { medplum, MedplumClient, ensureAuthenticated } from '../config/medplumClient';

// Medication.status is a string literal type in FHIR R4
export type MedicationStatus = 'active' | 'inactive' | 'entered-in-error';

export interface CreateMedicationArgs {
  code: CodeableConcept;
  status?: MedicationStatus;
  manufacturer?: Reference<Organization>; // Corrected to Reference<Organization>
  form?: CodeableConcept;
  identifier?: Identifier[];
}

export interface MedicationSearchArgs {
  code?: string;
  identifier?: string;
  status?: MedicationStatus;
}

/**
 * Creates a new Medication resource.
 * @param args The arguments for creating the medication.
 * @returns The created Medication resource or an OperationOutcome in case of an error.
 */
export async function createMedication(
  args: CreateMedicationArgs,
  client?: MedplumClient, // Restore optional client
): Promise<Medication | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!args.code || !args.code.coding || args.code.coding.length === 0) {
      throw new Error('Medication code with at least one coding is required.');
    }

    const medicationResource: Medication = {
      resourceType: 'Medication',
      code: args.code,
      status: args.status,
      manufacturer: args.manufacturer,
      form: args.form,
      identifier: args.identifier,
    };

    Object.keys(medicationResource).forEach(
      (key) =>
        (medicationResource as any)[key] === undefined && delete (medicationResource as any)[key],
    );

    const createdMedication = (await medplumClient.createResource(
      medicationResource,
    )) as Medication;
    console.log('Medication created successfully:', createdMedication);
    return createdMedication;
  } catch (error: any) {
    console.error('Error creating Medication:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error creating Medication: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      console.error('Server OperationOutcome:', JSON.stringify(error.outcome, null, 2));
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

/**
 * Retrieves a Medication resource by its ID.
 * @param medicationId The ID of the Medication to retrieve.
 * @returns The Medication resource or null if not found, or an OperationOutcome on error.
 */
export async function getMedicationById(
  medicationId: string,
  client?: MedplumClient,
): Promise<Medication | null | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!medicationId) {
      throw new Error('Medication ID is required.');
    }
    const medication = (await medplumClient.readResource(
      'Medication',
      medicationId,
    )) as Medication | null;
    console.log('Medication retrieved:', medication);
    return medication;
  } catch (error: any) {
    if (error.outcome && error.outcome.issue && error.outcome.issue[0]?.code === 'not-found') {
      console.log(`Medication with ID "${medicationId}" not found.`);
      return null;
    }
    console.error(`Error retrieving Medication with ID "${medicationId}":`, error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error retrieving Medication: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      console.error('Server OperationOutcome:', JSON.stringify(error.outcome, null, 2));
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

/**
 * Searches for Medication resources based on specified criteria.
 * @param args The search criteria.
 * @returns An array of Medication resources matching the criteria or an OperationOutcome on error.
 */
export async function searchMedications(
  args: MedicationSearchArgs,
  client?: MedplumClient,
): Promise<Medication[] | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    const searchCriteria: string[] = [];
    if (args.code) {
      searchCriteria.push(`code=${args.code}`);
    }
    if (args.identifier) {
      searchCriteria.push(`identifier=${args.identifier}`);
    }
    if (args.status) {
      searchCriteria.push(`status=${args.status}`);
    }

    if (searchCriteria.length === 0) {
      console.warn(
        'Searching for medications without any criteria. This might return a large dataset or be restricted by the server.',
      );
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics:
              'At least one search criterion (code, identifier, or status) must be provided for searching medications.',
          },
        ],
      };
    }

    const query = searchCriteria.join('&');
    console.log('Searching medications with query:', query);

    const searchResult = await medplumClient.searchResources('Medication', query);
    const medications = searchResult as Medication[];

    console.log(`Found ${medications.length} medications.`);
    return medications;
  } catch (error: any) {
    console.error('Error searching Medications:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error searching Medications: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      console.error('Server OperationOutcome:', JSON.stringify(error.outcome, null, 2));
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

// Example usage (for local testing, can be removed or commented out)
/*
async function main() {
  // Make sure your .env file is configured for medplumClient
  // Example: Create a Medication
  const newMed: CreateMedicationArgs = {
    code: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '313782', // Amoxicillin 250mg
          display: 'Amoxicillin 250mg Oral Tablet',
        },
      ],
      text: 'Amoxicillin 250mg Oral Tablet',
    },
    status: 'active',
    form: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '385055001',
          display: 'Oral tablet',
        },
      ],
      text: 'Oral tablet',
    },
    // manufacturer: { reference: "Organization/your-org-id" } // If you have an Org ID
  };

  const created = await createMedication(newMed);
  if (created.resourceType === 'Medication') {
    console.log('Created medication:', JSON.stringify(created, null, 2));

    // Example: Get Medication by ID
    const medicationId = created.id;
    if ( medicationId ) {
      const fetched = await getMedicationById(medicationId);
      if (fetched && fetched.resourceType === 'Medication') {
        console.log('Fetched medication:', JSON.stringify(fetched, null, 2));
      } else if (!fetched) {
        console.log('Medication not found by ID after creation.');
      } else {
        console.log('Error fetching medication by ID:', JSON.stringify(fetched, null, 2));
      }
    }

    // Example: Search Medications
    // By code
    const searchByCodeResults = await searchMedications({ code: 'http://www.nlm.nih.gov/research/umls/rxnorm|313782' });
    console.log('Search by code results:', JSON.stringify(searchByCodeResults, null, 2));
    
    // By status
    const searchByStatusResults = await searchMedications({ status: 'active' });
    console.log('Search by status results:', JSON.stringify(searchByStatusResults, null, 2));

  } else {
    console.log('Error creating medication:', JSON.stringify(created, null, 2));
  }

  // Test Get Not Found
  const notFound = await getMedicationById('non-existent-id');
  if (!notFound) {
    console.log('Correctly handled getMedicationById for non-existent ID.');
  } else {
    console.log('Unexpected result for non-existent ID:', JSON.stringify(notFound, null, 2));
  }
}

main().catch(console.error);
*/ 