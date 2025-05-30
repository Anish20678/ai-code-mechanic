
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { buildJobId, projectId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Starting build for project ${projectId}, job ${buildJobId}`);

    // Update build job status to building
    await supabase
      .from('build_jobs')
      .update({ 
        status: 'building',
        started_at: new Date().toISOString()
      })
      .eq('id', buildJobId);

    // Get project code files
    const { data: codeFiles, error: filesError } = await supabase
      .from('code_files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) throw filesError;

    // Simulate build process
    let buildLog = "Starting build process...\n";
    buildLog += "Fetching code files...\n";
    buildLog += `Found ${codeFiles?.length || 0} files\n`;
    
    // Simulate compilation steps
    const steps = [
      "Installing dependencies...",
      "Compiling TypeScript...",
      "Bundling assets...",
      "Optimizing bundle...",
      "Generating source maps...",
      "Build completed successfully!"
    ];

    for (const step of steps) {
      buildLog += `${step}\n`;
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10000); // 10 seconds ago
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update build job with success
    await supabase
      .from('build_jobs')
      .update({
        status: 'success',
        build_log: buildLog,
        duration: duration,
        completed_at: endTime.toISOString(),
        artifact_url: `https://cdn.example.com/builds/${buildJobId}.zip`
      })
      .eq('id', buildJobId);

    console.log(`Build completed successfully for job ${buildJobId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        buildJobId,
        duration,
        artifactUrl: `https://cdn.example.com/builds/${buildJobId}.zip`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Build error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
