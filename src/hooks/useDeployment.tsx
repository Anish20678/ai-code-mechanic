
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Deployment = Database['public']['Tables']['deployments']['Row'];
type DeploymentInsert = Database['public']['Tables']['deployments']['Insert'];

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
    mutationFn: async (deploymentConfig: Omit<DeploymentInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('deployments')
        .insert(deploymentConfig)
        .select()
        .single();

      if (error) throw error;

      // Trigger deployment via edge function
      const { error: deployError } = await supabase.functions.invoke('deployment-system', {
        body: { deploymentId: data.id, projectId: deploymentConfig.project_id }
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
