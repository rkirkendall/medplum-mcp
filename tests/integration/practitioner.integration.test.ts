import { ensureAuthenticated, medplum } from '../../src/config/medplumClient';
import {
  searchPractitionersByName,
  createPractitioner,
  getPractitionerById,
  updatePractitioner,
  searchPractitioners,
  CreatePractitionerArgs,
  UpdatePractitionerArgs,
  PractitionerSearchCriteria
} from '../../src/tools/practitionerUtils';
import { Practitioner } from '@medplum/fhirtypes';

// Timeout for async operations, e.g., API calls to Medplum
// Jest default is 5000ms. Increase if tests are timing out due to network latency.
// jest.setTimeout(10000); 

describe('Practitioner Tools Integration Tests', () => {
  let createdPractitionerId: string | undefined;
  const testPractitionerBase = {
    givenName: 'IntegrationTest',
    familyName: 'Practitioner'
  };
  const uniqueTimestamp = Date.now();

  // Ensure Medplum client is authenticated once before all tests in this suite
  beforeAll(async () => {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      throw new Error('Medplum authentication failed. Cannot run Practitioner integration tests.');
    }
    console.log('Medplum client authenticated for Practitioner integration tests.');
  });

  afterAll(async () => {
    if (createdPractitionerId) {
      try {
        await medplum.deleteResource('Practitioner', createdPractitionerId);
        console.log(`Deleted test practitioner: ${createdPractitionerId}`);
      } catch (error) {
        console.error(`Error deleting test practitioner ${createdPractitionerId}:`, error);
      }
    }
  });

  describe('createPractitioner', () => {
    it('should create a new practitioner', async () => {
      const practitionerDetails: CreatePractitionerArgs = {
        ...testPractitionerBase,
        familyName: `${testPractitionerBase.familyName}${uniqueTimestamp}`,
        identifier: [{ system: 'http://example.com/test-id', value: `prac-id-${uniqueTimestamp}` }],
        telecom: [{ system: 'phone', value: '555-0100', use: 'work' }],
      };
      const practitioner = await createPractitioner(practitionerDetails);
      expect(practitioner).toBeDefined();
      expect(practitioner.id).toBeDefined();
      createdPractitionerId = practitioner.id;
      expect(practitioner.name?.[0]?.given?.[0]).toEqual(practitionerDetails.givenName);
      expect(practitioner.name?.[0]?.family).toEqual(practitionerDetails.familyName);
      expect(practitioner.identifier?.[0]?.value).toEqual(practitionerDetails.identifier?.[0].value);
    });
  });

  describe('getPractitionerById', () => {
    it('should retrieve an existing practitioner by ID', async () => {
      expect(createdPractitionerId).toBeDefined(); // Ensure create test ran first and set ID
      const practitioner = await getPractitionerById(createdPractitionerId!);
      expect(practitioner).toBeDefined();
      expect(practitioner?.id).toEqual(createdPractitionerId);
      expect(practitioner?.name?.[0]?.family).toEqual(`${testPractitionerBase.familyName}${uniqueTimestamp}`);
    });

    it('should return undefined for a non-existent practitioner ID', async () => {
      const practitioner = await getPractitionerById('non-existent-id-12345');
      expect(practitioner).toBeNull();
    });
  });

  describe('updatePractitioner', () => {
    it('should update an existing practitioner', async () => {
      expect(createdPractitionerId).toBeDefined();
      const updates: UpdatePractitionerArgs = {
        active: true,
        telecom: [{ system: 'email', value: `test${uniqueTimestamp}@example.com`, use: 'work' }],
      };
      const updatedPractitioner = await updatePractitioner(createdPractitionerId!, updates);
      expect(updatedPractitioner).toBeDefined();
      expect(updatedPractitioner.active).toBe(true);
      expect(updatedPractitioner.telecom?.some(t => t.value === `test${uniqueTimestamp}@example.com`)).toBe(true);
    });
  });

  describe('searchPractitionersByName (existing specific search)', () => {
    it('should find a practitioner by family name using searchPractitionersByName', async () => {
      const practitioners = await searchPractitionersByName({ familyName: `${testPractitionerBase.familyName}${uniqueTimestamp}` });
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBeGreaterThanOrEqual(1);
      expect(practitioners.some(p => p.id === createdPractitionerId)).toBe(true);
    });

    it('should find no practitioners for a non-existent name using searchPractitionersByName', async () => {
      const practitioners = await searchPractitionersByName({ name: 'NonExistentNameForTest123' });
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBe(0);
    });
  });

  describe('searchPractitioners (general search)', () => {
    it('should find a practitioner by identifier using general search', async () => {
      const criteria: PractitionerSearchCriteria = { identifier: `prac-id-${uniqueTimestamp}` };
      const practitioners = await searchPractitioners(criteria);
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBeGreaterThanOrEqual(1);
      expect(practitioners.some(p => p.id === createdPractitionerId)).toBe(true);
    });

    it('should find a practitioner by partial name using general search', async () => {
      const criteria: PractitionerSearchCriteria = { name: testPractitionerBase.givenName }; 
      const practitioners = await searchPractitioners(criteria);
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBeGreaterThanOrEqual(1);
      expect(practitioners.some(p => p.id === createdPractitionerId)).toBe(true);
    });
    
    it('should return an empty array if no criteria match for general search', async () => {
      const criteria: PractitionerSearchCriteria = { name: 'AbsolutelyNonExistentName999' };
      const practitioners = await searchPractitioners(criteria);
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBe(0);
    });

    it('should handle search with no criteria gracefully (return empty or all, depending on util logic)', async () => {
      // The practitionerUtils.searchPractitioners logs a warning and returns results if no criteria.
      // This test just ensures it doesn't crash.
      const practitioners = await searchPractitioners({});
      expect(practitioners).toBeDefined(); // Should return an array (possibly empty or all based on SDK default)
    });
  });

  // Example: Test for a known practitioner (if you add one to your Medplum instance)
  /*
  it('should find a specific practitioner by name', async () => {
    // First, ensure a practitioner like 'Dr. Test Example' exists in your Medplum instance
    // For example, by creating one via Medplum UI or another script if not already present
    const practitionerName = 'Test Example'; // Adjust as per your test data
    const practitioners = await searchPractitionersByName({ name: practitionerName });
    expect(practitioners).toBeDefined();
    expect(practitioners.length).toBeGreaterThan(0);
    expect(practitioners[0].name?.[0]?.family).toEqual('Example'); // Or a more specific check
  });
  */
}); 