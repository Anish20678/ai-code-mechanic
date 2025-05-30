
import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface ChatInterfaceProps {
  conversationId: string;
}

const ChatInterface = ({ conversationId }: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, createMessage } = useMessages(conversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Create user message
    await createMessage.mutateAsync({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });

    // Simulate AI response (in a real app, this would call your AI service)
    setTimeout(async () => {
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'assistant',
        content: `I understand you want to: "${userMessage}". I'm an AI coding assistant that can help you write, debug, and improve your code. What specific coding task would you like assistance with?`,
      });
    }, 1000);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gray-900' : 'bg-blue-500'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-white" />
            )}
          </div>
          <Card className={`${isUser ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <CardContent className="p-3">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Start a conversation with your AI assistant</p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask your AI coding assistant..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || createMessage.isPending}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
