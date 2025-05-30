import { ensureAuthenticated, medplum } from '../../src/config/medplumClient';
import {
  createPatient,
  getPatientById,
  updatePatient,
  searchPatients,
  CreatePatientArgs,
} from '../../src/tools/patientUtils';
import { Patient } from '@medplum/fhirtypes';

// jest.setTimeout(10000); // Increase if tests are slow

describe('Patient Tools Integration Tests', () => {
  let createdPatientId: string | undefined;
  let createdPatientId2: string | undefined;

  beforeAll(async () => {
    await ensureAuthenticated();
    if (!medplum.getActiveLogin()) {
      throw new Error('Medplum authentication failed. Cannot run Patient integration tests.');
    }
    console.log('Medplum client authenticated for Patient integration tests.');
  });

  // Test sequence for CRUD operations
  describe('createPatient', () => {
    it('should create a new patient (John Doe)', async () => {
      const johnDoeData: CreatePatientArgs = {
        firstName: 'JohnIntegration', // Using a unique name for tests
        lastName: 'DoeTest',
        birthDate: '1980-01-15',
        gender: 'male',
      };
      const patient = await createPatient(johnDoeData);
      expect(patient).toBeDefined();
      expect(patient).not.toBeNull();
      if (patient && patient.id) {
        createdPatientId = patient.id;
        expect(patient.name?.[0]?.given?.[0]).toEqual(johnDoeData.firstName);
        expect(patient.name?.[0]?.family).toEqual(johnDoeData.lastName);
        expect(patient.birthDate).toEqual(johnDoeData.birthDate);
        expect(patient.gender).toEqual(johnDoeData.gender);
      } else {
        throw new Error('John Doe patient creation failed or ID is missing.');
      }
    });

    it('should create a second patient (Jane Smith)', async () => {
      const janeSmithData: CreatePatientArgs = {
        firstName: 'JaneIntegration',
        lastName: 'SmithTest',
        birthDate: '1992-07-20',
      };
      const patient = await createPatient(janeSmithData);
      expect(patient).toBeDefined();
      expect(patient).not.toBeNull();
      if (patient && patient.id) {
        createdPatientId2 = patient.id;
        expect(patient.name?.[0]?.given?.[0]).toEqual(janeSmithData.firstName);
        expect(patient.name?.[0]?.family).toEqual(janeSmithData.lastName);
        expect(patient.birthDate).toEqual(janeSmithData.birthDate);
      } else {
        throw new Error('Jane Smith patient creation failed or ID is missing.');
      }
    });
  });

  describe('getPatientById', () => {
    it('should retrieve an existing patient by ID', async () => {
      if (!createdPatientId) throw new Error('Test dependency failed: createdPatientId is not set.');
      const patient = await getPatientById(createdPatientId);
      expect(patient).toBeDefined();
      expect(patient).not.toBeNull();
      expect(patient?.id).toEqual(createdPatientId);
      expect(patient?.name?.[0]?.family).toEqual('DoeTest');
    });

    it('should return null for a non-existent patient ID', async () => {
      const patient = await getPatientById('non-existent-id-123');
      expect(patient).toBeNull();
    });
  });

  describe('updatePatient', () => {
    it('should update an existing patient', async () => {
      if (!createdPatientId) throw new Error('Test dependency failed: createdPatientId is not set.');
      
      const updates: Omit<Partial<Patient>, 'resourceType' | 'id'> = {
        birthDate: '1980-01-17',
        name: [{ given: ['JohnIntegration', 'UpdatedMiddle'], family: 'DoeTest' }],
        gender: 'other',
      };
      
      const updatedPatient = await updatePatient(createdPatientId, updates);
      expect(updatedPatient).toBeDefined();
      expect(updatedPatient).not.toBeNull();
      expect(updatedPatient?.id).toEqual(createdPatientId);
      expect(updatedPatient?.birthDate).toEqual('1980-01-17');
      expect(updatedPatient?.name?.[0]?.given?.join(' ')).toEqual('JohnIntegration UpdatedMiddle');
      expect(updatedPatient?.gender).toEqual('other');
    });
  });

  describe('searchPatients', () => {
    it('should find patients by family name', async () => {
      const patients = await searchPatients({ family: 'DoeTest' });
      expect(patients).toBeDefined();
      expect(patients.length).toBeGreaterThanOrEqual(1);
      expect(patients.some(p => p.id === createdPatientId)).toBe(true);
    });

    it('should find patients by given and family name', async () => {
      const patients = await searchPatients({ given: 'JaneIntegration', family: 'SmithTest' });
      expect(patients).toBeDefined();
      expect(patients.length).toBeGreaterThanOrEqual(1);
      expect(patients.some(p => p.id === createdPatientId2)).toBe(true);
    });

    it('should find patients by birthdate', async () => {
      const patients = await searchPatients({ birthdate: '1992-07-20' });
      expect(patients).toBeDefined();
      expect(patients.length).toBeGreaterThanOrEqual(1);
      const jane = patients.find(p => p.id === createdPatientId2);
      expect(jane).toBeDefined();
      expect(jane?.name?.[0]?.given?.[0]).toEqual('JaneIntegration');
    });

    it('should return an empty array for non-matching criteria', async () => {
      const patients = await searchPatients({ family: 'NonExistentFamilyName123' });
      expect(patients).toBeDefined();
      expect(patients.length).toBe(0);
    });
  });

  // Optional: afterAll to clean up created test resources
  afterAll(async () => {
    console.log('Cleaning up patient test data...');
    if (createdPatientId) {
      try {
        await medplum.deleteResource('Patient', createdPatientId);
        console.log(`Deleted test patient: ${createdPatientId}`);
      } catch (error) {
        console.error(`Error deleting patient ${createdPatientId}:`, error);
      }
    }
    if (createdPatientId2) {
      try {
        await medplum.deleteResource('Patient', createdPatientId2);
        console.log(`Deleted test patient: ${createdPatientId2}`);
      } catch (error) {
        console.error(`Error deleting patient ${createdPatientId2}:`, error);
      }
    }
  });
}); 