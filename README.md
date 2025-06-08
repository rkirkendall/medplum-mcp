# Medplum MCP Server

## 🚀 Project Description

This project implements a **complete Model Context Protocol (MCP) server** designed to seamlessly interact with a Medplum FHIR server. The MCP server provides a standardized interface, enabling Large Language Models (LLMs) to perform Create, Read, Update, and Search (CRUDS) operations on various FHIR resources through a comprehensive suite of tools. This empowers users to manage healthcare data stored in Medplum using natural language commands through any MCP-compatible client (Claude Desktop, VS Code MCP extensions, etc.).

The server implements the full MCP protocol specification, providing 22 comprehensive FHIR resource management tools that can be discovered and executed by any MCP client. Users can intuitively manage patient information, practitioners, organizations, encounters, observations, and more by conversing with an LLM that leverages the MCP tools to execute requests against the FHIR server.

## ✨ Current Status

🎉 **MCP Server Implementation Complete!** 🎉

**What's Implemented:**
- ✅ Core FHIR resource management tools (Patient, Practitioner, Organization, Encounter, Observation, Medication, etc.)
- ✅ **MCP Server Protocol Implementation** - Full Model Context Protocol server with stdio transport
- ✅ Comprehensive tool schemas for LLM interaction (22 FHIR tools)
- ✅ **Interactive Chat Harness** - Full MCP client with natural language interface
- ✅ Jest integration tests for all tools
- ✅ Medplum FHIR server connectivity and authentication
- ✅ MCP Inspector testing and validation
- ✅ Claude Desktop integration configuration

**Ready for Use:**
- 🔄 The MCP server is fully functional and ready for integration with MCP clients
- 🔄 All 22 FHIR tools are properly registered and working
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

The MCP server currently supports a robust set of tools for managing various FHIR resources:

*   **Patient Management (`src/tools/patientUtils.ts`)**:
    *   `createPatient`: Create new patient records.
    *   `getPatientById`: Retrieve patient details by ID.
    *   `updatePatient`: Modify existing patient information.
    *   `searchPatients`: Find patients based on various criteria.
*   **Practitioner Management (`src/tools/practitionerUtils.ts`)**:
    *   `createPractitioner`: Register new practitioners.
    *   `getPractitionerById`: Fetch practitioner details by ID.
    *   `updatePractitioner`: Update practitioner information.
    *   `searchPractitionersByName`: Search for practitioners using their name.
    *   `searchPractitioners`: Conduct general searches for practitioners based on multiple criteria.
*   **Organization Management (`src/tools/organizationUtils.ts`)**:
    *   `createOrganization`: Add new healthcare organizations.
    *   `getOrganizationById`: Retrieve organization details by ID.
    *   `updateOrganization`: Update organization information.
    *   `searchOrganizations`: Search for organizations.
*   **Observation Management (`src/tools/observationUtils.ts`)**:
    *   `createObservation`: Record new observations (e.g., lab results, vital signs).
    *   `getObservationById`: Get observation details by ID.
    *   `updateObservation`: Modify existing observations.
    *   `searchObservations`: Search for observations.

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
    Create a `.env` file in the project root by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Then, update the `.env` file with your specific Medplum server details and API keys:
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
- 🗣️ Natural language interaction with all 22 FHIR tools
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