
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SystemPrompt = Database['public']['Tables']['system_prompts']['Row'];
type SystemPromptInsert = Database['public']['Tables']['system_prompts']['Insert'];
type SystemPromptUpdate = Database['public']['Tables']['system_prompts']['Update'];

export const useSystemPrompts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemPrompts, isLoading } = useQuery({
    queryKey: ['system-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemPrompt[];
    },
  });

  const createPrompt = useMutation({
    mutationFn: async (prompt: SystemPromptInsert) => {
      const { data, error } = await supabase
        .from('system_prompts')
        .insert(prompt)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create system prompt",
        variant: "destructive",
      });
    },
  });

  const updatePrompt = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SystemPromptUpdate }) => {
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
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system prompt",
        variant: "destructive",
      });
    },
  });

  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete system prompt",
        variant: "destructive",
      });
    },
  });

  const activatePrompt = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      // First deactivate all prompts in this category
      await supabase
        .from('system_prompts')
        .update({ is_active: false })
        .eq('category', category);

      // Then activate the selected prompt
      const { data, error } = await supabase
        .from('system_prompts')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
      toast({
        title: "Success",
        description: "System prompt activated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate system prompt",
        variant: "destructive",
      });
    },
  });

  return {
    systemPrompts,
    isLoading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    activatePrompt,
  };
};
