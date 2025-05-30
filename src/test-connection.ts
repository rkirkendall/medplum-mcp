import { medplum, ensureAuthenticated } from './config/medplumClient';

async function testMedplumConnection() {
  console.log('Attempting to authenticate and test Medplum connection...');
  try {
    await ensureAuthenticated();
    console.log('Authentication process completed.');

    if (medplum.getActiveLogin()) {
      console.log('Client appears to be authenticated. Fetching server capabilities (FHIR metadata)...');
      // @ts-ignore // Temporarily ignore for capabilities if linter issue persists on this line
      const capabilities = await medplum.get('fhir/R4/metadata');
      console.log('Successfully fetched server capabilities:', JSON.stringify(capabilities, null, 2));

      console.log('Fetching current user profile...');
      // @ts-ignore // Temporarily ignore for getProfile if linter issue persists on this line
      const currentUserProfile = await medplum.getProfile();
      console.log('Successfully fetched user profile:', JSON.stringify(currentUserProfile, null, 2));

      console.log('\nMedplum connection test successful!');
    } else {
      console.error('Medplum client is not authenticated after ensureAuthenticated() call. Check logs.');
    }
  } catch (error) {
    console.error('Medplum connection test failed:', error);
  }
}

testMedplumConnection(); 