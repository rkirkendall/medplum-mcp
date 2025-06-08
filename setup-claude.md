# Setting up Medplum MCP Server with Claude Desktop

## Prerequisites

1. **Claude Desktop App**: Download and install from [Claude.ai](https://claude.ai/download)
2. **Node.js**: Ensure you have Node.js installed (version 18 or higher)
3. **Medplum Server**: A running Medplum FHIR server instance
4. **Medplum Credentials**: Client ID and Client Secret for authentication

## Installation

1. **Clone and build the Medplum MCP server:**
   ```bash
   git clone <repository-url>
   cd medplum-mcp
   npm install
   npm run build
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the project root with your Medplum credentials:
   ```env
   MEDPLUM_BASE_URL=http://localhost:8103/
   MEDPLUM_CLIENT_ID=your_actual_client_id
   MEDPLUM_CLIENT_SECRET=your_actual_client_secret
   ```

3. **Test the server:**
   ```bash
   npm run test:connection
   ```

## Claude Desktop Configuration

1. **Open Claude Desktop Settings:**
   - On macOS: Claude menu → Settings → Developer
   - On Windows: File menu → Settings → Developer

2. **Edit Config:**
   Click "Edit Config" to open the configuration file.

3. **Add the Medplum MCP server configuration:**
   
   Replace the contents with:
   ```json
   {
     "mcpServers": {
       "medplum-mcp": {
         "command": "node",
         "args": [
           "/absolute/path/to/medplum-mcp/dist/index.js"
         ],
         "env": {
           "MEDPLUM_BASE_URL": "http://localhost:8103/",
           "MEDPLUM_CLIENT_ID": "your_actual_client_id",
           "MEDPLUM_CLIENT_SECRET": "your_actual_client_secret"
         }
       }
     }
   }
   ```

   **Important:** 
   - Replace `/absolute/path/to/medplum-mcp/` with the actual absolute path to your project
   - Replace the environment variables with your actual Medplum credentials

4. **Save and restart Claude Desktop**

## Verification

After restarting Claude Desktop, you should see:

1. A hammer icon (🔨) in the bottom left of the input box
2. When clicked, it should show "medplum-mcp" as an available server
3. The server should list 22 available FHIR tools

## Available Tools

The Medplum MCP server provides comprehensive FHIR resource management tools:

### Patient Management
- `createPatient` - Create new patient records
- `getPatientById` - Retrieve patient by ID
- `updatePatient` - Update patient information
- `searchPatients` - Search patients by criteria

### Practitioner Management
- `createPractitioner` - Register new practitioners
- `getPractitionerById` - Retrieve practitioner by ID
- `updatePractitioner` - Update practitioner information
- `searchPractitioners` - Search practitioners
- `searchPractitionersByName` - Search by name specifically

### Organization Management
- `createOrganization` - Add new healthcare organizations
- `getOrganizationById` - Retrieve organization by ID
- `updateOrganization` - Update organization information
- `searchOrganizations` - Search organizations

### Encounter Management
- `createEncounter` - Create new patient encounters
- `getEncounterById` - Retrieve encounter by ID
- `updateEncounter` - Update encounter information
- `searchEncounters` - Search encounters

### Observation Management
- `createObservation` - Record new observations (lab results, vitals)
- `getObservationById` - Retrieve observation by ID
- `updateObservation` - Update observation information
- `searchObservations` - Search observations

### General FHIR Search
- `generalFhirSearch` - Perform generic FHIR searches on any resource type

## Example Usage

Once configured, you can interact with your Medplum FHIR server through natural language:

- "Create a new patient named John Doe, born on 1990-05-15"
- "Find all practitioners with the last name Smith"
- "Show me the latest observations for patient ID abc123"
- "Create an encounter for patient xyz789 with status 'finished'"

## Troubleshooting

### Server not appearing in Claude
1. Check that the path in the configuration is absolute and correct
2. Ensure the server builds successfully (`npm run build`)
3. Verify your Medplum credentials are correct
4. Restart Claude Desktop completely

### Authentication errors
1. Verify your `MEDPLUM_CLIENT_ID` and `MEDPLUM_CLIENT_SECRET` are correct
2. Ensure your Medplum server is running and accessible
3. Check that the client has appropriate permissions

### Tool execution errors
1. Verify your Medplum server is running
2. Check the Claude Desktop logs for detailed error messages
3. Test the connection using `npm run test:connection`

## Logs

Claude Desktop logs can be found at:
- macOS: `~/Library/Logs/Claude/`
- Windows: `%APPDATA%\Claude\logs\`

Look for `mcp-server-medplum-mcp.log` for server-specific logs. 