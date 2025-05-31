
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIGeneration = Database['public']['Tables']['ai_generations']['Row'];
type AIGenerationInsert = Database['public']['Tables']['ai_generations']['Insert'];

export const useAIGenerations = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generations, isLoading } = useQuery({
    queryKey: ['aiGenerations', projectId],
    queryFn: async () => {
      let query = supabase
        .from('ai_generations')
        .select(`
          *,
          ai_models!inner(display_name, provider),
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AIGeneration[];
    },
  });

  const createGeneration = useMutation({
    mutationFn: async (generation: Omit<AIGenerationInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_generations')
        .insert({ ...generation, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiGenerations'] });
      queryClient.invalidateQueries({ queryKey: ['userBilling'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTotalCost = () => {
    return generations?.reduce((total, gen) => total + (gen.total_cost || 0), 0) || 0;
  };

  const getTotalTokens = () => {
    return generations?.reduce((total, gen) => total + (gen.input_tokens || 0) + (gen.output_tokens || 0), 0) || 0;
  };

  const getUsageByModel = () => {
    if (!generations) return {};
    
    return generations.reduce((acc, gen) => {
      const modelName = gen.ai_models?.display_name || 'Unknown';
      if (!acc[modelName]) {
        acc[modelName] = { cost: 0, tokens: 0, count: 0 };
      }
      acc[modelName].cost += gen.total_cost || 0;
      acc[modelName].tokens += (gen.input_tokens || 0) + (gen.output_tokens || 0);
      acc[modelName].count += 1;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; count: number }>);
  };

  return {
    generations,
    isLoading,
    createGeneration,
    getTotalCost,
    getTotalTokens,
    getUsageByModel,
  };
};
