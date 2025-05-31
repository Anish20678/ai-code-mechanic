
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type BackendMigration = Database['public']['Tables']['backend_migrations']['Row'];
type BackendMigrationInsert = Database['public']['Tables']['backend_migrations']['Insert'];
type BackendMigrationUpdate = Database['public']['Tables']['backend_migrations']['Update'];

export const useBackendMigrations = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: migrations, isLoading } = useQuery({
    queryKey: ['backendMigrations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('backend_migrations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BackendMigration[];
    },
    enabled: !!projectId,
  });

  const createMigration = useMutation({
    mutationFn: async (migrationData: Omit<BackendMigrationInsert, 'project_id'>) => {
      if (!projectId) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('backend_migrations')
        .insert({
          ...migrationData,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backendMigrations', projectId] });
      toast({
        title: "Migration created",
        description: "Backend migration has been initiated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating migration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMigration = useMutation({
    mutationFn: async ({ id, ...updates }: BackendMigrationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('backend_migrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backendMigrations', projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating migration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    migrations,
    isLoading,
    createMigration,
    updateMigration,
  };
};
