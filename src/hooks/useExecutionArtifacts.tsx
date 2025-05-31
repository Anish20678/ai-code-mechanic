
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ExecutionArtifact = Database['public']['Tables']['execution_artifacts']['Row'];
type ExecutionArtifactInsert = Database['public']['Tables']['execution_artifacts']['Insert'];

export const useExecutionArtifacts = (sessionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: artifacts, isLoading } = useQuery({
    queryKey: ['executionArtifacts', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('execution_artifacts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExecutionArtifact[];
    },
    enabled: !!sessionId,
  });

  const createArtifact = useMutation({
    mutationFn: async (artifact: Omit<ExecutionArtifactInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('execution_artifacts')
        .insert(artifact)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executionArtifacts'] });
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
    artifacts,
    isLoading,
    createArtifact,
  };
};
