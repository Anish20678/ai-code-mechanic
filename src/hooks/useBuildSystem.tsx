
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type BuildJob = Database['public']['Tables']['build_jobs']['Row'];
type BuildJobInsert = Database['public']['Tables']['build_jobs']['Insert'];

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
    mutationFn: async (buildConfig: Omit<BuildJobInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('build_jobs')
        .insert(buildConfig)
        .select()
        .single();

      if (error) throw error;

      // Trigger the build process via edge function
      const { error: buildError } = await supabase.functions.invoke('build-system', {
        body: { buildJobId: data.id, projectId: buildConfig.project_id }
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
