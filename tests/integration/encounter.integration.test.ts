import { medplum, ensureAuthenticated } from '../../src/config/medplumClient';
import { CreateEncounterArgs, createEncounter } from '../../src/tools/encounterUtils';
import { createPatient, CreatePatientArgs } from '../../src/tools/patientUtils';
import { createPractitioner, CreatePractitionerArgs } from '../../src/tools/practitionerUtils';
import { Patient, Practitioner, Encounter } from '@medplum/fhirtypes';
import { randomUUID } from 'crypto';
import { getEncounterById } from '../../src/tools/encounterUtils';
import { updateEncounter, UpdateEncounterArgs } from '../../src/tools/encounterUtils';
import { searchEncounters } from '../../src/tools/encounterUtils';

describe('Encounter Tool Integration Tests', () => {
  let testPatient: Patient | null;
  let testPractitioner: Practitioner | null;

  beforeAll(async () => {
    await ensureAuthenticated();

    // Create a Patient for the tests
    const patientArgs: CreatePatientArgs = {
      firstName: 'EncounterTest',
      lastName: `Patient-${randomUUID().substring(0, 8)}`,
      birthDate: '1970-01-01',
      gender: 'other',
    };
    testPatient = await createPatient(patientArgs);
    expect(testPatient).toBeDefined();
    expect(testPatient).not.toBeNull();
    if (!testPatient) throw new Error('Test patient creation failed'); // Guard against null
    expect(testPatient.id).toBeDefined();
    console.log(`Created test patient for encounter tests: ${testPatient.id}`);

    // Create a Practitioner for the tests
    const practitionerArgs: CreatePractitionerArgs = {
      givenName: 'EncounterTest',
      familyName: `Practitioner-${randomUUID().substring(0, 8)}`,
    };
    testPractitioner = await createPractitioner(practitionerArgs);
    expect(testPractitioner).toBeDefined();
    expect(testPractitioner).not.toBeNull();
    if (!testPractitioner) throw new Error('Test practitioner creation failed'); // Guard against null
    expect(testPractitioner.id).toBeDefined();
    console.log(`Created test practitioner for encounter tests: ${testPractitioner.id}`);
  });

  describe('createEncounter', () => {
    it('should create a new encounter successfully with required and optional parameters', async () => {
      // Ensure testPatient and testPractitioner are not null before using their IDs
      if (!testPatient || !testPatient.id || !testPractitioner || !testPractitioner.id) {
        throw new Error('Test patient or practitioner not initialized correctly for createEncounter test.');
      }

      const encounterArgs: CreateEncounterArgs = {
        status: 'finished',
        classCode: 'AMB', // Ambulatory
        patientId: testPatient.id,
        practitionerIds: [testPractitioner.id],
        // organizationId: undefined, // Optional, can be added if a test org is set up
        typeCode: 'CONS', // Consultation
        typeSystem: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        typeDisplay: 'Consultation',
        periodStart: new Date().toISOString(),
        reasonCode: '185349003', // General examination of patient (SNOMED CT)
        reasonSystem: 'http://snomed.info/sct',
        reasonDisplay: 'General examination of patient',
        identifierValue: `ENC-${randomUUID().substring(0,8)}`,
        identifierSystem: 'urn:ietf:rfc:3986'
      };

      const newEncounter = await createEncounter(encounterArgs);

      expect(newEncounter).toBeDefined();
      expect(newEncounter.resourceType).toBe('Encounter');
      expect(newEncounter.id).toBeDefined();
      expect(newEncounter.status).toBe(encounterArgs.status);
      expect(newEncounter.class.code).toBe(encounterArgs.classCode);
      expect(newEncounter.subject?.reference).toBe(`Patient/${testPatient.id}`);
      expect(newEncounter.participant?.[0]?.individual?.reference).toBe(`Practitioner/${testPractitioner.id}`);
      expect(newEncounter.type?.[0]?.coding?.[0]?.code).toBe(encounterArgs.typeCode);
      expect(newEncounter.type?.[0]?.coding?.[0]?.display).toBe(encounterArgs.typeDisplay);
      expect(newEncounter.period?.start).toBe(encounterArgs.periodStart);
      expect(newEncounter.reasonCode?.[0]?.coding?.[0]?.code).toBe(encounterArgs.reasonCode);
      expect(newEncounter.reasonCode?.[0]?.coding?.[0]?.display).toBe(encounterArgs.reasonDisplay);
      expect(newEncounter.identifier?.[0]?.value).toBe(encounterArgs.identifierValue);
      expect(newEncounter.identifier?.[0]?.system).toBe(encounterArgs.identifierSystem);

      console.log(`Created encounter: ${newEncounter.id}`);

      // TODO: Add cleanup logic if necessary, e.g., delete the created encounter, patient, practitioner
      // For now, assume manual cleanup or that test Medplum instance is ephemeral.
    });

    it('should throw an error if required fields are missing (e.g., patientId)', async () => {
      const encounterArgs: CreateEncounterArgs = {
        status: 'planned',
        classCode: 'IMP',
        // patientId: is missing
      } as unknown as CreateEncounterArgs; // Cast to bypass TypeScript check for test

      await expect(createEncounter(encounterArgs)).rejects.toThrow();
      // The exact error message can be checked if the createEncounter function throws specific errors
      // For example: .rejects.toThrow('Patient ID is required to create an encounter.');
      // This depends on how error handling is implemented in createEncounter (e.g., if it checks for patientId before calling Medplum SDK).
      // Medplum SDK itself will likely throw an error due to schema validation if subject is missing.
    });
  });

  describe('getEncounterById', () => {
    let createdEncounter: Encounter | null;

    beforeAll(async () => {
      // Ensure testPatient and testPractitioner are not null
      if (!testPatient || !testPatient.id || !testPractitioner || !testPractitioner.id) {
        throw new Error('Test patient or practitioner not initialized for getEncounterById tests.');
      }
      // Create an encounter to be used for get tests
      const encounterArgs: CreateEncounterArgs = {
        status: 'planned',
        classCode: 'HH', // Home Health
        patientId: testPatient.id,
        practitionerIds: [testPractitioner.id],
        identifierValue: `GET-TEST-${randomUUID().substring(0,8)}`
      };
      createdEncounter = await createEncounter(encounterArgs);
      expect(createdEncounter).toBeDefined();
      expect(createdEncounter).not.toBeNull();
      if (!createdEncounter) throw new Error('Test encounter creation failed for getEncounterById tests');
      console.log(`Created test encounter for getEncounterById tests: ${createdEncounter.id}`);
    });

    it('should retrieve an existing encounter successfully', async () => {
      expect(createdEncounter).toBeDefined(); // Redundant due to beforeAll but good practice
      expect(createdEncounter!.id).toBeDefined();

      const fetchedEncounter = await getEncounterById({ encounterId: createdEncounter!.id! });

      expect(fetchedEncounter).toBeDefined();
      expect(fetchedEncounter).not.toBeNull();
      expect(fetchedEncounter!.id).toBe(createdEncounter!.id);
      expect(fetchedEncounter!.resourceType).toBe('Encounter');
      expect(fetchedEncounter!.status).toBe('planned'); // From the encounter created in beforeAll
      expect(fetchedEncounter!.class.code).toBe('HH');
      expect(fetchedEncounter!.subject?.reference).toBe(`Patient/${testPatient!.id}`);
      expect(fetchedEncounter!.participant?.[0]?.individual?.reference).toBe(`Practitioner/${testPractitioner!.id}`);
      expect(fetchedEncounter!.identifier?.[0]?.value).toContain('GET-TEST-');
    });

    it('should return null when trying to retrieve a non-existent encounter ID', async () => {
      const nonExistentId = randomUUID(); // A virtually guaranteed non-existent ID
      const fetchedEncounter = await getEncounterById({ encounterId: nonExistentId });
      expect(fetchedEncounter).toBeNull();
    });

    it('should throw an error if no encounter ID is provided', async () => {
      // @ts-ignore: Testing invalid input purposefully
      await expect(getEncounterById({})).rejects.toThrow('Encounter ID is required to fetch an encounter.');
      // @ts-ignore: Testing invalid input purposefully
      await expect(getEncounterById({ encounterId: '' })).rejects.toThrow('Encounter ID is required to fetch an encounter.');
    });
  });

  describe('updateEncounter', () => {
    let encounterToUpdate: Encounter | null;
    const initialStatus = 'planned';
    const updatedStatus = 'in-progress';
    const initialClassCode = 'AMB'; // Ambulatory
    const updatedClassCode = 'IMP'; // Inpatient

    beforeEach(async () => {
      // Create a fresh encounter for each update test to ensure independence
      if (!testPatient || !testPatient.id) {
        throw new Error('Test patient not initialized for updateEncounter tests.');
      }
      const encounterArgs: CreateEncounterArgs = {
        status: initialStatus,
        classCode: initialClassCode,
        patientId: testPatient.id,
        identifierValue: `UPDATE-TEST-${randomUUID().substring(0,8)}`
      };
      encounterToUpdate = await createEncounter(encounterArgs);
      expect(encounterToUpdate).toBeDefined();
      expect(encounterToUpdate).not.toBeNull();
      if (!encounterToUpdate) throw new Error('Test encounter creation failed for updateEncounter tests');
      console.log(`Created encounter for update test: ${encounterToUpdate.id}, status: ${encounterToUpdate.status}, class: ${encounterToUpdate.class.code}`);
    });

    it('should update an existing encounter successfully (e.g., status and class)', async () => {
      expect(encounterToUpdate).toBeDefined();
      expect(encounterToUpdate!.id).toBeDefined();

      const updates: UpdateEncounterArgs = {
        status: updatedStatus,
        class: updatedClassCode, // Test providing class as a simple string code
        period: { start: new Date().toISOString() },
      };

      const updatedEncounter = await updateEncounter(encounterToUpdate!.id!, updates);

      expect(updatedEncounter).toBeDefined();
      expect(updatedEncounter).not.toBeNull();
      expect(updatedEncounter!.id).toBe(encounterToUpdate!.id);
      expect(updatedEncounter!.status).toBe(updatedStatus);
      expect(updatedEncounter!.class?.code).toBe(updatedClassCode); // Class should have been converted to Coding
      expect(updatedEncounter!.class?.system).toBe('http://terminology.hl7.org/CodeSystem/v3-ActCode');
      expect(updatedEncounter!.period?.start).toBeDefined();
      console.log(`Updated encounter: ${updatedEncounter!.id}, new status: ${updatedEncounter!.status}, new class: ${updatedEncounter!.class?.code}`);
    });

    it('should throw an error if encounter ID is not provided', async () => {
      await expect(updateEncounter('', { status: 'finished' })).rejects.toThrow('Encounter ID is required to update an encounter.');
    });

    it('should throw an error if updates object is empty or null', async () => {
      expect(encounterToUpdate).toBeDefined();
      expect(encounterToUpdate!.id).toBeDefined();
      // @ts-ignore: Testing invalid input purposefully 
      await expect(updateEncounter(encounterToUpdate!.id!, null)).rejects.toThrow('Updates object cannot be empty for updating an encounter.');
      await expect(updateEncounter(encounterToUpdate!.id!, {})).rejects.toThrow('Updates object cannot be empty for updating an encounter.');
    });
    
    it('should correctly update encounter with full class object provided in updates', async () => {
      expect(encounterToUpdate).toBeDefined();
      expect(encounterToUpdate!.id).toBeDefined();

      const fullClassCoding: import('@medplum/fhirtypes').Coding = {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'EMER', // Emergency
        display: 'emergency'
      };
      const updates: UpdateEncounterArgs = {
        class: fullClassCoding,
      };

      const updatedEncounter = await updateEncounter(encounterToUpdate!.id!, updates);
      expect(updatedEncounter).toBeDefined();
      // @ts-ignore // Linter seems confused about Coding vs string comparison here
      expect(updatedEncounter!.class).toEqual(fullClassCoding);
      console.log(`Updated encounter class with full object: ${updatedEncounter!.class?.code}`);
    });
  });

  describe('searchEncounters', () => {
    // Create a few encounters with varying details to test search functionality
    let enc1: Encounter | null, enc2: Encounter | null, enc3: Encounter | null;
    let searchPatientId: string | undefined;     // Declare here, assign in beforeAll
    let searchPractitionerId: string | undefined; // Declare here, assign in beforeAll
    const commonIdentifierSystem = 'http://example.com/encounter-ids';
    const uniqueIdentifier1 = `SEARCH-TEST-${randomUUID().substring(0,8)}`;
    const uniqueIdentifier2 = `SEARCH-TEST-${randomUUID().substring(0,8)}`;

    beforeAll(async () => {
      searchPatientId = testPatient?.id;         // Assign after outer beforeAll has run
      searchPractitionerId = testPractitioner?.id; // Assign after outer beforeAll has run

      if (!searchPatientId || !searchPractitionerId) {
        throw new Error('Test patient or practitioner not initialized for searchEncounters tests.');
      }
      // Encounter 1: Specific patient, practitioner, status 'finished', specific class, specific date
      enc1 = await createEncounter({
        patientId: searchPatientId!,
        practitionerIds: [searchPractitionerId!],
        status: 'finished',
        classCode: 'AMB', // Ambulatory
        typeCode: 'CHECKUP',
        identifierValue: uniqueIdentifier1,
        identifierSystem: commonIdentifierSystem,
        periodStart: '2023-01-15', // Testing exact date match
        // periodEnd: '2023-01-15T11:00:00Z' // Removed for simpler date test
      });
      // Encounter 2: Same patient, different status 'planned', different class, different date
      enc2 = await createEncounter({
        status: 'planned',
        classCode: 'IMP', // Inpatient
        patientId: searchPatientId,
        typeCode: 'SURGERY',
        identifierValue: uniqueIdentifier2,
        identifierSystem: commonIdentifierSystem,
        periodStart: '2023-02-10T09:00:00Z',
      });
      // Encounter 3: Different patient (if possible, or use same for simplicity if another test patient isn't easy to make here)
      // For now, use same patient but different practitioner and details to ensure it can be differentiated or found by other criteria
      // Let's assume we need another practitioner for this test.
      const otherPractitionerArgs: CreatePractitionerArgs = { givenName: 'SearchTestDoc', familyName: 'Other'};
      const otherPractitioner = await createPractitioner(otherPractitionerArgs);
      expect(otherPractitioner?.id).toBeDefined();

      enc3 = await createEncounter({
        status: 'finished',
        classCode: 'EMER', // Emergency
        patientId: searchPatientId, // Could be a different patient ID if available
        practitionerIds: [otherPractitioner!.id!],
        typeCode: 'ACUTEILL',
        periodStart: '2023-01-20T14:00:00Z',
      });
      expect(enc1).toBeDefined(); expect(enc2).toBeDefined(); expect(enc3).toBeDefined();
      console.log(`Created encounters for search tests: ${enc1?.id}, ${enc2?.id}, ${enc3?.id}`);
    });

    it('should find encounters by patientId', async () => {
      const results = await searchEncounters({ patientId: searchPatientId! });
      expect(results.length).toBeGreaterThanOrEqual(3); // enc1, enc2, enc3 are for this patient
      expect(results.some(e => e.id === enc1!.id)).toBe(true);
      expect(results.some(e => e.id === enc2!.id)).toBe(true);
      expect(results.some(e => e.id === enc3!.id)).toBe(true);
    });

    it('should find encounters by status', async () => {
      const resultsFinished = await searchEncounters({ patientId: searchPatientId!, status: 'finished' });
      expect(resultsFinished.some(e => e.id === enc1!.id)).toBe(true);
      expect(resultsFinished.some(e => e.id === enc3!.id)).toBe(true); // enc3 also 'finished' for this patient
      expect(resultsFinished.every(e => e.status === 'finished')).toBe(true);

      const resultsPlanned = await searchEncounters({ patientId: searchPatientId!, status: 'planned' });
      expect(resultsPlanned.some(e => e.id === enc2!.id)).toBe(true);
      expect(resultsPlanned.every(e => e.status === 'planned')).toBe(true);
    });

    it('should find encounters by classCode', async () => {
      const resultsAMB = await searchEncounters({ patientId: searchPatientId!, classCode: 'AMB' });
      expect(resultsAMB.some(e => e.id === enc1!.id)).toBe(true);
      // We cannot guarantee every AMB encounter for this patient is enc1 or related test data only,
      // so the .every check might be too strict if other AMB encounters exist for this patient.
      // We should ensure that the ones we expect are there and their class is correct.
      const foundEnc1 = resultsAMB.find(e => e.id === enc1!.id);
      expect(foundEnc1?.class?.code).toBe('AMB');

      const resultsIMP = await searchEncounters({ patientId: searchPatientId!, classCode: 'IMP' });
      expect(resultsIMP.some(e => e.id === enc2!.id)).toBe(true);
      const foundEnc2 = resultsIMP.find(e => e.id === enc2!.id);
      expect(foundEnc2?.class?.code).toBe('IMP');
    });

    it('should find encounters by patientId and status', async () => {
      const results = await searchEncounters({ patientId: searchPatientId!, status: 'finished' });
      expect(results.some(e => e.id === enc1!.id)).toBe(true);
      expect(results.some(e => e.id === enc3!.id)).toBe(true);
      expect(results.every(e => e.status === 'finished' && e.subject?.reference === `Patient/${searchPatientId}`)).toBe(true);
    });
    
    it('should find encounters by specific identifier', async () => {
      const results = await searchEncounters({ identifier: uniqueIdentifier1 });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(enc1!.id);
      expect(results[0].identifier?.some(id => id.value === uniqueIdentifier1)).toBe(true);
    });
    
    it('should find encounters by date', async () => {
      const results = await searchEncounters({ date: '2023-01-15' }); 
      expect(results.some(e => e.id === enc1!.id)).toBe(true);
    });

    it('should return an empty array for criteria that match no encounters', async () => {
      const results = await searchEncounters({ status: 'entered-in-error' });
      expect(results.length).toBe(0);
    });

    it('should handle searches with no criteria (warns and returns results or empty based on util logic)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const results = await searchEncounters({});
      // The current searchEncounters util might return all encounters or an empty array depending on its internal logic for no criteria.
      // It logs a warning. We primarily check the warning was logged.
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Encounter search called with no specific criteria'));
      expect(results).toBeInstanceOf(Array); // Should always return an array
      consoleWarnSpy.mockRestore();
    });

  });

}); 