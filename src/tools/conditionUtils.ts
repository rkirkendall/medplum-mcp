import {
  Condition,
  CodeableConcept,
  OperationOutcome,
  Reference,
  Patient,
  Encounter,
  Period,
  Age,
  Practitioner,
} from '@medplum/fhirtypes';
import { medplum, MedplumClient, ensureAuthenticated } from '../config/medplumClient';

/**
 * The clinical status of the condition.
 * From http://hl7.org/fhir/R4/valueset-condition-clinical.html
 */
export const ConditionClinicalStatusCodes = {
  ACTIVE: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'active',
    display: 'Active',
  },
  RECURRENCE: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'recurrence',
    display: 'Recurrence',
  },
  RELAPSE: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'relapse',
    display: 'Relapse',
  },
  INACTIVE: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'inactive',
    display: 'Inactive',
  },
  REMISSION: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'remission',
    display: 'Remission',
  },
  RESOLVED: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    code: 'resolved',
    display: 'Resolved',
  },
} as const;

/**
 * The verification status to support or refute the clinical status of the condition.
 * From http://hl7.org/fhir/R4/valueset-condition-ver-status.html
 */
export const ConditionVerificationStatusCodes = {
  UNCONFIRMED: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'unconfirmed',
    display: 'Unconfirmed',
  },
  PROVISIONAL: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'provisional',
    display: 'Provisional',
  },
  DIFFERENTIAL: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'differential',
    display: 'Differential',
  },
  CONFIRMED: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'confirmed',
    display: 'Confirmed',
  },
  REFUTED: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'refuted',
    display: 'Refuted',
  },
  'ENTERED-IN-ERROR': {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'entered-in-error',
    display: 'Entered in Error',
  },
} as const;

export interface CreateConditionArgs {
  subject: Reference<Patient>;
  code: CodeableConcept;
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  encounter?: Reference<Encounter>;
  onsetDateTime?: string;
  onsetAge?: Age;
  onsetPeriod?: Period;
  onsetString?: string;
  recordedDate?: string; // ISO 8601 date string
  asserter?: Reference<Patient | Practitioner>;
}

export interface UpdateConditionArgs {
  id: string;
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  code?: CodeableConcept;
  onsetDateTime?: string | null; // null to remove
  onsetString?: string | null;
  recordedDate?: string | null;
}

export interface ConditionSearchArgs {
  subject?: string; // Patient ID
  patient?: string; // Patient ID (alternative to subject)
  category?: string; // e.g., 'encounter-diagnosis'
  'clinical-status'?: string; // e.g., 'active'
  code?: string; // e.g., 'http://snomed.info/sct|44054006'
  'asserter.identifier'?: string;
}

/**
 * Creates a new Condition resource.
 * @param args The arguments for creating the condition.
 * @returns The created Condition resource or an OperationOutcome in case of an error.
 */
