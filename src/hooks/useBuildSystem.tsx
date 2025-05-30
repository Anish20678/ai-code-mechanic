
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define types based on the database schema we just created
type BuildJob = {
  id: string;
  project_id: string;
  build_command: string;
  status: 'queued' | 'building' | 'success' | 'failed';
  build_log: string | null;
  artifact_url: string | null;
  duration: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type BuildJobInsert = Omit<BuildJob, 'id' | 'created_at' | 'updated_at'>;

export const useBuildSystem = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buildJobs, isLoading } = useQuery({
    queryKey: ['buildJobs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('build_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BuildJob[];
    },
    enabled: !!projectId,
    refetchInterval: 5000, // Poll every 5 seconds for active builds
  });

  const triggerBuild = useMutation({
    mutationFn: async (buildConfig: Partial<BuildJobInsert>) => {
      if (!projectId) throw new Error('Project ID is required');

      const buildJobData = {
        project_id: projectId,
        build_command: buildConfig.build_command || 'npm run build',
        status: 'queued' as const,
        build_log: null,
        artifact_url: null,
        duration: null,
        started_at: null,
        completed_at: null,
      };

      const { data, error } = await supabase
        .from('build_jobs')
        .insert(buildJobData)
        .select()
        .single();

      if (error) throw error;

      // Trigger the build process via edge function
      const { error: buildError } = await supabase.functions.invoke('build-system', {
        body: { buildJobId: data.id, projectId }
      });

      if (buildError) throw buildError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildJobs'] });
      toast({
        title: "Build started",
        description: "Your project build has been queued.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Build failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const latestBuild = buildJobs?.[0];
  const isBuilding = latestBuild?.status === 'building' || latestBuild?.status === 'queued';

  return {
    buildJobs,
    latestBuild,
    isBuilding,
    isLoading,
    triggerBuild,
  };
};
