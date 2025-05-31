
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];
type AIModelInsert = Database['public']['Tables']['ai_models']['Insert'];
type AIModelUpdate = Database['public']['Tables']['ai_models']['Update'];

export const useAIModels = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models, isLoading } = useQuery({
    queryKey: ['aiModels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('provider', { ascending: true });

      if (error) throw error;
      return data as AIModel[];
    },
  });

  const createModel = useMutation({
    mutationFn: async (model: Omit<AIModelInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('ai_models')
        .insert(model)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
      toast({
        title: "Model added",
        description: "AI model has been added successfully.",
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

  const updateModel = useMutation({
    mutationFn: async ({ id, ...updates }: AIModelUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
      toast({
        title: "Model updated",
        description: "AI model has been updated successfully.",
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

  const getModelsByProvider = (provider: string) => {
    return models?.filter(model => model.provider === provider) || [];
  };

  const getDefaultModel = (provider?: string) => {
    if (provider) {
      return models?.find(model => model.provider === provider && model.is_active);
    }
    return models?.find(model => model.model_name === 'gpt-4o-mini');
  };

  return {
    models,
    isLoading,
    createModel,
    updateModel,
    getModelsByProvider,
    getDefaultModel,
  };
};
