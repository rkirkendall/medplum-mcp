import { MedplumClient, normalizeErrorString } from '@medplum/core';
import { Organization, BundleEntry, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { medplum, ensureAuthenticated } from '../config/medplumClient';

export interface CreateOrganizationArgs {
  name: string;
  alias?: string[];
  contact?: Organization['contact'];
  // Add other relevant Organization fields as needed by the LLM or use cases
  // For example: type, address, partOf (reference to parent organization)
}

export interface UpdateOrganizationArgs extends Partial<CreateOrganizationArgs> {
  // We'll allow partial updates of fields defined in CreateOrganizationArgs
  // plus other updatable fields.
  // Ensure 'id' is not part of this, as it's a separate parameter for the update function.
}

/**
 * Creates a new Organization resource.
 * @param args - The details for the new organization.
 * @returns The created Organization resource.
 */
export async function createOrganization(args: CreateOrganizationArgs): Promise<Organization> {
  try {
    await ensureAuthenticated();
    const organization: Organization = {
      resourceType: 'Organization',
      name: args.name,
      alias: args.alias,
      contact: args.contact,
      // Potentially map other args fields here
    };
    const createdOrganization = await medplum.createResource(organization);
    console.log('Organization created successfully:', createdOrganization.id);
    return createdOrganization;
  } catch (error) {
    console.error('Error creating organization:', normalizeErrorString(error));
    throw new Error(`Failed to create organization: ${normalizeErrorString(error)}`);
  }
}

/**
 * Retrieves an Organization resource by its ID.
 * @param organizationId - The ID of the organization to retrieve.
 * @returns The Organization resource.
 */
export async function getOrganizationById(organizationId: string): Promise<Organization | undefined> {
  try {
    await ensureAuthenticated();
    const organization = await medplum.readResource('Organization', organizationId);
    console.log('Organization retrieved successfully:', organization.id);
    return organization;
  } catch (error) {
    console.error(`Error retrieving organization ${organizationId}:`, normalizeErrorString(error));
    // Medplum SDK throws error if not found, so we might want to return undefined or handle specific error types
    if (normalizeErrorString(error).includes('Not found')) {
        return undefined;
    }
    throw new Error(`Failed to retrieve organization ${organizationId}: ${normalizeErrorString(error)}`);
  }
}

/**
 * Updates an existing Organization resource.
 * @param organizationId - The ID of the organization to update.
 * @param updates - The partial data to update the organization with.
 * @returns The updated Organization resource.
 */
export async function updateOrganization(
  organizationId: string,
  updates: UpdateOrganizationArgs
): Promise<Organization> {
  try {
    await ensureAuthenticated();
    const existingOrganization = await getOrganizationById(organizationId);
    if (!existingOrganization) {
      throw new Error(`Organization with ID ${organizationId} not found.`);
    }

    const organizationToUpdate: Organization = {
      ...existingOrganization,
      ...updates,
      id: organizationId, // Ensure ID is maintained
      resourceType: 'Organization', // Ensure resourceType is maintained
    };

    const updatedOrganization = await medplum.updateResource(organizationToUpdate);
    console.log('Organization updated successfully:', updatedOrganization.id);
    return updatedOrganization;
  } catch (error) {
    console.error(`Error updating organization ${organizationId}:`, normalizeErrorString(error));
    throw new Error(`Failed to update organization ${organizationId}: ${normalizeErrorString(error)}`);
  }
}

export interface OrganizationSearchCriteria {
  name?: string;
  address?: string;
  // Add other searchable fields as needed, e.g., 'address-city', 'address-postalcode'
  // Medplum search parameters: https://www.medplum.com/docs/search/clinical-resources/organization
}

/**
 * Searches for Organization resources based on criteria.
 * @param criteria - The search criteria.
 * @returns A bundle of Organization resources matching the criteria.
 */
export async function searchOrganizations(criteria: OrganizationSearchCriteria): Promise<Organization[]> {
  try {
    await ensureAuthenticated();
    const searchParams: Record<string, string> = {};
    if (criteria.name) {
      searchParams.name = criteria.name;
    }
    if (criteria.address) {
      searchParams.address = criteria.address;
    }

    if (Object.keys(searchParams).length === 0) {
       throw new Error('Search criteria must be provided for organizations.');
    }

    // Let TypeScript infer the return type from the 'Organization' string literal argument
    const organizations: Organization[] = await medplum.searchResources('Organization', searchParams);
    
    console.log(`Found ${organizations.length} organizations matching criteria.`);
    return organizations;
  } catch (error) {
    console.error('Error searching organizations:', normalizeErrorString(error));
    throw new Error(`Failed to search organizations: ${normalizeErrorString(error)}`);
  }
}

// Example usage (for testing purposes, can be removed or moved to a test file)
/*
async function testOrganizationTools() {
  // Make sure Medplum is authenticated
  // await ensureAuthenticated(); // You'd need to import and call this if running standalone

  let orgId = '';

  // Test createOrganization
  try {
    const newOrg = await createOrganization({
      name: 'Sunset General Hospital',
      alias: ['SGH', 'Sunset General'],
      contact: [{
        purpose: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/contactentity-type', code: 'ADMIN' }]
        },
        telecom: [{ system: 'phone', value: '555-123-4567' }]
      }]
    });
    orgId = newOrg.id as string;
    console.log('Created Org ID:', orgId);
  } catch (e) {
    console.error(e);
  }

  if (!orgId) {
    console.error('Organization creation failed, aborting further tests.');
    return;
  }

  // Test getOrganizationById
  try {
    const fetchedOrg = await getOrganizationById(orgId);
    if (fetchedOrg) {
      console.log('Fetched Org Name:', fetchedOrg.name);
    } else {
      console.log('Fetched Org not found by ID:', orgId);
    }
  } catch (e) {
    console.error(e);
  }

  // Test updateOrganization
  try {
    const updatedOrg = await updateOrganization(orgId, { alias: ['SGH', 'Sunset General', 'Sunset Community Hospital'] });
    console.log('Updated Org Aliases:', updatedOrg.alias);
  } catch (e) {
    console.error(e);
  }

  // Test searchOrganizations
  try {
    console.log('\nSearching for organizations with name "Sunset":');
    const orgsByName = await searchOrganizations({ name: 'Sunset' });
    orgsByName.forEach(entry => console.log('-', entry.name));

    console.log('\nSearching for organizations with specific name "Sunset General Hospital":');
    const orgsExactName = await searchOrganizations({ name: 'Sunset General Hospital' });
     orgsExactName.forEach(entry => console.log('-', entry.name));


    // console.log('\nSearching for organizations with address containing "123 Main St":');
    // const orgsByAddress = await searchOrganizations({ address: '123 Main St' }); // Assuming an org with this address exists
    // orgsByAddress.forEach(entry => console.log('-', entry.resource?.name, entry.resource?.address?.[0]?.line?.join(' ')));

    console.log('\nAttempting search with no criteria (should fail or return none based on implementation):');
    try {
        const noCriteriaSearch = await searchOrganizations({});
        console.log('Search with no criteria returned:', noCriteriaSearch.length, 'organizations');
    } catch (e) {
        console.error('Search with no criteria failed as expected:', e);
    }


  } catch (e) {
    console.error(e);
  }
}

// testOrganizationTools();
*/ 