
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
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
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, createMessage } = useMessages(conversationId);
  const { sendUnifiedMessage, isLoading: aiLoading } = useUnifiedAIAssistant();
  const { codeFiles } = useCodeFiles(projectId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || aiLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      });

      await sendUnifiedMessage(userMessage, conversationId, codeFiles, true);
    } catch (error) {
      console.error('Failed to send message:', error);
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

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    const content = message.content.replace(/^\[(CHAT|EXECUTE) MODE\]\s*/, '');
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gray-900' : 'bg-blue-500'
          }`}>
            {isUser ? (
              <User className="h-3.5 w-3.5 text-white" />
            ) : (
              <Bot className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {content.includes('```') ? (
                <div>
                  {content.split('```').map((part, index) => {
                    if (index % 2 === 1) {
                      return (
                        <div key={index} className="bg-gray-800 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto">
                          <pre className="text-xs font-mono">
                            <code>{part}</code>
                          </pre>
                        </div>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </div>
              ) : (
                content
              )}
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
      {/* Simple Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium text-gray-900">AI Assistant</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">AI Assistant</h4>
              <p className="text-gray-500 text-sm mb-4">
                I can help you write code, debug issues, and improve your project.
              </p>
              <p className="text-xs text-gray-400">
                Start a conversation to get help with your code.
              </p>
            </div>
          </div>
        )}
        
        {aiLoading && (
          <div className="flex justify-start mb-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your code..."
            className="flex-1"
            disabled={aiLoading}
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || aiLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SimplifiedAIAssistant;
