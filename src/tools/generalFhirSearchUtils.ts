import { Bundle, OperationOutcome, Resource, ResourceType } from '@medplum/fhirtypes';
import { medplum, MedplumClient, ensureAuthenticated } from '../config/medplumClient';

export interface GeneralFhirSearchArgs {
  /** The FHIR resource type to search for (e.g., 'Patient', 'Observation'). */
  resourceType: ResourceType | string; // Allow any string, but ResourceType provides some guidance
  /** A record of query parameters, where keys are FHIR search parameters and values are their corresponding values. */
  queryParams: Record<string, string | number | boolean | string[]>;
}

/**
 * Performs a generic FHIR search operation.
 * Returns a Bundle of resources or an OperationOutcome in case of an error.
 */
export async function generalFhirSearch(
  args: GeneralFhirSearchArgs,
  client?: MedplumClient,
): Promise<Bundle<Resource> | OperationOutcome> {
  const medplumClient = client || medplum;
  await ensureAuthenticated();

  try {
    if (!args.resourceType) {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type is required for general FHIR search.',
          },
        ],
      };
    }

    if (!args.queryParams || Object.keys(args.queryParams).length === 0) {
      return {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'At least one query parameter is required for general FHIR search.',
          },
        ],
      };
    }

    // Construct the query string from queryParams
    const queryString = Object.entries(args.queryParams)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          // For _id, comma-separate: field=_id=v1,v2,v3
          if (key === '_id') {
            return `${encodeURIComponent(key)}=${value.map(v => String(v)).join(',')}`;
          }
          // For other array values, create multiple parameters: key=v1&key=v2
          return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      })
      .join('&');

    console.log(`Performing general FHIR search for type "${args.resourceType}" with query: ${queryString}`);

    // Medplum SDK's search method can take ResourceType or a string for the resource type.
    // The result is a Bundle of the specified Resource type.
    const result = (await medplumClient.search(args.resourceType as ResourceType, queryString)) as Bundle<Resource>; 
    
    console.log(`General FHIR search found ${result.entry?.length || 0} resources.`);
    return result;

  } catch (error: any) {
    console.error(`Error during general FHIR search for type "${args.resourceType}":`, error);
    if (error.outcome) { // Prefer the outcome from the error if available
      return error.outcome as OperationOutcome;
    }
    // Fallback to a generic OperationOutcome
    return {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: `Error during general FHIR search: ${error.message || 'Unknown error'}`,
        },
      ],
    };
  }
} 