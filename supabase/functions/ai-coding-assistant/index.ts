
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
    const { message, conversationId, projectFiles, modelId = 'gpt-4o', modelName = 'gpt-4o', mode = 'chat' } = await req.json();
    
    console.log('AI Coding Assistant called with:', { 
      messageLength: message?.length, 
      conversationId, 
      mode, 
      filesCount: projectFiles?.length 
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch system prompt from database based on mode and category
    let systemPrompt = '';
    
    try {
      let category = 'coding'; // default to coding
      
      switch (mode) {
        case 'execute':
          category = 'coding';
          break;
        case 'chat':
          category = 'system';
          break;
        case 'analyze':
          category = 'analysis';
          break;
        case 'optimize':
          category = 'optimization';
          break;
        default:
          category = 'coding';
      }
      
      const { data: promptData, error: promptError } = await supabase
        .from('system_prompts')
        .select('content')
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!promptError && promptData) {
        systemPrompt = promptData.content;
        console.log('Using custom system prompt from database for category:', category);
      } else {
        console.log('No custom system prompt found, using default for mode:', mode);
      }
    } catch (error) {
      console.log('Error fetching system prompt, using default:', error);
    }

    // Enhanced fallback prompts for better execute mode behavior
    if (!systemPrompt) {
      switch (mode) {
        case 'execute':
          systemPrompt = `You are an AI code executor specialized in React/TypeScript development. You provide guidance and suggestions for code implementation.

IMPORTANT: You are in GUIDANCE mode - provide clear instructions and code examples, but do not make direct file changes.

Current project context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Available files: ${projectFiles ? JSON.stringify(projectFiles.slice(0, 5), null, 2) : 'No files provided'}

Guidelines:
1. Provide clear, actionable implementation guidance
2. Include complete code examples ready for implementation
3. Suggest specific file names and structure
4. Ensure all code follows React/TypeScript best practices
5. Use Tailwind CSS for styling
6. Integrate with existing Supabase setup when needed

Be direct and practical in your responses. Focus on providing clear implementation steps.`;
          break;
        
        case 'chat':
          systemPrompt = `You are a helpful AI coding assistant specialized in React/TypeScript development. Provide guidance, suggestions, and explanations.

Current project context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Available files: ${projectFiles ? JSON.stringify(projectFiles.slice(0, 5), null, 2) : 'No files provided'}

Guidelines:
1. Provide clear, practical coding solutions
2. Explain your reasoning step by step
3. Include code examples when helpful
4. Suggest best practices and optimizations
5. Help debug errors with specific solutions
6. If creating new files, suggest appropriate file names and structure

Be conversational and educational in your responses.`;
          break;
        
        case 'analyze':
          systemPrompt = `You are an AI code analyzer specialized in React/TypeScript development. Analyze code quality, performance, and architecture.

Current project context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Available files: ${projectFiles ? JSON.stringify(projectFiles.slice(0, 5), null, 2) : 'No files provided'}

Guidelines:
1. Analyze code structure and architecture
2. Identify potential issues and improvements
3. Suggest performance optimizations
4. Review for best practices compliance
5. Check for security considerations
6. Provide actionable recommendations

Focus on thorough analysis and constructive feedback.`;
          break;
        
        default:
          systemPrompt = `You are an expert AI coding assistant specialized in web development. You help users write, debug, and improve their code.

Current project context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- Available files: ${projectFiles ? JSON.stringify(projectFiles.slice(0, 5), null, 2) : 'No files provided'}

Guidelines:
1. Provide clear, practical coding solutions
2. Explain your reasoning step by step
3. Include code examples when helpful
4. Suggest best practices and optimizations
5. Help debug errors with specific solutions
6. If creating new files, suggest appropriate file names and structure

Be concise but thorough in your responses.`;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: mode === 'execute' ? 0.3 : 0.7,
        max_tokens: mode === 'analyze' ? 3000 : 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store the AI response in the database only if conversationId is provided
    if (conversationId) {
      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          metadata: { 
            model: modelName,
            mode: mode,
            tokens_used: data.usage?.total_tokens || 0,
            system_prompt_used: systemPrompt ? 'custom' : 'default'
          }
        });

      if (dbError) {
        console.error('Database error storing message:', dbError);
      }
    }

    console.log('AI coding assistant completed successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI coding assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
