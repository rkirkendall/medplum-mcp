#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from 'dotenv';

// Import our existing FHIR tool functions
import {
  searchPractitionersByName,
  createPractitioner,
  getPractitionerById,
  updatePractitioner,
  searchPractitioners,
} from './tools/practitionerUtils.js';
import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
} from './tools/organizationUtils.js';
import {
  createPatient,
  getPatientById,
  updatePatient,
  searchPatients,
} from './tools/patientUtils.js';
import {
  createEncounter,
  getEncounterById,
  updateEncounter,
  searchEncounters,
} from './tools/encounterUtils.js';
import {
  createObservation,
  getObservationById,
  updateObservation,
  searchObservations,
} from './tools/observationUtils.js';
import {
  createMedicationRequest,
  getMedicationRequestById,
  updateMedicationRequest,
  searchMedicationRequests,
} from './tools/medicationRequestUtils.js';
import {
  createMedication,
  getMedicationById,
  searchMedications,
} from './tools/medicationUtils.js';
import {
  createEpisodeOfCare,
  getEpisodeOfCareById,
  updateEpisodeOfCare,
  searchEpisodesOfCare,
} from './tools/episodeOfCareUtils.js';
import {
  generalFhirSearch,
} from './tools/generalFhirSearchUtils.js';

// Load environment variables
dotenv.config();

