
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAIModels } from '@/hooks/useAIModels';
import { useMessages } from '@/hooks/useMessages';

export const useUnifiedAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getDefaultModel } = useAIModels();

  const sendUnifiedMessage = async (
    message: string, 
    conversationId: string, 
    projectFiles?: any[],
    isChatMode: boolean = true
  ) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      const modelId = defaultModel?.id || 'gpt-4o';
      
      // Prepare the system prompt based on mode
      const systemPrompt = isChatMode
        ? `You are a helpful AI coding assistant. Provide guidance, suggestions, and explanations. Do not make direct code changes unless explicitly requested. Focus on helping the user understand and improve their code.`
        : `You are an AI code executor. When given commands, execute them immediately by making the necessary code changes. Be direct and efficient in your responses. If a task requires multiple steps, complete them all in one response.`;

      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message: `${systemPrompt}\n\nUser request: ${message}`,
          conversationId,
          projectFiles,
          modelId,
          modelName: defaultModel?.model_name || 'gpt-4o',
          mode: isChatMode ? 'chat' : 'execute'
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

  const executeCodeGeneration = async (
    prompt: string, 
    projectId: string, 
    fileType?: string, 
    existingFiles?: any[]
  ) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('code-generator', {
        body: {
          prompt: `[EXECUTE MODE] ${prompt}`,
          projectId,
          fileType,
          existingFiles,
          modelId: defaultModel?.id || 'gpt-4o',
          modelName: defaultModel?.model_name || 'gpt-4o',
          executeMode: true
        }
      });

      if (error) throw error;

      return {
        code: data.code,
        suggestedFilename: data.suggestedFilename,
        changes: data.changes
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute code generation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCode = async (code: string, context?: string) => {
    setIsLoading(true);
    try {
      const defaultModel = getDefaultModel();
      
      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message: `[CHAT MODE] Analyze this code and provide insights: ${context ? `Context: ${context}\n` : ''}Code: ${code}`,
          modelId: defaultModel?.id || 'gpt-4o',
          modelName: defaultModel?.model_name || 'gpt-4o',
          mode: 'analyze'
        }
      });

      if (error) throw error;

      return data.response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendUnifiedMessage,
    executeCodeGeneration,
    analyzeCode,
    isLoading
  };
};
