
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIProviderConfig = Database['public']['Tables']['ai_provider_configs']['Row'];
type AIProviderConfigUpdate = Database['public']['Tables']['ai_provider_configs']['Update'];

export const useAIProviderConfigs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['aiProviderConfigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select(`
          *,
          ai_models!ai_provider_configs_default_model_id_fkey(display_name)
        `)
        .eq('is_enabled', true)
        .order('provider', { ascending: true });

      if (error) throw error;
      return data as AIProviderConfig[];
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: AIProviderConfigUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviderConfigs'] });
      toast({
        title: "Configuration updated",
        description: "Provider configuration has been updated successfully.",
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

  const getConfigByProvider = (provider: string) => {
    return configs?.find(config => config.provider === provider);
  };

  const getEnabledProviders = () => {
    return configs?.filter(config => config.is_enabled).map(config => config.provider) || [];
  };

  return {
    configs,
    isLoading,
    updateConfig,
    getConfigByProvider,
    getEnabledProviders,
  };
};
