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
  // MedicationRequest Tool Schemas (Add these as per medicationRequestUtils.ts)
  // ... (Assuming MedicationRequest schemas are already here or will be added separately)

  // Medication Tool Schemas
  {
    name: 'createMedication',
    description: 'Creates a new Medication resource. Requires at least a code system and code value.',
    input_schema: {
      type: 'object',
      properties: {
        code_coding_system: {
          type: 'string',
          description: "The system for the medication code (e.g., 'http://www.nlm.nih.gov/research/umls/rxnorm').",
        },
        code_coding_code: {
          type: 'string',
          description: 'The value for the medication code (e.g., \'313782\').',
        },
        code_coding_display: {
          type: 'string',
          description: 'Optional display text for the medication code (e.g., \'Amoxicillin 250mg Oral Tablet\').',
        },
        code_text: {
          type: 'string',
          description: 'Optional fallback text for the overall medication code concept.',
        },
        status: {
          type: 'string',
          description: "The status of the medication. Optional.",
          enum: ['active', 'inactive', 'entered-in-error'],
        },
        manufacturer_reference: {
          type: 'string',
          description: 'Optional reference to the manufacturer Organization (e.g., \"Organization/123\").',
        },
        form_coding_system: {
          type: 'string',
          description: "Optional: The system for the medication form code (e.g., 'http://snomed.info/sct').",
        },
        form_coding_code: {
          type: 'string',
          description: "Optional: The value for the medication form code (e.g., \'385055001\').",
        },
        form_coding_display: {
          type: 'string',
          description: "Optional: Display text for the medication form code (e.g., \'Oral tablet\').",
        },
        form_text: {
          type: 'string',
          description: 'Optional: Fallback text for the overall medication form concept.',
        },
        identifier_system: {
          type: 'string',
          description: "Optional: System for a medication identifier (e.g., 'http://hl7.org/fhir/sid/ndc').",
        },
        identifier_value: {
          type: 'string',
          description: 'Optional: Value for the medication identifier.',
        },
      },
      required: ['code_coding_system', 'code_coding_code'],
    },
  },
  {
    name: 'getMedicationById',
    description: 'Retrieves a Medication resource by its unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        medicationId: { type: 'string', description: 'The unique ID of the Medication to retrieve.' },
      },
      required: ['medicationId'],
    },
  },
  {
    name: 'searchMedications',
    description: 'Searches for Medication resources based on code, identifier, or status. Provide at least one criterion.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: "Search by medication code. Can be a simple string (e.g., 'Aspirin') or system|value (e.g., 'http://www.nlm.nih.gov/research/umls/rxnorm|1191'). Optional.",
        },
        identifier: {
          type: 'string',
          description: "Search by medication identifier. Can be a simple value or system|value. Optional.",
        },
        status: {
          type: 'string',
          description: "Search by medication status. Optional.",
          enum: ['active', 'inactive', 'entered-in-error'],
        },
      },
      required: [], // Function logic requires at least one criterion
    },
  },
  // EpisodeOfCare Tool Schemas
  {
    name: 'createEpisodeOfCare',
    description: 'Creates a new EpisodeOfCare for a patient. Requires patient ID and status.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: "The ID of the patient for whom this episode of care is being created." },
        status: { 
          type: 'string', 
          description: "The status of the episode of care.",
          enum: ['planned', 'waitlist', 'active', 'onhold', 'finished', 'cancelled', 'entered-in-error']
        },
        managingOrganizationId: { type: 'string', description: "Optional. ID of the organization managing this episode of care." },
        careManagerId: { type: 'string', description: "Optional. ID of the practitioner who is the care manager for this episode." },
        type: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coding: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    system: { type: 'string', description: "The URI for the coding system (e.g., 'http://terminology.hl7.org/CodeSystem/episodeofcare-type')." },
                    code: { type: 'string', description: "The code from the coding system (e.g., 'hacc')." },
                    display: { type: 'string', description: "Optional. The display name for the code." }
                  },
                  required: ['system', 'code']
                }
              },
              text: { type: 'string', description: "Optional. Plain text representation of the type." }
            },
            // required: ['coding'] // A type can be just text
          },
          description: "Optional. Type of episode of care, e.g., Home and Community Care. Provide an array of CodeableConcept objects."
        },
        periodStart: { type: 'string', format: 'date-time', description: "Optional. The start date/time of the episode of care (ISO8601 format)." },
        periodEnd: { type: 'string', format: 'date-time', description: "Optional. The end date/time of the episode of care (ISO8601 format)." },
        identifier: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string', description: "The system for the identifier (e.g., 'urn:oid:1.2.3.4.5')." },
              value: { type: 'string', description: "The value of the identifier." }
            },
            required: ['value']
          },
          description: "Optional. One or more identifiers for this episode of care."
        }
      },
      required: ['patientId', 'status']
    }
  },
  {
    name: 'getEpisodeOfCareById',
    description: 'Retrieves a specific EpisodeOfCare resource by its ID.',
    input_schema: {
      type: 'object',
      properties: {
        episodeOfCareId: { type: 'string', description: 'The unique ID of the EpisodeOfCare to retrieve.' }
      },
      required: ['episodeOfCareId']
    }
  },
  {
    name: 'updateEpisodeOfCare',
    description: 'Updates an existing EpisodeOfCare. Requires the EpisodeOfCare ID and the fields to update.',
    input_schema: {
      type: 'object',
      properties: {
        episodeOfCareId: { type: 'string', description: 'The unique ID of the EpisodeOfCare to update.' },
        status: { 
          type: 'string', 
          description: "New status for the episode of care. Optional.",
          enum: ['planned', 'waitlist', 'active', 'onhold', 'finished', 'cancelled', 'entered-in-error']
        },
        type: { /* Same as in createEpisodeOfCare, optional */ type: 'array', items: { '$ref': '#/definitions/episodeOfCareTypeItem' }, description: "Optional. New list of types for the episode of care. This will replace the existing types." },
        periodStart: { type: 'string', format: 'date-time', description: "Optional. New start date/time (ISO8601)." },
        periodEnd: { type: 'string', format: 'date-time', description: "Optional. New end date/time (ISO8601)." },
        managingOrganizationId: { type: 'string', description: "Optional. New ID of the managing organization. Provide an empty string or null (if supported by LLM) to remove." },
        careManagerId: { type: 'string', description: "Optional. New ID of the care manager. Provide an empty string or null to remove." }
        // Diagnosis updates are complex and typically handled differently, so not included in simple updates.
      },
      required: ['episodeOfCareId'] // At least one update field is implicitly required
    }
  },
  {
    name: 'searchEpisodesOfCare',
    description: 'Searches for EpisodeOfCare resources based on specified criteria. At least one search parameter must be provided.',
    input_schema: {
      type: 'object',
      properties: {
        patient: { type: 'string', description: "Patient ID (e.g., '123' or 'Patient/123')." },
        status: { type: 'string', description: "Status of the episode (e.g., 'active', or 'active,onhold')." },
        type: { type: 'string', description: "Type of episode, token search (e.g., 'hacc' or 'http://sys|code')." },
        date: { 
            oneOf: [
                { type: 'string', description: "Date or date range (e.g., '2023-01-01', 'ge2023-01-01&le2023-12-31')." },
                { type: 'array', items: { type: 'string' }, description: "Array of date parameters (e.g., ['ge2023-01-01', 'le2023-12-31'])." }
            ],
            description: "Search by period start/end date." 
        },
        identifier: { type: 'string', description: "Identifier for the episode (e.g., 'urn:sys|value' or 'value')." },
        organization: { type: 'string', description: "Managing organization ID (e.g., 'Organization/456' or '456')." }, // Changed from managing-organization
        'care-manager': { type: 'string', description: "Care manager (Practitioner) ID (e.g., 'Practitioner/789' or '789')." }
      },
      required: [] // Function logic enforces at least one criterion
    }
  },
  // General FHIR Search Tool Schema
  {
    name: 'generalFhirSearch',
    description: 'Performs a generic search for any FHIR resource type using specified query parameters. Useful when the exact resource type is known and specific search criteria need to be applied, or for resource types not covered by other specialized tools.',
    input_schema: {
      type: 'object',
      properties: {
        resourceType: {
          type: 'string',
          description: "The FHIR resource type to search for (e.g., 'Patient', 'Observation', 'MedicationRequest'). This must be a valid FHIR resource type name.",
          // Potentially add an enum of common ResourceTypes if helpful for LLM, but can be very long.
          // Example enum (partial): enum: ['Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation', 'MedicationRequest', 'Condition', 'Procedure', 'DiagnosticReport']
        },
        queryParams: {
          type: 'object',
          description: "An object where keys are FHIR search parameters (e.g., 'name', 'date', '_id', 'patient') and values are the corresponding search values. For parameters that can appear multiple times (like 'date' for a range), provide an array of strings as the value (e.g., { date: ['ge2023-01-01', 'le2023-01-31'] }). For token parameters (codeableConcepts), provide the value as 'system|code' or just 'code'. For reference parameters, use 'ResourceType/id' or just 'id'.",
          additionalProperties: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'array', items: { type: 'string' } }
            ]
          },
          example: {
            _id: "12345",
            status: "active",
            "patient.name": "John Doe",
            date: ["ge2024-01-01", "le2024-01-31"]
          }
        }
      },
      required: ['resourceType', 'queryParams']
    }
  },
  // Condition Tool Schemas
  {
    name: 'createCondition',
    description:
      'Creates a new condition or diagnosis for a patient. Requires a patient ID and a condition code.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'The ID of the patient for whom the condition is being created.',
        },
        code: {
          type: 'object',
          description:
            'The code representing the condition. Must include a coding system, code, and display text.',
          properties: {
            coding: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'string',
                    description: 'The URI of the coding system (e.g., "http://snomed.info/sct").',
                  },
                  code: { type: 'string', description: 'The code from the system (e.g., "44054006").' },
                  display: {
                    type: 'string',
                    description:
                      'The human-readable display text for the code (e.g., "Type 2 diabetes mellitus").',
                  },
                },
                required: ['system', 'code', 'display'],
              },
            },
            text: { type: 'string', description: 'A human-readable summary of the condition.' },
          },
          required: ['coding', 'text'],
        },
        clinicalStatus: {
          type: 'string',
          description: 'The clinical status of the condition. For example: "active", "inactive", "resolved".',
          enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
        },
        onsetString: {
          type: 'string',
          description:
            'Estimated date, state, or age when the condition began (e.g., "about 3 years ago"). Optional.',
        },
        recordedDate: {
          type: 'string',
          description: 'The date the condition was recorded, in YYYY-MM-DD format. Optional.',
        },
      },
      required: ['patientId', 'code'],
    },
  },
  {
    name: 'getConditionById',
    description: 'Retrieves a condition resource by its unique ID.',
    input_schema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'The unique ID of the condition to retrieve.',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'updateCondition',
    description: 'Updates an existing condition. Requires the condition ID and at least one field to update.',
    input_schema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'The unique ID of the condition to update.',
        },
        clinicalStatus: {
          type: 'string',
          description: 'The new clinical status of the condition.',
          enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
        },
        verificationStatus: {
          type: 'string',
          description: 'The new verification status of the condition.',
          enum: ['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error'],
        },
        onsetString: {
          type: 'string',
          description: 'Update the onset description. To remove this field, provide a `null` value.',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'searchConditions',
    description: 'Searches for conditions based on patient and other criteria. Requires a patient ID.',
    input_schema: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: "The ID of the patient whose conditions are being searched.",
        },
        code: {
          type: 'string',
          description: 'A code to filter by, e.g., "http://snomed.info/sct|44054006". Optional.',
        },
        'clinical-status': {
          type: 'string',
          description: 'Filter by clinical status.',
          enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
        },
        category: {
          type: 'string',
          description: 'Filter by category, e.g., "encounter-diagnosis" or "problem-list-item".',
        },
      },
      required: ['patientId'],
    },
  },
];

