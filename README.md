# Medplum MCP Server

## 🚀 Project Description

This project implements a **complete Model Context Protocol (MCP) server** designed to seamlessly interact with a Medplum FHIR server. The MCP server provides a standardized interface, enabling Large Language Models (LLMs) to perform Create, Read, Update, and Search (CRUDS) operations on various FHIR resources through a comprehensive suite of tools. This empowers users to manage healthcare data stored in Medplum using natural language commands through any MCP-compatible client (Claude Desktop, VS Code MCP extensions, etc.).

<a href="https://glama.ai/mcp/servers/@rkirkendall/medplum-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@rkirkendall/medplum-mcp/badge" alt="Medplum Server MCP server" />
</a>

The server implements the full MCP protocol specification, providing 33 comprehensive FHIR resource management tools that can be discovered and executed by any MCP client. Users can intuitively manage patient information, practitioners, organizations, encounters, observations, and more by conversing with an LLM that leverages the MCP tools to execute requests against the FHIR server.

## ✨ Current Status

🎉 **MCP Server Implementation Complete!** 🎉

**What's Implemented:**
- ✅ Core FHIR resource management tools (Patient, Practitioner, Organization, Encounter, Observation, Medication, etc.)
- ✅ **MCP Server Protocol Implementation** - Full Model Context Protocol server with stdio transport
- ✅ Comprehensive tool schemas for LLM interaction (33 FHIR tools)
- ✅ **Interactive Chat Harness** - Full MCP client with natural language interface
- ✅ Jest integration tests for all tools
- ✅ Medplum FHIR server connectivity and authentication
- ✅ MCP Inspector testing and validation
- ✅ Claude Desktop integration configuration

**Ready for Use:**
- 🔄 The MCP server is fully functional and ready for integration with MCP clients
- ✅ All 33 FHIR tools are properly registered and working
- 🔄 Server successfully authenticates with Medplum and executes FHIR operations
- 🔄 **Interactive chat harness available** - Test all tools with natural language
- 🔄 Tested with MCP Inspector - all tools discoverable and executable
- 🔄 Claude Desktop configuration provided for immediate use

**Current Capabilities:**
- Full CRUD operations on FHIR resources through natural language
- Interactive chat interface for testing and development
- Seamless integration with any MCP-compatible client (Claude Desktop, VS Code MCP extensions, etc.)
- Comprehensive error handling and logging
- Production-ready MCP protocol implementation

## 🌟 Features Implemented

The MCP server currently supports a comprehensive set of **33 tools** for managing various FHIR resources:

### 👥 **Patient Management (4 tools)** - `src/tools/patientUtils.ts`
*   `createPatient`: Create new patient records with demographics, identifiers, and contact information.
*   `getPatientById`: Retrieve complete patient details by their unique ID.
*   `updatePatient`: Modify existing patient information including demographics and contact details.
*   `searchPatients`: Find patients based on name, birthdate, identifier, or other criteria.

### 👩‍⚕️ **Practitioner Management (5 tools)** - `src/tools/practitionerUtils.ts`
*   `createPractitioner`: Register new healthcare practitioners with their professional details.
*   `getPractitionerById`: Fetch complete practitioner details by their unique ID.
*   `updatePractitioner`: Update practitioner information including qualifications and contact details.
*   `searchPractitionersByName`: Search for practitioners using their first or last name.
*   `searchPractitioners`: Conduct advanced searches for practitioners based on multiple criteria.

### 🏥 **Organization Management (4 tools)** - `src/tools/organizationUtils.ts`
*   `createOrganization`: Add new healthcare organizations (hospitals, clinics, departments).
*   `getOrganizationById`: Retrieve complete organization details by their unique ID.
*   `updateOrganization`: Update organization information including contact details and addresses.
*   `searchOrganizations`: Search for organizations by name, type, or other attributes.

### 🏥 **Encounter Management (4 tools)** - `src/tools/encounterUtils.ts`
*   `createEncounter`: Create new patient encounters (visits, appointments, hospital stays).
*   `getEncounterById`: Retrieve complete encounter details by their unique ID.
*   `updateEncounter`: Update encounter information including status, class, and participants.
*   `searchEncounters`: Search for encounters by patient, practitioner, date, status, or class.

### 🔬 **Observation Management (4 tools)** - `src/tools/observationUtils.ts`
*   `createObservation`: Record new observations (lab results, vital signs, diagnostic findings).
*   `getObservationById`: Retrieve complete observation details by their unique ID.
*   `updateObservation`: Modify existing observations including values, status, and interpretations.
*   `searchObservations`: Search for observations by patient, code, date, or encounter.

### 💊 **Medication Request Management (4 tools)** - `src/tools/medicationRequestUtils.ts`
*   `createMedicationRequest`: Create new medication requests (prescriptions) with dosage and instructions.
*   `getMedicationRequestById`: Retrieve complete medication request details by their unique ID.
*   `updateMedicationRequest`: Update prescription information including status, dosage, and instructions.
*   `searchMedicationRequests`: Search for medication requests by patient, medication, or prescriber.

