
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code, Loader2, Settings, MessageSquare, Zap, ChevronDown, Play, FileText, TestTube, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMessages } from '@/hooks/useMessages';
import { useUnifiedAIAssistant } from '@/hooks/useUnifiedAIAssistant';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useExecutionSessions } from '@/hooks/useExecutionSessions';
import ExecutionTracker from '@/components/ExecutionTracker';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface UnifiedAIAssistantProps {
  conversationId: string;
  projectId: string;
}

const UnifiedAIAssistant = ({ conversationId, projectId }: UnifiedAIAssistantProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatMode, setChatMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showExecutionTracker, setShowExecutionTracker] = useState(false);
  const [activeExecutionId, setActiveExecutionId] = useState<string>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, createMessage } = useMessages(conversationId);
  const { sendUnifiedMessage, isLoading: aiLoading } = useUnifiedAIAssistant();
  const { executeCode, analyzeCode, optimizeCode, generateTests, refactorCode, isLoading: advancedLoading } = useAdvancedAI();
  const { codeFiles } = useCodeFiles(projectId);
  const { createSession } = useExecutionSessions(projectId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || aiLoading || advancedLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Create user message
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      });

      // Send to unified AI assistant with mode context
      await sendUnifiedMessage(userMessage, conversationId, codeFiles, chatMode);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleExecuteCode = async () => {
    try {
      // Create execution session
      const session = await createSession.mutateAsync({
        conversation_id: conversationId,
        project_id: projectId,
        execution_type: 'code_generation',
        total_steps: 5,
        status: 'running',
      });

      setActiveExecutionId(session.id);
      setShowExecutionTracker(true);

      // Create a message to trigger the code execution
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: 'Execute the plan',
      });

      // Execute using the advanced AI
      await executeCode('Execute the discussed plan', projectId, session.id, conversationId, codeFiles);
    } catch (error) {
      console.error('Failed to execute code:', error);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!codeFiles || codeFiles.length === 0) return;

    const userMessage = `${action} for the current codebase`;
    setInputMessage('');

    try {
      await createMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      });

      switch (action) {
        case 'Analyze code quality':
          await analyzeCode(userMessage, conversationId, codeFiles);
          break;
        case 'Generate tests':
          // For now, analyze and suggest test generation
          await sendUnifiedMessage(`Generate comprehensive tests for the current codebase`, conversationId, codeFiles, false);
          break;
        case 'Optimize performance':
          // Analyze for optimization opportunities
          await sendUnifiedMessage(`Analyze and optimize the performance of the current codebase`, conversationId, codeFiles, false);
          break;
        default:
          await sendUnifiedMessage(userMessage, conversationId, codeFiles, chatMode);
      }
    } catch (error) {
      console.error('Failed to execute quick action:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
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
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gray-900' : chatMode ? 'bg-blue-500' : 'bg-orange-500'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : chatMode ? (
              <Bot className="h-4 w-4 text-white" />
            ) : (
              <Zap className="h-4 w-4 text-white" />
            )}
          </div>
          <Card className={`${isUser ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <CardContent className="p-3">
              <div className="text-sm whitespace-pre-wrap">
                {content.includes('```') ? (
                  <div>
                    {content.split('```').map((part, index) => {
                      if (index % 2 === 1) {
                        return (
                          <div key={index} className="bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto">
                            <pre className="text-sm font-mono">
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
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
                {message.metadata && (message.metadata as any).tokens_used && (
                  <span className={`text-xs ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>
                    {(message.metadata as any).tokens_used} tokens
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const getSuggestions = () => {
    const chatSuggestions = [
      "Help me debug this error",
      "Review my code quality", 
      "Suggest improvements",
      "Explain this function",
      "Add error handling",
      "Optimize performance"
    ];

    const executeSuggestions = [
      "Create a new component",
      "Add error boundaries",
      "Implement authentication",
      "Add form validation",
      "Create API endpoints",
      "Setup routing"
    ];

    return chatMode ? chatSuggestions : executeSuggestions;
  };

  const getQuickActions = () => {
    return [
      { label: "Analyze code quality", icon: FileText },
      { label: "Generate tests", icon: TestTube },
      { label: "Optimize performance", icon: Wrench }
    ];
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
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header with Chat Mode Toggle */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">AI Assistant</h3>
              <span className="text-xs text-gray-500">
                ({codeFiles?.length || 0} files in context)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExecutionTracker(!showExecutionTracker)}
              >
                <Zap className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {chatMode ? (
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                ) : (
                  <Zap className="h-4 w-4 text-orange-500" />
                )}
                <Label htmlFor="chat-mode" className="text-sm font-medium">
                  {chatMode ? 'Chat Mode' : 'Execute Mode'}
                </Label>
              </div>
              <Switch
                id="chat-mode"
                checked={chatMode}
                onCheckedChange={setChatMode}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExecuteCode}
                disabled={aiLoading || advancedLoading || createSession.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Code
              </Button>
              <p className="text-xs text-gray-500">
                {chatMode ? 'Provides suggestions and guidance' : 'Executes commands immediately'}
              </p>
            </div>
          </div>

          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleContent className="mt-3 pt-3 border-t border-gray-100">
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-medium">Mode Explanation:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Chat Mode ON:</strong> AI provides suggestions, explanations, and guidance. Ask questions and get advice.</p>
                  <p><strong>Chat Mode OFF:</strong> AI executes commands directly. Make changes to your code immediately.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
                {chatMode ? (
                  <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                ) : (
                  <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                )}
                <h4 className="font-medium text-gray-900 mb-2">
                  {chatMode ? 'AI Coding Assistant' : 'AI Code Executor'}
                </h4>
                <p className="text-gray-500 text-sm mb-4">
                  {chatMode 
                    ? 'I can help you understand code, debug issues, and provide guidance.'
                    : 'I can execute commands and make changes to your code directly.'
                  }
                </p>
                <p className="text-xs text-gray-400">
                  I have access to your project files for better context.
                </p>
              </div>
            </div>
          )}
          
          {/* Loading indicator for AI response */}
          {(aiLoading || advancedLoading) && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  chatMode ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {chatMode ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <Zap className="h-4 w-4 text-white" />
                  )}
                </div>
                <Card className="bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {chatMode ? 'AI is thinking...' : 'AI is executing...'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Quick Actions */}
        {codeFiles && codeFiles.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {getQuickActions().map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleQuickAction(action.label)}
                  disabled={aiLoading || advancedLoading}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {(!messages || messages.length === 0) && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-600 mb-2">
              {chatMode ? 'Chat Suggestions:' : 'Execute Suggestions:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {getSuggestions().map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setInputMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={chatMode 
                ? "Ask me to help with your code..." 
                : "Tell me what to implement..."
              }
              className="flex-1"
              disabled={aiLoading || advancedLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || aiLoading || advancedLoading}
              className={chatMode ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {aiLoading || advancedLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : chatMode ? (
                <Send className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Execution Tracker Panel */}
      {showExecutionTracker && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
          <ExecutionTracker projectId={projectId} activeSessionId={activeExecutionId} />
        </div>
      )}
    </div>
  );
};

export default UnifiedAIAssistant;
