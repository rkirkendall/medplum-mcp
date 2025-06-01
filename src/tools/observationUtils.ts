import { medplum, ensureAuthenticated } from '../config/medplumClient';
import { Observation, Patient, Practitioner, Encounter, Reference, Identifier, CodeableConcept, Period, Quantity, Ratio, SampledData, Attachment, Range, ObservationReferenceRange } from '@medplum/fhirtypes';

// Interface for creating an Observation
export interface CreateObservationArgs {
  status: Observation['status'];
  code: CodeableConcept;
  subject?: Reference<Patient>; // Made optional since tests use subjectId
  subjectId?: string; // For convenience in tests - will be converted to subject reference
  encounter?: Reference<Encounter>;
  encounterId?: string; // For convenience in tests - will be converted to encounter reference
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference<Practitioner>[];
  performerIds?: string[]; // For convenience in tests - will be converted to performer references
  valueQuantity?: Quantity;
  valueString?: string;
  valueBoolean?: boolean;
  valueCodeableConcept?: CodeableConcept;
  valueInteger?: number;
  valueRange?: Range;
  valueRatio?: Ratio;
  valueSampledData?: SampledData;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  component?: any[];
  interpretation?: CodeableConcept[];
  note?: string;
  referenceRange?: any[];
  identifier?: { system?: string; value: string };
}

// Interface for retrieving an Observation by ID
export interface GetObservationByIdArgs {
  observationId: string;
}

// Interface for updating an Observation
export interface UpdateObservationArgs {
  status?: Observation['status'];
  code?: CodeableConcept;
  subjectId?: string;
  encounterId?: string | null;
  effectiveDateTime?: string | null;
  effectivePeriod?: Period | null;
  issued?: string;
  performerIds?: string[] | null;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: Range;
  valueRatio?: Ratio;
  valueSampledData?: SampledData;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  bodySite?: CodeableConcept | null;
  method?: CodeableConcept | null;
  referenceRange?: any[] | null;
  note?: string | null;
  interpretation?: CodeableConcept[] | null;
  identifier?: { system?: string; value: string } | null;
}

// Interface for searching Observations
export interface ObservationSearchArgs {
  patientId?: string;
  code?: string; // Search by LOINC or other code system code
  codeSystem?: string; // Specify the system for the code
  encounterId?: string;
  date?: string; // Search by effectiveDateTime or effectivePeriod
  status?: Observation['status'];
  subject?: string; // FHIR style search param: Patient/XYZ
  performer?: string; // FHIR style search param: Practitioner/XYZ
  identifier?: string; // Search by identifier value (e.g. value or system|value)
  _lastUpdated?: string; // Search by last updated date
}


/**
 * Creates a new Observation resource.
 * @param args - The arguments for creating the observation.
 * @returns The created Observation resource.
 */
export async function createObservation(args: CreateObservationArgs): Promise<Observation> {
  await ensureAuthenticated();

  // Handle subjectId conversion for convenience
  let subject = args.subject;
  if (args.subjectId && !subject) {
    subject = { reference: `Patient/${args.subjectId}` };
  }

  // Handle encounterId conversion for convenience
  let encounter = args.encounter;
  if (args.encounterId && !encounter) {
    encounter = { reference: `Encounter/${args.encounterId}` };
  }

  // Handle performerIds conversion for convenience
  let performer = args.performer;
  if (args.performerIds && !performer) {
    performer = args.performerIds.map(id => ({ reference: `Practitioner/${id}` }));
  }

  if (!subject?.reference) {
    throw new Error('Patient reference is required to create an observation.');
  }
  if (!args.code || !args.code.coding || args.code.coding.length === 0) {
    throw new Error('Observation code with at least one coding is required.');
  }
  if (!args.status) {
    throw new Error('Observation status is required.');
  }
  if (
    args.valueQuantity === undefined && args.valueCodeableConcept === undefined && args.valueString === undefined && args.valueBoolean === undefined &&
    args.valueInteger === undefined && args.valueRange === undefined && args.valueRatio === undefined && args.valueSampledData === undefined &&
    args.valueTime === undefined && args.valueDateTime === undefined && args.valuePeriod === undefined
  ) {
    throw new Error('At least one value field must be provided (valueQuantity, valueCodeableConcept, valueString, valueBoolean, valueInteger, valueRange, valueRatio, valueSampledData, valueTime, valueDateTime, or valuePeriod).');
  }

  const observationResource: Observation = {
    resourceType: 'Observation',
    status: args.status,
    code: args.code,
    subject: subject,
    encounter: encounter,
    effectiveDateTime: args.effectiveDateTime,
    effectivePeriod: args.effectivePeriod,
    issued: args.issued || new Date().toISOString(),
    performer: performer,
    valueQuantity: args.valueQuantity,
    valueCodeableConcept: args.valueCodeableConcept,
    valueString: args.valueString,
    valueBoolean: args.valueBoolean,
    valueInteger: args.valueInteger,
    valueRange: args.valueRange,
    valueRatio: args.valueRatio,
    valueSampledData: args.valueSampledData,
    valueTime: args.valueTime,
    valueDateTime: args.valueDateTime,
    valuePeriod: args.valuePeriod,
    bodySite: args.bodySite,
    method: args.method,
    referenceRange: args.referenceRange,
    note: args.note ? [{ text: args.note }] : undefined,
    interpretation: args.interpretation,
    identifier: args.identifier ? [{ system: args.identifier.system, value: args.identifier.value }] : undefined,
  };

  if (args.component) {
    observationResource.component = args.component;
  }

  return medplum.createResource<Observation>(observationResource);
}

