
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SystemPrompt = Database['public']['Tables']['system_prompts']['Row'];
type SystemPromptInsert = Database['public']['Tables']['system_prompts']['Insert'];
type SystemPromptUpdate = Database['public']['Tables']['system_prompts']['Update'];
type PromptCategory = Database['public']['Enums']['prompt_category'];

export const useSystemPrompts = (category?: PromptCategory) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['systemPrompts', category],
    queryFn: async () => {
      let query = supabase
        .from('system_prompts')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SystemPrompt[];
    },
  });

  const createPrompt = useMutation({
    mutationFn: async (prompt: Omit<SystemPromptInsert, 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('system_prompts')
        .insert({ ...prompt, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
      toast({
        title: "Prompt created",
        description: "System prompt has been created successfully.",
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

  const updatePrompt = useMutation({
    mutationFn: async ({ id, ...updates }: SystemPromptUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('system_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
      toast({
        title: "Prompt updated",
        description: "System prompt has been updated successfully.",
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

  const getPromptByCategory = (cat: PromptCategory) => {
    return prompts?.filter(prompt => prompt.category === cat) || [];
  };

  const getDefaultPrompt = (cat: PromptCategory) => {
    return prompts?.find(prompt => prompt.category === cat && prompt.name.includes('default'));
  };

  return {
    prompts,
    isLoading,
    createPrompt,
    updatePrompt,
    getPromptByCategory,
    getDefaultPrompt,
  };
};
