// Temporarily disabled while converting to MCP server
// This file will be updated or replaced for MCP testing

// TODO: Implement MCP client testing once server is complete

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as readline from 'readline-sync';
import OpenAI from 'openai';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

class MCPChatTestHarness {
    private client!: Client;
    private transport!: StdioClientTransport;
    private availableTools: MCPTool[] = [];
    private serverProcess: any;
    private conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = [];

    constructor() {
        console.log('🏥 Medplum MCP Chat Test Harness');
        console.log('===============================');
        this.conversationHistory.push({
            role: 'system',
            content: `You are a healthcare data assistant using a Medplum FHIR server through MCP tools. You have access to 33 comprehensive FHIR tools for managing healthcare data.

            IMPORTANT: You are capable of multi-step reasoning and chaining multiple tool calls together to complete complex tasks. When a user asks for something that requires multiple steps, perform ALL necessary steps automatically without asking for permission.

            **Multi-Step Tool Chaining Examples:**
            - If asked about "medications for patient X", first search for the patient, then search for their medications
            - If asked to "create a prescription for John Doe", first find the patient, then create the medication request
            - If asked about "all data for patient Y", search for patient, encounters, observations, medications, etc.
            - Always follow through on tasks completely rather than stopping after the first tool call

            **Available Tool Categories (33 tools total):**
            - Patient Management: create, get, update, search patients
            - Practitioner Management: create, get, update, search practitioners  
            - Organization Management: create, get, update, search organizations
            - Encounter Management: create, get, update, search encounters
            - Observation Management: create, get, update, search observations (labs, vitals)
            - Medication Request Management: create, get, update, search prescriptions
            - Medication Management: create, get, search medications
            - Episode of Care Management: create, get, update, search episodes
            - General FHIR Operations: search any resource type with custom parameters

            **Your Behavior:**
            1. Analyze the user's request and identify ALL steps needed
            2. Execute the tool calls in logical sequence  
            3. Continue until the task is fully complete
            4. **WHEN YOU NEED CLARIFICATION:** If a tool fails due to missing or unclear parameters, or if you need specific information to proceed, ASK THE USER clearly and specifically what you need
            5. **DON'T GUESS:** Never repeatedly guess parameters - if something fails more than once, ask for clarification
            6. Always show clear, helpful results and explain what you found
            7. Be proactive and thorough - don't stop at partial results

            **When Tool Calls Fail Due to Missing Parameters:**
            1. **Analyze the context** - Look at what the user said and what they're trying to accomplish
            2. **Generate reasonable options** - Based on the context, come up with 3-5 likely choices in plain language
            3. **Ask the user to choose** - Present the options clearly and let them pick
            4. **Map to technical codes** - Convert their choice to the appropriate FHIR code/parameter

            **Example: If encounter creation fails with "class code required":**
            - DON'T just say "class code is required" 
            - DO ask: "What type of visit was this? Was it:
              • A regular office visit or clinic appointment?
              • A hospital stay or admission?
              • An emergency room visit?
              • A home healthcare visit?
              • A virtual/telemedicine appointment?"
            - Then map their answer (office visit → AMB, hospital stay → IMP, emergency → EMER, etc.)
            
            **This applies to ALL technical parameters** - status codes, observation types, medication codes, etc. Always translate technical requirements into human-friendly choices.

            Remember: You can call multiple tools in sequence to provide comprehensive answers, but always ask for clarification when you're missing essential information!`
        });
    }

    async initialize() {
        try {
            console.log('🚀 Starting MCP server...');
            
            // Start the MCP server process
            this.serverProcess = spawn('node', ['dist/index.js'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Set up the transport and client
            this.transport = new StdioClientTransport({
                command: 'node',
                args: ['dist/index.js']
            });

            this.client = new Client({
                name: 'medplum-mcp-chat-harness',
                version: '1.0.0'
            }, {
                capabilities: {}
            });

            await this.client.connect(this.transport);
            console.log('✅ Connected to MCP server');

            // Discover available tools
            await this.discoverTools();
            
            console.log(`🔧 Discovered ${this.availableTools.length} MCP tools`);
            console.log('📋 Available tools:', this.availableTools.map(t => t.name).join(', '));
            
        } catch (error) {
            console.error('❌ Failed to initialize MCP client:', error);
            throw error;
        }
    }

    private async discoverTools() {
        try {
            const result = await this.client.listTools();
            
            this.availableTools = result.tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));
        } catch (error) {
            console.error('Failed to discover tools:', error);
            throw error;
        }
    }

