import {
  EpisodeOfCare,
  // EpisodeOfCareStatus, // This type does not exist as a named export
  CodeableConcept,
  Identifier,
  Reference,
  Period,
  Patient,
  Organization,
  Practitioner,
  Condition,
  OperationOutcome,
} from '@medplum/fhirtypes';
import { medplum, MedplumClient, ensureAuthenticated } from '../config/medplumClient';

// Define EpisodeOfCareStatus based on FHIR R4 valueset
export type EpisodeOfCareStatus =
  | 'planned'
  | 'waitlist'
  | 'active'
  | 'onhold'
  | 'finished'
  | 'cancelled'
  | 'entered-in-error';

export interface CreateEpisodeOfCareArgs {
  patientId: string;
  status: EpisodeOfCareStatus; // planned | waitlist | active | onhold | finished | cancelled | entered-in-error
  managingOrganizationId?: string;
  type?: CodeableConcept[]; // e.g., [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/episodeofcare-type', code: 'hacc' }]}] (Home and Community Care)
  periodStart?: string; // ISO8601 DateTime
  periodEnd?: string; // ISO8601 DateTime
  careManagerId?: string; // ID of the Practitioner
  teamMemberIds?: string[]; // IDs of CareTeam resources (more complex, consider if needed for initial version)
  identifier?: Identifier[];
  // diagnosis related fields are complex (condition, role, rank) - might simplify or add later
}

export interface UpdateEpisodeOfCareArgs {
  status?: EpisodeOfCareStatus;
  type?: CodeableConcept[];
  periodStart?: string;
  periodEnd?: string;
  managingOrganizationId?: string;
  careManagerId?: string;
  // Consider how to handle diagnosis updates - potentially replacing all, or adding/removing specific ones.
}

export interface EpisodeOfCareSearchArgs {
  patient?: string; // Patient ID, e.g., "Patient/123" or just "123"
  status?: EpisodeOfCareStatus | string; // Can be a single status or comma-separated for multiple e.g. "active,onhold"
  type?: string; // Token search for type (e.g., system|code or just code)
  date?: string | string[]; // Date range for period (e.g., "ge2023-01-01&le2023-12-31" or ["ge2023-01-01", "le2023-12-31"])
  identifier?: string; // Identifier for the episode of care
  organization?: string; // <<< RENAMED from 'managing-organization'
  'care-manager'?: string; // Practitioner ID, e.g., "Practitioner/123" or just "123"
}

/**
 * Creates a new EpisodeOfCare resource.
 */
