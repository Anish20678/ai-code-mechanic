
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];
type CodeFileInsert = Database['public']['Tables']['code_files']['Insert'];
type CodeFileUpdate = Database['public']['Tables']['code_files']['Update'];

export const useCodeFiles = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codeFiles, isLoading } = useQuery({
    queryKey: ['codeFiles', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('code_files')
        .select('*')
        .eq('project_id', projectId)
        .order('file_path', { ascending: true });

      if (error) throw error;
      return data as CodeFile[];
    },
    enabled: !!projectId,
  });

  const createCodeFile = useMutation({
    mutationFn: async (codeFile: Omit<CodeFileInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('code_files')
        .insert(codeFile)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      toast({
        title: "File created",
        description: "Code file created successfully.",
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

  const updateCodeFile = useMutation({
    mutationFn: async ({ id, ...updates }: CodeFileUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('code_files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
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
    codeFiles,
    isLoading,
    createCodeFile,
    updateCodeFile,
  };
};
