
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
    const { projectId, task, taskType, operation } = await req.json();
    
    console.log('Autonomous Agent called with:', { projectId, task, taskType, operation });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get existing project files for context with better structure
    const { data: existingFiles } = await supabase
      .from('code_files')
      .select('*')
      .eq('project_id', projectId);

    // Build comprehensive project context
    const projectContext = {
      totalFiles: existingFiles?.length || 0,
      fileStructure: existingFiles?.reduce((acc, file) => {
        const parts = file.file_path.split('/');
        const folder = parts.length > 1 ? parts[0] : 'root';
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push({
          path: file.file_path,
          size: file.content?.length || 0,
          lastModified: file.updated_at
        });
        return acc;
      }, {} as Record<string, any[]>) || {},
      recentFiles: existingFiles?.slice(-5).map(f => ({
        path: f.file_path,
        preview: f.content?.substring(0, 200) + '...'
      })) || []
    };

    // Enhanced system prompt for autonomous development
    const systemPrompt = `You are an advanced autonomous AI coding agent with comprehensive development capabilities. You can read, analyze, create, modify, and manage files with contextual understanding.

CURRENT PROJECT ANALYSIS:
- Project ID: ${projectId}
- Task Type: ${taskType}
- Operation: ${operation || 'general'}
- Total Files: ${projectContext.totalFiles}
- File Structure: ${JSON.stringify(projectContext.fileStructure, null, 2)}
- Recent Activity: ${JSON.stringify(projectContext.recentFiles, null, 2)}

ENHANCED CAPABILITIES:
1. **File Operations**: Create, read, update, delete, rename, duplicate files
2. **Code Analysis**: Understand existing patterns, dependencies, and architecture
3. **Context Awareness**: Consider project structure and existing implementations
4. **Smart Integration**: Ensure new code integrates seamlessly with existing codebase
5. **Best Practices**: Follow React, TypeScript, and modern development patterns
6. **Error Prevention**: Anticipate and prevent common integration issues

OPERATION TYPES:
- create_files: Generate new files with proper integration
- modify_files: Update existing files while preserving functionality
- analyze_project: Examine codebase and provide insights
- refactor_code: Improve code structure and organization
- fix_issues: Debug and resolve problems
- add_features: Implement new functionality

RESPONSE FORMAT REQUIREMENTS:
Provide a JSON response with this exact structure:
{
  "result": "Brief description of what was accomplished",
  "operations": {
    "created": ["array of created file paths"],
    "modified": ["array of modified file paths"], 
    "deleted": ["array of deleted file paths"]
  },
  "code": {
    "filename1.tsx": "complete file content",
    "filename2.ts": "complete file content"
  },
  "analysis": {
    "projectInsights": "analysis of project structure and patterns",
    "integrationNotes": "how new code integrates with existing",
    "recommendations": "suggestions for improvement"
  },
  "dependencies": ["array of npm packages needed"],
  "instructions": "Any additional setup instructions"
}

CRITICAL REQUIREMENTS:
1. Always analyze existing code patterns before implementing
2. Ensure new code follows existing architectural patterns
3. Maintain consistent naming conventions and file organization
4. Include proper TypeScript types and error handling
5. Consider performance and accessibility
6. Provide complete, production-ready code`;

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
          { role: 'user', content: `Task: ${task}\n\nAnalyze the current project structure and implement this task with full contextual awareness. Consider how this fits into the existing codebase and ensure seamless integration.` }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Enhanced JSON parsing with better error handling
    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        aiResponse = jsonMatch[1];
      }
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      parsedResponse = {
        result: "AI provided response but couldn't parse structured output",
        operations: { created: [], modified: [], deleted: [] },
        code: {},
        analysis: {
          projectInsights: "Response parsing failed",
          integrationNotes: "Unable to extract structured data",
          recommendations: aiResponse.substring(0, 500)
        },
        dependencies: [],
        instructions: aiResponse
      };
    }

    // Process file operations
    const operationResults = {
      created: [],
      modified: [],
      deleted: [],
      errors: []
    };

    // Handle file creation and modification
    if (parsedResponse.code && typeof parsedResponse.code === 'object') {
      for (const [filename, content] of Object.entries(parsedResponse.code)) {
        try {
          // Check if file already exists
          const { data: existingFile } = await supabase
            .from('code_files')
            .select('id')
            .eq('project_id', projectId)
            .eq('file_path', filename)
            .single();

          if (existingFile) {
            // Update existing file
            const { error } = await supabase
              .from('code_files')
              .update({ 
                content: content as string,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingFile.id);

            if (!error) {
              operationResults.modified.push(filename);
            } else {
              operationResults.errors.push(`Failed to update ${filename}: ${error.message}`);
            }
          } else {
            // Create new file
            const { error } = await supabase
              .from('code_files')
              .insert({
                project_id: projectId,
                file_path: filename,
                content: content as string
              });

            if (!error) {
              operationResults.created.push(filename);
            } else {
              operationResults.errors.push(`Failed to create ${filename}: ${error.message}`);
            }
          }
        } catch (fileError) {
          console.error('Error processing file:', filename, fileError);
          operationResults.errors.push(`Error processing ${filename}: ${fileError.message}`);
        }
      }
    }

    const finalResponse = {
      result: parsedResponse.result || "Task completed",
      operations: operationResults,
      analysis: parsedResponse.analysis || {},
      dependencies: parsedResponse.dependencies || [],
      instructions: parsedResponse.instructions || "",
      errors: operationResults.errors
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in autonomous agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      result: "Task failed",
      operations: { created: [], modified: [], deleted: [] }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
