
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProjectIntegration = Database['public']['Tables']['project_integrations']['Row'];
type ProjectIntegrationInsert = Database['public']['Tables']['project_integrations']['Insert'];
type ProjectIntegrationUpdate = Database['public']['Tables']['project_integrations']['Update'];

export const useProjectIntegrations = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['projectIntegrations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectIntegration[];
    },
    enabled: !!projectId,
  });

  const createIntegration = useMutation({
    mutationFn: async (integration: Omit<ProjectIntegrationInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('project_integrations')
        .insert(integration)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectIntegrations'] });
      toast({
        title: "Integration created",
        description: "Project integration has been configured successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: ProjectIntegrationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('project_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectIntegrations'] });
      toast({
        title: "Integration updated",
        description: "Project integration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
  };
};
