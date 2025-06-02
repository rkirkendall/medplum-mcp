import { Bundle, OperationOutcome, Patient, Observation, Resource, Practitioner } from '@medplum/fhirtypes';
import { generalFhirSearch, GeneralFhirSearchArgs } from '../../src/tools/generalFhirSearchUtils';
import { medplum } from '../../src/config/medplumClient';
import { randomUUID } from 'crypto';

// Test resources
let testPatient1: Patient;
let testPatient2: Patient;
let testObservation1: Observation;
let testPractitioner1: Practitioner;

describe('generalFhirSearch Integration Tests', () => {
  beforeAll(async () => {
    // Create some resources to search for
    testPatient1 = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ family: 'SearchTest', given: ['GeneralPatient1'] }],
      gender: 'male',
      birthDate: '1980-01-01',
    });
    testPatient2 = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ family: 'SearchTest', given: ['GeneralPatient2'] }],
      gender: 'female',
      active: true,
    });
    testPractitioner1 = await medplum.createResource<Practitioner>({
        resourceType: 'Practitioner',
        name: [{ family: 'GeneralSearchDoc', given: ['Test']}],
        active: true,
    });
    testObservation1 = await medplum.createResource<Observation>({
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8302-2' }], text: 'Body Height' }, // Body Height
      subject: { reference: `Patient/${testPatient1.id}` },
      valueQuantity: { value: 175, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' },
      effectiveDateTime: new Date().toISOString(),
    });

    expect(testPatient1?.id).toBeDefined();
    expect(testPatient2?.id).toBeDefined();
    expect(testPractitioner1?.id).toBeDefined();
    expect(testObservation1?.id).toBeDefined();
  });

  afterAll(async () => {
    // Clean up created resources
    if (testPatient1?.id) await medplum.deleteResource('Patient', testPatient1.id);
    if (testPatient2?.id) await medplum.deleteResource('Patient', testPatient2.id);
    if (testPractitioner1?.id) await medplum.deleteResource('Practitioner', testPractitioner1.id);
    if (testObservation1?.id) await medplum.deleteResource('Observation', testObservation1.id);
  });

  test('should successfully search for Patients by family name', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'Patient',
      queryParams: { family: 'SearchTest' },
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Patient>; // Type assertion for Patient
    expect(bundle.entry?.length).toBeGreaterThanOrEqual(2);
    expect(bundle.entry?.some(e => e.resource?.id === testPatient1.id)).toBeTruthy();
    expect(bundle.entry?.some(e => e.resource?.id === testPatient2.id)).toBeTruthy();
  });

  test('should successfully search for active Patients', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'Patient',
      queryParams: { active: 'true' }, // boolean typically as string in FHIR search
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Patient>; 
    expect(bundle.entry?.length).toBeGreaterThanOrEqual(1);
    expect(bundle.entry?.some(e => e.resource?.id === testPatient2.id)).toBeTruthy();
    expect(bundle.entry?.every(e => e.resource?.active === true)).toBeTruthy();
  });

  test('should successfully search for Observations by patient and code', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'Observation',
      queryParams: {
        subject: `Patient/${testPatient1.id}`,
        code: 'http://loinc.org|8302-2',
      },
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Observation>; 
    expect(bundle.entry?.length).toBe(1);
    expect(bundle.entry?.[0]?.resource?.id).toBe(testObservation1.id);
  });
  
  test('should search for Practitioners by name', async () => {
    const args: GeneralFhirSearchArgs = {
        resourceType: 'Practitioner',
        queryParams: { name: 'GeneralSearchDoc' }
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Practitioner>; 
    expect(bundle.entry?.length).toBeGreaterThanOrEqual(1);
    expect(bundle.entry?.some(e => e.resource?.id === testPractitioner1.id)).toBeTruthy();
  });

  test('should handle array query parameters (e.g., multiple _id)', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'Patient',
      queryParams: { _id: [testPatient1.id as string, testPatient2.id as string] },
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Patient>; 
    expect(bundle.entry?.length).toBe(2);
    const ids = bundle.entry?.map(e => e.resource?.id).sort();
    expect(ids).toEqual([testPatient1.id, testPatient2.id].sort());
  });

  test('should return an empty bundle for non-matching criteria', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'Patient',
      queryParams: { family: `NonExistentFamily-${randomUUID()}` },
    };
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('Bundle');
    const bundle = result as Bundle<Patient>; 
    expect(bundle.entry?.length || 0).toBe(0);
  });

  test('should return OperationOutcome if resourceType is missing', async () => {
    const args = {
      queryParams: { name: 'Test' },
    } as unknown as GeneralFhirSearchArgs; // Missing resourceType, cast to unknown first
    const result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('OperationOutcome');
    const outcome = result as OperationOutcome;
    expect(outcome.issue?.[0]?.diagnostics).toContain('Resource type is required');
  });

  test('should return OperationOutcome if queryParams is missing or empty', async () => {
    let args: GeneralFhirSearchArgs = {
      resourceType: 'Patient',
      queryParams: {},
    };
    let result = await generalFhirSearch(args);
    expect(result.resourceType).toBe('OperationOutcome');
    let outcome = result as OperationOutcome;
    expect(outcome.issue?.[0]?.diagnostics).toContain('At least one query parameter is required');

    // Test for queryParams entirely missing
    const argsMissingQueryParams = { resourceType: 'Patient' } as unknown as GeneralFhirSearchArgs; 
    
    result = await generalFhirSearch(argsMissingQueryParams);
    expect(result.resourceType).toBe('OperationOutcome');
    outcome = result as OperationOutcome;
    expect(outcome.issue?.[0]?.diagnostics).toContain('At least one query parameter is required');
  });

  test('should return OperationOutcome for an invalid resource type', async () => {
    const args: GeneralFhirSearchArgs = {
      resourceType: 'InvalidResourceTypeABC',
      queryParams: { name: 'Test' },
    };
    const result = await generalFhirSearch(args);
    // This will likely be caught by the Medplum SDK and returned as a specific FHIR error (e.g., 404 or 400)
    // which the utility should wrap into an OperationOutcome.
    expect(result.resourceType).toBe('OperationOutcome');
    const outcome = result as OperationOutcome;
    expect(outcome.issue?.[0]?.severity).toBe('error');
    // Check that there is an issue reported, and it has details or diagnostics.
    expect(outcome.issue?.length).toBeGreaterThan(0);
    expect(outcome.issue?.[0]?.code).toBe('structure'); // As seen from logs
    expect(outcome.issue?.[0]?.details?.text).toContain('Unknown resource type'); 
  });

   test('should correctly build query string with multiple array parameters', async () => {
    // This test is more of a unit test for query string construction logic within generalFhirSearch,
    // but it's useful to have here as an integration check too.
    // We won't actually call the function, but check the console log for the query string.
    const consoleSpy = jest.spyOn(console, 'log');
    const args: GeneralFhirSearchArgs = {
      resourceType: 'FakeResource', // Does not need to exist for this spy test
      queryParams: {
        status: 'active',
        date: ['ge2024-01-01', 'le2024-01-31'],
        category: ['vital-signs', 'laboratory'],
      },
    };

    // Call the function (it might fail if FakeResource is not valid, but we only care about the console.log)
    try {
      await generalFhirSearch(args);
    } catch (e) {
      // Ignore errors as we are spying on console.log before potential Medplum SDK errors
    }

    let generatedQuery = '';
    // Find the log entry that contains the query string
    for (const call of consoleSpy.mock.calls) {
        if (typeof call[0] === 'string' && call[0].includes('Performing general FHIR search')) {
            generatedQuery = call[0].substring(call[0].indexOf('with query: ') + 'with query: '.length);
            break;
        }
    }
    
    // The order of parameters in the final query string can vary, so we check for parts.
    // Corrected expected parts:
    expect(generatedQuery).toContain('status=active');
    expect(generatedQuery).toContain('date=ge2024-01-01');
    expect(generatedQuery).toContain('date=le2024-01-31');
    expect(generatedQuery).toContain('category=vital-signs');
    expect(generatedQuery).toContain('category=laboratory');
    
    // Also check the number of '&' which should be number of params - 1
    // In this case: status=active & date=ge2024-01-01 & date=le2024-01-31 & category=vital-signs & category=laboratory
    // So, 5 parameters means 4 ampersands.
    const ampersandCount = (generatedQuery.match(/&/g) || []).length;
    expect(ampersandCount).toBe(4);

    consoleSpy.mockRestore();
  });

}); 