import 'dotenv/config'; // Load environment variables from .env file
import { MedplumClient } from '@medplum/core';
import fetch from 'node-fetch'; // Import node-fetch

const effectiveBaseUrl = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103/';
console.log('[Medplum MCP] Initializing MedplumClient with baseUrl:', effectiveBaseUrl);

export const medplum = new MedplumClient({
  baseUrl: effectiveBaseUrl, // Default Medplum Docker API port
  clientId: process.env.MEDPLUM_CLIENT_ID, // To be configured
  fetch: fetch as any, // Medplum SDK needs fetch
});

/**
 * Ensures the Medplum client is authenticated.
 * For local development, this attempts to log in using environment variables
 * for MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET.
 *
 * IMPORTANT: This basic authentication is for local development ONLY.
 * For production, a proper OAuth/OpenID Connect flow should be implemented.
 */
export async function ensureAuthenticated(): Promise<void> {
  if (!medplum.getActiveLogin()) {
    console.log('No active Medplum login. Attempting client credentials grant...');
    const clientId = process.env.MEDPLUM_CLIENT_ID;
    const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        'Error: MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET environment variables are required for authentication.'
      );
      console.log(
        'Please create a ClientApplication in your Medplum instance (e.g., at http://localhost:3000/admin/project) ' +
        'and set these environment variables.'
      );
      throw new Error('Medplum client credentials not configured.');
    }

    try {
      await medplum.startClientLogin(clientId, clientSecret);
      console.log('Medplum client authenticated successfully using client credentials.');
    } catch (err) {
      console.error('Error authenticating Medplum client with client_credentials:', err);
      const adminEmail = process.env.MEDPLUM_ADMIN_EMAIL || 'ricky+1test1@gmail.com';
      const adminPassword = process.env.MEDPLUM_ADMIN_PASSWORD || '5gyXgkRW579BBrv';
      console.log(`Attempting login with super admin: ${adminEmail} - THIS IS FOR DEV ONLY`);
      try {
        await medplum.startLogin({
          email: adminEmail,
          password: adminPassword,
          remember: false,
        });
        console.log('Medplum client authenticated successfully using basic login (admin).');
      } catch (basicLoginErr) {
        console.error('Error authenticating Medplum client with basic login:', basicLoginErr);
        throw new Error('Medplum client authentication failed. Check credentials and server status.');
      }
    }
  }
} 