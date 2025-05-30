
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (message: string, conversationId: string, projectFiles?: any[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message,
          conversationId,
          projectFiles
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
      const { data, error } = await supabase.functions.invoke('code-generator', {
        body: {
          prompt,
          projectId,
          fileType,
          existingFiles
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
