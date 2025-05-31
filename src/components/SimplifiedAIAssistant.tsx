
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Lightbulb, Send, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useUnifiedAIAssistant } from '@/hooks/useUnifiedAIAssistant';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface SimplifiedAIAssistantProps {
  conversationId: string;
  projectId: string;
  onOpenSettings: () => void;
}

const SimplifiedAIAssistant = ({ conversationId, projectId, onOpenSettings }: SimplifiedAIAssistantProps) => {
  const [executeMode, setExecuteMode] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading } = useMessages(conversationId);
  const { sendUnifiedMessage, isLoading: aiLoading } = useUnifiedAIAssistant();
  const { codeFiles } = useCodeFiles(projectId);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || aiLoading) return;

    const message = inputValue.trim();
    setInputValue('');

    try {
      await sendUnifiedMessage(message, conversationId, codeFiles, !executeMode);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const formatAIResponse = (content: string) => {
    // Remove mode prefixes and clean up code blocks
    const cleanContent = content.replace(/^\[(CHAT|EXECUTE) MODE\]\s*/, '');
    
    // Split content by code blocks to handle them separately
    const parts = cleanContent.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block - show a simplified version
        return (
          <div key={index} className="bg-gray-800 text-gray-100 p-3 rounded-lg my-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Code changes applied</span>
            </div>
            <p className="text-xs text-gray-300">Files have been updated successfully.</p>
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    const content = message.content.replace(/^\[(CHAT|EXECUTE) MODE\]\s*/, '');
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gray-900' : executeMode ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : executeMode ? (
              <Zap className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-white" />
            )}
          </div>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {isUser ? content : formatAIResponse(content)}
            </div>
            <p className={`text-xs mt-2 ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {executeMode ? (
                <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              ) : (
                <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              )}
              <h4 className="font-medium text-gray-900 mb-2">
                {executeMode ? 'AI Code Executor' : 'AI Assistant'}
              </h4>
              <p className="text-gray-500 text-sm mb-4">
                {executeMode 
                  ? 'I can execute commands and make changes to your code directly.'
                  : 'I can help you write code, debug issues, and improve your project.'
                }
              </p>
              <p className="text-xs text-gray-400">
                Start typing your message below to begin.
              </p>
            </div>
          </div>
        )}
        
        {aiLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                executeMode ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {executeMode ? (
                  <Zap className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {executeMode ? 'Executing changes...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Fixed Chat Input at Bottom */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Mode:</span>
              <span className={executeMode ? 'text-orange-600 font-medium' : 'text-blue-600 font-medium'}>
                {executeMode ? 'Execute' : 'Chat'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExecuteMode(!executeMode)}
              className="h-6 px-2"
            >
              <Lightbulb className={`h-3 w-3 ${executeMode ? 'text-orange-500' : 'text-blue-500'}`} />
            </Button>
          </div>
          
          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={executeMode 
                ? "Describe what you want to build or fix..." 
                : "Ask me anything about your code..."
              }
              disabled={aiLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || aiLoading}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimplifiedAIAssistant;
