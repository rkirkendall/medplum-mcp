import OpenAI from 'openai';
import { toolSchemas } from './tools/toolSchemas';
import { searchPractitionersByName } from './tools/practitionerSearch';
import {
  createPatient,
  getPatientById,
  updatePatient,
  searchPatients,
  CreatePatientArgs, // This specific interface might not be directly used by LLM but good for our own type safety if we had other internal calls.
} from './tools/patientUtils';
import { Patient } from '@medplum/fhirtypes'; // Practitioner is imported in practitionerSearch.ts
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// A simple mapping from tool name (as defined in schema and returned by LLM)
// to the actual function implementation.
const availableTools: Record<string, (...args: any[]) => Promise<any>> = {
  searchPractitionersByName: searchPractitionersByName,
  createPatient: createPatient,
  getPatientById: getPatientById,
  updatePatient: updatePatient,
  searchPatients: searchPatients,
  // Future tools will be added here
};

/**
 * Processes a natural language query using an LLM, attempts to map it to a tool,
 * executes the tool if indicated, and returns the result.
 * @param query The natural language query from the user.
 * @returns The result from the tool execution, or a message if no tool was called.
 */
async function processNaturalLanguageQuery(query: string): Promise<any> {
  console.log(`Processing query: "${query}"`);

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that can use tools to interact with a Medplum FHIR server. Based on the user query, decide if a tool is appropriate. If so, respond with the tool call. Otherwise, respond to the user directly.',
      },
      { role: 'user', content: query },
    ];

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = toolSchemas.map((schema) => ({
      type: 'function',
      function: {
        name: schema.name,
        description: schema.description,
        parameters: schema.input_schema,
      },
    }));

    console.log('Sending request to OpenAI with tools:', JSON.stringify(tools, null, 2));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Or your preferred model, e.g., 'gpt-3.5-turbo'
      messages: messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined, // 'auto' lets the model decide, or specify a tool
      temperature: 0.2, // Added temperature setting
    });

    const responseMessage = response.choices[0].message;
    console.log('OpenAI response:', JSON.stringify(responseMessage, null, 2));

    // Check if the model wants to call a tool
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]; // Assuming one tool call for now
      const toolName = toolCall.function.name;
      const toolArguments = JSON.parse(toolCall.function.arguments);

      console.log(`LLM wants to call tool: ${toolName} with arguments:`, toolArguments);

      const toolToExecute = availableTools[toolName];
      if (toolToExecute) {
        let toolResult;
        // Adjust how arguments are passed based on the tool being called
        if (toolName === 'getPatientById') {
          toolResult = await toolToExecute(toolArguments.patientId);
        } else if (toolName === 'updatePatient') {
          // Construct the updates object from any arguments other than patientId
          const { patientId, ...updatesObject } = toolArguments;
          console.log(`Constructed updates for updatePatient:`, updatesObject);
          toolResult = await toolToExecute(patientId, updatesObject);
        } else if (toolName === 'createPatient' || toolName === 'searchPatients' || toolName === 'searchPractitionersByName') {
          // These tools expect the whole argument object as their first parameter
          toolResult = await toolToExecute(toolArguments);
        } else {
          // Default behavior for other tools (if any) - might need adjustment
          console.warn(`Tool ${toolName} called with generic argument passing.`);
          toolResult = await toolToExecute(toolArguments);
        }
        
        console.log(`Result from ${toolName}:`, toolResult);

        return {
          processed: true,
          tool_called: toolName,
          arguments: toolArguments,
          result: toolResult,
        };
      } else {
        console.error(`Error: LLM tried to call unknown tool "${toolName}"`);
        return { processed: false, error: `Unknown tool: ${toolName}` };
      }
    } else {
      // No tool call, LLM responded directly
      console.log('LLM responded directly:', responseMessage.content);
      return {
        processed: true,
        tool_called: null,
        llm_response: responseMessage.content,
      };
    }
  } catch (error) {
    console.error('Error processing natural language query:', error);
    return { processed: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// --- Example Usage ---
async function main() {
  // Example 1: Query that should trigger the practitioner search
  const query1 = 'Can you find a doctor whose last name is Smith?';
  const result1 = await processNaturalLanguageQuery(query1);
  console.log('\n--- Test Case 1 (Practitioner Search) Result ---');
  console.log(JSON.stringify(result1, null, 2));
  console.log('---------------------------------------------\n');

  // Example 2: A query that might use a different parameter for practitioner search
  const query2 = 'Search for a practitioner named Dr. James Chalmers.';
  const result2 = await processNaturalLanguageQuery(query2);
  console.log('\n--- Test Case 2 (Practitioner Search by Full Name) Result ---');
  console.log(JSON.stringify(result2, null, 2));
  console.log('-------------------------------------------------------------\n');
  
  // Example 3: Query that might not trigger a tool
  const query3 = 'Hello, how are you today?';
  const result3 = await processNaturalLanguageQuery(query3);
  console.log('\n--- Test Case 3 (No Tool) Result ---');
  console.log(JSON.stringify(result3, null, 2));
  console.log('----------------------------------\n');

  // Example 4: Query for practitioner search that should find no results
  const query4 = "I'm looking for a practitioner with the family name NonExistentName";
  const result4 = await processNaturalLanguageQuery(query4);
  console.log('\n--- Test Case 4 (Practitioner Search - No Results Expected) Result ---');
  console.log(JSON.stringify(result4, null, 2));
  console.log('---------------------------------------------------------------------\n');

  // --- New Test Cases for Patient Tools ---

  // Test Case 5: Create a new patient
  const query5 = "Please create a new patient named Alice Wonderland, born on July 10th, 1985, gender female.";
  const result5 = await processNaturalLanguageQuery(query5);
  console.log('\n--- Test Case 5 (Create Patient) Result ---');
  console.log(JSON.stringify(result5, null, 2));
  console.log('-----------------------------------------\n');

  let createdPatientIdForFollowUp: string | undefined;
  if (result5.processed && result5.tool_called === 'createPatient' && result5.result?.id) {
    createdPatientIdForFollowUp = result5.result.id;
    console.log(`Patient created with ID: ${createdPatientIdForFollowUp} - will use for get/update tests.`);
  }

  // Test Case 6: Search for the created patient by name
  const query6 = "Can you find patients whose family name is Wonderland?";
  const result6 = await processNaturalLanguageQuery(query6);
  console.log('\n--- Test Case 6 (Search Patient by Name) Result ---');
  console.log(JSON.stringify(result6, null, 2));
  console.log('-------------------------------------------------\n');

  // Test Case 7: Get patient by ID (using ID from Test Case 5 if available)
  if (createdPatientIdForFollowUp) {
    const query7 = `Get me the details for patient with ID ${createdPatientIdForFollowUp}.`;
    const result7 = await processNaturalLanguageQuery(query7);
    console.log('\n--- Test Case 7 (Get Patient By ID) Result ---');
    console.log(JSON.stringify(result7, null, 2));
    console.log('--------------------------------------------\n');

    // Test Case 8: Update the created patient
    const query8 = `Update patient ${createdPatientIdForFollowUp}, set their birth date to 1990-02-02 and gender to female.`;
    const result8 = await processNaturalLanguageQuery(query8);
    console.log('\n--- Test Case 8 (Update Patient) Result ---');
    console.log(JSON.stringify(result8, null, 2));
    console.log('-----------------------------------------\n');
  } else {
    console.log('\n--- Skipping Test Cases 7 & 8 (Get/Update Patient) because patient creation failed or ID was not retrieved ---\n');
  }

  // Test Case 9: Search for patients by a different criteria (e.g., part of a name)
  const query9 = "I'm looking for patients with the first name Alice.";
  const result9 = await processNaturalLanguageQuery(query9);
  console.log('\n--- Test Case 9 (Search Patient by Given Name) Result ---');
  console.log(JSON.stringify(result9, null, 2));
  console.log('-------------------------------------------------------\n');

}

main().catch(console.error); 