/**
 * Retrieves an Observation by its ID.
 * @param args - The arguments containing the observation ID.
 * @returns The Observation resource, or null if not found.
 */
export async function getObservationById(args: GetObservationByIdArgs): Promise<Observation | null> {
  await ensureAuthenticated();
  if (!args.observationId) {
    throw new Error('Observation ID is required to fetch an observation.');
  }
  try {
    return await medplum.readResource('Observation', args.observationId);
  } catch (error: any) {
    if (error.outcome?.issue?.[0]?.code === 'not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Updates an existing Observation resource.
 * @param observationId - The ID of the observation to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated Observation resource.
 */
export async function updateObservation(observationId: string, updates: UpdateObservationArgs): Promise<Observation> {
  await ensureAuthenticated();

  if (!observationId) {
    throw new Error('Observation ID is required to update an observation.');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates object cannot be empty for updating an observation.');
  }

  const existingObservation = await medplum.readResource('Observation', observationId);
  if (!existingObservation) {
    throw new Error(`Observation with ID ${observationId} not found.`);
  }

  const {
    note: noteInput,
    identifier: identifierInput,
    encounterId: encounterIdInput,
    performerIds: performerIdsInput,
    subjectId: subjectIdInput, // Though less common to update subject, handle if passed
    ...restOfUpdates // These are fields that are mostly 1:1 or simple null->undefined
  } = updates;

  const workingUpdates: Partial<Observation> = {};

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

  // Handle specific conversions for note
  if (typeof noteInput === 'string') {
    workingUpdates.note = [{ text: noteInput }];
  } else if (noteInput === null) {
    workingUpdates.note = undefined;
  } else if (noteInput !== undefined) { // If it was already Annotation[]
    workingUpdates.note = noteInput as any; // Cast if UpdateObservationArgs not updated
  }

  // Handle specific conversions for identifier
  if (identifierInput && typeof identifierInput === 'object') {
    workingUpdates.identifier = [identifierInput as Identifier];
  } else if (identifierInput === null) {
    workingUpdates.identifier = undefined;
  }

  // Handle subjectId to subject reference
  if (typeof subjectIdInput === 'string') {
    workingUpdates.subject = { reference: `Patient/${subjectIdInput}` };
  } else if (subjectIdInput === null) { // Allow clearing subject if necessary
    workingUpdates.subject = undefined;
  }


  // Handle encounterId to encounter reference
  if (typeof encounterIdInput === 'string') {
    workingUpdates.encounter = { reference: `Encounter/${encounterIdInput}` };
  } else if (encounterIdInput === null) {
    workingUpdates.encounter = undefined; // Clear the encounter
  }

  // Handle performerIds to performer references
  if (Array.isArray(performerIdsInput)) {
    workingUpdates.performer = performerIdsInput.map(id => ({ reference: `Practitioner/${id}` }));
  } else if (performerIdsInput === null) {
    workingUpdates.performer = undefined; // Clear performers
  }

  // value[x] exclusivity logic
  const valueFields: (keyof Observation)[] = [
    'valueQuantity', 'valueCodeableConcept', 'valueString', 'valueBoolean',
    'valueInteger', 'valueRange', 'valueRatio', 'valueSampledData',
    'valueTime', 'valueDateTime', 'valuePeriod'
  ];

  let valueKeyPresentInUpdates: keyof Observation | undefined;
  for (const key of valueFields) {
    // Check if the key (potentially a value[x] field) exists in the original `updates` object
    if ((updates as any)[key] !== undefined) {
      if (valueKeyPresentInUpdates) {
        // This indicates multiple value[x] fields were in the input `updates`.
        // The test "should throw error if updating with multiple value[x] types"
        // expects the Medplum server to reject this. So, we don't throw here,
        // but let Medplum handle it if workingUpdates still contains multiple.
      }
      valueKeyPresentInUpdates = key;
    }
  }

  // If a value[x] is being set in updates, ensure all other value[x] fields are cleared
  // from workingUpdates to ensure only one is sent to Medplum.
  if (valueKeyPresentInUpdates) {
    for (const key of valueFields) {
      if (key !== valueKeyPresentInUpdates) {
        (workingUpdates as any)[key] = undefined;
      }
    }
  }

  const updatedResource: Observation = {
    ...existingObservation,
    ...workingUpdates,
    resourceType: 'Observation', // Ensure resourceType is correctly maintained
    id: observationId,           // Ensure ID is correctly maintained
  };

  return medplum.updateResource(updatedResource);
}

// Helper function to clear other value[x] fields when one is set
function clearOtherValues(resource: Observation, valueKeyToKeep: keyof Observation) {
    const valueKeysToClear: (keyof Observation)[] = [
        'valueQuantity', 'valueCodeableConcept', 'valueString', 'valueBoolean',
        'valueInteger', 'valueRange', 'valueRatio', 'valueSampledData',
        'valueTime', 'valueDateTime', 'valuePeriod'
    ];
    valueKeysToClear.forEach(key => {
        if (key !== valueKeyToKeep) {
            delete resource[key];
        }
    });
}


/**
 * Searches for Observation resources based on specified criteria.
 * @param args - The search criteria.
 * @returns An array of matching Observation resources.
 */
export async function searchObservations(args: ObservationSearchArgs): Promise<Observation[]> {
  await ensureAuthenticated();
  const searchCriteria: string[] = [];

  if (Object.keys(args).length === 0) {
    console.warn('Observation search called with no specific criteria. This might return a large number of results or be inefficient.');
  }

  if (args.patientId) {
    searchCriteria.push(`subject=Patient/${args.patientId}`);
  } else if (args.subject) { 
     searchCriteria.push(`subject=${args.subject}`);
  }

  if (args.code) {
    if (args.codeSystem) {
      searchCriteria.push(`code=${args.codeSystem}|${args.code}`);
    } else {
      searchCriteria.push(`code=${args.code}`);
    }
  }
  if (args.encounterId) {
    searchCriteria.push(`encounter=Encounter/${args.encounterId}`);
  }
  if (args.date) {
    // If no comparator is provided, default to 'eq' for exact date match
    const dateValue = args.date.match(/^(eq|ne|gt|lt|ge|le)/) ? args.date : `eq${args.date}`;
    searchCriteria.push(`date=${dateValue}`); 
  }
  if (args.status) {
    searchCriteria.push(`status=${args.status}`);
  }
   if (args.performer) {
    searchCriteria.push(`performer=${args.performer}`);
  }
  if (args.identifier) {
    searchCriteria.push(`identifier=${args.identifier}`);
  }
  if (args._lastUpdated) {
    searchCriteria.push(`_lastUpdated=${args._lastUpdated}`);
  }

  if (searchCriteria.length === 0 && Object.keys(args).length > 0) {
    console.warn('Observation search arguments provided but did not map to any known search parameters:', args);
    return [];
  }
  
  if (searchCriteria.length > 0 || Object.keys(args).length === 0) {
      const queryString = searchCriteria.join('&');
      // console.log(`Searching observations with query: ${queryString}`); // Optional: for debugging
      return medplum.searchResources('Observation', queryString);
  } else {
      return [];
  }
} 