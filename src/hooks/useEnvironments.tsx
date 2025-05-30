
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Environment = Database['public']['Tables']['environments']['Row'];
type EnvironmentInsert = Database['public']['Tables']['environments']['Insert'];
type EnvironmentUpdate = Database['public']['Tables']['environments']['Update'];

export const useEnvironments = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: environments, isLoading } = useQuery({
    queryKey: ['environments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Environment[];
    },
    enabled: !!projectId,
  });

  const createEnvironment = useMutation({
    mutationFn: async (environment: Omit<EnvironmentInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('environments')
        .insert(environment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      toast({
        title: "Environment created",
        description: "New environment has been created successfully.",
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

  const updateEnvironment = useMutation({
    mutationFn: async ({ id, ...updates }: EnvironmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('environments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      toast({
        title: "Environment updated",
        description: "Environment has been updated successfully.",
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
    environments,
    isLoading,
    createEnvironment,
    updateEnvironment,
  };
};
