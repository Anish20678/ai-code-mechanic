
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CodeAnalysis = Database['public']['Tables']['code_analysis']['Row'];
type CodeAnalysisInsert = Database['public']['Tables']['code_analysis']['Insert'];
type CodeAnalysisUpdate = Database['public']['Tables']['code_analysis']['Update'];

export const useCodeAnalysis = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['codeAnalysis', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('code_analysis')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'open')
        .order('severity', { ascending: false });

      if (error) throw error;
      return data as CodeAnalysis[];
    },
    enabled: !!projectId,
  });

  const createAnalysis = useMutation({
    mutationFn: async (analysis: Omit<CodeAnalysisInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('code_analysis')
        .insert(analysis)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeAnalysis'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAnalysis = useMutation({
    mutationFn: async ({ id, ...updates }: CodeAnalysisUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('code_analysis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeAnalysis'] });
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
    analyses,
    isLoading,
    createAnalysis,
    updateAnalysis,
  };
};
