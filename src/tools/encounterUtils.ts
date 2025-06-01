import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Encounter, Patient, Practitioner, Organization, Reference, Identifier, CodeableConcept, Coding, Period, EncounterParticipant } from '@medplum/fhirtypes';

// Helper function to map class codes to Coding object
function mapEncounterClass(classCode: string): Coding {
    return {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', 
        code: classCode,
        display: classCode 
    };
}

/**
 * Arguments for creating an Encounter.
 * At a minimum, status, class, subject (Patient reference) are required.
 * Participants (Practitioner references) and serviceProvider (Organization reference) are highly recommended.
 */
export interface CreateEncounterArgs {
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  classCode: string; // e.g., AMB, IMP, EMER from HL7 v3 ActCode system
  patientId: string;
  practitionerIds?: string[];
  organizationId?: string; // For serviceProvider
  typeCode?: string; // e.g., CHECKUP, CONSULT from a code system
  typeSystem?: string; // e.g., http://terminology.hl7.org/CodeSystem/v3-ActCode
  typeDisplay?: string;
  periodStart?: string; // ISO 8601 DateTime string
  periodEnd?: string;   // ISO 8601 DateTime string
  reasonCode?: string;  // Code from a system like SNOMED CT
  reasonSystem?: string;
  reasonDisplay?: string;
  identifierValue?: string; // Business identifier for the encounter
  identifierSystem?: string;
}

/**
 * Creates a new Encounter resource.
 *
 * @param args - The arguments for creating the encounter.
 * @returns The created Encounter resource.
 * @throws Error if creation fails.
 */
