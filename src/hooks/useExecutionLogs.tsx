
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ExecutionLog = Database['public']['Tables']['execution_logs']['Row'];
type ExecutionLogInsert = Database['public']['Tables']['execution_logs']['Insert'];

export const useExecutionLogs = (sessionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['executionLogs', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('execution_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return data as ExecutionLog[];
    },
    enabled: !!sessionId,
  });

  const createLog = useMutation({
    mutationFn: async (log: Omit<ExecutionLogInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('execution_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executionLogs', sessionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscription for logs
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('execution-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['executionLogs', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return {
    logs,
    isLoading,
    createLog,
  };
};
