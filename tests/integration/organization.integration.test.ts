import { ensureAuthenticated, medplum } from '../../src/config/medplumClient';
import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  CreateOrganizationArgs,
  UpdateOrganizationArgs,
  OrganizationSearchCriteria
} from '../../src/tools/organizationUtils';
import { Organization } from '@medplum/fhirtypes';

// jest.setTimeout(10000); // Increase if tests are slow

describe('Organization Tools Integration Tests', () => {
  let createdOrgId: string | undefined;
  const testOrgBaseName = 'IntegrationTestOrg';
  const uniqueTimestamp = Date.now();
  const testOrgFullName = `${testOrgBaseName}${uniqueTimestamp}`;

  beforeAll(async () => {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      throw new Error('Medplum authentication failed. Cannot run Organization integration tests.');
    }
    console.log('Medplum client authenticated for Organization integration tests.');
  });

  afterAll(async () => {
    if (createdOrgId) {
      try {
        await medplum.deleteResource('Organization', createdOrgId);
        console.log(`Deleted test organization: ${createdOrgId}`);
      } catch (error) {
        console.error(`Error deleting test organization ${createdOrgId}:`, error);
      }
    }
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
      const orgDetails: CreateOrganizationArgs = {
        name: testOrgFullName,
        alias: [`ITO${uniqueTimestamp}`],
        contact: [{
          purpose: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/contactentity-type', code: 'ADMIN' }] },
          telecom: [{ system: 'phone', value: '555-0123', use: 'work' }]
        }]
      };
      const organization = await createOrganization(orgDetails);
      expect(organization).toBeDefined();
      expect(organization.id).toBeDefined();
      createdOrgId = organization.id;
      expect(organization.name).toEqual(testOrgFullName);
      expect(organization.alias?.includes(`ITO${uniqueTimestamp}`)).toBe(true);
    });
  });

  describe('getOrganizationById', () => {
    it('should retrieve an existing organization by ID', async () => {
      expect(createdOrgId).toBeDefined();
      const organization = await getOrganizationById(createdOrgId!);
      expect(organization).toBeDefined();
      expect(organization?.id).toEqual(createdOrgId);
      expect(organization?.name).toEqual(testOrgFullName);
    });

    it('should return undefined for a non-existent organization ID', async () => {
      const organization = await getOrganizationById('non-existent-org-id-12345');
      expect(organization).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('should update an existing organization', async () => {
      expect(createdOrgId).toBeDefined();
      const updates: UpdateOrganizationArgs = {
        alias: [`ITO${uniqueTimestamp}`, `UpdatedITO${uniqueTimestamp}`],
        contact: [{
          purpose: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/contactentity-type', code: 'BILL' }] },
          telecom: [{ system: 'email', value: `org${uniqueTimestamp}@example.com`, use: 'work' }]
        }]
      };
      const updatedOrganization = await updateOrganization(createdOrgId!, updates);
      expect(updatedOrganization).toBeDefined();
      expect(updatedOrganization.alias?.includes(`UpdatedITO${uniqueTimestamp}`)).toBe(true);
      expect(updatedOrganization.contact?.[0]?.purpose?.coding?.[0]?.code).toEqual('BILL');
      expect(updatedOrganization.contact?.[0]?.telecom?.[0]?.value).toEqual(`org${uniqueTimestamp}@example.com`);
    });
  });

  describe('searchOrganizations', () => {
    it('should find an organization by name', async () => {
      const criteria: OrganizationSearchCriteria = { name: testOrgFullName };
      const organizations = await searchOrganizations(criteria);
      expect(organizations).toBeDefined();
      expect(organizations.length).toBeGreaterThanOrEqual(1);
      // Note: searchOrganizations returns Organization[], not BundleEntry<Organization>[], so we access resource directly
      expect(organizations.some(org => org.id === createdOrgId)).toBe(true);
    });

    it('should find an organization by partial name', async () => {
      const criteria: OrganizationSearchCriteria = { name: `${testOrgBaseName}${uniqueTimestamp.toString().substring(0,5)}` }; // Partial match
      const organizations = await searchOrganizations(criteria);
      expect(organizations).toBeDefined();
      expect(organizations.length).toBeGreaterThanOrEqual(1);
      expect(organizations.some(org => org.id === createdOrgId)).toBe(true);
    });

    it('should return an empty array if no criteria match', async () => {
      const criteria: OrganizationSearchCriteria = { name: 'AbsolutelyNonExistentOrg999' };
      const organizations = await searchOrganizations(criteria);
      expect(organizations).toBeDefined();
      expect(organizations.length).toBe(0);
    });
  });
}); 