
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
        .limit(10);

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
      console.log('=== sendUnifiedMessage called ===');
      console.log('Message preview:', message.substring(0, 100));
      console.log('Conversation ID:', conversationId);
      console.log('Is Chat Mode:', isChatMode);
      console.log('Files count:', projectFiles?.length);

      // Store user message immediately
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

      console.log('User message stored successfully:', userMessage.id);

      const defaultModel = getDefaultModel();
      const modelId = defaultModel?.id || 'gpt-4o';
      
      // Execute mode: use ai-file-executor for code changes
      if (!isChatMode) {
        console.log('=== EXECUTE MODE: Using ai-file-executor ===');
        
        // Create execution session for tracking
        const { data: sessionData, error: sessionError } = await supabase
          .from('execution_sessions')
          .insert({
            conversation_id: conversationId,
            project_id: projectFiles?.[0]?.project_id || 'default',
            execution_type: 'unified_execute',
            total_steps: 3,
            status: 'running'
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating execution session:', sessionError);
          throw new Error(`Failed to create execution session: ${sessionError.message}`);
        }

        const sessionId = sessionData?.id || `unified_${Date.now()}`;
        console.log('Execution session created:', sessionId);

        // Prepare enhanced context for the AI
        const contextualPrompt = `User Request: ${message}

Project Context:
- Total Files: ${projectFiles?.length || 0}
- Project ID: ${projectFiles?.[0]?.project_id || 'default'}

Please implement the user's request by creating or modifying the necessary files. Provide complete, working code that follows React/TypeScript best practices.`;

        console.log('Calling ai-file-executor with contextual prompt...');

        // Call ai-file-executor for code execution
        const { data: executeData, error: executeError } = await supabase.functions.invoke('ai-file-executor', {
          body: {
            prompt: contextualPrompt,
            projectId: projectFiles?.[0]?.project_id || 'default',
            sessionId,
            conversationId,
            existingFiles: projectFiles?.slice(0, 20) || [],
            mode: 'execute'
          }
        });

        if (executeError) {
          console.error('AI file executor error:', executeError);
          throw new Error(`Code execution error: ${executeError.message || 'Unknown error'}`);
        }

        console.log('=== AI file executor completed successfully ===');
        console.log('Execute data:', executeData);

        toast({
          title: "Code Executed",
          description: `AI has made changes to your code. ${executeData.operations || 0} operations completed.`,
        });

        return executeData.response;
      } else {
        // Chat mode: use the regular ai-coding-assistant
        console.log('=== CHAT MODE: Using ai-coding-assistant ===');
        
        const conversationHistory = await fetchConversationHistory(conversationId);
        
        const systemContext = `You are Lovable, a helpful AI coding assistant. Provide clear, concise guidance and explanations.

Current Project Context:
- Tech Stack: React, TypeScript, Tailwind CSS, Supabase
- Files Available: ${projectFiles?.length || 0} files
- Recent Context: ${conversationHistory.slice(-2).map(m => `${m.role}: ${m.content.substring(0, 100)}`).join(' | ')}

Guidelines:
1. Provide practical coding solutions
2. Explain your reasoning step by step
3. Include code examples when helpful
4. Suggest best practices and optimizations
5. Help debug errors with specific solutions
6. When users want actual file changes, suggest switching to Execute Mode

Be conversational and educational in your responses.`;

        const { data, error } = await supabase.functions.invoke('ai-coding-assistant', {
          body: {
            message: `${systemContext}\n\nUser Request: ${message}`,
            conversationId,
            projectFiles: projectFiles?.slice(0, 10) || [],
            modelId,
            modelName: defaultModel?.model_name || 'gpt-4o',
            mode: 'chat'
          }
        });

        if (error) {
          console.error('AI coding assistant error:', error);
          throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
        }

        console.log('=== AI coding assistant completed successfully ===');
        return data.response;
      }
    } catch (error: any) {
      console.error('=== AI Assistant error ===', error);
      
      const errorMessage = error.message || "Failed to get AI response";
      
      handleError(errorMessage, 'UnifiedAIAssistant.sendUnifiedMessage');
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendUnifiedMessage,
    isLoading
  };
};
