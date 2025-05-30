import { Encounter, Reference, Identifier, CodeableConcept } from '@medplum/fhirtypes';
import { medplum, ensureAuthenticated } from '../config/medplumClient';

/**
 * Arguments for creating an Encounter.
 * At a minimum, status, class, subject (Patient reference) are required.
 * Participants (Practitioner references) and serviceProvider (Organization reference) are highly recommended.
 */
export interface CreateEncounterArgs {
  status: Encounter['status'];
  classCode: string; // Using string for class code as FHIR types use Coding, which is more complex for LLM. Will map to Coding internally.
  patientId: string; // Reference to the Patient
  practitionerIds?: string[]; // References to Practitioners involved
  organizationId?: string; // Reference to the Organization (service provider)
  // Basic details for the encounter
  typeCode?: string; // E.g., 'IMP' (inpatient encounter), 'AMB' (ambulatory) - maps to Encounter.type[].coding[].code
  typeSystem?: string; // E.g., 'http://terminology.hl7.org/CodeSystem/v3-ActCode'
  typeDisplay?: string; // E.g., "inpatient encounter"
  periodStart?: string; // ISO8601 DateTime string
  periodEnd?: string; // ISO8601 DateTime string
  reasonCode?: string; // Code for the reason of the encounter
  reasonSystem?: string; // System for the reason code
  reasonDisplay?: string; // Display text for the reason
  identifierValue?: string; // An identifier for the encounter
  identifierSystem?: string; // System for the identifier
}

/**
 * Creates a new Encounter resource.
 *
 * @param args - The arguments for creating the encounter.
 * @returns The created Encounter resource.
 * @throws Error if creation fails.
 */
export async function createEncounter(args: CreateEncounterArgs): Promise<Encounter> {
  console.log('Attempting to create Encounter with args:', JSON.stringify(args, null, 2));

  if (!args.patientId) {
    throw new Error('Patient ID (subject) is required to create an encounter.');
  }

  await ensureAuthenticated();

  const encounterResource: Encounter = {
    resourceType: 'Encounter',
    status: args.status,
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', // Default system for class
      code: args.classCode,
      // We might want to add a display based on the code if available
    },
    subject: {
      reference: `Patient/${args.patientId}`,
    },
  };

  if (args.typeCode) {
    encounterResource.type = [
      {
        coding: [
          {
            system: args.typeSystem || 'http://terminology.hl7.org/CodeSystem/v3-ActCode', // Reverted to original default
            code: args.typeCode,
            display: args.typeDisplay,
          },
        ],
        text: args.typeDisplay || args.typeCode,
      },
    ];
  }

  if (args.practitionerIds && args.practitionerIds.length > 0) {
    encounterResource.participant = args.practitionerIds.map((id) => ({
      individual: {
        reference: `Practitioner/${id}`,
      },
      // TODO: Consider adding type for participant (e.g., 'PPRF' - primary performer) if LLM can provide
    }));
  }

  if (args.organizationId) {
    encounterResource.serviceProvider = {
      reference: `Organization/${args.organizationId}`,
    };
  }

  if (args.periodStart || args.periodEnd) {
    encounterResource.period = {};
    if (args.periodStart) {
      encounterResource.period.start = args.periodStart;
    }
    if (args.periodEnd) {
      encounterResource.period.end = args.periodEnd;
    }
  }

  if (args.reasonCode) {
    encounterResource.reasonCode = [
      {
        coding: [
          {
            system: args.reasonSystem || 'http://snomed.info/sct', // Example system
            code: args.reasonCode,
            display: args.reasonDisplay,
          },
        ],
        text: args.reasonDisplay || args.reasonCode,
      },
    ];
  }
  
  if (args.identifierValue) {
    const identifier: Identifier = {
        value: args.identifierValue,
    };
    if (args.identifierSystem) {
        identifier.system = args.identifierSystem;
    }
    encounterResource.identifier = [identifier];
  }

  try {
    const createdEncounter = await medplum.createResource<Encounter>(encounterResource);
    console.log('Successfully created Encounter:', JSON.stringify(createdEncounter, null, 2));
    return createdEncounter;
  } catch (error) {
    console.error('Error creating Encounter:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      throw new Error(`Failed to create Encounter: ${error.message}`);
    }
    throw new Error('Failed to create Encounter due to an unknown error.');
  }
}

