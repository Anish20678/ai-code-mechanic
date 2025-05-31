
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAIModels } from '@/hooks/useAIModels';

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
      
      // Determine the appropriate mode and prompt
      const mode = isChatMode ? 'chat' : 'execute';
      const systemContext = isChatMode
        ? `You are a helpful AI coding assistant. Provide guidance, suggestions, and explanations. Do not make direct code changes unless explicitly requested. Focus on helping the user understand and improve their code.`
        : `You are an AI code executor. When given commands, execute them immediately by making the necessary code changes. Be direct and efficient in your responses. If a task requires multiple steps, complete them all in one response.`;

      const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
        body: {
          message: `${systemContext}\n\nUser request: ${message}`,
          conversationId,
          projectFiles,
          modelId,
          modelName: defaultModel?.model_name || 'gpt-4o',
          mode
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

  const executeFileOperations = async (
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

      return {
        response: data.response,
        operations: data.operations,
        executionResults: data.executionResults
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute file operations",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCodeWithAI = async (
    code: string, 
    conversationId: string,
    context?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-file-executor', {
        body: {
          prompt: `[ANALYSIS MODE] Analyze this code and provide insights: ${context ? `Context: ${context}\n` : ''}Code: ${code}`,
          projectId: '',
          sessionId: '',
          conversationId,
          existingFiles: [],
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
    executeFileOperations,
    analyzeCodeWithAI,
    isLoading
  };
};
