
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
      // First, create and store the user message immediately
      const { data: userMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          metadata: { 
            mode: isChatMode ? 'chat' : 'execute',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (userMessageError) {
        console.error('Error storing user message:', userMessageError);
        throw new Error(`Failed to store message: ${userMessageError.message}`);
      }

      const defaultModel = getDefaultModel();
      const modelId = defaultModel?.id || 'gpt-4o';
      
      // Determine the appropriate mode and prompt
      const mode = isChatMode ? 'chat' : 'execute';
      const systemContext = isChatMode
        ? `You are a helpful AI coding assistant. Provide clear, concise guidance and explanations. Focus on helping the user understand concepts and solve problems.`
        : `You are an AI code executor. You can create, modify, and delete files in the project. Execute commands immediately by making necessary code changes. Be direct and efficient.`;

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

      if (error) {
        console.error('AI function error:', error);
        throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
      }

      // Show success toast for execute mode
      if (!isChatMode) {
        toast({
          title: "Code Executed",
          description: "AI has made changes to your code",
        });
      }

      return data.response;
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      
      const errorMessage = error.message || "Failed to get AI response";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
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
      // Create user message for file operations
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: prompt,
          metadata: { 
            mode: 'file_execute',
            session_id: sessionId,
            timestamp: new Date().toISOString()
          }
        });

      if (userMessageError) {
        console.error('Error storing user message:', userMessageError);
        throw new Error(`Failed to store message: ${userMessageError.message}`);
      }

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

      if (error) {
        console.error('File executor error:', error);
        throw new Error(`File operation error: ${error.message || 'Unknown error'}`);
      }

      toast({
        title: "Files Updated",
        description: "AI has executed file operations successfully",
      });

      return {
        response: data.response,
        operations: data.operations,
        executionResults: data.executionResults
      };
    } catch (error: any) {
      console.error('File executor error:', error);
      
      const errorMessage = error.message || "Failed to execute file operations";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
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
      // Create user message for code analysis
      const analysisPrompt = `[ANALYSIS MODE] Analyze this code and provide insights: ${context ? `Context: ${context}\n` : ''}Code: ${code}`;
      
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: analysisPrompt,
          metadata: { 
            mode: 'analyze',
            timestamp: new Date().toISOString()
          }
        });

      if (userMessageError) {
        console.error('Error storing user message:', userMessageError);
        throw new Error(`Failed to store message: ${userMessageError.message}`);
      }

      const { data, error } = await supabase.functions.invoke('ai-file-executor', {
        body: {
          prompt: analysisPrompt,
          projectId: '',
          sessionId: '',
          conversationId,
          existingFiles: [],
          mode: 'analyze'
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(`Code analysis error: ${error.message || 'Unknown error'}`);
      }

      return data.response;
    } catch (error: any) {
      console.error('Code analysis error:', error);
      
      const errorMessage = error.message || "Failed to analyze code";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
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