/**
 * Arguments for getting an Encounter by ID.
 */
export interface GetEncounterByIdArgs {
  encounterId: string;
}

/**
 * Retrieves an Encounter resource by its ID.
 *
 * @param args - The arguments containing the encounter ID.
 * @returns The Encounter resource if found, otherwise null.
 * @throws Error if the ID is not provided or if the fetch fails for other reasons.
 */
export async function getEncounterById(args: GetEncounterByIdArgs): Promise<Encounter | null> {
  console.log('Attempting to get Encounter with args:', JSON.stringify(args, null, 2));
  if (!args.encounterId) {
    throw new Error('Encounter ID is required to fetch an encounter.');
  }

  await ensureAuthenticated();

  try {
    // @ts-ignore // This ignore is for the Medplum SDK typing issue with readResource generics
    const encounter = await medplum.readResource<Encounter>('Encounter', args.encounterId);
    console.log('Successfully fetched Encounter:', JSON.stringify(encounter, null, 2));
    return encounter;
  } catch (error: any) {
    console.error(`Error fetching Encounter with ID ${args.encounterId}:`, JSON.stringify(error, null, 2));
    // Check for Medplum's specific not-found outcome structure
    if (error.outcome?.id === 'not-found' || error.outcome?.issue?.[0]?.code === 'not-found') {
        console.warn(`Encounter with ID ${args.encounterId} not found.`);
        return null; // Explicitly return null for not found cases
    }
    throw new Error(`Failed to fetch Encounter with ID ${args.encounterId}: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Arguments for updating an Encounter.
 * Requires the encounterId and an object with fields to update.
 * The updates object should not contain resourceType or id.
 */
export interface UpdateEncounterArgs extends Omit<Partial<Encounter>, 'resourceType' | 'id' | 'class' | 'type'> {
  class?: import('@medplum/fhirtypes').Coding | string; // Allow string for simplified class update
  type?: import('@medplum/fhirtypes').CodeableConcept[] | string[]; // Allow array of strings for simplified type update (e.g. just codes)
  // We can add specific, simplified fields here if we want to guide the LLM more directly
  // For example:
  // status?: Encounter['status'];
  // classCode?: string; // If we allow changing class via a simple code
  // periodStart?: string;
  // periodEnd?: string;
  // reasonCode?: string; // If we allow changing reason via a simple code
  // Note: For complex updates like adding/removing participants or changing referenced resources,
  // the LLM might need to provide a more detailed structure conforming to Partial<Encounter>.
}

/**
 * Updates an existing Encounter resource.
 *
 * @param encounterId - The ID of the encounter to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Encounter resource.
 * @throws Error if update fails or ID is not provided.
 */
export async function updateEncounter(
  encounterId: string,
  updates: UpdateEncounterArgs
): Promise<Encounter | null> {
  console.log(`Attempting to update Encounter ${encounterId} with updates:`, JSON.stringify(updates, null, 2));
  if (!encounterId) {
    throw new Error('Encounter ID is required to update an encounter.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating an encounter.');
  }

  await ensureAuthenticated();

  try {
    // @ts-ignore // For Medplum SDK typing issue with readResource generics
    let existingEncounter = await medplum.readResource<Encounter>('Encounter', encounterId);
    if (!existingEncounter) {
      console.warn(`Encounter with ID ${encounterId} not found. Cannot update.`);
      return null;
    }

    const validExistingEncounter = existingEncounter as Encounter; // Explicit cast

    const encounterToUpdate: Encounter = {
      ...validExistingEncounter, // Spread the casted object
      resourceType: 'Encounter',
      id: encounterId,
    };

    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        const K = key as keyof UpdateEncounterArgs;
        if (K === 'class' && typeof updates.class === 'string') {
          encounterToUpdate.class = {
            system: validExistingEncounter.class?.system || 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: updates.class,
            display: updates.class,
          };
        } else if (K === 'type' && Array.isArray(updates.type) && updates.type.length > 0 && typeof updates.type[0] === 'string') {
          encounterToUpdate.type = (updates.type as string[]).map(typeCode => ({
            coding: [{
              system: validExistingEncounter.type?.[0]?.coding?.[0]?.system || 'http://terminology.hl7.org/CodeSystem/encounter-type',
              code: typeCode,
              display: typeCode,
            }],
            text: typeCode,
          }));
        } else {
          (encounterToUpdate as any)[K] = (updates as any)[K];
        }
      }
    }
    
    // @ts-ignore - Medplum SDK typing issue with updateResource generics
    const updatedEncounter = await medplum.updateResource<Encounter>(encounterToUpdate);
    console.log('Successfully updated Encounter:', JSON.stringify(updatedEncounter, null, 2));
    return updatedEncounter;
  } catch (error: any) {
    console.error(`Error updating Encounter ${encounterId}:`, JSON.stringify(error, null, 2));
    throw new Error(`Failed to update Encounter ${encounterId}: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Arguments for searching Encounters.
 * All parameters are optional. At least one should be provided for a meaningful search.
 */
export interface EncounterSearchArgs {
  patientId?: string;      // Search by patient reference (ID only)
  practitionerId?: string; // Search by practitioner reference (ID only for a participant)
  organizationId?: string; // Search by service provider reference (ID only)
  date?: string;           // Search by date (e.g., '2023-01-01') Medplum treats this as a prefix for the day.
  status?: Encounter['status'] | Encounter['status'][]; // Search by status or list of statuses
  classCode?: string;      // Search by class code
  typeCode?: string;       // Search by type code
  identifier?: string;     // Search by an identifier (value only, system can be implicit or not easily searchable this way)
  // Add other common search parameters as needed, e.g., length, reasonCode
}

/**
 * Searches for Encounter resources based on specified criteria.
 *
 * @param searchArgs - An object containing direct search parameters.
 * @returns A promise that resolves to an array of Encounter resources, or an empty array if none found or an error occurs.
 */
export async function searchEncounters(searchArgs: EncounterSearchArgs): Promise<Encounter[]> {
  console.log('Attempting to search Encounters with args:', JSON.stringify(searchArgs, null, 2));
  await ensureAuthenticated();

  const medplumSearchCriteria: Record<string, string | string[]> = {};

  if (searchArgs.patientId) {
    medplumSearchCriteria.patient = `Patient/${searchArgs.patientId}`;
  }
  if (searchArgs.practitionerId) {
    // FHIR search for participant can be complex (e.g., participant.individual or specific roles)
    // Simplifying to search for any practitioner involvement by ID.
    medplumSearchCriteria.participant = `Practitioner/${searchArgs.practitionerId}`;
  }
  if (searchArgs.organizationId) {
    medplumSearchCriteria['service-provider'] = `Organization/${searchArgs.organizationId}`;
  }
  if (searchArgs.date) {
    medplumSearchCriteria.date = searchArgs.date;
  }
  if (searchArgs.status) {
    medplumSearchCriteria.status = searchArgs.status;
  }
  if (searchArgs.classCode) {
    // Assuming classCode maps directly to a search on class (which is a Coding)
    // Medplum might support direct search like Encounter?class=AMB
    medplumSearchCriteria.class = searchArgs.classCode;
  }
  if (searchArgs.typeCode) {
    // Similar to class, assuming direct search by code part of the type CodeableConcept
    medplumSearchCriteria.type = searchArgs.typeCode;
  }
  if (searchArgs.identifier) {
    medplumSearchCriteria.identifier = searchArgs.identifier;
  }

  if (Object.keys(medplumSearchCriteria).length === 0 && !searchArgs.date) {
    // Added !searchArgs.date because date alone can be a valid search if no other criteria.
    // However, an open search without any criteria is usually discouraged.
    // Consider if an empty criteria search should error or return all (Medplum might limit this).
    console.warn('Encounter search called with no specific criteria other than potentially date. This might return many results or be disallowed.');
    // return []; // Optionally return empty if no criteria to prevent overly broad searches
  }

  try {
    // @ts-ignore - SDK typing issues with searchResources generic constraints
    const encounters = await medplum.searchResources<Encounter>('Encounter', medplumSearchCriteria);
    console.log(`Found ${encounters.length} encounters.`);
    return encounters;
  } catch (error) {
    console.error('Error searching for encounters:', JSON.stringify(error, null, 2));
    return []; // Return empty array on error
  }
} 