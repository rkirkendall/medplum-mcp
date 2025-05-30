export const toolSchemas = [
  {
    name: 'searchPractitionersByName',
    description: 'Searches for Practitioner resources based on name criteria. Returns a list of practitioners. You must provide at least one of the following parameters: givenName, familyName, or name.',
    input_schema: {
      type: 'object',
      properties: {
        givenName: {
          type: 'string',
          description: "The practitioner\'s given name. Use this if the user specifies a first name.",
        },
        familyName: {
          type: 'string',
          description: "The practitioner\'s family name. Use this if the user specifies a last name.",
        },
        name: {
          type: 'string',
          description:
            'A general name search string for the practitioner. This can be used to search across given, family, prefix, suffix, etc. Use this if a specific given or family name is not clear, or if a full name is provided.',
        },
      },
      // OpenAI does not support anyOf at the top level for function parameters.
      // The requirement for at least one parameter is now in the main description.
      // We also remove additionalProperties: false for now, as it might be too restrictive
      // without a more complex schema or further validation logic post-LLM.
      required: [], // No individual property is strictly required on its own, but the function needs at least one.
    },
    // We can expand this later to describe the output structure if needed
    // output_schema: { ... } 
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
];

// Example of how an LLM might be instructed to use this:
// "If you need to find a practitioner, you can use the 'searchPractitionersByName' tool.
// Provide one of 'givenName', 'familyName', or 'name'.
// For example: { "tool_name": "searchPractitionersByName", "parameters": { "familyName": "Smith" } }" 