### 💉 **Medication Management (3 tools)** - `src/tools/medicationUtils.ts`
*   `createMedication`: Create new medication resources with codes, names, and formulations.
*   `getMedicationById`: Retrieve complete medication details by their unique ID.
*   `searchMedications`: Search for medications by code, name, or ingredient.

### 📋 **Episode of Care Management (4 tools)** - `src/tools/episodeOfCareUtils.ts`
*   `createEpisodeOfCare`: Create new episodes of care for managing patient care over time.
*   `getEpisodeOfCareById`: Retrieve complete episode of care details by their unique ID.
*   `updateEpisodeOfCare`: Update episode information including status, period, and managing organization.
*   `searchEpisodesOfCare`: Search for episodes of care by patient, status, or managing organization.

### 🔍 **General FHIR Operations (1 tool)**
*   `generalFhirSearch`: Generic FHIR search with custom parameters for any resource type, enabling advanced queries across all FHIR resources.

Each tool is exposed to the LLM via a well-defined JSON schema and is callable through a dedicated test harness (`src/llm-test-harness.ts`), facilitating robust testing and integration.

## 🛠️ Technology Stack

*   **Runtime**: Node.js
*   **Language**: TypeScript
*   **FHIR Server Interaction**: `@medplum/core`, `@medplum/fhirtypes`
*   **LLM Integration**: OpenAI API (specifically `gpt-4o` in the test harness)
*   **Testing**: Jest (for integration tests), Manual E2E via test harness
*   **Linting & Formatting**: ESLint, Prettier
*   **Environment Management**: `dotenv`
*   **HTTP Client (for Medplum SDK)**: `node-fetch`

## 📁 Project Structure

```
medplum-mcp/
├── src/                  # Source code
│   ├── config/           # Medplum client configuration (medplumClient.ts)
│   ├── tools/            # FHIR resource utility functions (patientUtils.ts, etc.)
│   ├── lib/              # Shared libraries (currently unused)
│   ├── index.ts          # Main application entry point
│   ├── llm-test-harness.ts # Script for testing LLM tool calling
│   └── test-connection.ts  # Script for basic Medplum connection test
├── tests/                # Test suites
│   └── integration/      # Jest integration tests for tools
├── .eslintrc.js
├── .gitignore
├── .prettierrc.js
├── .prettierignore
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Setup and Configuration

1.  **Prerequisites**:
    *   Node.js (refer to `package.json` for engine specifics; LTS versions recommended)
    *   A running Medplum server instance (e.g., local Dockerized instance at `http://localhost:8103/`)
    *   Medplum client credentials (Client ID and Client Secret)

2.  **Installation**:
    ```bash
    git clone https://github.com/rkirkendall/medplum-mcp.git
    cd medplum-mcp
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the project root with your specific Medplum server details and API keys:
    ```dotenv
    MEDPLUM_BASE_URL=http://your-medplum-server-url/
    MEDPLUM_CLIENT_ID=your_client_id
    MEDPLUM_CLIENT_SECRET=your_client_secret
    OPENAI_API_KEY=your_openai_api_key # Required for llm-test-harness.ts
    ```

## 🚀 Usage

### 💬 Interactive Chat Harness (Recommended)
The most user-friendly way to test your MCP server is through the interactive chat interface:

```bash
# Build and run the chat harness
npm run chat

# Or in development mode
npx ts-node src/llm-test-harness.ts
```

**Features:**
- 🗣️ Natural language interaction with all 33 FHIR tools
- 🔧 Automatic tool discovery and execution
- 📋 Built-in help and examples
- 🔄 Conversation context maintenance
- ⚡ Real-time tool execution and results

**Example Session:**
```
🏥 You: Create a new patient Jane Smith born 1985-03-20
🤖 Assistant: I'll create a new patient record for Jane Smith...

🏥 You: Find all doctors named Stevens
🤖 Assistant: I found 2 practitioners with the name Stevens...
```

See `CHAT_HARNESS_USAGE.md` for detailed usage instructions and `IMPLEMENTATION_PLAN.md` for development details.

### ▶️ Running the MCP Server Directly
```bash
npm start # Runs the MCP server with stdio transport
npm run dev # Development mode with live reloading
```

### 🧪 Alternative Testing Methods
```bash
# MCP Inspector (web-based tool testing)
npx @modelcontextprotocol/inspector node dist/index.js

# Legacy OpenAI integration (deprecated)
npm run test:harness
```

## ✅ Testing
### 🔗 Integration Tests
Integration tests use Jest and interact with a live Medplum instance (configured via `.env`).

To run all integration tests:
```bash
npx jest tests/integration
```
To run specific integration test files:
```bash
npx jest tests/integration/patient.integration.test.ts
npx jest tests/integration/practitioner.integration.test.ts
npx jest tests/integration/organization.integration.test.ts
# Add other specific test files as needed
```


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.