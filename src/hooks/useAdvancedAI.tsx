
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAIModels } from '@/hooks/useAIModels';

export const useAdvancedAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getDefaultModel } = useAIModels();

  const executeCode = async (
    prompt: string,
    projectId: string,
    sessionId: string,
    conversationId: string,
    existingFiles?: any[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-file-executor', {
        body: {
          prompt,
          projectId,
          sessionId,
          conversationId,
          existingFiles,
          mode: 'execute'
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Execution Error",
        description: error.message || "Failed to execute code changes",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCode = async (
    prompt: string,
    conversationId: string,
    existingFiles?: any[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-file-executor', {
        body: {
          prompt,
          projectId: '',
          sessionId: '',
          conversationId,
          existingFiles,
          mode: 'analyze'
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeCode = async (filePath: string, content: string, projectId: string) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message: `Optimize this code for better performance and maintainability:\n\nFile: ${filePath}\n\n${content}`,
          modelId: defaultModel?.id || 'gpt-4o',
          modelName: defaultModel?.model_name || 'gpt-4o',
          mode: 'optimize'
        }
      });

      if (error) throw error;
      return data.response;
    } catch (error: any) {
      toast({
        title: "Optimization Error",
        description: error.message || "Failed to optimize code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateTests = async (filePath: string, content: string) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('code-generator', {
        body: {
          prompt: `Generate comprehensive unit tests for this code:\n\nFile: ${filePath}\n\n${content}`,
          fileType: 'test.tsx',
          modelId: defaultModel?.id || 'gpt-4o',
          modelName: defaultModel?.model_name || 'gpt-4o'
        }
      });

      if (error) throw error;
      return {
        code: data.code,
        suggestedFilename: data.suggestedFilename
      };
    } catch (error: any) {
      toast({
        title: "Test Generation Error",
        description: error.message || "Failed to generate tests",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refactorCode = async (filePath: string, content: string, instructions: string) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('code-generator', {
        body: {
          prompt: `Refactor this code according to these instructions: ${instructions}\n\nFile: ${filePath}\n\n${content}`,
          fileType: filePath.split('.').pop() || 'tsx',
          modelId: defaultModel?.id || 'gpt-4o',
          modelName: defaultModel?.model_name || 'gpt-4o'
        }
      });

      if (error) throw error;
      return {
        code: data.code,
        suggestedFilename: data.suggestedFilename
      };
    } catch (error: any) {
      toast({
        title: "Refactoring Error",
        description: error.message || "Failed to refactor code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeCode,
    analyzeCode,
    optimizeCode,
    generateTests,
    refactorCode,
    isLoading
  };
};