    private convertToolsToOpenAIFormat(): any[] {
        return this.availableTools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));
    }

    private async callMCPTool(toolName: string, args: any): Promise<any> {
        try {
            const response = await this.client.callTool({
                name: toolName,
                arguments: args
            });
            return response;
        } catch (error) {
            console.error(`❌ Failed to call MCP tool ${toolName}:`, error);
            throw error;
        }
    }

    async processUserQuery(query: string): Promise<string> {
        console.log(`\n🤖 Processing: "${query}"`);
        
        // Add user message to conversation history
        this.conversationHistory.push({ role: 'user', content: query });

        try {
            let maxIterations = 3; // Reduced to encourage asking for help sooner
            let currentIteration = 0;
            let assistantResponse = '';
            let consecutiveFailures = 0;

            while (currentIteration < maxIterations) {
                currentIteration++;
                console.log(`\n🔄 Iteration ${currentIteration}:`);

                // Send to OpenAI with function calling
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: this.conversationHistory,
                    tools: this.convertToolsToOpenAIFormat(),
                    tool_choice: 'auto',
                    temperature: 0.1
                });

                const assistantMessage = response.choices[0].message;
                assistantResponse = assistantMessage.content || '';

                // Handle tool calls
                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    console.log(`🔧 LLM wants to call ${assistantMessage.tool_calls.length} tool(s):`);
                    
                    const toolResults: string[] = [];
                    
                    for (const toolCall of assistantMessage.tool_calls) {
                        const toolName = toolCall.function.name;
                        const toolArgs = JSON.parse(toolCall.function.arguments);
                        
                        console.log(`   📞 Calling ${toolName} with args:`, toolArgs);
                        
                        try {
                            const result = await this.callMCPTool(toolName, toolArgs);
                            console.log(`   ✅ Result:`, JSON.stringify(result, null, 2));
                            
                            // Check if the result indicates an error (common FHIR pattern)
                            const resultStr = JSON.stringify(result, null, 2);
                            if (resultStr.includes('"error":') && resultStr.includes('"success": false')) {
                                consecutiveFailures++;
                                toolResults.push(`Tool ${toolName} failed: ${resultStr}. ${consecutiveFailures >= 2 ? 'MULTIPLE FAILURES DETECTED - Consider asking the user for clarification about required parameters.' : ''}`);
                            } else {
                                consecutiveFailures = 0; // Reset on success
                                toolResults.push(`Tool ${toolName} result: ${resultStr}`);
                            }
                        } catch (error) {
                            console.log(`   ❌ Error:`, error);
                            consecutiveFailures++;
                            toolResults.push(`Tool ${toolName} error: ${error}. ${consecutiveFailures >= 2 ? 'MULTIPLE FAILURES DETECTED - Consider asking the user for clarification about required parameters.' : ''}`);
                        }
                    }

                    // Send tool results back to OpenAI
                    const toolMessages = assistantMessage.tool_calls.map((toolCall, index) => ({
                        role: 'tool' as const,
                        content: toolResults[index],
                        tool_call_id: toolCall.id
                    }));

                    // Add assistant message and tool results to conversation
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: assistantMessage.content,
                        tool_calls: assistantMessage.tool_calls
                    } as any);
                    
                    this.conversationHistory.push(...toolMessages as any);

                    // Continue the loop to see if more tool calls are needed
                    continue;
                } else {
                    // No more tool calls, we have the final response
                    console.log(`✅ Final response after ${currentIteration} iteration(s)`);
                    break;
                }
            }

            if (currentIteration >= maxIterations) {
                assistantResponse += "\n\n(Note: Reached maximum iteration limit. Task may not be fully complete.)";
            }

            // Add final response to conversation history
            this.conversationHistory.push({ role: 'assistant', content: assistantResponse });
            
            return assistantResponse;

        } catch (error) {
            console.error('❌ Error processing query:', error);
            const errorMessage = `Sorry, I encountered an error: ${error}`;
            this.conversationHistory.push({ role: 'assistant', content: errorMessage });
            return errorMessage;
        }
    }

    async startChatSession() {
        console.log('\n💬 Chat session started! Type your healthcare data queries.');
        console.log('   Examples:');
        console.log('   - "Find all patients named Smith"');
        console.log('   - "Create a new patient John Doe born 1990-05-15"');
        console.log('   - "Search for cardiologists in our system"');
        console.log('   - "Show me the latest observations for patient ID 123"');
        console.log('   - Type "help" for more examples');
        console.log('   - Type "tools" to see all available tools');

        console.log('   - Type "quit" to exit\n');

        while (true) {
            const userInput = readline.question('🏥 You: ');
            
            if (userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
                console.log('👋 Goodbye!');
                await this.cleanup();
                process.exit(0);
            }
            
            if (userInput.toLowerCase() === 'help') {
                this.showExamples();
                continue;
            }
            
            if (userInput.toLowerCase() === 'tools') {
                this.showAvailableTools();
                continue;
            }
            
            if (userInput.toLowerCase() === 'clear') {
                this.conversationHistory = this.conversationHistory.slice(0, 1); // Keep system message
                console.log('🗑️  Conversation history cleared.');
                continue;
            }



            if (userInput.trim() === '') {
                continue;
            }

            try {
                const response = await this.processUserQuery(userInput);
                console.log(`🤖 Assistant: ${response}\n`);
            } catch (error) {
                console.error('❌ Error:', error);
            }
        }
    }

    private showExamples() {
        console.log('\n📚 Example queries you can try:');
        console.log('\n👥 Patient Management:');
        console.log('  • "Create a new patient Jane Smith born 1985-03-20"');
        console.log('  • "Find all patients with last name Johnson"');
        console.log('  • "Get patient details for ID abc123"');
        console.log('  • "Update patient ID xyz789 to mark as inactive"');
        
        console.log('\n👩‍⚕️ Practitioner Management:');
        console.log('  • "Find all doctors named Stevens"');
        console.log('  • "Create a new practitioner Dr. Emily Wilson"');
        console.log('  • "Search for cardiologists"');
        console.log('  • "Get practitioner details for ID prac456"');
        
        console.log('\n🏥 Organization Management:');
        console.log('  • "Create a new hospital called City General"');
        console.log('  • "Find organizations in downtown area"');
        console.log('  • "Get organization details for ID org789"');
        
        console.log('\n📋 Clinical Data:');
        console.log('  • "Create a blood pressure observation for patient ID pat123"');
        console.log('  • "Find all lab results for patient ID pat456"');
        console.log('  • "Create a new encounter for patient visit"');
        console.log('  • "Search for diabetes-related observations"');
        
        console.log('\n💊 Medications:');
        console.log('  • "Create a new medication for hypertension"');
        console.log('  • "Find all medications containing aspirin"');
        console.log('  • "Create a prescription for patient ID pat789"');
        
        console.log('\n🔍 General Searches:');
        console.log('  • "Search for all encounters this month"');
        console.log('  • "Find all active episodes of care"');
        console.log('  • "Search FHIR resources of type Condition"');
        console.log();
    }

    private showAvailableTools() {
        console.log('\n🔧 Available MCP Tools:');
        this.availableTools.forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.name}`);
            console.log(`     ${tool.description}`);
        });
        console.log();
    }



    async cleanup() {
        try {
            console.log('🧹 Cleaning up...');
            if (this.client) {
                await this.client.close();
            }
            if (this.transport) {
                await this.transport.close();
            }
            if (this.serverProcess) {
                this.serverProcess.kill('SIGTERM');
                // Force kill after 2 seconds if it doesn't terminate
                setTimeout(() => {
                    if (this.serverProcess && !this.serverProcess.killed) {
                        this.serverProcess.kill('SIGKILL');
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Main execution
async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Please set OPENAI_API_KEY in your .env file');
        process.exit(1);
    }

    const harness = new MCPChatTestHarness();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await harness.cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Terminating...');
        await harness.cleanup();
        process.exit(0);
    });

    // Handle unexpected exit
    process.on('exit', () => {
        console.log('👋 Process exiting...');
    });

    try {
        await harness.initialize();
        await harness.startChatSession();
    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await harness.cleanup();
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
} 