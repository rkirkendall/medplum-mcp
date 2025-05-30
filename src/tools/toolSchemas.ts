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
];

// Example of how an LLM might be instructed to use this:
// "If you need to find a practitioner, you can use the 'searchPractitionersByName' tool.
// Provide one of 'givenName', 'familyName', or 'name'.
// For example: { "tool_name": "searchPractitionersByName", "parameters": { "familyName": "Smith" } }" 