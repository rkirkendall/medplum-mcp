import OpenAI from 'openai';
import { toolSchemas } from './tools/toolSchemas';
import { searchPractitionersByName } from './tools/practitionerSearch';
import { Practitioner } from '@medplum/fhirtypes';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// A simple mapping from tool name (as defined in schema and returned by LLM)
// to the actual function implementation.
const availableTools: Record<string, (...args: any[]) => Promise<any>> = {
  searchPractitionersByName: searchPractitionersByName,
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
        // Before calling the tool, we might need to append its result back to the messages
        // and make another API call for the LLM to generate a human-readable response.
        // For now, let's just execute and return the direct result.
        const toolResult = await toolToExecute(toolArguments);
        console.log(`Result from ${toolName}:`, toolResult);

        // Here, you would typically send the tool result back to the LLM
        // to get a natural language summary. For this test harness,
        // we'll just return the raw tool result.
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
  console.log('\n--- Test Case 1 Result ---');
  console.log(JSON.stringify(result1, null, 2));
  console.log('--------------------------\n');

  // Example 2: A query that might use a different parameter
  const query2 = 'Search for a practitioner named Dr. James Chalmers.';
  const result2 = await processNaturalLanguageQuery(query2);
  console.log('\n--- Test Case 2 Result ---');
  console.log(JSON.stringify(result2, null, 2));
  console.log('--------------------------\n');
  
  // Example 3: Query that might not trigger a tool
  const query3 = 'Hello, how are you today?';
  const result3 = await processNaturalLanguageQuery(query3);
  console.log('\n--- Test Case 3 Result ---');
  console.log(JSON.stringify(result3, null, 2));
  console.log('--------------------------\n');


  // Example with potential no practitioner found.
  // (Assuming 'NonExistentName' is unlikely to be in your test data)
  const query4 = "I'm looking for a practitioner with the family name NonExistentName";
  const result4 = await processNaturalLanguageQuery(query4);
  console.log('\n--- Test Case 4 Result (No Practitioner Expected) ---');
  console.log(JSON.stringify(result4, null, 2));
  console.log('----------------------------------------------------\n');
}

main().catch(console.error); 