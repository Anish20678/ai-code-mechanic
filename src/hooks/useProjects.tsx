
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export const useProjects = (includeDeleted = false) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', includeDeleted],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({ ...project, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
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

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
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
    projects,
    isLoading,
    createProject,
    updateProject,
  };
};
