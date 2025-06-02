import {
  Medication,
  OperationOutcome,
  Reference,
  Organization,
  CodeableConcept,
  Identifier,
} from '@medplum/fhirtypes';
import {
  createMedication,
  getMedicationById,
  searchMedications,
  CreateMedicationArgs,
  MedicationSearchArgs,
  MedicationStatus,
} from '../../src/tools/medicationUtils';
import { medplum } from '../../src/config/medplumClient';
import { randomUUID } from 'crypto';

// Global variable to store IDs of created resources for cleanup
const createdMedicationIds: string[] = [];
let testOrganization: Organization | undefined;

describe('Medication Utils Integration Tests', () => {
  beforeAll(async () => {
    // You might want to create a dummy Organization if manufacturer testing is critical
    // For now, we'll skip it to keep it simple, manufacturer will be an optional reference string
    try {
      const orgToCreate: Organization = {
        resourceType: 'Organization',
        name: `Test Manufacturer Org ${randomUUID()}`,
        active: true,
      };
      testOrganization = await medplum.createResource(orgToCreate);
      console.log('Test organization created for medication tests:', testOrganization.id);
    } catch (error) {
      console.error('Failed to create test organization for medication tests', error);
      // Proceed without it, manufacturer tests might be limited
    }
  });

  afterAll(async () => {
    console.log(`Cleaning up ${createdMedicationIds.length} medication(s)...`);
    for (const id of createdMedicationIds) {
      try {
        await medplum.deleteResource('Medication', id);
        console.log(`Medication ${id} deleted.`);
      } catch (error: any) {
        // Log error if deletion fails but don't fail the test suite
        console.error(`Error deleting medication ${id}:`, error.message);
        if (error.outcome) {
          console.error('Details:', JSON.stringify(error.outcome, null, 2));
        }
      }
    }
    if (testOrganization?.id) {
      try {
        await medplum.deleteResource('Organization', testOrganization.id);
        console.log(`Test organization ${testOrganization.id} deleted.`);
      } catch (error) {
        console.error('Failed to delete test organization', error);
      }
    }
  });

  describe('createMedication', () => {
    test('should create a new medication with minimal valid data', async () => {
      const uniqueCode = randomUUID().slice(0, 8);
      const args: CreateMedicationArgs = {
        code: {
          coding: [
            {
              system: 'http://www.test.com/med-codes',
              code: `TEST-${uniqueCode}`,
              display: `Test Med ${uniqueCode}`,
            },
          ],
          text: `Test Medication ${uniqueCode}`,
        },
        status: 'active',
      };

      const result = await createMedication(args);
      console.log('Create medication result:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.resourceType).not.toBe('OperationOutcome');
      const medication = result as Medication;
      expect(medication.id).toBeDefined();
      if (medication.id) {
        createdMedicationIds.push(medication.id);
      }
      expect(medication.code?.coding?.[0]?.code).toBe(`TEST-${uniqueCode}`);
      expect(medication.status).toBe('active');
    });

    test('should create a new medication with all fields', async () => {
      const uniqueCode = randomUUID().slice(0, 8);
      const identifierValue = randomUUID();
      const args: CreateMedicationArgs = {
        code: {
          coding: [
            {
              system: 'http://www.rxnorm.test/codes',
              code: `RXN-${uniqueCode}`,
              display: `RxNorm Test Med ${uniqueCode}`,
            },
          ],
          text: `RxNorm Test Medication ${uniqueCode}`,
        },
        status: 'inactive',
        form: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '385055001', // Oral tablet
              display: 'Oral tablet',
            },
          ],
          text: 'Oral tablet',
        },
        manufacturer: testOrganization?.id ? { reference: `Organization/${testOrganization.id}` } : undefined,
        identifier: [
          {
            system: 'http://www.test.com/med-ids',
            value: identifierValue,
          },
        ],
      };

      const result = await createMedication(args);
      console.log('Create medication (all fields) result:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.resourceType).not.toBe('OperationOutcome');
      const medication = result as Medication;
      expect(medication.id).toBeDefined();
      if (medication.id) {
        createdMedicationIds.push(medication.id);
      }
      expect(medication.code?.coding?.[0]?.code).toBe(`RXN-${uniqueCode}`);
      expect(medication.status).toBe('inactive');
      expect(medication.form?.coding?.[0]?.code).toBe('385055001');
      if (testOrganization?.id) {
        expect(medication.manufacturer?.reference).toBe(`Organization/${testOrganization.id}`);
      }
      expect(medication.identifier?.[0]?.value).toBe(identifierValue);
    });

    test('should return OperationOutcome if code is missing', async () => {
      const args = {
        // code is missing
        status: 'active',
      } as unknown as CreateMedicationArgs;

      const result = await createMedication(args);
      console.log('Create medication (missing code) result:', JSON.stringify(result, null, 2));
      expect(result).toBeDefined();
      expect(result.resourceType).toBe('OperationOutcome');
      const outcome = result as OperationOutcome;
      expect(outcome.issue?.[0]?.diagnostics).toContain('Medication code with at least one coding is required');
    });
  });

  describe('getMedicationById', () => {
    let createdTestMedication: Medication;
    const uniqueCodeForGet = randomUUID().slice(0, 8);

    beforeAll(async () => {
      // Create a medication to be used for get tests
      const args: CreateMedicationArgs = {
        code: {
          coding: [
            {
              system: 'http://www.test.com/med-codes-for-get',
              code: `GET-${uniqueCodeForGet}`,
              display: `Test Med for Get ${uniqueCodeForGet}`,
            },
          ],
          text: `Test Medication for Get ${uniqueCodeForGet}`,
        },
        status: 'active',
      };
      const result = await createMedication(args);
      expect(result.resourceType).not.toBe('OperationOutcome');
      createdTestMedication = result as Medication;
      if (createdTestMedication.id) {
        createdMedicationIds.push(createdTestMedication.id); // Add to global list for cleanup
      }
    });

    test('should retrieve an existing medication by its ID', async () => {
      expect(createdTestMedication?.id).toBeDefined();
      const medicationId = createdTestMedication.id as string;

      const result = await getMedicationById(medicationId);
      console.log('Get medication by ID result:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.resourceType).toBe('Medication');
      const medication = result as Medication;
      expect(medication.id).toBe(medicationId);
      expect(medication.code?.coding?.[0]?.code).toBe(`GET-${uniqueCodeForGet}`);
    });

    test('should return null for a non-existent medication ID', async () => {
      const nonExistentId = randomUUID();
      const result = await getMedicationById(nonExistentId);
      console.log('Get medication by non-existent ID result:', JSON.stringify(result, null, 2));

      expect(result).toBeNull();
    });

    test('should return OperationOutcome for an empty medication ID string', async () => {
      const result = await getMedicationById('');
      console.log('Get medication by empty ID result:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result!.resourceType).toBe('OperationOutcome');
      const outcome = result as OperationOutcome;
      expect(outcome.issue?.[0]?.diagnostics).toContain('Medication ID is required');
    });
  });

  describe('searchMedications', () => {
    const searchTestSystem = 'http://www.search-test.com/meds';
    const medicationsForSearch: { args: CreateMedicationArgs; id?: string }[] = [
      {
        args: {
          code: { coding: [{ system: searchTestSystem, code: 'SRCH-001', display: 'Search Med Alpha (Active)' }], text: 'Search Med Alpha' },
          status: 'active',
          identifier: [{ system: 'urn:test:med-ids', value: 'ID-ALPHA-001' }],
        },
      },
      {
        args: {
          code: { coding: [{ system: searchTestSystem, code: 'SRCH-002', display: 'Search Med Beta (Inactive)' }], text: 'Search Med Beta' },
          status: 'inactive',
          identifier: [{ system: 'urn:test:med-ids', value: 'ID-BETA-002' }],
        },
      },
      {
        args: {
          code: { coding: [{ system: searchTestSystem, code: 'SRCH-003', display: 'Search Med Gamma (Active)' }], text: 'Search Med Gamma' },
          status: 'active',
          identifier: [{ system: 'urn:test:med-ids', value: 'ID-GAMMA-003' }],
          form: { coding: [{ system: 'http://snomed.info/sct', code: '385055001' }], text: 'Oral tablet' }, // Oral Tablet
        },
      },
      {
        args: { // Another active one with a different code system for variety
          code: { coding: [{ system: 'http://www.another-sys.com/meds', code: 'ASYS-100', display: 'Another Sys Med Delta (Active)' }], text: 'Another Sys Med Delta' },
          status: 'active',
        },
      },
    ];

    beforeAll(async () => {
      for (const med of medicationsForSearch) {
        const result = await createMedication(med.args);
        if (result.resourceType === 'Medication') {
          med.id = result.id;
          if (result.id) createdMedicationIds.push(result.id);
        } else {
          console.error('Failed to create medication for search tests:', result);
        }
      }
      // Ensure all medications were created, otherwise tests might be unreliable
      expect(medicationsForSearch.every(m => m.id)).toBe(true);
    });

    test('should return OperationOutcome if no search criteria are provided', async () => {
      const result = await searchMedications({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(false);
      if (!Array.isArray(result)) {
        expect(result.resourceType).toBe('OperationOutcome');
        const outcome = result as OperationOutcome;
        expect(outcome.issue?.[0]?.diagnostics).toContain('At least one search criterion (code, identifier, or status) must be provided');
      }
    });

    test('should find medications by code (system|value)', async () => {
      const result = await searchMedications({ code: `${searchTestSystem}|SRCH-001` });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(1);
      expect(meds.some(m => m.code?.coding?.[0]?.code === 'SRCH-001')).toBe(true);
    });

    test('should find medications by code (value only)', async () => {
      const result = await searchMedications({ code: 'SRCH-002' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(1);
      expect(meds.some(m => m.code?.coding?.[0]?.code === 'SRCH-002')).toBe(true);
    });
    
    test('should find medications by identifier (system|value)', async () => {
      const result = await searchMedications({ identifier: 'urn:test:med-ids|ID-ALPHA-001' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(1);
      expect(meds.some(m => m.identifier?.[0]?.value === 'ID-ALPHA-001')).toBe(true);
    });

    test('should find medications by identifier (value only)', async () => {
      const result = await searchMedications({ identifier: 'ID-BETA-002' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(1);
      expect(meds.some(m => m.identifier?.[0]?.value === 'ID-BETA-002')).toBe(true);
    });

    test('should find medications by status (active)', async () => {
      const result = await searchMedications({ status: 'active' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(3); // SRCH-001, SRCH-003, ASYS-100
      expect(meds.every(m => m.status === 'active')).toBe(true);
    });

    test('should find medications by status (inactive)', async () => {
      const result = await searchMedications({ status: 'inactive' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBeGreaterThanOrEqual(1); // SRCH-002
      expect(meds.every(m => m.status === 'inactive')).toBe(true);
      expect(meds.some(m => m.code?.coding?.[0]?.code === 'SRCH-002')).toBe(true);
    });
    
    test('should find medications by a combination of code and status', async () => {
      const result = await searchMedications({ code: `${searchTestSystem}|SRCH-003`, status: 'active' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBe(1);
      expect(meds[0].code?.coding?.[0]?.code).toBe('SRCH-003');
      expect(meds[0].status).toBe('active');
    });

    test('should return an empty array if no medications match criteria', async () => {
      const result = await searchMedications({ code: 'NON-EXISTENT-CODE-XYZ' });
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBe(0);
    });

    test('should find medication with specific form by code (indirectly, by checking created data)', async () => {
      // This test ensures that the medication with a form was created and can be found by its code.
      // The search function itself doesn't directly search by form.
      const result = await searchMedications({ code: `${searchTestSystem}|SRCH-003`});
      expect(result).toBeInstanceOf(Array);
      const meds = result as Medication[];
      expect(meds.length).toBe(1);
      expect(meds[0].form?.coding?.[0]?.code).toBe('385055001');
    });
  });
}); 