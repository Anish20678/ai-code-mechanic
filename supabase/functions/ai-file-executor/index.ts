
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'rename';
  filePath: string;
  content?: string;
  newPath?: string;
}

interface ExecutionRequest {
  prompt: string;
  projectId: string;
  sessionId?: string;
  conversationId: string;
  existingFiles?: any[];
  mode: 'execute' | 'analyze';
}

async function logExecutionStep(sessionId: string, stepNumber: number, message: string, level: string = 'info', details?: any) {
  try {
    await supabase.from('execution_logs').insert({
      session_id: sessionId,
      step_number: stepNumber,
      message,
      log_level: level,
      details: details || {}
    });
    console.log(`Step ${stepNumber}: ${message}`);
  } catch (error) {
    console.error('Failed to log execution step:', error);
  }
}

async function updateSessionProgress(sessionId: string, completedSteps: number, status: string = 'running', errorMessage?: string) {
  try {
    await supabase.from('execution_sessions').update({
      completed_steps: completedSteps,
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    }).eq('id', sessionId);
    console.log(`Session ${sessionId} updated: ${completedSteps} steps completed, status: ${status}`);
  } catch (error) {
    console.error('Failed to update session progress:', error);
  }
}

async function executeFileOperations(projectId: string, operations: FileOperation[], sessionId: string): Promise<string[]> {
  const results: string[] = [];
  let stepNumber = 1;

  console.log(`Executing ${operations.length} file operations for project ${projectId}`);

  for (const operation of operations) {
    try {
      await logExecutionStep(sessionId, stepNumber, `Executing ${operation.type} operation on ${operation.filePath}`, 'info');
      
      switch (operation.type) {
        case 'create':
        case 'update':
          const { error: upsertError } = await supabase
            .from('code_files')
            .upsert({
              project_id: projectId,
              file_path: operation.filePath,
              content: operation.content || '',
              updated_at: new Date().toISOString()
            });
          
          if (upsertError) throw upsertError;
          results.push(`${operation.type === 'create' ? 'Created' : 'Updated'} file: ${operation.filePath}`);
          console.log(`Successfully ${operation.type}d file: ${operation.filePath}`);
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('code_files')
            .delete()
            .eq('project_id', projectId)
            .eq('file_path', operation.filePath);
          
          if (deleteError) throw deleteError;
          results.push(`Deleted file: ${operation.filePath}`);
          console.log(`Successfully deleted file: ${operation.filePath}`);
          break;

        case 'rename':
          const { error: renameError } = await supabase
            .from('code_files')
            .update({
              file_path: operation.newPath,
              updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .eq('file_path', operation.filePath);
          
          if (renameError) throw renameError;
          results.push(`Renamed file: ${operation.filePath} -> ${operation.newPath}`);
          console.log(`Successfully renamed file: ${operation.filePath} -> ${operation.newPath}`);
          break;
      }

      await updateSessionProgress(sessionId, stepNumber);
      stepNumber++;
    } catch (error) {
      await logExecutionStep(sessionId, stepNumber, `Error in ${operation.type} operation: ${error.message}`, 'error', { error: error.message });
      console.error(`Error in ${operation.type} operation on ${operation.filePath}:`, error);
      throw error;
    }
  }

  return results;
}

async function generateAIResponse(prompt: string, existingFiles: any[], mode: string): Promise<{ response: string; operations: FileOperation[] }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log(`Generating AI response for mode: ${mode}`);

  const systemPrompt = mode === 'execute' 
    ? `You are Lovable, an AI code executor that creates and modifies files. You MUST analyze user requests and provide specific file operations.

CRITICAL EXECUTE MODE RULES:
1. You MUST respond with valid JSON containing "response" and "operations" fields
2. You MUST provide actual file operations for user requests
3. Create complete, functional code - no placeholders or TODOs
4. Use React 18, TypeScript, Tailwind CSS, Shadcn/ui components
5. Always include proper imports and exports

MANDATORY Response Format (JSON ONLY):
{
  "response": "Brief description of what was implemented",
  "operations": [
    {
      "type": "create",
      "filePath": "src/components/ExampleComponent.tsx",
      "content": "import React from 'react';\\n\\nconst ExampleComponent = () => {\\n  return <div>Hello World</div>;\\n};\\n\\nexport default ExampleComponent;"
    }
  ]
}

Current files context: ${JSON.stringify(existingFiles?.slice(0, 3) || [], null, 2)}

IMPORTANT: Respond with ONLY valid JSON. No markdown, no explanations outside the JSON.`
    : `You are an AI code analyzer. Analyze the provided code and give insights without making changes.

Current files: ${JSON.stringify(existingFiles?.slice(0, 3) || [], null, 2)}

Provide detailed analysis in a conversational format.`;

  try {
    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: mode === 'execute' ? 0.1 : 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('OpenAI response received, length:', aiResponse.length);

    if (mode === 'execute') {
      try {
        let cleanedResponse = aiResponse.trim();
        
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        console.log('Parsing AI response as JSON...');
        const parsed = JSON.parse(cleanedResponse);
        
        // Validate the response structure
        if (!parsed.response || !Array.isArray(parsed.operations)) {
          throw new Error('Invalid response structure from AI');
        }

        console.log(`Parsed ${parsed.operations.length} operations from AI response`);
        return {
          response: parsed.response || 'Executing code changes...',
          operations: parsed.operations || []
        };
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponse.substring(0, 500));
        console.error('Parse error:', parseError);
        
        // Create a simple file operation as fallback
        const fallbackOperation: FileOperation = {
          type: 'create',
          filePath: 'src/components/GeneratedComponent.tsx',
          content: `import React from 'react';

const GeneratedComponent = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Generated Component</h2>
      <p className="text-gray-600">This component was created based on your request: ${prompt.substring(0, 100)}</p>
    </div>
  );
};

export default GeneratedComponent;`
        };
        
        return {
          response: 'Created a basic component based on your request. AI provided non-JSON response.',
          operations: [fallbackOperation]
        };
      }
    } else {
      return {
        response: aiResponse,
        operations: []
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId, sessionId, conversationId, existingFiles = [], mode = 'execute' }: ExecutionRequest = await req.json();
    
    console.log('=== AI File Executor Called ===');
    console.log('Mode:', mode);
    console.log('Project ID:', projectId);
    console.log('Session ID:', sessionId);
    console.log('Prompt length:', prompt.length);
    console.log('Existing files count:', existingFiles.length);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');

    // Create session if not provided
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      const sessionData = await supabase.from('execution_sessions').insert({
        conversation_id: conversationId,
        project_id: projectId,
        execution_type: 'file_execution',
        total_steps: 3,
        status: 'running'
      }).select().single();
      
      if (sessionData.error) {
        throw new Error(`Failed to create session: ${sessionData.error.message}`);
      }
      
      finalSessionId = sessionData.data.id;
      console.log('Created new session:', finalSessionId);
    }

    await logExecutionStep(finalSessionId, 0, `Starting ${mode} mode execution`, 'info', { prompt: prompt.substring(0, 100) });

    // Generate AI response and file operations
    const { response, operations } = await generateAIResponse(prompt, existingFiles, mode);

    console.log('AI Response length:', response.length);
    console.log('Operations count:', operations.length);
    if (operations.length > 0) {
      console.log('Operations:', operations.map(op => ({ type: op.type, filePath: op.filePath })));
    }

    let executionResults: string[] = [];

    if (mode === 'execute' && operations.length > 0) {
      console.log(`=== Executing ${operations.length} file operations ===`);
      
      // Update total steps based on operations
      await supabase.from('execution_sessions').update({
        total_steps: operations.length
      }).eq('id', finalSessionId);

      // Execute file operations
      executionResults = await executeFileOperations(projectId, operations, finalSessionId);

      // Mark session as completed
      await updateSessionProgress(finalSessionId, operations.length, 'completed');
      console.log('=== File operations completed successfully ===');
      
      // Create execution artifacts
      for (const operation of operations) {
        if (operation.type === 'create' || operation.type === 'update') {
          await supabase.from('execution_artifacts').insert({
            session_id: finalSessionId,
            artifact_type: 'code_file',
            file_path: operation.filePath,
            content: operation.content || '',
            metadata: { operation_type: operation.type }
          });
        }
      }
    } else if (mode === 'execute' && operations.length === 0) {
      console.log('Execute mode but no operations generated');
      await logExecutionStep(finalSessionId, 1, 'No file operations generated from AI response', 'warning');
      await updateSessionProgress(finalSessionId, 1, 'completed');
    } else {
      // For analyze mode, just mark as completed
      await updateSessionProgress(finalSessionId, 1, 'completed');
    }

    // Store the AI response as a message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: response,
      metadata: {
        execution_mode: mode,
        operations_count: operations.length,
        execution_results: executionResults,
        session_id: finalSessionId
      }
    });

    console.log('=== Execution Summary ===');
    console.log('Operations executed:', operations.length);
    console.log('Results:', executionResults);
    console.log('Session ID:', finalSessionId);
    console.log('=== End Summary ===');

    return new Response(JSON.stringify({ 
      response,
      operations: operations.length,
      executionResults,
      sessionId: finalSessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR in AI file executor ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // Log error if we have sessionId
    const body = await req.json().catch(() => ({}));
    if (body.sessionId) {
      await logExecutionStep(body.sessionId, -1, `Execution failed: ${error.message}`, 'error', { 
        errorStack: error.stack,
        errorName: error.name 
      });
      await updateSessionProgress(body.sessionId, 0, 'failed', error.message);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
