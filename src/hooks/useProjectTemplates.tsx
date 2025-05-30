
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProjectTemplate = Database['public']['Tables']['project_templates']['Row'];
type ProjectTemplateInsert = Database['public']['Tables']['project_templates']['Insert'];

export const useProjectTemplates = (category?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['projectTemplates', category],
    queryFn: async () => {
      let query = supabase
        .from('project_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProjectTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<ProjectTemplateInsert, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_templates')
        .insert({ ...template, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast({
        title: "Template created",
        description: "Project template created successfully.",
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

  const incrementUsage = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('project_templates')
        .update({ usage_count: (data.usage_count || 0) + 1 })
        .eq('id', templateId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    incrementUsage,
  };
};
