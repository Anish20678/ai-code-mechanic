
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, task, taskType } = await req.json();
    
    console.log('Autonomous Agent called with:', { projectId, task, taskType });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get existing project files for context
    const { data: existingFiles } = await supabase
      .from('code_files')
      .select('*')
      .eq('project_id', projectId);

    // Enhanced system prompt for autonomous development
    const systemPrompt = `You are an autonomous AI coding agent with full development capabilities. You can create complete applications, manage dependencies, and handle the entire development workflow.

Current project context:
- Project ID: ${projectId}
- Task Type: ${taskType}
- Existing files: ${existingFiles ? JSON.stringify(existingFiles.map(f => ({ path: f.file_path, content: f.content?.substring(0, 200) + '...' })), null, 2) : 'No files'}

Your capabilities:
1. Create multiple related files and components
2. Manage dependencies and package installations
3. Write production-ready, tested code
4. Follow best practices and modern development patterns
5. Create complete features with proper error handling
6. Set up project structure and configuration

Guidelines:
1. Think holistically about the entire feature/component
2. Create all necessary files (components, hooks, types, etc.)
3. Include proper TypeScript types and interfaces
4. Use modern React patterns (hooks, functional components)
5. Implement proper error handling and loading states
6. Follow the existing code patterns in the project
7. Create reusable, maintainable code
8. Include helpful comments and documentation

Response format:
Provide a JSON response with:
{
  "result": "Brief description of what was accomplished",
  "filesCreated": ["array", "of", "file", "paths"],
  "dependenciesAdded": ["array", "of", "npm", "packages"],
  "code": {
    "filename1.tsx": "file content here",
    "filename2.ts": "file content here"
  },
  "instructions": "Any additional setup instructions for the user"
}

Be thorough and create complete, working solutions.`;

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
          { role: 'user', content: `Task: ${task}\n\nCreate a complete implementation for this task. Consider all necessary files, components, hooks, and dependencies.` }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        aiResponse = jsonMatch[1];
      }
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback: create a basic response structure
      parsedResponse = {
        result: "AI provided response but couldn't parse structured output",
        filesCreated: [],
        dependenciesAdded: [],
        code: {},
        instructions: aiResponse
      };
    }

    // Create files in the database if code was provided
    const filesCreated = [];
    if (parsedResponse.code && typeof parsedResponse.code === 'object') {
      for (const [filename, content] of Object.entries(parsedResponse.code)) {
        try {
          const { data: newFile, error: fileError } = await supabase
            .from('code_files')
            .insert({
              project_id: projectId,
              file_path: filename,
              content: content as string
            })
            .select()
            .single();

          if (!fileError && newFile) {
            filesCreated.push(filename);
          }
        } catch (fileCreateError) {
          console.error('Error creating file:', filename, fileCreateError);
        }
      }
    }

    const finalResponse = {
      result: parsedResponse.result || "Task completed",
      filesCreated: filesCreated,
      dependenciesAdded: parsedResponse.dependenciesAdded || [],
      instructions: parsedResponse.instructions || ""
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in autonomous agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
