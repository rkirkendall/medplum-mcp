export const toolSchemas = [
  {
    name: 'searchPractitionersByName',
    description: "Searches for medical practitioners (doctors, nurses, etc.) based on their given name, family name, or a general name string. Provide at least one name component.",
    input_schema: {
      type: 'object',
      properties: {
        givenName: {
          type: 'string',
          description: "The practitioner\'s given (first) name. Optional.",
        },
        familyName: {
          type: 'string',
          description: "The practitioner\'s family (last) name. Optional.",
        },
        name: {
          type: 'string',
          description: "A general name search string for the practitioner (e.g., \'Dr. John Smith\', \'Smith\'). Optional.",
        },
      },
      required: [], // Function logic handles requiring at least one param
    },
  },
  {
    name: 'createPractitioner',
    description: 'Creates a new medical practitioner. Requires given name and family name.',
    input_schema: {
      type: 'object',
      properties: {
        givenName: { type: 'string', description: "The practitioner\'s given (first) name." },
        familyName: { type: 'string', description: "The practitioner\'s family (last) name." },
        // Optional: Add more properties like identifier, telecom, address as needed by LLM
        // For example:
        // identifierValue: { type: 'string', description: "An identifier for the practitioner (e.g., NPI)." },
        // identifierSystem: { type: 'string', description: "The system for the identifier (e.g., 'http://hl7.org/fhir/sid/us-npi')." }
      },
      required: ['givenName', 'familyName'],
    },
  },
  {
    name: 'getPractitionerById',
    description: 'Retrieves a practitioner resource by their unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        practitionerId: { type: 'string', description: 'The unique ID of the practitioner to retrieve.' },
      },
      required: ['practitionerId'],
    },
  },
  {
    name: 'updatePractitioner',
    description: "Updates an existing practitioner\'s information. Requires the practitioner\'s ID and the fields to update.",
    input_schema: {
      type: 'object',
      properties: {
        practitionerId: { type: 'string', description: "The unique ID of the practitioner to update." },
        // Add properties for fields that can be updated, e.g.:
        // active: { type: 'boolean', description: "Set the practitioner as active or inactive." },
        // telecomValue: { type: 'string', description: "New phone number or email." },
        // telecomSystem: { type: 'string', description: "System for the telecom (phone, email)." },
        // givenName: { type: 'string', description: "New given name for the practitioner (note: full name update might be complex)." },
        // familyName: { type: 'string', description: "New family name." }
        // For simplicity, LLM can provide a flat structure of updates.
        // The function `updatePractitioner` expects a structure like UpdatePractitionerArgs or Omit<Partial<Practitioner>, 'resourceType' | 'id'>
        // The LLM should be guided to provide relevant top-level fields from Practitioner resource that are updatable.
        // Example based on UpdatePractitionerArgs (simplified for LLM):
        active: { type: 'boolean', description: 'Update active status.', optional: true },
        telecom: { 
          type: 'array', 
          items: { 
            type: 'object', 
            properties: { 
              system: { type: 'string', enum: ['phone', 'email', 'fax', 'pager', 'sms', 'other'] }, 
              value: { type: 'string' }, 
              use: { type: 'string', enum: ['home', 'work', 'temp', 'old', 'mobile'] , optional: true}
            },
            required: ['system', 'value']
          },
          description: "Contact details (phone, email, etc.). Provide an array of telecom entries.", optional: true
        },
        address: { 
          type: 'array', 
          items: { 
            type: 'object',
            // Simplified address properties for LLM
            properties: { 
              line: { type: 'array', items: {type: 'string'}, description: "Street lines, e.g. [\'123 Main St\']" },
              city: { type: 'string' },
              state: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string', optional: true }
            },
            required: ['line', 'city', 'state', 'postalCode']
          },
          description: "Addresses for the practitioner. Provide an array of address entries.", optional: true
        }
        // Other fields like `name` (full array) could be complex for LLM, better to stick to simpler fields or use specific functions for name changes if needed.
      },
      required: ['practitionerId'], // At least one update field should be implicitly required by the user's intent
    },
  },
  {
    name: 'searchPractitioners',
    description: 'Searches for practitioners based on various criteria like name, specialty, or identifier.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "A general name search string.", optional: true },
        given: { type: 'string', description: "The practitioner\'s given (first) name.", optional: true },
        family: { type: 'string', description: "The practitioner\'s family (last) name.", optional: true },
        specialty: { type: 'string', description: "The practitioner\'s specialty (e.g., cardiology).", optional: true },
        identifier: { type: 'string', description: "An identifier for the practitioner (e.g., NPI value).", optional: true },
      },
      required: [], // Function logic will handle if no criteria are provided
    },
  },
  // Organization Tool Schemas
  {
    name: 'createOrganization',
    description: 'Creates a new organization (e.g., hospital, clinic). Requires organization name.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "The official name of the organization." },
        alias: { type: 'array', items: { type: 'string' }, description: "A list of aliases for the organization. Optional." },
        // Add other relevant fields from CreateOrganizationArgs as needed for LLM
        // Example: contact details if they are simple enough for LLM to provide
      },
      required: ['name'],
    },
  },
  {
    name: 'getOrganizationById',
    description: 'Retrieves an organization by its unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'The unique ID of the organization to retrieve.' },
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'updateOrganization',
    description: "Updates an existing organization. Requires the organization ID and the fields to update.",
    input_schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: "The unique ID of the organization to update." },
        name: { type: 'string', description: "The new official name of the organization. Optional." },
        alias: { type: 'array', items: { type: 'string' }, description: "An updated list of aliases. Optional." },
        // Add other updatable fields from UpdateOrganizationArgs as simplified properties for LLM
        // Example: contact, address - keeping them simple for LLM
      },
      required: ['organizationId'], // At least one update field implied
    },
  },
  {
    name: 'searchOrganizations',
    description: "Searches for organizations based on criteria like name or address. Provide at least one criterion.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "The name of the organization to search for. Optional." },
        address: { type: 'string', description: "Part of the organization\'s address to search for. Optional." },
      },
      required: [], // Function logic ensures at least one is present
    },
  },
  // Patient Tools Schemas
  {
    name: 'createPatient',
    description: 'Creates a new patient resource. Requires first name, last name, and birth date.',
    input_schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: "The patient\'s first name.",
        },
        lastName: {
          type: 'string',
          description: "The patient\'s last name.",
        },
        birthDate: {
          type: 'string',
          description: "The patient\'s birth date in YYYY-MM-DD format.",
        },
        gender: {
          type: 'string',
          description: "The patient\'s gender (male, female, other, unknown). Optional.",
          enum: ['male', 'female', 'other', 'unknown'],
        },
      },
      required: ['firstName', 'lastName', 'birthDate'],
    },
  },
  {
    name: 'getPatientById',
    description: 'Retrieves a patient resource by their unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'The unique ID of the patient to retrieve.',
        },
      },
      required: ['patientId'],
    },
  },
  {
    name: 'updatePatient',
    description: 'Updates an existing patient resource. Requires the patient ID and an object containing the fields to update.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'The unique ID of the patient to update.',
        },
        updates: {
          type: 'object',
          description: "An object containing the patient fields to update. For example, { \"birthDate\": \"1990-01-01\", \"gender\": \"female\" }. Refer to the Patient FHIR resource for possible fields. For updating name, provide the full name structure, e.g., { name: [{ given: [\'NewFirstName\', \'NewMiddle\'], family: \'ExistingLastName\' }] }.",
          // We don't define exhaustive properties for 'updates' here as it's a partial Patient.
          // The description should guide the LLM.
        },
      },
      required: ['patientId', 'updates'],
    },
  },
  {
    name: 'searchPatients',
    description: 'Searches for patient resources based on various criteria. You must provide at least one of the following parameters: name, family, given, birthdate, identifier, email, or phone. Returns a list of patients.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "A general name search string for the patient (searches across given, family, etc.). Optional."
        },
        family: {
          type: 'string',
          description: "The patient\'s family (last) name. Optional."
        },
        given: {
          type: 'string',
          description: "The patient\'s given (first) name. Optional."
        },
        birthdate: {
          type: 'string',
          description: "The patient\'s birth date in YYYY-MM-DD format. Optional."
        },
        identifier: {
          type: 'string',
          description: "A patient identifier (e.g., MRN). Optional."
        },
        email: {
          type: 'string',
          description: "The patient\'s email address. Optional."
        },
        phone: {
          type: 'string',
          description: "The patient\'s phone number. Optional."
        }
        // Add other common search parameters as needed, making them optional.
      },
      required: [] // No single field is strictly required, but the function expects at least one useful parameter.
    },
  },
  // Encounter Tool Schemas
  {
    name: 'createEncounter',
    description: 'Creates a new patient encounter (e.g., a doctor visit or hospital stay).',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'The status of the encounter (e.g., planned, in-progress, finished, cancelled).',
          enum: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
        },
        classCode: {
          type: 'string',
          description: 'The class of the encounter (e.g., AMB for ambulatory, IMP for inpatient, EMER for emergency).',
        },
        patientId: {
          type: 'string',
          description: 'The ID of the patient for whom this encounter is being created.',
        },
        practitionerIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional. A list of practitioner IDs involved in the encounter.',
        },
        organizationId: {
          type: 'string',
          description: 'Optional. The ID of the organization (e.g., hospital or clinic) where the encounter takes place.',
        },
        typeCode: {
          type: 'string',
          description: "Optional. Specific type of encounter (e.g., 'CHECKUP', 'EMERGENCY'). Code from a recognized system.",
        },
        typeSystem: {
          type: 'string',
          description: "Optional. The URI of the coding system for the typeCode (e.g., 'http://terminology.hl7.org/CodeSystem/v3-ActCode').",
        },
        typeDisplay: {
          type: 'string',
          description: 'Optional. A human-readable display name for the encounter type.',
        },
        periodStart: {
          type: 'string',
          format: 'date-time',
          description: 'Optional. The start date and time of the encounter in ISO8601 format.',
        },
        periodEnd: {
          type: 'string',
          format: 'date-time',
          description: 'Optional. The end date and time of the encounter in ISO8601 format.',
        },
        reasonCode: {
          type: 'string',
          description: 'Optional. The primary reason for the encounter (e.g., a SNOMED CT code).',
        },
        reasonSystem: {
          type: 'string',
          description: "Optional. The URI of the coding system for the reasonCode (e.g., 'http://snomed.info/sct').",
        },
        reasonDisplay: {
          type: 'string',
          description: 'Optional. A human-readable display name for the reason of the encounter.',
        },
        identifierValue: {
          type: 'string',
          description: 'Optional. An identifier for this encounter e.g. an appointment number'
        },
        identifierSystem: {
          type: 'string',
          description: 'Optional. The system for the identifier e.g. urn:oid:1.2.3.4.5'
        }
      },
      required: ['status', 'classCode', 'patientId'],
    },
  },
  {
    name: 'getEncounterById',
    description: 'Retrieves a specific encounter resource by its unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        encounterId: {
          type: 'string',
          description: 'The unique ID of the encounter to retrieve.',
        },
      },
      required: ['encounterId'],
    },
  },
  {
    name: 'updateEncounter',
    description: 'Updates an existing encounter. Requires the encounter ID and an object containing the fields to update.',
    input_schema: {
      type: 'object',
      properties: {
        encounterId: {
          type: 'string',
          description: 'The unique ID of the encounter to update.',
        },
        updates: {
          type: 'object',
          description: "An object containing the encounter fields to update. Refer to the Encounter FHIR resource definition for possible fields. For example, to update status: { \"status\": \"in-progress\" }. For fields like 'class' or 'type', you can provide a simple code (e.g., { \"class\": \"IMP\" }) or the full FHIR Coding/CodeableConcept structure if needed for precision.",
          properties: {
            // Define common, simple updatable fields here to guide the LLM.
            // More complex structures can be passed, and the description guides the LLM.
            status: {
              type: 'string',
              description: "Update the status of the encounter (e.g., planned, in-progress, finished). Optional.",
              enum: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
            },
            class: {
              type: ['string', 'object'], // Can be a simple code string or a FHIR Coding object
              description: "Update the class of the encounter (e.g., AMB, IMP, EMER as a string, or a FHIR Coding object). Optional.",
            },
            // For 'type' (CodeableConcept[]), it's harder to simplify for LLM updates via simple properties.
            // The main 'updates' description guides it to provide FHIR structure or simple type code string within the type array.
            // Example: updates: { type: [{ coding: [{ system: 'some-system', code: 'XYZ' }] }] } or potentially simplified if handled by util.
            periodStart: {
              type: 'string',
              format: 'date-time',
              description: "Update the start date and time of the encounter (ISO8601 format). Optional.",
            },
            periodEnd: {
              type: 'string',
              format: 'date-time',
              description: "Update the end date and time of the encounter (ISO8601 format). Optional.",
            },
            // Add other commonly updated simple fields as necessary.
            // For complex fields like 'participant', 'reasonCode', 'hospitalization', the LLM should provide them
            // directly in the 'updates' object matching FHIR structure, guided by the main description.
          },
          additionalProperties: true, // Allows other FHIR fields not explicitly listed here
        },
      },
      required: ['encounterId', 'updates'],
    },
  },
  {
    name: 'searchEncounters',
    description: 'Searches for encounters based on criteria like patient, practitioner, date, status, or class. Provide at least one criterion.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: "Optional. The ID of the patient involved in the encounters."
        },
        practitionerId: {
          type: 'string',
          description: "Optional. The ID of a practitioner involved in the encounters."
        },
        organizationId: {
          type: 'string',
          description: "Optional. The ID of the service provider organization."
        },
        date: {
          type: 'string',
          description: "Optional. A date or date range for the encounter (e.g., '2023-10-26', 'ge2023-10-01&le2023-10-31')."
        },
        status: {
          type: ['string', 'array'],
          items: { type: 'string' }, // For array case
          description: "Optional. The status of the encounter (e.g., 'finished') or a comma-separated list of statuses (e.g., 'planned,in-progress').",
          // FHIR search for multiple statuses is typically status=code1,code2 - so a string might be better for LLM.
          // Or, LLM provides an array and we join it. Let's keep it simple for LLM: a string that might be CSV.
        },
        classCode: {
          type: 'string',
          description: "Optional. The class of the encounter (e.g., 'AMB', 'IMP')."
        },
        typeCode: {
          type: 'string',
          description: "Optional. The type code of the encounter (e.g., 'CHECKUP')."
        },
        identifier: {
          type: 'string',
          description: "Optional. An identifier associated with the encounter."
        }
      },
      required: [], // Function logic might require at least one or warn for broad searches
    },
  },
];

// Example of how an LLM might be instructed to use this:
// "If you need to find a practitioner, you can use the 'searchPractitionersByName' tool.
// Provide one of 'givenName', 'familyName', or 'name'.
// For example: { "tool_name": "searchPractitionersByName", "parameters": { "familyName": "Smith" } }" 