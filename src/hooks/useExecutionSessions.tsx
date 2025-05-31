
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ExecutionSession = Database['public']['Tables']['execution_sessions']['Row'];
type ExecutionSessionInsert = Database['public']['Tables']['execution_sessions']['Insert'];

export const useExecutionSessions = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['executionSessions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('execution_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExecutionSession[];
    },
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: async (session: Omit<ExecutionSessionInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('execution_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executionSessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExecutionSession> }) => {
      const { data, error } = await supabase
        .from('execution_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executionSessions'] });
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
    sessions,
    isLoading,
    createSession,
    updateSession,
  };
};
