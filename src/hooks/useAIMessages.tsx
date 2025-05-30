
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIMessage = Database['public']['Tables']['ai_messages']['Row'];
type AIMessageInsert = Database['public']['Tables']['ai_messages']['Insert'];

export const useAIMessages = (sessionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['aiMessages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AIMessage[];
    },
    enabled: !!sessionId,
  });

  const createMessage = useMutation({
    mutationFn: async (message: Omit<AIMessageInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiMessages'] });
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
    messages,
    isLoading,
    createMessage,
  };
};
