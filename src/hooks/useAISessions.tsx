
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AISession = Database['public']['Tables']['ai_sessions']['Row'];
type AISessionInsert = Database['public']['Tables']['ai_sessions']['Insert'];
type AISessionUpdate = Database['public']['Tables']['ai_sessions']['Update'];

export const useAISessions = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['aiSessions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as AISession[];
    },
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: async (session: Omit<AISessionInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_sessions')
        .insert({ ...session, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSessions'] });
      toast({
        title: "Session created",
        description: "New AI session created successfully.",
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

  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: AISessionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSessions'] });
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
