
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAIModels } from '@/hooks/useAIModels';

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getDefaultModel } = useAIModels();

  const sendMessage = async (message: string, conversationId: string, projectFiles?: any[]) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      const modelId = defaultModel?.id || 'gpt-4o';
      
      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message,
          conversationId,
          projectFiles,
          modelId,
          modelName: defaultModel?.model_name || 'gpt-4o'
        }
      });

      if (error) throw error;

      return data.response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async (prompt: string, projectId: string, fileType?: string, existingFiles?: any[]) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('code-generator', {
        body: {
          prompt,
          projectId,
          fileType,
          existingFiles,
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
        title: "Error",
        description: error.message || "Failed to generate code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    generateCode,
    isLoading
  };
};