// Create the MCP server
const server = new Server(
  {
    name: "medplum-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas in MCP format (converted from the existing toolSchemas.ts)
const mcpTools = [
  // Patient Tools
  {
    name: "createPatient",
    description: "Creates a new patient resource. Requires first name, last name, and birth date.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          description: "The patient's first name.",
        },
        lastName: {
          type: "string",
          description: "The patient's last name.",
        },
        birthDate: {
          type: "string",
          description: "The patient's birth date in YYYY-MM-DD format.",
        },
        gender: {
          type: "string",
          description: "The patient's gender (male, female, other, unknown). Optional.",
          enum: ["male", "female", "other", "unknown"],
        },
      },
      required: ["firstName", "lastName", "birthDate"],
    },
  },
  {
    name: "getPatientById",
    description: "Retrieves a patient resource by their unique ID.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The unique ID of the patient to retrieve.",
        },
      },
      required: ["patientId"],
    },
  },
  {
    name: "updatePatient",
    description: "Updates an existing patient's information. Requires the patient's ID and the fields to update.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The unique ID of the patient to update.",
        },
        firstName: {
          type: "string",
          description: "New first name for the patient.",
        },
        lastName: {
          type: "string", 
          description: "New last name for the patient.",
        },
        birthDate: {
          type: "string",
          description: "New birth date in YYYY-MM-DD format.",
        },
        gender: {
          type: "string",
          description: "New gender (male, female, other, unknown).",
          enum: ["male", "female", "other", "unknown"],
        },
      },
      required: ["patientId"],
    },
  },
  {
    name: "searchPatients",
    description: "Searches for patients based on criteria like name or birth date.",
    inputSchema: {
      type: "object",
      properties: {
        given: {
          type: "string",
          description: "The patient's given (first) name.",
        },
        family: {
          type: "string", 
          description: "The patient's family (last) name.",
        },
        birthdate: {
          type: "string",
          description: "The patient's birth date in YYYY-MM-DD format.",
        },
        gender: {
          type: "string",
          description: "The patient's gender.",
          enum: ["male", "female", "other", "unknown"],
        },
      },
      required: [],
    },
  },
  // Practitioner Tools
  {
    name: "searchPractitionersByName",
    description: "Searches for medical practitioners based on their given name, family name, or a general name string.",
    inputSchema: {
      type: "object",
      properties: {
        givenName: {
          type: "string",
          description: "The practitioner's given (first) name.",
        },
        familyName: {
          type: "string",
          description: "The practitioner's family (last) name.",
        },
        name: {
          type: "string",
          description: "A general name search string for the practitioner.",
        },
      },
      required: [],
    },
  },
  {
    name: "createPractitioner",
    description: "Creates a new medical practitioner. Requires given name and family name.",
    inputSchema: {
      type: "object",
      properties: {
        givenName: {
          type: "string",
          description: "The practitioner's given (first) name.",
        },
        familyName: {
          type: "string",
          description: "The practitioner's family (last) name.",
        },
      },
      required: ["givenName", "familyName"],
    },
  },
  {
    name: "getPractitionerById",
    description: "Retrieves a practitioner resource by their unique ID.",
    inputSchema: {
      type: "object",
      properties: {
        practitionerId: {
          type: "string",
          description: "The unique ID of the practitioner to retrieve.",
        },
      },
      required: ["practitionerId"],
    },
  },
  {
    name: "updatePractitioner",
    description: "Updates an existing practitioner's information. Requires the practitioner's ID and the fields to update.",
    inputSchema: {
      type: "object",
      properties: {
        practitionerId: {
          type: "string",
          description: "The unique ID of the practitioner to update.",
        },
        active: {
          type: "boolean",
          description: "Update active status.",
        },
      },
      required: ["practitionerId"],
    },
  },
  {
    name: "searchPractitioners",
    description: "Searches for practitioners based on various criteria like name, specialty, or identifier.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "A general name search string.",
        },
        given: {
          type: "string",
          description: "The practitioner's given (first) name.",
        },
        family: {
          type: "string",
          description: "The practitioner's family (last) name.",
        },
        specialty: {
          type: "string",
          description: "The practitioner's specialty (e.g., cardiology).",
        },
        identifier: {
          type: "string",
          description: "An identifier for the practitioner (e.g., NPI value).",
        },
      },
      required: [],
    },
  },
  // Organization Tools
  {
    name: "createOrganization",
    description: "Creates a new organization (e.g., hospital, clinic). Requires organization name.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The official name of the organization.",
        },
        alias: {
          type: "array",
          items: { type: "string" },
          description: "A list of aliases for the organization. Optional.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "getOrganizationById",
    description: "Retrieves an organization by its unique ID.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "The unique ID of the organization to retrieve.",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "updateOrganization",
    description: "Updates an existing organization. Requires the organization ID and the fields to update.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "The unique ID of the organization to update.",
        },
        name: {
          type: "string",
          description: "The new official name of the organization. Optional.",
        },
        alias: {
          type: "array",
          items: { type: "string" },
          description: "An updated list of aliases. Optional.",
        },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "searchOrganizations",
    description: "Searches for organizations based on criteria like name or address. Provide at least one criterion.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the organization to search for. Optional.",
        },
        address: {
          type: "string",
          description: "Part of the organization's address to search for. Optional.",
        },
      },
      required: [],
    },
  },
  // Encounter Tools
  {
    name: "createEncounter",
    description: "Creates a new encounter (patient visit). Requires patient ID and status.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient for this encounter.",
        },
        status: {
          type: "string",
          description: "The status of the encounter.",
          enum: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled"],
        },
        class: {
          type: "string",
          description: "The classification of the encounter (e.g., ambulatory, inpatient).",
        },
        practitionerId: {
          type: "string",
          description: "The ID of the practitioner involved in the encounter. Optional.",
        },
        organizationId: {
          type: "string",
          description: "The ID of the organization providing the encounter. Optional.",
        },
      },
      required: ["patientId", "status"],
    },
  },
  {
    name: "getEncounterById",
    description: "Retrieves an encounter by its unique ID.",
    inputSchema: {
      type: "object",
      properties: {
        encounterId: {
          type: "string",
          description: "The unique ID of the encounter to retrieve.",
        },
      },
      required: ["encounterId"],
    },
  },
  {
    name: "updateEncounter",
    description: "Updates an existing encounter. Requires the encounter ID and the fields to update.",
    inputSchema: {
      type: "object",
      properties: {
        encounterId: {
          type: "string",
          description: "The unique ID of the encounter to update.",
        },
        status: {
          type: "string",
          description: "New status for the encounter.",
          enum: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled"],
        },
      },
      required: ["encounterId"],
    },
  },
  {
    name: "searchEncounters",
    description: "Searches for encounters based on criteria like patient ID or status.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The patient ID to search encounters for. Optional.",
        },
        status: {
          type: "string",
          description: "The encounter status to filter by. Optional.",
          enum: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled"],
        },
        practitionerId: {
          type: "string",
          description: "The practitioner ID to search encounters for. Optional.",
        },
      },
      required: [],
    },
  },
  // Observation Tools
  {
    name: "createObservation",
    description: "Creates a new observation (lab result, vital sign, etc.). Requires patient ID and code.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient this observation is for.",
        },
        code: {
          type: "string",
          description: "The code representing what was observed (LOINC, SNOMED CT, etc.).",
        },
        valueQuantity: {
          type: "number",
          description: "Numeric value of the observation. Optional.",
        },
        valueString: {
          type: "string",
          description: "String value of the observation. Optional.",
        },
        status: {
          type: "string",
          description: "The status of the observation.",
          enum: ["registered", "preliminary", "final", "amended", "corrected", "cancelled"],
        },
        encounterId: {
          type: "string",
          description: "The encounter this observation is associated with. Optional.",
        },
      },
      required: ["patientId", "code", "status"],
    },
  },
  {
    name: "getObservationById",
    description: "Retrieves an observation by its unique ID.",
    inputSchema: {
      type: "object",
      properties: {
        observationId: {
          type: "string",
          description: "The unique ID of the observation to retrieve.",
        },
      },
      required: ["observationId"],
    },
  },
  {
    name: "updateObservation",
    description: "Updates an existing observation. Requires the observation ID and the fields to update.",
    inputSchema: {
      type: "object",
      properties: {
        observationId: {
          type: "string",
          description: "The unique ID of the observation to update.",
        },
        status: {
          type: "string",
          description: "New status for the observation.",
          enum: ["registered", "preliminary", "final", "amended", "corrected", "cancelled"],
        },
        valueQuantity: {
          type: "number",
          description: "New numeric value of the observation. Optional.",
        },
        valueString: {
          type: "string",
          description: "New string value of the observation. Optional.",
        },
      },
      required: ["observationId"],
    },
  },
  {
    name: "searchObservations",
    description: "Searches for observations based on criteria like patient ID or code.",
    inputSchema: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The patient ID to search observations for. Optional.",
        },
        code: {
          type: "string",
          description: "The observation code to filter by. Optional.",
        },
        status: {
          type: "string",
          description: "The observation status to filter by. Optional.",
          enum: ["registered", "preliminary", "final", "amended", "corrected", "cancelled"],
        },
        encounterId: {
          type: "string",
          description: "The encounter ID to search observations for. Optional.",
        },
      },
      required: [],
    },
  },
  // General FHIR Search Tool
  {
    name: "generalFhirSearch",
    description: "Performs a generic FHIR search operation on any resource type with custom query parameters.",
    inputSchema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          description: "The FHIR resource type to search for (e.g., 'Patient', 'Observation').",
        },
        queryParams: {
          type: "object",
          description: "A record of query parameters, where keys are FHIR search parameters and values are their corresponding values.",
          additionalProperties: {
            oneOf: [
              { type: "string" },
              { type: "number" },
              { type: "boolean" },
              { type: "array", items: { type: "string" } }
            ]
          },
        },
      },
      required: ["resourceType", "queryParams"],
    },
  },
];

