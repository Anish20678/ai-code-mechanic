
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
  await supabase.from('execution_logs').insert({
    session_id: sessionId,
    step_number: stepNumber,
    message,
    log_level: level,
    details: details || {}
  });
}

async function updateSessionProgress(sessionId: string, completedSteps: number, status: string = 'running', errorMessage?: string) {
  await supabase.from('execution_sessions').update({
    completed_steps: completedSteps,
    status,
    error_message: errorMessage,
    updated_at: new Date().toISOString()
  }).eq('id', sessionId);
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
    ? `You are an AI code executor specialized in React/TypeScript development. You MUST analyze the user's request and provide specific file operations to implement their requirements.

CRITICAL: You are in EXECUTE MODE. You must make actual code changes based on the user's request.

Context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Existing files: ${JSON.stringify(existingFiles, null, 2)}

IMPORTANT: You MUST respond with a JSON object containing:
1. "response": A brief description of what you're implementing
2. "operations": An array of file operations with the following structure:
   - type: "create" | "update" | "delete" | "rename"
   - filePath: string (path to the file)
   - content: string (for create/update operations - MUST contain complete, valid code)
   - newPath: string (for rename operations)

Example response:
{
  "response": "Creating a new user profile component with form validation",
  "operations": [
    {
      "type": "create",
      "filePath": "src/components/UserProfile.tsx",
      "content": "import React from 'react';\\n\\nconst UserProfile = () => {\\n  return <div>User Profile</div>;\\n};\\n\\nexport default UserProfile;"
    }
  ]
}

You must provide actual file operations that implement the user's request. Do not just provide explanations.`
    : `You are an AI code analyzer. Analyze the provided code and give insights, suggestions, and explanations without making changes.

Context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Existing files: ${JSON.stringify(existingFiles, null, 2)}

Provide detailed analysis and suggestions in a conversational format.`;

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
      temperature: mode === 'execute' ? 0.3 : 0.7,
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
      const parsed = JSON.parse(aiResponse);
      return {
        response: parsed.response || 'Executing code changes...',
        operations: parsed.operations || []
      };
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      // Fallback: try to extract file operations from text
      return {
        response: 'AI provided text response instead of structured operations',
        operations: []
      };
    }
  } else {
    return {
      response: aiResponse,
      operations: []
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId, sessionId, conversationId, existingFiles = [], mode = 'execute' }: ExecutionRequest = await req.json();
    
    console.log('AI File Executor called:', { prompt: prompt.substring(0, 100) + '...', projectId, sessionId, mode });

    await logExecutionStep(sessionId, 0, `Starting ${mode} mode execution`, 'info');

    // Generate AI response and file operations
    const { response, operations } = await generateAIResponse(prompt, existingFiles, mode);

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
        execution_results: executionResults
      }
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
      await logExecutionStep(body.sessionId, -1, `Execution failed: ${error.message}`, 'error');
      await updateSessionProgress(body.sessionId, 0, 'failed', error.message);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
