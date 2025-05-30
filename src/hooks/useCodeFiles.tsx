
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
        .select(`
          *,
          projects!inner(user_id)
        `)
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

  const deleteCodeFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('code_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      toast({
        title: "File deleted",
        description: "Code file deleted successfully.",
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

  const duplicateCodeFile = useMutation({
    mutationFn: async (file: CodeFile) => {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
      const extension = file.file_path.split('.').pop();
      const nameWithoutExt = file.file_path.replace(/\.[^/.]+$/, '');
      const newPath = `${nameWithoutExt}_copy_${timestamp}.${extension}`;

      const { data, error } = await supabase
        .from('code_files')
        .insert({
          project_id: file.project_id,
          file_path: newPath,
          content: file.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      toast({
        title: "File duplicated",
        description: "Code file duplicated successfully.",
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

  const renameCodeFile = useMutation({
    mutationFn: async ({ id, newPath }: { id: string; newPath: string }) => {
      const { data, error } = await supabase
        .from('code_files')
        .update({ 
          file_path: newPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      toast({
        title: "File renamed",
        description: "Code file renamed successfully.",
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

  return {
    codeFiles,
    isLoading,
    createCodeFile,
    updateCodeFile,
    deleteCodeFile,
    duplicateCodeFile,
    renameCodeFile,
  };
};
