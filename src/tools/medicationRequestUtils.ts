import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { 
  MedicationRequest, 
  Patient, 
  Practitioner, 
  Encounter, 
  Reference, 
  Identifier, 
  CodeableConcept, 
  Dosage,
  Period
} from '@medplum/fhirtypes';

// Interface for creating a MedicationRequest
export interface CreateMedicationRequestArgs {
  status: MedicationRequest['status'];
  intent: MedicationRequest['intent'];
  medicationCodeableConcept?: CodeableConcept;
  // medicationReference?: Reference; // TODO: Add if direct reference to Medication resource is needed
  subjectId: string; // Convenience for Patient reference
  encounterId?: string; // Convenience for Encounter reference
  authoredOn?: string;
  requesterId?: string; // Convenience for Practitioner reference
  dosageInstruction?: Dosage[];
  note?: string;
  identifier?: { system?: string; value: string };
  // Add other relevant fields like dispenseRequest, category, priority, etc. as needed
}

// Interface for retrieving a MedicationRequest by ID
export interface GetMedicationRequestByIdArgs {
  medicationRequestId: string;
}

// Interface for updating a MedicationRequest
export interface UpdateMedicationRequestArgs {
  status?: MedicationRequest['status'];
  intent?: MedicationRequest['intent'];
  medicationCodeableConcept?: CodeableConcept | null;
  // medicationReference?: Reference | null;
  subjectId?: string | null; 
  encounterId?: string | null;
  authoredOn?: string | null;
  requesterId?: string | null;
  dosageInstruction?: Dosage[] | null;
  note?: string | null;
  identifier?: { system?: string; value: string } | null;
  // Add other relevant fields from CreateMedicationRequestArgs as optional and nullable
}

// Interface for searching MedicationRequests
export interface SearchMedicationRequestsArgs {
  patientId?: string; // Searches for subject=Patient/[patientId]
  status?: MedicationRequest['status'];
  intent?: MedicationRequest['intent'];
  code?: string; // Searches by medicationCodeableConcept.coding.code
  codeSystem?: string; // System for the medication code
  authoredon?: string; // Date search for authoredOn, supports prefixes like eq, gt, le
  requester?: string; // FHIR style search param: Practitioner/XYZ or Organization/XYZ
  identifier?: string; // Search by identifier value (e.g. value or system|value)
  _lastUpdated?: string;
  // Add other common search parameters
}

/**
 * Creates a new MedicationRequest resource.
 * @param args - The arguments for creating the medication request.
 * @returns The created MedicationRequest resource.
 */
export async function createMedicationRequest(args: CreateMedicationRequestArgs): Promise<MedicationRequest> {
  await ensureAuthenticated();

  if (!args.status) {
    throw new Error('MedicationRequest status is required.');
  }
  if (!args.intent) {
    throw new Error('MedicationRequest intent is required.');
  }
  if (!args.medicationCodeableConcept) { // Add || !args.medicationReference if that's supported
    throw new Error('Medication (medicationCodeableConcept or medicationReference) is required.');
  }
  if (!args.subjectId) {
    throw new Error('Subject (Patient ID) is required to create a MedicationRequest.');
  }

  const medicationRequestResource: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: args.status,
    intent: args.intent,
    medicationCodeableConcept: args.medicationCodeableConcept,
    // medicationReference: args.medicationReference,
    subject: { reference: `Patient/${args.subjectId}` },
    authoredOn: args.authoredOn || new Date().toISOString(),
    dosageInstruction: args.dosageInstruction,
  };

  if (args.encounterId) {
    medicationRequestResource.encounter = { reference: `Encounter/${args.encounterId}` };
  }
  if (args.requesterId) {
    medicationRequestResource.requester = { reference: `Practitioner/${args.requesterId}` };
  }
  if (args.note) {
    medicationRequestResource.note = [{ text: args.note }];
  }
  if (args.identifier) {
    medicationRequestResource.identifier = [{ system: args.identifier.system, value: args.identifier.value }];
  }

  return medplum.createResource<MedicationRequest>(medicationRequestResource);
}

/**
 * Retrieves a MedicationRequest by its ID.
 * @param args - The arguments containing the medication request ID.
 * @returns The MedicationRequest resource, or null if not found.
 */
