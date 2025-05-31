
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useProjectDeletion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project deleted",
        description: "The project has been moved to trash successfully.",
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

  const restoreProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project restored",
        description: "The project has been restored successfully.",
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
    deleteProject,
    restoreProject,
  };
};
