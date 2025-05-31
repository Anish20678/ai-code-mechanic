
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];

export const useAIModels = () => {
  const { data: models, isLoading } = useQuery({
    queryKey: ['aiModels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) throw error;
      return data as AIModel[];
    },
  });

  const getDefaultModel = () => {
    return models?.find(model => model.model_name === 'gpt-4o') || models?.[0];
  };

  return {
    models,
    isLoading,
    getDefaultModel,
  };
};