export async function getMedicationRequestById(args: GetMedicationRequestByIdArgs): Promise<MedicationRequest | null> {
  await ensureAuthenticated();
  if (!args.medicationRequestId) {
    throw new Error('MedicationRequest ID is required to fetch a medication request.');
  }
  try {
    return await medplum.readResource('MedicationRequest', args.medicationRequestId);
  } catch (error: any) {
    if (error.outcome?.issue?.[0]?.code === 'not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Updates an existing MedicationRequest resource.
 * @param medicationRequestId - The ID of the medication request to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated MedicationRequest resource.
 */
export async function updateMedicationRequest(medicationRequestId: string, updates: UpdateMedicationRequestArgs): Promise<MedicationRequest> {
  await ensureAuthenticated();

  if (!medicationRequestId) {
    throw new Error('MedicationRequest ID is required to update a medication request.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating a medication request.');
  }

  const existingMedicationRequest = await medplum.readResource('MedicationRequest', medicationRequestId);
  if (!existingMedicationRequest) {
    throw new Error(`MedicationRequest with ID ${medicationRequestId} not found.`);
  }

  const {
    note: noteInput,
    identifier: identifierInput,
    subjectId: subjectIdInput,
    encounterId: encounterIdInput,
    requesterId: requesterIdInput,
    medicationCodeableConcept: medicationCodeableConceptInput,
    // medicationReference: medicationReferenceInput, // If added to UpdateMedicationRequestArgs
    ...restOfUpdates
  } = updates;

  const workingUpdates: Partial<MedicationRequest> = {};

  // Handle fields from restOfUpdates, converting null to undefined
  for (const key in restOfUpdates) {
    if (Object.prototype.hasOwnProperty.call(restOfUpdates, key)) {
      const value = (restOfUpdates as any)[key];
      if (value === null) {
        (workingUpdates as any)[key] = undefined;
      } else if (value !== undefined) {
        (workingUpdates as any)[key] = value;
      }
    }
  }
  
  // Handle specific conversions
  if (typeof noteInput === 'string') {
    workingUpdates.note = [{ text: noteInput }];
  } else if (noteInput === null) {
    workingUpdates.note = undefined;
  } else if (noteInput !== undefined) { // If it was already Annotation[]
    workingUpdates.note = noteInput as any; 
  }

  if (identifierInput && typeof identifierInput === 'object') {
    workingUpdates.identifier = [identifierInput as Identifier];
  } else if (identifierInput === null) {
    workingUpdates.identifier = undefined;
  }

  if (typeof subjectIdInput === 'string') {
    workingUpdates.subject = { reference: `Patient/${subjectIdInput}` };
  } else if (subjectIdInput === null) {
    workingUpdates.subject = undefined;
  }

  if (typeof encounterIdInput === 'string') {
    workingUpdates.encounter = { reference: `Encounter/${encounterIdInput}` };
  } else if (encounterIdInput === null) {
    workingUpdates.encounter = undefined;
  }

  if (typeof requesterIdInput === 'string') {
    workingUpdates.requester = { reference: `Practitioner/${requesterIdInput}` };
  } else if (requesterIdInput === null) {
    workingUpdates.requester = undefined;
  }

  if (medicationCodeableConceptInput === null) {
    workingUpdates.medicationCodeableConcept = undefined;
  } else if (medicationCodeableConceptInput !== undefined) {
    workingUpdates.medicationCodeableConcept = medicationCodeableConceptInput;
    // workingUpdates.medicationReference = undefined; // Ensure exclusivity if medicationReference is also handled
  }
  
  // Similar logic for medicationReference if it gets added
  // if (medicationReferenceInput === null) {
  //   workingUpdates.medicationReference = undefined;
  //   workingUpdates.medicationCodeableConcept = undefined; // Clear the other if one is nulled
  // } else if (medicationReferenceInput !== undefined) {
  //   workingUpdates.medicationReference = medicationReferenceInput;
  //   workingUpdates.medicationCodeableConcept = undefined; // Ensure exclusivity
  // }

  const updatedResource: MedicationRequest = {
    ...existingMedicationRequest,
    ...workingUpdates,
    resourceType: 'MedicationRequest',
    id: medicationRequestId,
  };

  return medplum.updateResource(updatedResource);
}

/**
 * Searches for MedicationRequest resources based on specified criteria.
 * @param args - The search criteria.
 * @returns An array of matching MedicationRequest resources.
 */
export async function searchMedicationRequests(args: SearchMedicationRequestsArgs): Promise<MedicationRequest[]> {
  await ensureAuthenticated();
  const searchCriteria: string[] = [];

  if (Object.keys(args).length === 0) {
    console.warn('MedicationRequest search called with no specific criteria. This might return a large number of results or be inefficient.');
  }

  if (args.patientId) {
    searchCriteria.push(`patient=Patient/${args.patientId}`);
  }
  if (args.status) {
    searchCriteria.push(`status=${args.status}`);
  }
  if (args.intent) {
    searchCriteria.push(`intent=${args.intent}`);
  }
  if (args.code) {
    searchCriteria.push(`code=${args.code}`);
  }
  if (args.authoredon) {
    searchCriteria.push(`authoredon=${args.authoredon}`);
  }
  if (args.requester) {
    searchCriteria.push(`requester=${args.requester}`);
  }
  if (args.identifier) {
    searchCriteria.push(`identifier=${args.identifier}`);
  }
  if (args._lastUpdated) {
    searchCriteria.push(`_lastUpdated=${args._lastUpdated}`);
  }

  if (searchCriteria.length === 0 && Object.keys(args).length > 0) {
    console.warn('MedicationRequest search arguments provided but did not map to any known search parameters:', args);
    return [];
  }
  
  // Only search if there are criteria or if no arguments were provided (search all)
  if (searchCriteria.length > 0 || Object.keys(args).length === 0) {
      const queryString = searchCriteria.join('&');
      return medplum.searchResources('MedicationRequest', queryString);
  } else {
      return []; // Should be caught by the warning above, but as a fallback
  }
} 