import { ensureAuthenticated, medplum } from '../../src/config/medplumClient';
import { searchPractitionersByName } from '../../src/tools/practitionerSearch';
import { Practitioner } from '@medplum/fhirtypes';

// Timeout for async operations, e.g., API calls to Medplum
// Jest default is 5000ms. Increase if tests are timing out due to network latency.
// jest.setTimeout(10000); 

describe('Practitioner Tools Integration Tests', () => {
  // Ensure Medplum client is authenticated once before all tests in this suite
  beforeAll(async () => {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      throw new Error('Medplum authentication failed. Cannot run Practitioner integration tests.');
    }
    console.log('Medplum client authenticated for Practitioner integration tests.');
  });

  describe('searchPractitionersByName', () => {
    it('should find no practitioners for a non-existent name', async () => {
      const practitioners = await searchPractitionersByName({ name: 'NonExistentNameForTest' });
      expect(practitioners).toBeDefined();
      expect(practitioners.length).toBe(0);
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

  // Add afterAll if any cleanup is needed, e.g., deleting test resources
  /* 
  afterAll(async () => {
    // Logic to clean up test data created during the tests
    // For example, delete the patients created (John Doe, Jane Smith)
    // This requires storing their IDs and then calling delete operations.
    console.log('Cleaning up test data...');
    // e.g., if johnDoeId was stored: await medplum.deleteResource('Patient', johnDoeId);
  });
  */
}); 