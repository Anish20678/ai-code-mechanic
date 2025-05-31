
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAIModels } from '@/hooks/useAIModels';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useUnifiedAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getDefaultModel } = useAIModels();
  const { handleError } = useErrorHandler();

  const fetchConversationHistory = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Get last 10 messages for context

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
      return [];
    }
  };

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

      // Fetch conversation history for context
      const conversationHistory = await fetchConversationHistory(conversationId);

      const defaultModel = getDefaultModel();
      const modelId = defaultModel?.id || 'gpt-4o';
      
      // In execute mode, use the ai-file-executor for actual code changes
      if (!isChatMode) {
        console.log('Execute mode: Using ai-file-executor for code changes');
        
        // Create execution session for tracking
        const { data: sessionData, error: sessionError } = await supabase
          .from('execution_sessions')
          .insert({
            conversation_id: conversationId,
            project_id: projectFiles?.[0]?.project_id || '',
            execution_type: 'unified_execute',
            total_steps: 3,
            status: 'running'
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating execution session:', sessionError);
        }

        const sessionId = sessionData?.id || `unified_${Date.now()}`;

        // Call ai-file-executor for code execution
        const { data: executeData, error: executeError } = await supabase.functions.invoke('ai-file-executor', {
          body: {
            prompt: `${message}\n\nConversation Context:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`,
            projectId: projectFiles?.[0]?.project_id || '',
            sessionId,
            conversationId,
            existingFiles: projectFiles,
            mode: 'execute'
          }
        });

        if (executeError) {
          console.error('AI file executor error:', executeError);
          throw new Error(`Code execution error: ${executeError.message || 'Unknown error'}`);
        }

        toast({
          title: "Code Executed",
          description: "AI has made changes to your code",
        });

        return executeData.response;
      } else {
        // Chat mode: use the regular ai-coding-assistant
        console.log('Chat mode: Using ai-coding-assistant for guidance');
        
        const systemContext = `You are a helpful AI coding assistant. Provide clear, concise guidance and explanations. Focus on helping the user understand concepts and solve problems.

Conversation History:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

        const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
          body: {
            message: `${systemContext}\n\nCurrent request: ${message}`,
            conversationId,
            projectFiles,
            modelId,
            modelName: defaultModel?.model_name || 'gpt-4o',
            mode: 'chat'
          }
        });

        if (error) {
          console.error('AI function error:', error);
          throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
        }

        return data.response;
      }
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      
      const errorMessage = error.message || "Failed to get AI response";
      
      // Use error handler instead of direct toast
      handleError(errorMessage, 'UnifiedAIAssistant.sendUnifiedMessage');
      
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
