# Medplum MCP Server

## Project Description

This project implements a Model Context Protocol (MCP) server for interacting with a Medplum FHIR server. The MCP server provides a standardized interface that allows Large Language Models (LLMs) to perform Create, Read, Update, and Search (CRUDS) operations on various FHIR resources through a suite of tools. This enables natural language commands to manage healthcare data stored in Medplum via the Model Context Protocol standard.

The primary goal is to allow users to manage patient information by conversing with an LLM, which then translates these requests into specific actions on the FHIR server via the MCP tools.

## Current Status

This project is currently under active development. Core functionalities for managing Patient, Practitioner, and Organization resources have been implemented and tested.

## Features Implemented

The MCP server currently supports the following FHIR resource management tools:

*   **Patient Tools (`src/tools/patientUtils.ts`)**:
    *   `createPatient`
    *   `getPatientById`
    *   `updatePatient`
    *   `searchPatients`
*   **Practitioner Tools (`src/tools/practitionerUtils.ts`)**:
    *   `createPractitioner`
    *   `getPractitionerById`
    *   `updatePractitioner`
    *   `searchPractitionersByName` (specific name search)
    *   `searchPractitioners` (general criteria search)
*   **Organization Tools (`src/tools/organizationUtils.ts`)**:
    *   `createOrganization`
    *   `getOrganizationById`
    *   `updateOrganization`
    *   `searchOrganizations`

Each tool is exposed to the LLM via a defined JSON schema and is callable through a test harness (`src/llm-test-harness.ts`).

## Technology Stack

*   **Runtime**: Node.js
*   **Language**: TypeScript
*   **FHIR Server Interaction**: `@medplum/core`, `@medplum/fhirtypes`
*   **LLM Integration**: OpenAI API (specifically `gpt-4o` in the test harness)
*   **Testing**: Jest (for integration tests), Manual E2E via test harness
*   **Linting & Formatting**: ESLint, Prettier
*   **Environment Management**: `dotenv`
*   **HTTP Client (for Medplum SDK)**: `node-fetch`

## Project Structure

```
medplum-mcp/
├── src/
│   ├── config/             # Medplum client configuration (medplumClient.ts)
│   ├── tools/              # FHIR resource utility functions (patientUtils.ts, etc.)
│   ├── lib/                # (Currently unused, for future shared libraries)
│   ├── index.ts            # Main application entry point
│   ├── llm-test-harness.ts # Script for testing LLM tool calling
│   └── test-connection.ts  # Script for basic Medplum connection test
├── tests/
│   └── integration/        # Jest integration tests for tools
├── .env.example            # Example environment file
├── .eslintrc.js
├── .gitignore
├── .prettierrc.js
├── .prettierignore
├── package.json
├── tsconfig.json
└── README.md
```

## Setup and Configuration

1.  **Prerequisites**:
    *   Node.js (refer to `package.json` for engine specifics, though generally LTS versions)
    *   A running Medplum server instance (e.g., local Dockerized instance at `http://localhost:8103/`).
    *   Medplum client credentials (Client ID and Client Secret).

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
    Update the `.env` file with your Medplum server details:
    ```
    MEDPLUM_BASE_URL=http://your-medplum-server-url/
    MEDPLUM_CLIENT_ID=your_client_id
    MEDPLUM_CLIENT_SECRET=your_client_secret
    OPENAI_API_KEY=your_openai_api_key # Required for llm-test-harness.ts
    ```

## Usage

### Running the Application (Main Entry - `src/index.ts`)
The main entry point `src/index.ts` is intended for future application logic (e.g., a chat server). Currently, it might contain basic setup or be minimal.
```bash
npm start # (Runs compiled JS from outDir)
npm run dev # (Runs TypeScript using ts-node-dev for development)
```

### LLM Test Harness
To test the interaction between natural language queries, the LLM (OpenAI), and the implemented Medplum tools:
```bash
npm run test:harness # Assuming a script is added to package.json for this
# or directly:
# npx ts-node src/llm-test-harness.ts
```
The harness (`src/llm-test-harness.ts`) contains example queries that trigger various tools.

