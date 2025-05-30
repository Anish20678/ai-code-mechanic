
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define types based on the database schema we just created
type Deployment = {
  id: string;
  project_id: string;
  environment: string;
  build_command: string;
  status: 'queued' | 'deploying' | 'success' | 'failed';
  deployment_log: string | null;
  url: string | null;
  duration: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeploymentInsert = Omit<Deployment, 'id' | 'created_at' | 'updated_at'>;

export const useDeployment = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deployments, isLoading } = useQuery({
    queryKey: ['deployments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deployment[];
    },
    enabled: !!projectId,
    refetchInterval: 10000, // Poll every 10 seconds for deployment status
  });

  const deploy = useMutation({
    mutationFn: async (deploymentConfig: Partial<DeploymentInsert>) => {
      if (!projectId) throw new Error('Project ID is required');

      const deploymentData = {
        project_id: projectId,
        environment: deploymentConfig.environment || 'production',
        build_command: deploymentConfig.build_command || 'npm run build',
        status: 'queued' as const,
        deployment_log: null,
        url: null,
        duration: null,
        started_at: null,
        completed_at: null,
      };

      const { data, error } = await supabase
        .from('deployments')
        .insert(deploymentData)
        .select()
        .single();

      if (error) throw error;

      // Trigger deployment via edge function
      const { error: deployError } = await supabase.functions.invoke('deployment-system', {
        body: { deploymentId: data.id, projectId }
      });

      if (deployError) throw deployError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      toast({
        title: "Deployment started",
        description: "Your project is being deployed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deployment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const latestDeployment = deployments?.[0];
  const isDeploying = latestDeployment?.status === 'deploying' || latestDeployment?.status === 'queued';
  const liveUrl = deployments?.find(d => d.status === 'success')?.url;

  return {
    deployments,
    latestDeployment,
    isDeploying,
    liveUrl,
    isLoading,
    deploy,
  };
};
