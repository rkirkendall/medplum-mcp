# MCP Chat Test Harness Usage Guide

## Overview

The MCP Chat Test Harness provides an interactive command-line interface to test your Medplum MCP server. It acts as an MCP client that connects to your server and allows you to interact with your 22 FHIR tools using natural language.

## Prerequisites

1. **Environment Setup**: Ensure your `.env` file contains:
   ```
   MEDPLUM_BASE_URL=http://localhost:8103/
   MEDPLUM_CLIENT_ID=your_client_id
   MEDPLUM_CLIENT_SECRET=your_client_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Medplum Server**: Have your Medplum server running (e.g., at `http://localhost:8103/`)

3. **Build the Project**: 
   ```bash
   npm run build
   ```

## Running the Chat Harness

### Option 1: Using the npm script (recommended)
```bash
npm run test:chat
```

### Option 2: Direct execution
```bash
node dist/llm-test-harness.js
```

### Option 3: Development mode
```bash
npx ts-node src/llm-test-harness.ts
```

## How It Works

1. **MCP Client Connection**: The harness starts your MCP server and connects to it as a client
2. **Tool Discovery**: It automatically discovers all 22 available FHIR tools
3. **Natural Language Processing**: Uses OpenAI GPT-4o to interpret your requests
4. **Tool Execution**: Calls the appropriate MCP tools and displays results
5. **Conversation Flow**: Maintains context across the conversation

## Available Commands

### Chat Commands
- **Natural language queries**: Ask questions about healthcare data management
- **`help`**: Show detailed examples of what you can ask
- **`tools`**: Display all available MCP tools
- **`clear`**: Clear conversation history
- **`quit`** or **`exit`**: End the chat session

### Example Queries

#### Patient Management
```
🏥 You: Create a new patient Jane Smith born 1985-03-20
🏥 You: Find all patients with last name Johnson
🏥 You: Get patient details for ID abc123
🏥 You: Update patient ID xyz789 to mark as inactive
```

#### Practitioner Management
```
🏥 You: Find all doctors named Stevens
🏥 You: Create a new practitioner Dr. Emily Wilson
🏥 You: Search for cardiologists
🏥 You: Get practitioner details for ID prac456
```

#### Organization Management
```
🏥 You: Create a new hospital called City General
🏥 You: Find organizations in downtown area
🏥 You: Get organization details for ID org789
```

#### Clinical Data
```
🏥 You: Create a blood pressure observation for patient ID pat123
🏥 You: Find all lab results for patient ID pat456
🏥 You: Create a new encounter for patient visit
🏥 You: Search for diabetes-related observations
```

#### Medications
```
🏥 You: Create a new medication for hypertension
🏥 You: Find all medications containing aspirin
🏥 You: Create a prescription for patient ID pat789
```

#### General Searches
```
🏥 You: Search for all encounters this month
🏥 You: Find all active episodes of care
🏥 You: Search FHIR resources of type Condition
```

## What You'll See

### Successful Tool Execution
```
🤖 Processing: "Find all patients named Smith"

🔧 LLM wants to call 1 tool(s):
   📞 Calling searchPatients with args: { "family": "Smith" }
   ✅ Result: {
     "content": [
       {
         "resourceType": "Patient",
         "id": "patient-123",
         "name": [
           {
             "family": "Smith",
             "given": ["John"]
           }
         ]
       }
     ]
   }

🤖 Assistant: I found 1 patient with the last name Smith. Here are the details:

**Patient ID:** patient-123
**Name:** John Smith
```

### Error Handling
```
🔧 LLM wants to call 1 tool(s):
   📞 Calling getPatientById with args: { "patientId": "invalid-id" }
   ❌ Error: Patient not found

🤖 Assistant: I couldn't find a patient with ID "invalid-id". Please check the ID and try again.
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: 
   - Ensure Medplum server is running
   - Check your `.env` file configuration
   - Verify client credentials

2. **OpenAI API Errors**:
   - Verify `OPENAI_API_KEY` is set correctly
   - Check your OpenAI account has sufficient credits

3. **Tool Execution Errors**:
   - Review the tool arguments being passed
   - Check if required FHIR resources exist
   - Verify proper resource relationships

### Debug Mode
Add `console.log` statements in the harness or use the MCP Inspector for detailed debugging:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Harness  │───▶│   OpenAI API    │───▶│  Tool Selection │
│   (MCP Client)  │    │   (GPT-4o)      │    │  & Execution    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                            ┌─────────────────┐
│   MCP Server    │◀───────────────────────────│   FHIR Tools    │
│   (Your Server) │                            │   (22 tools)    │
└─────────────────┘                            └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Medplum FHIR   │
│     Server      │
└─────────────────┘
```

This harness provides a complete testing environment for your MCP server, allowing you to verify that all tools work correctly and can be accessed through natural language interactions. 