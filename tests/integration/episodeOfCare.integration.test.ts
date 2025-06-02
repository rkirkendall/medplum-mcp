import {
  EpisodeOfCare,
  OperationOutcome,
  Patient,
  Organization,
  Practitioner,
  CodeableConcept,
} from '@medplum/fhirtypes';
import {
  createEpisodeOfCare,
  getEpisodeOfCareById,
  updateEpisodeOfCare,
  searchEpisodesOfCare,
  CreateEpisodeOfCareArgs,
  UpdateEpisodeOfCareArgs,
  EpisodeOfCareSearchArgs,
  EpisodeOfCareStatus,
} from '../../src/tools/episodeOfCareUtils';
import { medplum } from '../../src/config/medplumClient';
import { randomUUID } from 'crypto';

// Global vars for test resources
let testPatient: Patient;
let testOrganization: Organization;
let testPractitioner: Practitioner;
const createdEpisodeOfCareIds: string[] = [];

describe('EpisodeOfCare Utils Integration Tests', () => {
  beforeAll(async () => {
    // Create a Patient
    const patientToCreate: Patient = {
      resourceType: 'Patient',
      name: [{ given: ['TestEoCFirstName'], family: `TestEoCLastName-${randomUUID().slice(0,4)}` }],
      gender: 'male',
      birthDate: '1970-01-01',
    };
    testPatient = await medplum.createResource(patientToCreate);
    console.log('Test Patient created for EoC tests:', testPatient.id);

    // Create an Organization
    const orgToCreate: Organization = {
      resourceType: 'Organization',
      name: `Test EoC Org ${randomUUID().slice(0,4)}`,
      active: true,
    };
    testOrganization = await medplum.createResource(orgToCreate);
    console.log('Test Organization created for EoC tests:', testOrganization.id);

    // Create a Practitioner (Care Manager)
    const practToCreate: Practitioner = {
      resourceType: 'Practitioner',
      name: [{ given: ['TestEoCCareMgrFirst'], family: `TestEoCCareMgrLast-${randomUUID().slice(0,4)}` }],
      active: true,
    };
    testPractitioner = await medplum.createResource(practToCreate);
    console.log('Test Practitioner created for EoC tests:', testPractitioner.id);
    
    expect(testPatient.id).toBeDefined();
    expect(testOrganization.id).toBeDefined();
    expect(testPractitioner.id).toBeDefined();
  });

  afterAll(async () => {
    console.log(`Cleaning up ${createdEpisodeOfCareIds.length} EpisodeOfCare(s)...`);
    for (const id of createdEpisodeOfCareIds) {
      try {
        await medplum.deleteResource('EpisodeOfCare', id);
      } catch (error) {
        console.error(`Error deleting EpisodeOfCare ${id}:`, error);
      }
    }
    // Clean up shared resources
    if (testPatient?.id) await medplum.deleteResource('Patient', testPatient.id);
    if (testOrganization?.id) await medplum.deleteResource('Organization', testOrganization.id);
    if (testPractitioner?.id) await medplum.deleteResource('Practitioner', testPractitioner.id);
    console.log('Finished cleaning up EoC test resources.');
  });

  describe('createEpisodeOfCare', () => {
    test('should create a new EpisodeOfCare with minimal valid data', async () => {
      const args: CreateEpisodeOfCareArgs = {
        patientId: testPatient.id as string,
        status: 'active',
      };

      const result = await createEpisodeOfCare(args);
      console.log('Create EoC result (minimal):', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.resourceType).not.toBe('OperationOutcome');
      const eoc = result as EpisodeOfCare;
      expect(eoc.id).toBeDefined();
      if (eoc.id) createdEpisodeOfCareIds.push(eoc.id);
      expect(eoc.status).toBe('active');
      expect(eoc.patient?.reference).toBe(`Patient/${testPatient.id}`);
    });

    test('should create a new EpisodeOfCare with all fields', async () => {
      const identifierValue = `EOC-ID-${randomUUID().slice(0,8)}`;
      const args: CreateEpisodeOfCareArgs = {
        patientId: testPatient.id as string,
        status: 'planned',
        managingOrganizationId: testOrganization.id as string,
        careManagerId: testPractitioner.id as string,
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/episodeofcare-type',
                code: 'hacc',
                display: 'Home and Community Care',
              },
            ],
            text: 'HACC Type',
          },
        ],
        periodStart: new Date().toISOString(),
        identifier: [{ system: 'urn:test:eoc-ids', value: identifierValue }],
      };

      const result = await createEpisodeOfCare(args);
      console.log('Create EoC result (all fields):', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.resourceType).not.toBe('OperationOutcome');
      const eoc = result as EpisodeOfCare;
      expect(eoc.id).toBeDefined();
      if (eoc.id) createdEpisodeOfCareIds.push(eoc.id);
      expect(eoc.status).toBe('planned');
      expect(eoc.patient?.reference).toBe(`Patient/${testPatient.id}`);
      expect(eoc.managingOrganization?.reference).toBe(`Organization/${testOrganization.id}`);
      expect(eoc.careManager?.reference).toBe(`Practitioner/${testPractitioner.id}`);
      expect(eoc.type?.[0]?.coding?.[0]?.code).toBe('hacc');
      expect(eoc.period?.start).toBeDefined();
      expect(eoc.identifier?.[0]?.value).toBe(identifierValue);
    });

    test('should return OperationOutcome if patientId is missing', async () => {
      const args = {
        status: 'active',
      } as CreateEpisodeOfCareArgs; // patientId missing
      const result = await createEpisodeOfCare(args);
      expect(result.resourceType).toBe('OperationOutcome');
      expect((result as OperationOutcome).issue?.[0]?.diagnostics).toContain('Patient ID is required');
    });

    test('should return OperationOutcome if status is missing', async () => {
      const args = {
        patientId: testPatient.id as string,
      } as CreateEpisodeOfCareArgs; // status missing
      const result = await createEpisodeOfCare(args);
      expect(result.resourceType).toBe('OperationOutcome');
      expect((result as OperationOutcome).issue?.[0]?.diagnostics).toContain('Status is required');
    });
  });

  describe('getEpisodeOfCareById', () => {
    let testEocForGet: EpisodeOfCare;

    beforeAll(async () => {
      const args: CreateEpisodeOfCareArgs = {
        patientId: testPatient.id as string,
        status: 'active',
        type: [{ text: 'Routine Checkup EoC for Get Test' }],
      };
      const result = await createEpisodeOfCare(args);
      expect(result.resourceType).not.toBe('OperationOutcome');
      testEocForGet = result as EpisodeOfCare;
      if (testEocForGet.id) createdEpisodeOfCareIds.push(testEocForGet.id);
      expect(testEocForGet.id).toBeDefined();
    });

    test('should retrieve an existing EpisodeOfCare by its ID', async () => {
      const result = await getEpisodeOfCareById(testEocForGet.id as string);
      console.log('Get EoC by ID result:', JSON.stringify(result, null, 2));
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.resourceType).toBe('EpisodeOfCare');
      const eoc = result as EpisodeOfCare;
      expect(eoc.id).toBe(testEocForGet.id);
      expect(eoc.type?.[0]?.text).toBe('Routine Checkup EoC for Get Test');
    });

    test('should return null for a non-existent EpisodeOfCare ID', async () => {
      const nonExistentId = randomUUID();
      const result = await getEpisodeOfCareById(nonExistentId);
      console.log('Get EoC by non-existent ID result:', JSON.stringify(result, null, 2));
      expect(result).toBeNull();
    });

    test('should return OperationOutcome for an empty ID string', async () => {
      const result = await getEpisodeOfCareById('');
      console.log('Get EoC by empty ID result:', JSON.stringify(result, null, 2));
      expect(result).toBeDefined();
      expect(result!.resourceType).toBe('OperationOutcome');
      const outcome = result as OperationOutcome;
      expect(outcome.issue?.[0]?.diagnostics).toContain('EpisodeOfCare ID is required');
    });
  });

  describe('updateEpisodeOfCare', () => {
    let eocToUpdate: EpisodeOfCare;

    beforeEach(async () => {
      // Create a fresh EpisodeOfCare before each update test
      const args: CreateEpisodeOfCareArgs = {
        patientId: testPatient.id as string,
        status: 'planned',
        managingOrganizationId: testOrganization.id as string,
        type: [{ text: 'Initial Type for Update Test' }],
        periodStart: '2023-01-01T00:00:00Z',
      };
      const result = await createEpisodeOfCare(args);
      expect(result.resourceType).not.toBe('OperationOutcome');
      eocToUpdate = result as EpisodeOfCare;
      if (eocToUpdate.id) createdEpisodeOfCareIds.push(eocToUpdate.id);
      expect(eocToUpdate.id).toBeDefined();
    });

    test('should update status of an EpisodeOfCare', async () => {
      const updates: UpdateEpisodeOfCareArgs = { status: 'active' };
      const result = await updateEpisodeOfCare(eocToUpdate.id as string, updates);
      console.log('Update EoC status result:', JSON.stringify(result, null, 2));
      expect(result.resourceType).toBe('EpisodeOfCare');
      const updatedEoc = result as EpisodeOfCare;
      expect(updatedEoc.status).toBe('active');
      expect(updatedEoc.patient?.reference).toBe(`Patient/${testPatient.id}`); // Ensure other fields persist
    });

    test('should update period, managingOrganization, and careManager', async () => {
      const newEndDate = '2023-12-31T23:59:59Z';
      // Create a new org and practitioner for this specific update test to avoid interference
      const newOrg = await medplum.createResource<Organization>({ resourceType: 'Organization', name: 'New Update Org', active: true });
      const newPract = await medplum.createResource<Practitioner>({ resourceType: 'Practitioner', name: [{ given: ['NewUpdateMgr']}], active: true });
      expect(newOrg.id).toBeDefined();
      expect(newPract.id).toBeDefined();

      const updates: UpdateEpisodeOfCareArgs = {
        periodEnd: newEndDate,
        managingOrganizationId: newOrg.id as string,
        careManagerId: newPract.id as string,
      };
      const result = await updateEpisodeOfCare(eocToUpdate.id as string, updates);
      expect(result.resourceType).toBe('EpisodeOfCare');
      const updatedEoc = result as EpisodeOfCare;
      expect(updatedEoc.period?.end).toBe(newEndDate);
      expect(updatedEoc.managingOrganization?.reference).toBe(`Organization/${newOrg.id}`);
      expect(updatedEoc.careManager?.reference).toBe(`Practitioner/${newPract.id}`);
      
      // Cleanup new org and practitioner
      if(newOrg.id) await medplum.deleteResource('Organization', newOrg.id);
      if(newPract.id) await medplum.deleteResource('Practitioner', newPract.id);
    });

    test('should update (replace) the type array', async () => {
      const newType: CodeableConcept[] = [
        { coding: [{ system: 'http://example.com/new-types', code: 'NT001', display: 'New Type 1' }], text: 'New Type 1' },
      ];
      const updates: UpdateEpisodeOfCareArgs = { type: newType };
      const result = await updateEpisodeOfCare(eocToUpdate.id as string, updates);
      expect(result.resourceType).toBe('EpisodeOfCare');
      const updatedEoc = result as EpisodeOfCare;
      expect(updatedEoc.type).toEqual(newType);
      expect(updatedEoc.type?.length).toBe(1);
      expect(updatedEoc.type?.[0]?.coding?.[0]?.code).toBe('NT001');
    });
    
    test('should allow unsetting managingOrganization and careManager by providing null', async () => {
        const updates: UpdateEpisodeOfCareArgs = {
            managingOrganizationId: null as any, // Testing the explicit null path
            careManagerId: null as any, // Testing the explicit null path
        };
        const result = await updateEpisodeOfCare(eocToUpdate.id as string, updates);
        expect(result.resourceType).toBe('EpisodeOfCare');
        const updatedEoc = result as EpisodeOfCare;
        expect(updatedEoc.managingOrganization).toBeUndefined();
        expect(updatedEoc.careManager).toBeUndefined();
    });

    test('should return OperationOutcome if no updates are provided', async () => {
      const result = await updateEpisodeOfCare(eocToUpdate.id as string, {});
      expect(result.resourceType).toBe('OperationOutcome');
      expect((result as OperationOutcome).issue?.[0]?.diagnostics).toContain('No updates provided');
    });

    test('should return OperationOutcome for updating a non-existent EpisodeOfCare ID', async () => {
      const nonExistentId = randomUUID();
      const updates: UpdateEpisodeOfCareArgs = { status: 'finished' };
      const result = await updateEpisodeOfCare(nonExistentId, updates);
      expect(result.resourceType).toBe('OperationOutcome');
      expect((result as OperationOutcome).issue?.[0]?.code).toBe('not-found');
    });
  });

  describe('searchEpisodesOfCare', () => {
    let searchTestPatientId: string;
    let searchTestOrgId: string;
    let searchTestPractitionerId: string;
    let eocSearch1: EpisodeOfCare, eocSearch2: EpisodeOfCare, eocSearch3: EpisodeOfCare;
    const searchEocIdentifierSystem = 'urn:test:search-eoc-ids';
    const searchEocIdentifierValue1 = `SREOC1-${randomUUID().slice(0,6)}`;
    const searchEocIdentifierValue2 = `SREOC2-${randomUUID().slice(0,6)}`;

    beforeAll(async () => {
      // Assign IDs from global test resources created in the top-level beforeAll
      searchTestPatientId = testPatient.id as string;
      searchTestOrgId = testOrganization.id as string;
      searchTestPractitionerId = testPractitioner.id as string;
      
      expect(searchTestPatientId).toBeDefined();
      expect(searchTestOrgId).toBeDefined();
      expect(searchTestPractitionerId).toBeDefined();

      // Create specific EoCs for searching
      const eoc1Args: CreateEpisodeOfCareArgs = {
        patientId: searchTestPatientId,
        status: 'active',
        type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/episodeofcare-type', code: 'hacc' }], text: 'Home Care EoC'}],
        periodStart: '2023-01-10T10:00:00Z',
        periodEnd: '2023-03-10T10:00:00Z',
        managingOrganizationId: searchTestOrgId, 
        identifier: [{ system: searchEocIdentifierSystem, value: searchEocIdentifierValue1 }]
      };
      const eoc1Result = await createEpisodeOfCare(eoc1Args);
      expect(eoc1Result.resourceType).not.toBe('OperationOutcome');
      eocSearch1 = eoc1Result as EpisodeOfCare;
      if (eocSearch1.id) createdEpisodeOfCareIds.push(eocSearch1.id);
      // Verify managingOrganization on created eocSearch1
      const fetchedEoc1 = await medplum.readResource('EpisodeOfCare', eocSearch1.id!);
      console.log('Fetched eocSearch1 for verification:', JSON.stringify(fetchedEoc1, null, 2));
      expect(fetchedEoc1.managingOrganization?.reference).toBe(`Organization/${searchTestOrgId}`);

      const eoc2Args: CreateEpisodeOfCareArgs = {
        patientId: searchTestPatientId, 
        status: 'finished',
        type: [{ coding: [{ system: 'http://snomed.info/sct', code: '394802001' }], text: 'Long term care' }],
        periodStart: '2022-05-01T00:00:00Z',
        careManagerId: searchTestPractitionerId,
        identifier: [{ system: searchEocIdentifierSystem, value: searchEocIdentifierValue2 }]
      };
      const eoc2Result = await createEpisodeOfCare(eoc2Args);
      expect(eoc2Result.resourceType).not.toBe('OperationOutcome');
      eocSearch2 = eoc2Result as EpisodeOfCare;
      if (eocSearch2.id) createdEpisodeOfCareIds.push(eocSearch2.id);
      // Verify careManager on created eocSearch2
      const fetchedEoc2 = await medplum.readResource('EpisodeOfCare', eocSearch2.id!);
      console.log('Fetched eocSearch2 for verification:', JSON.stringify(fetchedEoc2, null, 2));
      expect(fetchedEoc2.careManager?.reference).toBe(`Practitioner/${searchTestPractitionerId}`);
      
      // Create another patient for a specific search test
      const otherPatient = await medplum.createResource<Patient>({ resourceType: 'Patient', name: [{given: ['OtherSearch'], family: 'Patient'}]});
      const eoc3Args: CreateEpisodeOfCareArgs = {
        patientId: otherPatient.id as string,
        status: 'active',
        type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/episodeofcare-type', code: 'pac' }], text: 'Post Acute Care' }],
        periodStart: '2023-02-15T00:00:00Z',
      };
      eocSearch3 = (await createEpisodeOfCare(eoc3Args)) as EpisodeOfCare;
      if (eocSearch3.id) createdEpisodeOfCareIds.push(eocSearch3.id);
      // We need to clean up this otherPatient, but after all tests if it's not globally defined
      // For now, let's assume it gets cleaned up if its ID is pushed to a global cleanup array or handled in afterAll for search.
      // Better: clean up directly if not used elsewhere
      if (otherPatient.id) {
        // Add to a temporary list for cleanup in afterAll for this describe block, or clean up if not used by other tests in suite
        // For simplicity here, we'll delete it if not globally tracked. Assume it's not globally tracked.
        // This patient is only for this eocSearch3, so it can be deleted after `eocSearch3` is created if not needed for search tests themselves.
        // Actually, it IS needed if we search by this patient's ID. So it should be cleaned in afterAll of this describe, or globally.
        // Simplest for now: create and delete within beforeAll, if the EoC itself doesn't need to link to a *persistent during tests* patient.
        // The current test design uses global testPatient for most. This is an exception.
        // Let's adjust: create this other patient and add its ID to a list for cleanup in the main afterAll, or handle its cleanup more carefully.
        // For this example, since it's just used to create eocSearch3, and eocSearch3's reference will be by ID,
        // we can delete `otherPatient` after `eocSearch3` is created. The reference in `eocSearch3` will still hold the ID.
         await medplum.deleteResource('Patient', otherPatient.id as string);
      }
      
      expect(eocSearch1.id).toBeDefined();
      expect(eocSearch2.id).toBeDefined();
      expect(eocSearch3.id).toBeDefined();
    });

    test('should find EpisodesOfCare by patient ID', async () => {
      const args: EpisodeOfCareSearchArgs = { patient: searchTestPatientId };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.length).toBeGreaterThanOrEqual(2);
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
      expect(eocs.some(e => e.id === eocSearch2.id)).toBeTruthy();
    });

    test('should find EpisodesOfCare by status (single)', async () => {
      const args: EpisodeOfCareSearchArgs = { status: 'active' };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
      expect(eocs.some(e => e.id === eocSearch3.id)).toBeTruthy();
      expect(eocs.every(e => e.status === 'active')).toBeTruthy();
    });

    test('should find EpisodesOfCare by status (comma-separated)', async () => {
      const args: EpisodeOfCareSearchArgs = { status: 'active,finished' };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy(); // active
      expect(eocs.some(e => e.id === eocSearch2.id)).toBeTruthy(); // finished
      expect(eocs.some(e => e.id === eocSearch3.id)).toBeTruthy(); // active
    });

    test('should find EpisodesOfCare by type (code only)', async () => {
      const args: EpisodeOfCareSearchArgs = { type: 'hacc' }; // from eocSearch1
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
    });

    test('should find EpisodesOfCare by type (system|code)', async () => {
      const args: EpisodeOfCareSearchArgs = { type: 'http://snomed.info/sct|394802001' }; // from eocSearch2
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch2.id)).toBeTruthy();
    });
    
    test('should find EpisodesOfCare by date (exact start date of one item)', async () => {
      const args: EpisodeOfCareSearchArgs = { date: '2023-01-10T10:00:00Z' }; // eocSearch1
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
    });

    test('should find EpisodesOfCare by date range (covers eocSearch1)', async () => {
      const args: EpisodeOfCareSearchArgs = { date: ['ge2023-01-01', 'le2023-02-01'] }; // eocSearch1 is within this
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
    });

    test('should find EpisodeOfCare by identifier (value only)', async () => {
      const args: EpisodeOfCareSearchArgs = { identifier: searchEocIdentifierValue1 };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.length).toBeGreaterThanOrEqual(1);
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
    });

    test('should find EpisodeOfCare by identifier (system|value)', async () => {
      const args: EpisodeOfCareSearchArgs = { identifier: `${searchEocIdentifierSystem}|${searchEocIdentifierValue2}` };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.length).toBeGreaterThanOrEqual(1);
      expect(eocs.some(e => e.id === eocSearch2.id)).toBeTruthy();
    });

    test('should find EpisodesOfCare by managing-organization', async () => {
      const targetEoc = await medplum.readResource('EpisodeOfCare', eocSearch1.id!);
      console.log(`Verifying eocSearch1 (${eocSearch1.id}) for org search. ManagingOrg: ${targetEoc.managingOrganization?.reference}`);
      
      const args: EpisodeOfCareSearchArgs = { organization: `Organization/${searchTestOrgId}` };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
      expect(eocs.every(e => e.managingOrganization?.reference === `Organization/${searchTestOrgId}`)).toBeTruthy();
    });

    test('should find EpisodesOfCare by care-manager', async () => {
      const targetEoc = await medplum.readResource('EpisodeOfCare', eocSearch2.id!);
      console.log(`Verifying eocSearch2 (${eocSearch2.id}) for care-manager search. CareManager: ${targetEoc.careManager?.reference}`);

      const args: EpisodeOfCareSearchArgs = { 'care-manager': `Practitioner/${searchTestPractitionerId}` };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch2.id)).toBeTruthy();
      expect(eocs.every(e => e.careManager?.reference === `Practitioner/${searchTestPractitionerId}`)).toBeTruthy();
    });

    test('should find EpisodeOfCare with combined criteria (patient and status)', async () => {
      const args: EpisodeOfCareSearchArgs = { patient: searchTestPatientId, status: 'active' };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      const eocs = result as EpisodeOfCare[];
      expect(eocs.some(e => e.id === eocSearch1.id)).toBeTruthy();
      expect(eocs.every(e => e.patient?.reference === `Patient/${searchTestPatientId}` && e.status === 'active')).toBeTruthy();
    });

    test('should return an empty array for criteria that match no EpisodesOfCare', async () => {
      const args: EpisodeOfCareSearchArgs = { status: 'waitlist', type: 'nonexistent-type' };
      const result = await searchEpisodesOfCare(args);
      expect(result).not.toHaveProperty('resourceType', 'OperationOutcome');
      expect(Array.isArray(result)).toBe(true);
      expect((result as EpisodeOfCare[]).length).toBe(0);
    });

    test('should return OperationOutcome if no search criteria are provided', async () => {
      const result = await searchEpisodesOfCare({});
      expect(result).toHaveProperty('resourceType', 'OperationOutcome');
      const outcome = result as OperationOutcome;
      expect(outcome.issue?.[0]?.diagnostics).toContain('At least one search criterion must be provided');
    });
  });
}); 