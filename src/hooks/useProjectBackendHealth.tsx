
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProjectBackendHealth = Database['public']['Tables']['project_backend_health']['Row'];
type ProjectBackendHealthInsert = Database['public']['Tables']['project_backend_health']['Insert'];

export const useProjectBackendHealth = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backendHealth, isLoading } = useQuery({
    queryKey: ['projectBackendHealth', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('project_backend_health')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ProjectBackendHealth | null;
    },
    enabled: !!projectId,
  });

  const recordHealthCheck = useMutation({
    mutationFn: async (healthData: Omit<ProjectBackendHealthInsert, 'project_id'>) => {
      if (!projectId) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('project_backend_health')
        .insert({
          ...healthData,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectBackendHealth', projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error recording health check",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    backendHealth,
    isLoading,
    recordHealthCheck,
  };
};