export async function createEpisodeOfCare(
  args: CreateEpisodeOfCareArgs,
  client?: MedplumClient,
): Promise<EpisodeOfCare | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!args.patientId) {
      throw new Error('Patient ID is required to create an EpisodeOfCare.');
    }
    if (!args.status) {
      throw new Error('Status is required to create an EpisodeOfCare.');
    }

    const episode: EpisodeOfCare = {
      resourceType: 'EpisodeOfCare',
      status: args.status,
      patient: { reference: `Patient/${args.patientId}` },
      type: args.type,
      identifier: args.identifier,
      period: args.periodStart || args.periodEnd ? {
        start: args.periodStart,
        end: args.periodEnd,
      } : undefined,
      managingOrganization: args.managingOrganizationId
        ? { reference: `Organization/${args.managingOrganizationId}` }
        : undefined,
      careManager: args.careManagerId
        ? { reference: `Practitioner/${args.careManagerId}` }
        : undefined,
      // team: args.teamMemberIds?.map(id => ({ reference: `CareTeam/${id}` })) // If using CareTeam IDs
    };

    // Remove undefined top-level fields to keep the resource clean
    Object.keys(episode).forEach((key) => (episode as any)[key] === undefined && delete (episode as any)[key]);
    if (episode.period && !episode.period.start && !episode.period.end) {
      delete episode.period;
    }

    const result = (await medplumClient.createResource(episode)) as EpisodeOfCare;
    console.log('EpisodeOfCare created successfully:', result.id);
    return result;
  } catch (error: any) {
    console.error('Error creating EpisodeOfCare:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error creating EpisodeOfCare: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

/**
 * Retrieves an EpisodeOfCare resource by its ID.
 */
export async function getEpisodeOfCareById(
  episodeOfCareId: string,
  client?: MedplumClient,
): Promise<EpisodeOfCare | null | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!episodeOfCareId) {
      throw new Error('EpisodeOfCare ID is required.');
    }
    const result = (await medplumClient.readResource(
      'EpisodeOfCare',
      episodeOfCareId,
    )) as EpisodeOfCare | null;
    console.log(result ? 'EpisodeOfCare retrieved:' : 'EpisodeOfCare not found:', episodeOfCareId);
    return result;
  } catch (error: any) {
    if (error.outcome && error.outcome.issue && error.outcome.issue[0]?.code === 'not-found') {
      console.log(`EpisodeOfCare with ID "${episodeOfCareId}" not found.`);
      return null;
    }
    console.error(`Error retrieving EpisodeOfCare with ID "${episodeOfCareId}":`, error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error retrieving EpisodeOfCare: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

/**
 * Updates an existing EpisodeOfCare resource.
 */
export async function updateEpisodeOfCare(
  episodeOfCareId: string,
  updates: UpdateEpisodeOfCareArgs,
  client?: MedplumClient,
): Promise<EpisodeOfCare | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    if (!episodeOfCareId) {
      throw new Error('EpisodeOfCare ID is required for update.');
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided for EpisodeOfCare.');
    }

    // Fetch the existing resource
    const existingEpisode = await medplumClient.readResource('EpisodeOfCare', episodeOfCareId);
    if (!existingEpisode) {
      // This case should ideally be handled by readResource throwing a not-found error
      // which would be caught and returned as OperationOutcome or null by getEpisodeOfCareById logic
      // For robustness, if it somehow returns null here:
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `EpisodeOfCare with ID "${episodeOfCareId}" not found for update.`,
          },
        ],
      };
    }
    
    // Construct the updated resource. Be careful with deep merges or partial updates.
    // A common strategy for utilities is to merge top-level fields or replace arrays.
    const resourceToUpdate: EpisodeOfCare = {
      ...existingEpisode,
      resourceType: 'EpisodeOfCare', // Ensure resourceType is maintained
      id: episodeOfCareId, // Ensure ID is maintained
    };

    if (updates.status) resourceToUpdate.status = updates.status;
    if (updates.type) resourceToUpdate.type = updates.type; // Replace array
    if (updates.managingOrganizationId) {
      resourceToUpdate.managingOrganization = { reference: `Organization/${updates.managingOrganizationId}` };
    } else if (updates.hasOwnProperty('managingOrganizationId') && updates.managingOrganizationId === null) {
        delete resourceToUpdate.managingOrganization; // Allow unsetting
    }

    if (updates.careManagerId) {
      resourceToUpdate.careManager = { reference: `Practitioner/${updates.careManagerId}` };
    } else if (updates.hasOwnProperty('careManagerId') && updates.careManagerId === null) {
        delete resourceToUpdate.careManager; // Allow unsetting
    }

    // Handle period update
    let periodUpdated = false;
    const currentPeriod = resourceToUpdate.period || {};
    const newPeriod: Period = { ...currentPeriod };
    if (updates.hasOwnProperty('periodStart')) {
      newPeriod.start = updates.periodStart; // Allow null/undefined to clear
      periodUpdated = true;
    }
    if (updates.hasOwnProperty('periodEnd')) {
      newPeriod.end = updates.periodEnd; // Allow null/undefined to clear
      periodUpdated = true;
    }
    if(periodUpdated){
        if(newPeriod.start || newPeriod.end){
            resourceToUpdate.period = newPeriod;
        } else {
            delete resourceToUpdate.period;
        }
    }

    // Remove undefined top-level fields from the merged object that might have been introduced by spread
    Object.keys(resourceToUpdate).forEach(
        (key) => (resourceToUpdate as any)[key] === undefined && delete (resourceToUpdate as any)[key]
    );

    const result = (await medplumClient.updateResource(resourceToUpdate)) as EpisodeOfCare;
    console.log('EpisodeOfCare updated successfully:', result.id);
    return result;
  } catch (error: any) {
    console.error(`Error updating EpisodeOfCare "${episodeOfCareId}":`, error);
     if (error.outcome && error.outcome.issue && error.outcome.issue[0]?.code === 'not-found') {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `EpisodeOfCare with ID "${episodeOfCareId}" not found for update.`,
          },
        ],
      };
    }
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error updating EpisodeOfCare: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
}

/**
 * Searches for EpisodeOfCare resources based on specified criteria.
 */
export async function searchEpisodesOfCare(
  args: EpisodeOfCareSearchArgs,
  client?: MedplumClient,
): Promise<EpisodeOfCare[] | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();
  try {
    const searchCriteria: string[] = [];
    let hasCriteria = false;

    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Standard FHIR search parameters for EpisodeOfCare:
        // patient, status, type, date, identifier, organization, care-manager
        if (key === 'patient' || key === 'status' || key === 'type' || key === 'identifier' || key === 'organization' || key === 'care-manager') {
            searchCriteria.push(`${key}=${encodeURIComponent(String(value))}`);
            hasCriteria = true;
        } else if (key === 'date') {
            if (Array.isArray(value)) {
              value.forEach(d => {
                searchCriteria.push(`date=${encodeURIComponent(d)}`);
              });
            } else {
              // Handle single date string, which might contain '&' for ranges not split by client
              // This logic splits a single string like 'ge2023-01-01&le2023-12-31' into two params
              const dateParams = String(value).split('&');
              dateParams.forEach(dp => {
                searchCriteria.push(`date=${encodeURIComponent(dp)}`);
              });
            }
            hasCriteria = true;
        } else {
            console.warn(`Unsupported search parameter for EpisodeOfCare: ${key}`);
        }
      }
    });

    if (!hasCriteria) {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'At least one search criterion must be provided for searching EpisodeOfCare.',
          },
        ],
      };
    }

    const query = searchCriteria.join('&');
    console.log('Searching EpisodesOfCare with query:', query);

    const result = (await medplumClient.searchResources('EpisodeOfCare', query)) as EpisodeOfCare[];
    console.log(`Found ${result.length} EpisodesOfCare.`);
    return result;
  } catch (error: any) {
    console.error('Error searching EpisodesOfCare:', error);
    const outcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error searching EpisodesOfCare: ${error.message || 'Unknown error'}`,
        },
      ],
    };
    if (error.outcome) {
      return error.outcome as OperationOutcome;
    }
    return outcome;
  }
} 