export async function createCondition(
  args: CreateConditionArgs,
  client?: MedplumClient,
): Promise<Condition | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!args.subject || !args.subject.reference) {
      throw new Error('Patient subject reference is required.');
    }
    if (!args.code || !args.code.coding || args.code.coding.length === 0) {
      throw new Error('Condition code with at least one coding is required.');
    }

    const conditionResource: Condition = {
      resourceType: 'Condition',
      subject: args.subject,
      code: args.code,
      clinicalStatus: args.clinicalStatus || { coding: [ConditionClinicalStatusCodes.ACTIVE] },
      verificationStatus:
        args.verificationStatus || { coding: [ConditionVerificationStatusCodes.CONFIRMED] },
      category: args.category,
      encounter: args.encounter,
      onsetDateTime: args.onsetDateTime,
      onsetAge: args.onsetAge,
      onsetPeriod: args.onsetPeriod,
      onsetString: args.onsetString,
      recordedDate: args.recordedDate,
      asserter: args.asserter,
    };

    // Remove undefined fields to create a clean resource object
    Object.keys(conditionResource).forEach(
      (key) =>
        (conditionResource as any)[key] === undefined && delete (conditionResource as any)[key],
    );

    const createdCondition = (await medplumClient.createResource(
      conditionResource,
    )) as Condition;
    console.log('Condition created successfully:', createdCondition.id);
    return createdCondition;
  } catch (error: any) {
    console.error('Error creating Condition:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error creating Condition: ${error.message || 'Unknown error'}`,
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
 * Retrieves a Condition resource by its ID.
 * @param conditionId The ID of the Condition to retrieve.
 * @returns The Condition resource or null if not found, or an OperationOutcome on error.
 */
export async function getConditionById(
  conditionId: string,
  client?: MedplumClient,
): Promise<Condition | null | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!conditionId) {
      throw new Error('Condition ID is required.');
    }
    const condition = (await medplumClient.readResource(
      'Condition',
      conditionId,
    )) as Condition | null;
    if (condition) {
      console.log('Condition retrieved:', condition.id);
    }
    return condition;
  } catch (error: any) {
    if (error.outcome && error.outcome.issue && error.outcome.issue[0]?.code === 'not-found') {
      console.log(`Condition with ID "${conditionId}" not found.`);
      return null;
    }
    console.error(`Error retrieving Condition with ID "${conditionId}":`, error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error retrieving Condition: ${error.message || 'Unknown error'}`,
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
 * Updates an existing Condition resource.
 * @param args The arguments for updating the condition.
 * @returns The updated Condition resource or an OperationOutcome on error.
 */
export async function updateCondition(
  args: UpdateConditionArgs,
  client?: MedplumClient,
): Promise<Condition | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    const { id, ...updates } = args;
    if (!id) {
      throw new Error('Condition ID is required for update.');
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided for Condition.');
    }

    const existingCondition = (await medplumClient.readResource(
      'Condition',
      id,
    )) as Condition;

    const updatedResource: Condition = { ...existingCondition, ...(updates as any) };
    // Handle null values for removal
    if (updates.onsetDateTime === null) delete updatedResource.onsetDateTime;
    if (updates.onsetString === null) delete updatedResource.onsetString;
    if (updates.recordedDate === null) delete updatedResource.recordedDate;

    const result = (await medplumClient.updateResource(updatedResource)) as Condition;
    console.log('Condition updated successfully:', result.id);
    return result;
  } catch (error: any) {
    console.error('Error updating Condition:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error updating Condition: ${error.message || 'Unknown error'}`,
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
 * Searches for Condition resources based on specified criteria.
 * @param args The search criteria.
 * @returns An array of Condition resources matching the criteria or an OperationOutcome on error.
 */
export async function searchConditions(
  args: ConditionSearchArgs,
  client?: MedplumClient,
): Promise<Condition[] | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    const searchCriteria: string[] = [];
    const patientId = args.subject || args.patient;

    if (patientId) {
      // Medplum search needs the full reference, but the arg might just be an ID
      searchCriteria.push(`subject=${patientId.startsWith('Patient/') ? patientId : `Patient/${patientId}`}`);
    }
    if (args.category) {
      searchCriteria.push(`category=${args.category}`);
    }
    if (args['clinical-status']) {
      searchCriteria.push(`clinical-status=${args['clinical-status']}`);
    }
    if (args.code) {
      searchCriteria.push(`code=${args.code}`);
    }
    if(args['asserter.identifier']){
      searchCriteria.push(`asserter.identifier=${args['asserter.identifier']}`);
    }

    if (searchCriteria.length === 0) {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics:
              'At least one search criterion (subject, patient, category, clinical-status, or code) must be provided.',
          },
        ],
      };
    }

    const query = searchCriteria.join('&');
    console.log('Searching conditions with query:', query);

    const searchResult = await medplumClient.searchResources('Condition', query);
    const conditions = searchResult as Condition[];

    console.log(`Found ${conditions.length} conditions.`);
    return conditions;
  } catch (error: any) {
    console.error('Error searching Conditions:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error searching Conditions: ${error.message || 'Unknown error'}`,
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