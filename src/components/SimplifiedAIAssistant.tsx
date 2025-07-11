
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Lightbulb, Send, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMessages } from '@/hooks/useMessages';
import { useUnifiedAIAssistant } from '@/hooks/useUnifiedAIAssistant';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import SmartMessageBubble from '@/components/SmartMessageBubble';
import ExecutionStatusCard from '@/components/ExecutionStatusCard';
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
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading } = useMessages(conversationId);
  const { sendUnifiedMessage, isLoading: aiLoading } = useUnifiedAIAssistant();
  const { codeFiles } = useCodeFiles(projectId);
  const { handleAsyncOperation } = useErrorHandler();

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || aiLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsExecuting(true);

    await handleAsyncOperation(async () => {
      await sendUnifiedMessage(message, conversationId, codeFiles, !executeMode);
    }, 'Failed to send message', 'SimplifiedAIAssistant.handleSendMessage');

    setIsExecuting(false);
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
  }, [messages, isExecuting]);

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
      {/* Header with Mode Toggle */}
      <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {executeMode ? (
                <Zap className="h-4 w-4 text-orange-500" />
              ) : (
                <Lightbulb className="h-4 w-4 text-blue-500" />
              )}
              <Label htmlFor="execute-mode" className="text-sm font-medium">
                {executeMode ? 'Execute Mode' : 'Chat Mode'}
              </Label>
            </div>
            <Switch
              id="execute-mode"
              checked={executeMode}
              onCheckedChange={setExecuteMode}
            />
          </div>
          <div className="text-xs text-gray-500">
            {codeFiles?.length || 0} files • {messages?.length || 0} messages
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {executeMode 
            ? 'AI will execute code changes and modify files directly'
            : 'AI will provide guidance and suggestions without making changes'
          }
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages && messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <SmartMessageBubble 
                key={message.id} 
                message={message}
                mode={executeMode ? 'execute' : 'chat'}
              />
            ))}
            
            {/* Execution Status Card */}
            <ExecutionStatusCard
              isExecuting={isExecuting}
              mode={executeMode ? 'execute' : 'chat'}
              onComplete={() => setIsExecuting(false)}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {executeMode ? (
                <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              ) : (
                <Lightbulb className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              )}
              <h4 className="font-medium text-gray-900 mb-2">
                {executeMode ? 'AI Code Executor' : 'AI Assistant'}
              </h4>
              <p className="text-gray-500 text-sm mb-4">
                {executeMode 
                  ? 'I can execute commands and make changes to your code directly.'
                  : 'I can help you write code, debug issues, and provide guidance.'
                }
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>✓ Real-time message updates</p>
                <p>✓ File modification capabilities</p>
                <p>✓ Code execution and analysis</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator for AI response */}
        {aiLoading && !isExecuting && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                executeMode ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {executeMode ? (
                  <Zap className="h-4 w-4 text-white" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-white" />
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
          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={executeMode 
                ? "Tell me what to build, fix, or modify..." 
                : "Ask me anything about your code..."
              }
              disabled={aiLoading || isExecuting}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || aiLoading || isExecuting}
              size="sm"
              className={`px-3 ${executeMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {aiLoading || isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {executeMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('Create a new React component')}
                  disabled={aiLoading || isExecuting}
                >
                  Create Component
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('Add error handling to my components')}
                  disabled={aiLoading || isExecuting}
                >
                  Add Error Handling
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('Optimize my code for better performance')}
                  disabled={aiLoading || isExecuting}
                >
                  Optimize Code
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('How can I improve this code?')}
                  disabled={aiLoading || isExecuting}
                >
                  Code Review
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('Explain how this component works')}
                  disabled={aiLoading || isExecuting}
                >
                  Explain Code
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={() => setInputValue('Help me debug this issue')}
                  disabled={aiLoading || isExecuting}
                >
                  Debug Help
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimplifiedAIAssistant;
