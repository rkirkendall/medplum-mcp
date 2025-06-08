import { MedplumClient as MedplumClientSDK } from '@medplum/core';
import fetch from 'node-fetch'; // Required for Node.js environment
import { config } from 'dotenv';

config(); // Load environment variables from .env file

const { MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET } = process.env;

if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
  console.error('Missing Medplum client ID or secret in .env file');
  // process.exit(1); // Consider how to handle this in a library context
}

export const medplum = new MedplumClientSDK({
  baseUrl: MEDPLUM_BASE_URL || 'http://localhost:8103/', // Default if not set
  fetch: fetch as any, // Explicitly pass fetch
  clientId: MEDPLUM_CLIENT_ID,
  clientSecret: MEDPLUM_CLIENT_SECRET,
  // tokenStorage: new FileSystemStorage('medplum.json'), // Optional: for persistent token storage
  // log: console.log, // Optional: for logging
});

// Export the type alias if needed by other modules
export type MedplumClient = MedplumClientSDK;

/**
 * Ensures that the Medplum client is authenticated.
 * If not authenticated, it will attempt to start client credentials login.
 * @param client The MedplumClient instance to check and authenticate.
 * Throws an error if authentication fails.
 */
export async function ensureAuthenticated(): Promise<void> {
  // The MedplumClient automatically handles token refresh if a client secret is provided.
  // We just need to ensure the initial login or that a token is present.
  // console.error('Checking Medplum authentication...');
  if (!medplum.getActiveLogin()) {
    console.error('No active login. Attempting client credentials grant...');
    try {
      await medplum.startClientLogin(MEDPLUM_CLIENT_ID as string, MEDPLUM_CLIENT_SECRET as string);
      console.error('Client credentials login successful.');
    } catch (error) {
      console.error('Medplum client authentication failed:', error);
      throw new Error('Medplum client authentication failed.');
    }
  } else {
    // console.error('Medplum client is already authenticated.');
    // You might want to check if the token is close to expiring and refresh proactively
    // but the SDK should handle this automatically on the next request if needed.
  }
} 