// Tool mapping to actual functions
const toolMapping: Record<string, (...args: any[]) => Promise<any>> = {
  createPatient,
  getPatientById, 
  updatePatient,
  searchPatients,
  searchPractitionersByName,
  createPractitioner,
  getPractitionerById,
  updatePractitioner,
  searchPractitioners,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganizations,
  createEncounter,
  getEncounterById,
  updateEncounter,
  searchEncounters,
  createObservation,
  getObservationById,
  updateObservation,
  searchObservations,
  createMedicationRequest,
  getMedicationRequestById,
  updateMedicationRequest,
  searchMedicationRequests,
  createMedication,
  getMedicationById,
  searchMedications,
  createEpisodeOfCare,
  getEpisodeOfCareById,
  updateEpisodeOfCare,
  searchEpisodesOfCare,
  generalFhirSearch,
};

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: mcpTools,
  };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    const toolName = request.params.name;
    const args = request.params.arguments;

    console.error(`Executing tool: ${toolName} with args:`, JSON.stringify(args, null, 2));

    const toolFunction = toolMapping[toolName];
    if (!toolFunction) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    let result;
    
    try {
      // Handle different argument patterns based on tool type
      if (toolName.includes('ById')) {
        // Tools that take a single ID parameter
        const idKey = Object.keys(args).find(key => key.endsWith('Id')) || 'id';
        result = await toolFunction(args[idKey]);
      } else if (toolName.startsWith('update')) {
        // Update tools that take ID and updates object
        const { patientId, practitionerId, organizationId, encounterId, observationId, medicationRequestId, episodeOfCareId, ...updates } = args;
        const id = patientId || practitionerId || organizationId || encounterId || observationId || medicationRequestId || episodeOfCareId;
        result = await toolFunction(id, updates);
      } else {
        // Tools that take the whole arguments object
        result = await toolFunction(args);
      }
    } catch (toolError: any) {
      // Handle specific Medplum/FHIR errors
      if (toolError.message && typeof toolError.message === 'string') {
        // If it's a string error message, wrap it properly
        result = {
          error: toolError.message,
          success: false
        };
      } else if (toolError.outcome) {
        // FHIR OperationOutcome error
        result = {
          error: "FHIR operation failed",
          outcome: toolError.outcome,
          success: false
        };
      } else {
        // Generic error
        result = {
          error: String(toolError),
          success: false
        };
      }
    }

    console.error(`Tool ${toolName} result:`, JSON.stringify(result, null, 2));

    // Ensure result is serializable
    const serializedResult = JSON.stringify(result, null, 2);

    return {
      content: [
        {
          type: "text",
          text: serializedResult,
        },
      ],
    };
  } catch (error) {
    console.error("Error executing tool:", error);
    
    // Ensure error response is always valid JSON
    const errorResponse = {
      error: error instanceof Error ? error.message : String(error),
      success: false
    };

    return {
      content: [
        {
          type: "text", 
          text: JSON.stringify(errorResponse, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Medplum MCP Server running on stdio");
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down Medplum MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down Medplum MCP Server...');
  process.exit(0);
});

// Start the server
runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 