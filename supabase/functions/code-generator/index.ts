
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
    const { prompt, projectId, fileType = 'tsx', existingFiles } = await req.json();
    
    console.log('Code generator called with:', { prompt, projectId, fileType });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert code generator for React/TypeScript applications. Generate clean, production-ready code based on user requirements.

Context:
- Tech stack: React, TypeScript, Tailwind CSS, Supabase
- File type: ${fileType}
- Existing project files: ${existingFiles ? JSON.stringify(existingFiles, null, 2) : 'None'}

Guidelines:
1. Generate complete, functional code
2. Use TypeScript with proper types
3. Follow React best practices
4. Use Tailwind CSS for styling
5. Include proper imports and exports
6. Add helpful comments
7. Ensure code is production-ready

Respond ONLY with the code, no explanations or markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    // Suggest a filename based on the prompt
    const filenameResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Generate a appropriate filename for the code based on the user prompt. Return ONLY the filename with extension (e.g., "UserProfile.tsx", "api.ts", "styles.css"). Use PascalCase for components.' 
          },
          { role: 'user', content: `Generate filename for: ${prompt}` }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    const filenameData = await filenameResponse.json();
    const suggestedFilename = filenameData.choices[0].message.content.trim();

    return new Response(JSON.stringify({ 
      code: generatedCode,
      suggestedFilename: suggestedFilename
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in code generator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