export async function createEncounter(args: CreateEncounterArgs): Promise<Encounter> {
  await ensureAuthenticated();

  if (!args.patientId) {
    throw new Error('Patient ID is required to create an encounter.');
  }
  if (!args.status) {
    throw new Error('Encounter status is required.');
  }
  if (!args.classCode) {
    throw new Error('Encounter class code is required.');
  }

  const encounterResource: Encounter = {
    resourceType: 'Encounter',
    status: args.status,
    class: mapEncounterClass(args.classCode),
    subject: { reference: `Patient/${args.patientId}` },
  };

  if (args.practitionerIds && args.practitionerIds.length > 0) {
    encounterResource.participant = args.practitionerIds.map(id => ({
      individual: { reference: `Practitioner/${id}` }
    } as EncounterParticipant));
  }

  if (args.organizationId) {
    encounterResource.serviceProvider = { reference: `Organization/${args.organizationId}` };
  }

  if (args.typeCode) {
    const typeCoding: Coding = { code: args.typeCode };
    if (args.typeSystem) typeCoding.system = args.typeSystem;
    if (args.typeDisplay) typeCoding.display = args.typeDisplay;
    encounterResource.type = [{ coding: [typeCoding], text: args.typeDisplay || args.typeCode }];
  }

  if (args.periodStart || args.periodEnd) {
    encounterResource.period = {};
    if (args.periodStart) encounterResource.period.start = args.periodStart;
    if (args.periodEnd) encounterResource.period.end = args.periodEnd;
  }

  if (args.reasonCode) {
    const reasonCoding: Coding = { code: args.reasonCode };
    if (args.reasonSystem) reasonCoding.system = args.reasonSystem;
    if (args.reasonDisplay) reasonCoding.display = args.reasonDisplay;
    encounterResource.reasonCode = [{ coding: [reasonCoding], text: args.reasonDisplay || args.reasonCode }];
  }

  if (args.identifierValue) {
    const identifier: Identifier = { value: args.identifierValue };
    if (args.identifierSystem) identifier.system = args.identifierSystem;
    encounterResource.identifier = [identifier];
  }
  return medplum.createResource<Encounter>(encounterResource);
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
export async function getEncounterById(args: { encounterId: string }): Promise<Encounter | null> {
  await ensureAuthenticated();
  if (!args.encounterId) {
    throw new Error('Encounter ID is required to fetch an encounter.');
  }
  try {
    const encounter = await medplum.readResource('Encounter', args.encounterId);
    return encounter;
  } catch (error: any) {
    if (error.outcome?.issue?.[0]?.code === 'not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Arguments for updating an Encounter.
 * Requires the encounterId and an object with fields to update.
 * The updates object should not contain resourceType or id.
 */
export interface UpdateEncounterArgs extends Omit<Partial<Encounter>, 'resourceType' | 'id'> {
  // If specific simplified fields are needed, they can be added here,
  // but Partial<Encounter> provides flexibility.
  // Example: classCode?: string; to simplify updating class via a code.
  classCode?: string; // Added for convenience - will be converted to Coding
}

/**
 * Updates an existing Encounter resource.
 *
 * @param encounterId - The ID of the encounter to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Encounter resource.
 * @throws Error if update fails or ID is not provided.
 */
export async function updateEncounter(encounterId: string, updates: UpdateEncounterArgs): Promise<Encounter> {
  await ensureAuthenticated();

  if (!encounterId) {
    throw new Error('Encounter ID is required to update an encounter.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating an encounter.');
  }

  const existingEncounter = await medplum.readResource('Encounter', encounterId);
  if (!existingEncounter) {
    throw new Error(`Encounter with ID ${encounterId} not found.`);
  }

  const { resourceType, id, ...safeUpdates } = updates as any;
  
  // Handle class conversion
  if (typeof safeUpdates.class === 'string') {
    safeUpdates.class = mapEncounterClass(safeUpdates.class);
  }
  if (updates.classCode) {
    safeUpdates.class = mapEncounterClass(updates.classCode);
    delete safeUpdates.classCode; // Remove the convenience field
  }
  
  const encounterToUpdate: Encounter = {
    ...existingEncounter,
    ...safeUpdates,
    resourceType: 'Encounter',
    id: encounterId,
  };

  return medplum.updateResource(encounterToUpdate);
}

/**
 * Arguments for searching Encounters.
 * All parameters are optional. At least one should be provided for a meaningful search.
 */
export interface EncounterSearchArgs {
  patientId?: string;
  subject?: string; // Added for FHIR-style search: Patient/123
  practitionerId?: string;
  participant?: string; // Added for FHIR-style search: Practitioner/456
  organizationId?: string;
  date?: string;
  status?: string;
  classCode?: string;
  typeCode?: string;
  typeSystem?: string; // Added for use with typeCode
  identifier?: string;
  _lastUpdated?: string; // Added for FHIR-style search
  // Add other common search parameters as needed
}

/**
 * Searches for Encounter resources based on specified criteria.
 *
 * @param searchArgs - An object containing direct search parameters.
 * @returns A promise that resolves to an array of Encounter resources, or an empty array if none found or an error occurs.
 */
export async function searchEncounters(searchArgs: EncounterSearchArgs): Promise<Encounter[]> {
  await ensureAuthenticated();
  
  const searchCriteria: string[] = [];

  if (searchArgs.patientId) {
    searchCriteria.push(`subject=Patient/${searchArgs.patientId}`);
  }
  if (searchArgs.practitionerId) {
    const practitionerRef = searchArgs.practitionerId.startsWith('Practitioner/') 
      ? searchArgs.practitionerId 
      : `Practitioner/${searchArgs.practitionerId}`;
    searchCriteria.push(`participant=${practitionerRef}`);
  }
  if (searchArgs.organizationId) {
    searchCriteria.push(`service-provider=Organization/${searchArgs.organizationId}`);
  }
  if (searchArgs.status) {
    searchCriteria.push(`status=${searchArgs.status}`);
  }
  if (searchArgs.classCode) {
    searchCriteria.push(`class=${searchArgs.classCode}`);
  }
  if (searchArgs.date) {
    searchCriteria.push(`date=${searchArgs.date}`);
  }
  if (searchArgs.identifier) {
    searchCriteria.push(`identifier=${searchArgs.identifier}`);
  }
  if (searchArgs._lastUpdated) {
    searchCriteria.push(`_lastUpdated=${searchArgs._lastUpdated}`);
  }

  if (searchCriteria.length === 0) {
    console.warn('Encounter search called with no specific criteria. This might return a large number of results or be inefficient.');
    return []; // Return empty array if no criteria are provided
  }

  const queryString = searchCriteria.join('&');
  return medplum.searchResources('Encounter', queryString);
} 