// Helper definition for EpisodeOfCare type items, used in create/update schemas via $ref
// This avoids repetition and ensures consistency.
// Note: JSON Schema $ref might need specific handling or flattening depending on the LLM/tooling.
// For simplicity, if $ref is problematic, duplicate the structure.
// As of now, the LLM might not support $ref, so it's better to inline for `type` in `updateEpisodeOfCare`
// I will remove the $ref for now.
/*
toolSchemas.definitions = {
  episodeOfCareTypeItem: {
    type: 'object',
    properties: {
      coding: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            system: { type: 'string', description: "The URI for the coding system." },
            code: { type: 'string', description: "The code from the coding system." },
            display: { type: 'string', description: "Optional. Display name." }
          },
          required: ['system', 'code']
        }
      },
      text: { type: 'string', description: "Optional. Plain text representation." }
    }
  }
};
*/

// Adjusting updateEpisodeOfCare to inline the type definition if $ref is not ideal
const updateEpisodeOfCareSchema = toolSchemas.find(s => s.name === 'updateEpisodeOfCare');
if (updateEpisodeOfCareSchema && updateEpisodeOfCareSchema.input_schema.properties.type) {
  updateEpisodeOfCareSchema.input_schema.properties.type = {
    type: 'array',
    items: { // Inlined structure
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string', description: "The URI for the coding system (e.g., 'http://terminology.hl7.org/CodeSystem/episodeofcare-type')." },
              code: { type: 'string', description: "The code from the coding system (e.g., 'hacc')." },
              display: { type: 'string', description: "Optional. The display name for the code." }
            },
            required: ['system', 'code']
          }
        },
        text: { type: 'string', description: "Optional. Plain text representation of the type." }
      }
    },
    description: "Optional. New list of types for the episode of care. This will replace the existing types."
  };
}

// Example of how an LLM might be instructed to use this:
// "If you need to find a practitioner, you can use the 'searchPractitionersByName' tool.
// Provide one of 'givenName', 'familyName', or 'name'.
// For example: { "tool_name": "searchPractitionersByName", "parameters": { "familyName": "Smith" } }" 