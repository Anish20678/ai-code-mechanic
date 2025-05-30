
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define types based on the database schema we just created
type Environment = {
  id: string;
  project_id: string;
  name: string;
  variables: Record<string, any>;
  created_at: string;
  updated_at: string;
};

type EnvironmentInsert = Omit<Environment, 'id' | 'created_at' | 'updated_at'>;
type EnvironmentUpdate = Partial<EnvironmentInsert> & { id: string };

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
    mutationFn: async (environment: EnvironmentInsert) => {
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
    mutationFn: async ({ id, ...updates }: EnvironmentUpdate) => {
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
