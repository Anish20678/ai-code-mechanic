
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
  sessionId: string;
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
  } catch (error) {
    console.error('Failed to update session progress:', error);
  }
}

async function executeFileOperations(projectId: string, operations: FileOperation[], sessionId: string): Promise<string[]> {
  const results: string[] = [];
  let stepNumber = 1;

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
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('code_files')
            .delete()
            .eq('project_id', projectId)
            .eq('file_path', operation.filePath);
          
          if (deleteError) throw deleteError;
          results.push(`Deleted file: ${operation.filePath}`);
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
          break;
      }

      await updateSessionProgress(sessionId, stepNumber);
      stepNumber++;
    } catch (error) {
      await logExecutionStep(sessionId, stepNumber, `Error in ${operation.type} operation: ${error.message}`, 'error', { error: error.message });
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

  const systemPrompt = mode === 'execute' 
    ? `You are Lovable, an AI code executor that creates and modifies web applications. You MUST analyze user requests and provide specific file operations to implement their requirements.

CRITICAL EXECUTE MODE RULES:
1. You MUST respond with a valid JSON object containing "response" and "operations" fields
2. You MUST provide actual file operations that implement the user's request
3. Create complete, functional code that follows React/TypeScript best practices
4. Use Tailwind CSS for styling and Shadcn/ui components when appropriate
5. Focus on creating working implementations, not explanations

Tech Stack Context:
- React 18 with TypeScript
- Tailwind CSS for styling  
- Supabase for backend
- Shadcn/ui components available
- Existing files: ${JSON.stringify(existingFiles?.slice(0, 5) || [], null, 2)}

MANDATORY Response Format:
{
  "response": "Brief description of implementation",
  "operations": [
    {
      "type": "create|update|delete|rename",
      "filePath": "path/to/file.tsx",
      "content": "complete file content here"
    }
  ]
}

IMPLEMENTATION EXAMPLES:
- Dashboard components with proper TypeScript interfaces
- Authentication flows with error handling
- Form validation and state management
- API integrations and data fetching
- Responsive UI with Tailwind classes

Provide working, complete code without placeholders or TODO comments. Each operation must contain fully functional code ready for immediate use.`
    : `You are an AI code analyzer. Analyze the provided code and give insights, suggestions, and explanations without making changes.

Context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Existing files: ${JSON.stringify(existingFiles?.slice(0, 5) || [], null, 2)}

Provide detailed analysis and suggestions in a conversational format.`;

  try {
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

    if (mode === 'execute') {
      try {
        let cleanedResponse = aiResponse.trim();
        
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleanedResponse);
        
        // Validate the response structure
        if (!parsed.response || !Array.isArray(parsed.operations)) {
          throw new Error('Invalid response structure from AI');
        }

        return {
          response: parsed.response || 'Executing code changes...',
          operations: parsed.operations || []
        };
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponse);
        console.error('Parse error:', parseError);
        
        // Create a fallback response with basic error handling
        return {
          response: 'AI provided non-JSON response. Please try rephrasing your request to be more specific about what files and components you want created.',
          operations: []
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
    
    console.log('AI File Executor called:', { 
      prompt: prompt.substring(0, 200) + '...', 
      projectId, 
      sessionId, 
      mode,
      existingFilesCount: existingFiles.length 
    });

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    await logExecutionStep(sessionId, 0, `Starting ${mode} mode execution with prompt: ${prompt.substring(0, 100)}...`, 'info');

    // Generate AI response and file operations
    const { response, operations } = await generateAIResponse(prompt, existingFiles, mode);

    console.log('AI Response generated:', { 
      responseLength: response.length, 
      operationsCount: operations.length,
      operations: operations.map(op => ({ type: op.type, filePath: op.filePath }))
    });

    let executionResults: string[] = [];

    if (mode === 'execute' && operations.length > 0) {
      console.log(`Executing ${operations.length} file operations`);
      
      // Update total steps based on operations
      await supabase.from('execution_sessions').update({
        total_steps: operations.length
      }).eq('id', sessionId);

      // Execute file operations
      executionResults = await executeFileOperations(projectId, operations, sessionId);

      // Mark session as completed
      await updateSessionProgress(sessionId, operations.length, 'completed');
      
      // Create execution artifacts
      for (const operation of operations) {
        if (operation.type === 'create' || operation.type === 'update') {
          await supabase.from('execution_artifacts').insert({
            session_id: sessionId,
            artifact_type: 'code_file',
            file_path: operation.filePath,
            content: operation.content || '',
            metadata: { operation_type: operation.type }
          });
        }
      }
    } else if (mode === 'execute' && operations.length === 0) {
      console.log('Execute mode but no operations generated');
      await logExecutionStep(sessionId, 1, 'No file operations generated from AI response', 'warning');
      await updateSessionProgress(sessionId, 1, 'completed');
    } else {
      // For analyze mode, just mark as completed
      await updateSessionProgress(sessionId, 1, 'completed');
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
        session_id: sessionId
      }
    });

    console.log('Execution completed successfully:', {
      operationsExecuted: operations.length,
      resultsCount: executionResults.length
    });

    return new Response(JSON.stringify({ 
      response,
      operations: operations.length,
      executionResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI file executor:', error);
    
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
