import {
  Condition,
  OperationOutcome,
  Patient,
  Reference,
  CodeableConcept,
} from '@medplum/fhirtypes';
import {
  createCondition,
  getConditionById,
  searchConditions,
  updateCondition,
  CreateConditionArgs,
  UpdateConditionArgs,
  ConditionClinicalStatusCodes,
  ConditionVerificationStatusCodes,
} from '../../src/tools/conditionUtils';
import { medplum } from '../../src/config/medplumClient';
import { randomUUID } from 'crypto';

const createdConditionIds: string[] = [];
let testPatient: Patient;

describe('Condition Utils Integration Tests', () => {
  beforeAll(async () => {
    try {
      // Create a test patient for the conditions to be linked to
      const patientToCreate: Patient = {
        resourceType: 'Patient',
        name: [{ given: ['ConditionTest'], family: `Patient-${randomUUID()}` }],
      };
      testPatient = await medplum.createResource(patientToCreate);
      console.log('Test patient created for condition tests:', testPatient.id);
    } catch (error) {
      console.error('Failed to create test patient for condition tests', error);
      throw error; // Fail all tests if patient creation fails
    }
  });

  afterAll(async () => {
    console.log(`Cleaning up ${createdConditionIds.length} condition(s)...`);
    for (const id of createdConditionIds) {
      try {
        await medplum.deleteResource('Condition', id);
      } catch (error: any) {
        console.error(`Error deleting condition ${id}:`, error.message);
      }
    }
    if (testPatient?.id) {
      try {
        await medplum.deleteResource('Patient', testPatient.id);
        console.log(`Test patient ${testPatient.id} deleted.`);
      } catch (error) {
        console.error('Failed to delete test patient', error);
      }
    }
  });

  describe('createCondition', () => {
    test('should create a new condition with minimal valid data', async () => {
      const args: CreateConditionArgs = {
        subject: { reference: `Patient/${testPatient.id}` },
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '44054006',
              display: 'Type 2 diabetes mellitus',
            },
          ],
          text: 'Type 2 Diabetes',
        },
        // Rely on default clinicalStatus and verificationStatus
      };

      const result = await createCondition(args);
      console.log('Create condition result:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.resourceType).toBe('Condition');
      const condition = result as Condition;
      expect(condition.id).toBeDefined();
      if (condition.id) {
        createdConditionIds.push(condition.id);
      }
      expect(condition.subject?.reference).toBe(`Patient/${testPatient.id}`);
      expect(condition.code?.coding?.[0]?.code).toBe('44054006');
      expect(condition.clinicalStatus?.coding?.[0]?.code).toBe('active'); // Default
    });

    test('should create a new condition with all fields', async () => {
      const recordedDate = new Date().toISOString();
      const args: CreateConditionArgs = {
        subject: { reference: `Patient/${testPatient.id}` },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }],
          text: 'Hypertension',
        },
        clinicalStatus: { coding: [ConditionClinicalStatusCodes.RESOLVED] },
        verificationStatus: { coding: [ConditionVerificationStatusCodes.CONFIRMED] },
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          }]
        }],
        onsetString: 'Approximately 2 years ago',
        recordedDate,
      };

      const result = await createCondition(args);
      const condition = result as Condition;
      if (condition.id) createdConditionIds.push(condition.id);

      expect(condition.resourceType).toBe('Condition');
      expect(condition.clinicalStatus?.coding?.[0]?.code).toBe('resolved');
      expect(condition.verificationStatus?.coding?.[0]?.code).toBe('confirmed');
      expect(condition.category?.[0]?.coding?.[0]?.code).toBe('encounter-diagnosis');
      expect(condition.onsetString).toBe('Approximately 2 years ago');
      expect(condition.recordedDate).toBe(recordedDate);
    });

    test('should return OperationOutcome if subject is missing', async () => {
      const args = {
        code: { text: 'No subject condition' },
      } as unknown as CreateConditionArgs;

      const result = await createCondition(args);
      expect(result.resourceType).toBe('OperationOutcome');
      const outcome = result as OperationOutcome;
      expect(outcome.issue?.[0]?.diagnostics).toContain('Patient subject reference is required');
    });
  });

  describe('getConditionById', () => {
    let testCondition: Condition;

    beforeAll(async () => {
      const result = await createCondition({
        subject: { reference: `Patient/${testPatient.id}` },
        code: { 
          coding: [{ system: 'http://test.com', code: 'GET-TEST', display: 'Condition for get test' }],
          text: 'Condition for get test' 
        },
      });
      testCondition = result as Condition;
      if (testCondition.id) {
        createdConditionIds.push(testCondition.id);
      }
    });

    test('should retrieve an existing condition by its ID', async () => {
      const result = await getConditionById(testCondition.id as string);
      expect(result).toBeDefined();
      expect(result!.resourceType).toBe('Condition');
      const condition = result as Condition;
      expect(condition.id).toBe(testCondition.id);
      expect(condition.code?.text).toBe('Condition for get test');
    });

    test('should return null for a non-existent condition ID', async () => {
      const nonExistentId = randomUUID();
      const result = await getConditionById(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe('updateCondition', () => {
    let conditionToUpdate: Condition;

    beforeEach(async () => { // Use beforeEach to get a fresh condition for each update test
      const result = await createCondition({
        subject: { reference: `Patient/${testPatient.id}` },
        code: { 
          coding: [{ system: 'http://test.com', code: 'UPDATE-TEST', display: 'Condition to be updated' }],
          text: 'Condition to be updated' 
        },
        clinicalStatus: { coding: [ConditionClinicalStatusCodes.ACTIVE] },
        onsetString: "Original onset"
      });
      conditionToUpdate = result as Condition;
      if (conditionToUpdate.id) {
        createdConditionIds.push(conditionToUpdate.id);
      }
    });

    test('should update the clinicalStatus of a condition', async () => {
      const args: UpdateConditionArgs = {
        id: conditionToUpdate.id as string,
        clinicalStatus: { coding: [ConditionClinicalStatusCodes.INACTIVE] },
      };
      
      const result = await updateCondition(args);
      expect(result.resourceType).toBe('Condition');
      const updated = result as Condition;
      expect(updated.id).toBe(conditionToUpdate.id);
      expect(updated.clinicalStatus?.coding?.[0]?.code).toBe('inactive');
      expect(updated.code?.text).toBe('Condition to be updated'); // Ensure other fields are preserved
    });
    
    test('should remove a field when updated with null', async () => {
      const args: UpdateConditionArgs = {
        id: conditionToUpdate.id as string,
        onsetString: null
      };

      const result = await updateCondition(args);
      expect(result.resourceType).toBe('Condition');
      const updated = result as Condition;
      expect(updated.id).toBe(conditionToUpdate.id);
      expect(updated.onsetString).toBeUndefined();
    });
  });

  describe('searchConditions', () => {
    beforeAll(async () => {
      // Clean up any conditions from other tests
      for (const id of createdConditionIds) {
        await medplum.deleteResource('Condition', id);
      }
      createdConditionIds.length = 0; // Reset the array

      // Create a set of conditions for searching
      const conditionsToCreate = [
        { subject: { reference: `Patient/${testPatient.id}` }, code: { coding: [{ system: 'test', code: 'C-1' }], text: 'Active Test Condition' }, clinicalStatus: { coding: [ConditionClinicalStatusCodes.ACTIVE] } },
        { subject: { reference: `Patient/${testPatient.id}` }, code: { coding: [{ system: 'test', code: 'C-2' }], text: 'Inactive Test Condition' }, clinicalStatus: { coding: [ConditionClinicalStatusCodes.INACTIVE] } },
        { subject: { reference: `Patient/${testPatient.id}` }, code: { coding: [{ system: 'test', code: 'C-3' }], text: 'Resolved Encounter Diagnosis' }, clinicalStatus: { coding: [ConditionClinicalStatusCodes.RESOLVED] }, category: [{ coding: [{ code: 'encounter-diagnosis' }]}] },
      ];

      for (const c of conditionsToCreate) {
        const result = await createCondition(c);
        if(result.resourceType === 'Condition' && result.id) {
            createdConditionIds.push(result.id);
        }
      }
    });

    test('should find conditions by subject ID', async () => {
      const result = await searchConditions({ subject: testPatient.id as string });
      expect(result).toBeInstanceOf(Array);
      const conditions = result as Condition[];
      expect(conditions.length).toBeGreaterThanOrEqual(3);
      expect(conditions.every(c => c.subject?.reference === `Patient/${testPatient.id}`)).toBe(true);
    });

    test('should find conditions by clinical-status', async () => {
      const result = await searchConditions({ subject: testPatient.id, 'clinical-status': 'inactive' });
      expect(result).toBeInstanceOf(Array);
      const conditions = result as Condition[];
      expect(conditions.length).toBe(1);
      expect(conditions[0].clinicalStatus?.coding?.[0]?.code).toBe('inactive');
      expect(conditions[0].code?.coding?.[0]?.code).toBe('C-2');
    });
    
    test('should find conditions by code', async () => {
      const result = await searchConditions({ subject: testPatient.id, code: 'test|C-1' });
      expect(result).toBeInstanceOf(Array);
      const conditions = result as Condition[];
      expect(conditions.length).toBe(1);
      expect(conditions[0].code?.coding?.[0]?.code).toBe('C-1');
    });

    test('should find conditions by category', async () => {
        const result = await searchConditions({ subject: testPatient.id, category: 'encounter-diagnosis' });
        expect(result).toBeInstanceOf(Array);
        const conditions = result as Condition[];
        expect(conditions.length).toBe(1);
        expect(conditions[0].code?.coding?.[0]?.code).toBe('C-3');
    });
    
    test('should return an empty array for non-matching criteria', async () => {
        const result = await searchConditions({ subject: testPatient.id as string, code: 'non-existent' });
        expect(result).toBeInstanceOf(Array);
        expect((result as Condition[]).length).toBe(0);
    });
    
    test('should return OperationOutcome if no criteria provided', async () => {
        const result = await searchConditions({});
        expect(result).not.toBeInstanceOf(Array);
        if (!Array.isArray(result)) {
            expect(result.resourceType).toBe('OperationOutcome');
        } else {
            fail('Expected OperationOutcome but received an array of conditions.');
        }
    });
  });
}); 