### Basic Connection Test
To verify the connection to your Medplum server and client authentication:
```bash
npm run test:connection
```

## Testing

### Linting and Formatting
```bash
npm run lint
npm run format
```

### Integration Tests
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
```


# Medplum MCP Server Implementation Plan

This plan outlines the steps to build a Model Context Protocol (MCP) server for interacting with a Medplum FHIR server via a chat-based interface powered by an LLM. The MCP server will provide standardized tools for creating, reading, updating, and searching FHIR resources.

**General Workflow Note:** After completing each phase or significant step that results in runnable code or configuration changes, we will identify and execute relevant test or verification commands. For commands requiring interaction with the local Medplum instance or user-specific setup, I will prompt you to run them and then analyze the output you provide. For self-contained checks (e.g., linting), I may run the command directly.

## Phase 1: Project Setup & Foundation

- [x] **Initialize Node.js Project & Install Dependencies**
    - Notes:
        - Ran `npm init -y`.
        - Installed `@medplum/core`, `@medplum/fhirtypes`.
        - Installed dev dependencies: `typescript`, `@types/node`, `ts-node-dev`, `nodemon`, `eslint`, `prettier`, `@typescript-eslint/*`, `eslint-config-prettier`, `eslint-plugin-prettier`, `jest`, `@types/jest`, `ts-jest`.
        - Installed `dotenv` to manage environment variables.
        - Installed `node-fetch@^2` and `@types/node-fetch@^2` for explicit fetch in MedplumClient.
- [x] **Configure TypeScript**
    - Notes:
        - Created `tsconfig.json` using `npx tsc --init`.
        - Configured `rootDir`, `outDir`, `target`, `module`, `esModuleInterop`, `strict`, `skipLibCheck`, `resolveJsonModule`, `include`, `exclude` as per plan.
- [x] **Setup Project Structure**
    - Notes:
        - Created directories: `src`, `src/tools`, `src/config`, `src/lib`, `tests`.
        - Created `src/index.ts` as the main entry point.
- [x] **Implement ESLint and Prettier**
    - Notes:
        - Created `.eslintrc.js`, `.prettierrc.js`, and `.prettierignore`.
        - Added `lint`, `format`, `build`, `dev`, `start` scripts to `package.json`.
- [x] **Medplum Client Configuration**
    - Notes:
        - Created `src/config/medplumClient.ts`.
        - Initialized Medplum client to connect to `http://localhost:8103/` (or `MEDPLUM_BASE_URL` from `.env`).
        - Implemented `ensureAuthenticated` function using Client ID/Secret from `.env` (via `dotenv`).
        - Explicitly configured `fetch` using `node-fetch`.
- [x] **Basic Connection Test**
    - Notes:
        - Created `src/test-connection.ts`.
        - Script successfully authenticates using client credentials from `.env`.
        - Script successfully fetches server capabilities using `medplum.get('fhir/R4/metadata')`.
        - Script successfully fetches the client application's profile using `medplum.getProfile()`.
        - Added `test:connection` script to `package.json` and verified it runs.
        - Runtime successful, though linter shows type errors for `get` and `getProfile` (using `@ts-ignore` for now).

## Phase 1.5: Initial Tool & LLM Test Harness

- [x] **Implement a Single Simple MCP Tool**
    - Notes:
        - Choose one straightforward tool from Phase 2, e.g., `searchPractitioners` or a simplified version of `createPatient`.
        - Implement this tool in `src/tools/` using the Medplum SDK. (Implemented `searchPractitionersByName` in `src/tools/practitionerSearch.ts`)
- [x] **Develop Basic LLM Test Harness (Simulated Chat)**
    - Notes:
        - Created a script (`src/llm-test-harness.ts`) that takes natural language strings as input.
        - This harness will send the input to an LLM (via its API, configured with the schema of the implemented tool).
        - The purpose is to observe and verify the tool call generated by the LLM, not to build a user-facing chat UI at this stage. (Implemented `src/llm-test-harness.ts` using OpenAI GPT-4o)
- [x] **Define Schema and Configure LLM for the Initial Tool**
    - Notes:
        - Create the JSON schema for the first implemented tool (as described in Phase 3).
        - Configure your chosen LLM to use this tool. (Created `src/tools/toolSchemas.ts` and used it in the test harness with GPT-4o)
- [x] **Write Initial LLM Integration Test Case**
    - Notes:
        - Formulate a natural language query that should trigger the implemented tool.
        - Send this query through the test harness.
        - Verify that the LLM attempts to call the correct tool with the correct parameters.
        - This forms the first test in our iterative LLM integration suite. (Included several test queries in `llm-test-harness.ts` `main` function, verified LLM tool selection and parameter extraction)

## Phase 2: Core FHIR Resource Tools (MCP Server Tools)

For each resource, we need tools for `create`, `readById`, `update`, and `search`. Each tool should be a well-defined function in `src/tools/`.

- [x] **Patient Tools (`src/tools/patientUtils.ts`)**
    - Description: Tools for managing Patient resources.
    - [x] **`createPatient(patientDetails: CreatePatientArgs)`**: Creates a new patient.
        - SDK: `medplum.createResource<Patient>(patientResource)`
        - LLM Integration: Successfully integrated; LLM correctly extracts details from natural language.
    - [x] **`getPatientById(patientId: string)`**: Retrieves a patient by their ID.
        - SDK: `medplum.readResource<Patient>('Patient', patientId)`
        - LLM Integration: Successfully integrated; LLM correctly extracts `patientId`.
    - [x] **`updatePatient(patientId: string, updates: Omit<Partial<Patient>, 'resourceType' | 'id'>)`**: Updates an existing patient.
        - SDK: `medplum.updateResource<Patient>(patientToUpdate)`
        - LLM Integration: Operationally successful. LLM doesn't perfectly adhere to nested `updates` schema, but a workaround in `llm-test-harness.ts` reconstructs the arguments correctly.
    - [x] **`searchPatients(searchArgs: PatientSearchArgs)`**: Searches for patients based on criteria.
        - SDK: `medplum.searchResources<Patient>('Patient', medplumSearchCriteria)`
        - LLM Integration: Successfully integrated. Schema uses direct parameters (e.g., `family`, `given`), and the LLM correctly provides these. `patientUtils.ts` handles conversion to Medplum SDK format and prevents empty searches.
    - Notes:
        - Schemas defined in `src/tools/toolSchemas.ts`.
        - Integrated into `availableTools` in `src/llm-test-harness.ts`.
        - Iterative refinement of schemas and harness logic was key to successful LLM interaction.
        - Jest integration tests created and passing (`tests/integration/patient.integration.test.ts`).

- [x] **Practitioner Tools (`src/tools/practitionerUtils.ts`)**
    - Description: Tools for managing Practitioner resources.
    - [x] **`searchPractitionersByName(nameArgs: PractitionerNameSearchParams)`**
        - SDK: `medplum.searchResources<Practitioner>('Practitioner', searchCriteria)`
        - LLM Integration: Successfully integrated; LLM correctly extracts name parameters.
        - Notes: Schema defined in `src/tools/toolSchemas.ts`.
    - [x] **`createPractitioner(args: CreatePractitionerArgs)`**
        - SDK: `medplum.createResource<Practitioner>(practitionerResource)`
    - [x] **`getPractitionerById(practitionerId: string)`**
        - SDK: `medplum.readResource<Practitioner>('Practitioner', practitionerId)`
    - [x] **`updatePractitioner(practitionerId: string, updates: UpdatePractitionerArgs | Omit<Partial<Practitioner>, 'resourceType' | 'id'>)`**
        - SDK: `medplum.updateResource<Practitioner>(practitionerToUpdate)`
    - [x] **`searchPractitioners(criteria: PractitionerSearchCriteria)`**
        - SDK example: `medplum.searchResources<Practitioner>('Practitioner', criteria)`
        - Notes: For "Dr. Tom", criteria would be `{ name: 'Tom' }` or `{ family: 'Stevens' }`. LLM needs to map titles appropriately.
    - Notes:
        - Schemas defined in `src/tools/toolSchemas.ts`.
        - Integrated into `availableTools` and tested in `src/llm-test-harness.ts`.
        - Jest integration tests created and passing (`tests/integration/practitioner.integration.test.ts`).

- [x] **Tool: `manageOrganization`**
    - Description: Handles Organization resources (e.g., hospitals, clinics).
    - Sub-actions:
        - [x] `createOrganization(args: CreateOrganizationArgs)`
        - [x] `getOrganizationById(organizationId: string)`
        - [x] `updateOrganization(organizationId: string, updates: UpdateOrganizationArgs)`
        - [x] `searchOrganizations(criteria: OrganizationSearchCriteria)`
    - Notes: Useful for linking practitioners and encounters to specific facilities.
        - Schemas to be defined in `src/tools/toolSchemas.ts`.
        - To be integrated into `availableTools` in `src/llm-test-harness.ts`.
        - Jest integration tests created and passing (`tests/integration/organization.integration.test.ts`).

- [x] **Tool: `manageEncounter`**
    - Description: Handles Encounter resources (e.g., doctor visits, hospital stays).
    - Sub-actions:
        - [x] `createEncounter(details: CreateEncounterArgs)`: Links to Patient, Practitioner(s), Organization.
        - [x] `getEncounterById(id: string)`
        - [x] `updateEncounter(id: string, updates: UpdateEncounterArgs)`
        - [x] `searchEncounters(criteria: EncounterSearchArgs)`
    - Notes: Encounters are central to tracking patient interactions. `status`, `class`, `type`, `subject`, `participant`, `serviceProvider` are key. Implemented with corresponding utils, schemas, test harness updates, and integration tests (`tests/integration/encounter.integration.test.ts`).

- [ ] **Tool: `manageObservation`**
    - Description: Handles Observation resources (e.g., lab results, vital signs, X-ray findings).
    - Sub-actions:
        - `createObservation(details: Observation)`: Links to Encounter, Patient.
        - `getObservationById(id: string)`
        - `updateObservation(id: string, updates: Partial<Observation>)`
        - `searchObservations(criteria: { patientId?: string, code?: string, encounterId?: string, date?: string })`
    - Notes: `code` (LOINC, SNOMED CT), `value[x]`, `subject`, `encounter` are key fields. "Sed test" would map to a specific LOINC code. "X-ray" also.

- [ ] **Tool: `manageMedicationRequest`**
    - Description: Handles MedicationRequest resources (prescriptions).
    - Sub-actions:
        - `createMedicationRequest(details: MedicationRequest)`: Links to Patient, Practitioner, Medication.
        - `getMedicationRequestById(id: string)`
        - `updateMedicationRequest(id: string, updates: Partial<MedicationRequest>)`
        - `searchMedicationRequests(criteria: { patientId?: string, medicationCode?: string, prescriberId?: string })`
    - Notes: Differentiate between MedicationRequest and Medication (the actual drug).

- [ ] **Tool: `manageMedication`**
    - Description: Handles Medication resources (details about a specific drug).
    - Sub-actions:
        - `createMedication(details: Medication)` (less common, often Medications are pre-loaded or referenced)
        - `getMedicationById(id: string)`
        - `searchMedications(criteria: { code?: string, name?: string })`
    - Notes: Used by MedicationRequest. Might involve searching a drug database or pre-loaded list.

- [ ] **Tool: `manageEpisodeOfCare`**
    - Description: Handles EpisodeOfCare resources to group related encounters and conditions.
    - Sub-actions:
        - `createEpisodeOfCare(details: EpisodeOfCare)`: Links to Patient, managingOrganization.
        - `getEpisodeOfCareById(id: string)`
        - `updateEpisodeOfCare(id: string, updates: Partial<EpisodeOfCare>)` (e.g., change status, add encounters)
        - `searchEpisodesOfCare(criteria: { patientId?: string, status?: string, type?: string })`
    - Notes: Crucial for the "ongoing health episode" concept. Encounters, conditions, procedures can be linked.

- [ ] **Tool: `GeneralFhirSearch`**
    - Description: A more generic search tool if specific resource type is unknown or for broader queries.
    - Action: `searchResource(resourceType: FHIR_RESOURCE_TYPE, queryParams: Record<string, string>)`
    - SDK: `medplum.search(resourceType, queryParams)`
    - Notes: Provides flexibility but requires careful query construction.

## Phase 3: LLM Interaction & Orchestration

- [x] **Define Tool Schema for LLM**
    - Notes: JSON schemas defined in `src/tools/toolSchemas.ts` for all implemented Patient and Practitioner tools. Iteratively refined based on LLM performance (e.g., `searchPatients` uses direct parameters).
    - Example for `searchPractitionersByName` (which is what we implemented, not a generic `searchPractitioners`):
      ```json
      {
        "name": "searchPractitionersByName",
        "description": "Searches for medical practitioners (doctors, nurses, etc.) based on criteria.",
        "parameters": {
          "type": "object",
          "properties": {
            "givenName": { "type": "string", "description": "The practitioner's given name..." },
            "familyName": { "type": "string", "description": "The practitioner's family name..." },
            "name": { "type": "string", "description": "A general name search string..." }
          },
          "required": [] // Define as appropriate
        }
      }
      ```

- [x] **LLM Request Handling in MCP (via Test Harness)**
    - Notes: `src/llm-test-harness.ts` serves as the current entry point. It processes natural language queries, invokes the LLM with tool schemas, and executes the chosen tool by calling the corresponding TypeScript function.
    - It parses the LLM's tool call, validates (implicitly by checking tool name in `availableTools` map), calls the MCP server tool, and logs the result.

- [ ] **Natural Language to Tool Parameter Mapping Strategy**
    - Notes: This is largely an LLM task (using the tool schemas), but the MCP tool design should facilitate this.
    - The LLM needs to extract entities like "Dr. Stevens", "PCP", "x-ray", "sed test", "steroids", "rheumatologist" and map them to the correct parameters for the MCP tools.
    - For "PCP", the LLM might first call `searchPractitioners` with name "Stevens" and then the application logic (or LLM itself) might need to confirm if this is the PCP, potentially by checking `Encounter` history or `EpisodeOfCare.careManager`.

- [ ] **Clarifying Questions Logic (MCP Server Support)**
    - Notes: If the LLM cannot fill all required parameters for a tool, or if there's ambiguity, it needs to ask the user.
    - The MCP server might need to support this by:
        - Tools returning information that helps the LLM formulate a question (e.g., if a search returns multiple practitioners).
        - Potentially, tools that can present options to the user via the LLM (e.g., "Did you mean Dr. John Stevens or Dr. Jane Stevens?").

- [ ] **Context Management & Resource Linking**
    - Notes:
        - The LLM needs to maintain conversation context to understand references like "his PCP", "the osteodoctor from last week".
        - When creating new resources (e.g., an `Observation` for the sed test), the MCP server tools must accept parameters to link them to existing resources (e.g., `encounterId`, `patientId`).
        - Example flow for "Dr. Stevens ordered a blood panel":
            1. LLM identifies "Dr. Stevens" -> `searchPractitioners(name: 'Stevens')` -> gets Practitioner ID.
            2. LLM identifies "blood panel", "sed test" -> maps to Observation codes.
            3. LLM identifies the current Encounter (or creates one if necessary, linking to Patient and Dr. Stevens).
            4. LLM calls `createObservation` for the blood panel and `createObservation` for the sed test, linking both to the Encounter and Patient.
            5. The `EpisodeOfCare` for the father should be identified or created, and the new `Encounter` linked to it.

- [ ] **Error Handling and Feedback to LLM**
    - Notes: MCP server tools should return clear success/failure messages and any relevant data or error details. The LLM will use this to inform the user or adjust its strategy.

## Phase 4: Advanced Features & Refinements

- [ ] **Semantic Search Implementation**
    - Notes: Beyond simple field-based search.
        - If Medplum supports text search across resources or specific fields (`_text` or `_content` parameters), leverage that.
        - Otherwise, this might involve fetching relevant resources and then using an embedding model + vector search locally within the MCP or as a separate microservice if searching large amounts of text data (e.g., clinical notes, though this example focuses on structured data). For now, focus on Medplum's built-in search.
        - "User mentions a 'doctor tom' so we do a provider search on a doc w first name 'tom'" will primarily use `searchPractitioners` with appropriate name parameters.

- [ ] **Complex Utterance Decomposition (Primarily LLM task, MCP server enables)**
    - Notes: This involves handling complex user utterances that require breaking down the request into a series of actions and tool calls. For example, processing a sentence that includes multiple actors, actions, and references to past events.
    - The LLM needs to break this down into a sequence of actions/tool calls:
        1. Identify/Create Patient (e.g., based on conversational context).
        2. Identify/Create Practitioner ("Dr. Stevens", "PCP").
        3. Create Encounter for today with Patient and Dr. Stevens.
        4. Identify/Reference existing Observation ("x-ray from osteodoctor last week"). This implies a previous encounter and observation that need to be found.
        5. Create Observation for "blood panel" linked to current Encounter.
        6. Create Observation for "sed test" linked to current Encounter.
        7. Log future potential actions (MedicationRequest for steroids, Referral to rheumatologist - potentially as `ServiceRequest` resources or notes within the `Encounter` or `EpisodeOfCare`).

- [x] **Testing Strategy**
    - [ ] Unit tests for each MCP server tool (using Jest/ts-jest, with Medplum SDK calls mocked).
    - [x] Integration tests: Connect to the local Dockerized Medplum. Created `practitioner.integration.test.ts` and `patient.integration.test.ts` which test create, read, update, search against a live Medplum instance.
    - [x] E2E testing (manual for now): Converse with the LLM (via `llm-test-harness.ts`) and verify data in Medplum (implicitly done through observing successful tool calls and results).

- [x] **Expand and Iterate on LLM Integration Tests (via `llm-test-harness.ts`)**
    - Notes: (Marking as complete for current scope of tools; this is an ongoing process as new tools are added)
        - Continuously update and expand the test harness and test cases developed in Phase 1.5 as new MCP server tools are built.
        - **Test individual tool calls:** Ensure the LLM correctly identifies and calls individual MCP server tools based on a variety of simple natural language prompts. Verify parameter extraction and mapping. (Done for Patient & Practitioner tools).
        - **Test sequential/complex tool calls:** Develop scenarios where the LLM must make multiple tool calls in sequence. This includes using the output of one tool call as input for another to fulfill a complex user request (e.g., the detailed example utterance). (Partially done via create -> get/update/search sequence in harness).
        - **Test context handling:** Ensure the LLM, with the support of the MCP server and conversation history, can correctly resolve references (e.g., "his PCP," "that medication").

## Phase 5: Deployment & Operations (Future Consideration)

- [ ] **Containerize MCP Server (Optional)**
    - Notes: If the MCP server becomes a standalone service.
- [ ] **Logging and Monitoring**
    - Notes: Track tool usage, errors, performance.
- [ ] **Security and Compliance**
    - Notes: Ensure all interactions with Medplum are secure, and data handling complies with HIPAA if applicable. OAuth for Medplum client.