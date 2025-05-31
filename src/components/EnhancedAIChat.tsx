import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AIModelSelector from './AIModelSelector';
import { useAIModels } from '@/hooks/useAIModels';
import { useSystemPrompts } from '@/hooks/useSystemPrompts';
import { useAIGenerations } from '@/hooks/useAIGenerations';
import { useUserBilling } from '@/hooks/useUserBilling';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];
type PromptCategory = Database['public']['Enums']['prompt_category'];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  cost?: number;
}

interface EnhancedAIChatProps {
  projectId?: string;
  initialPrompt?: string;
  category?: PromptCategory;
}

const EnhancedAIChat = ({ projectId, initialPrompt, category = 'coding' }: EnhancedAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { getDefaultModel } = useAIModels();
  const { getDefaultPrompt } = useSystemPrompts(category);
  const { createGeneration } = useAIGenerations();
  const { isOverLimit } = useUserBilling();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedModel) {
      const defaultModel = getDefaultModel();
      if (defaultModel) {
        setSelectedModel(defaultModel);
      }
    }
  }, [getDefaultModel, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedModel || isLoading) return;

    if (isOverLimit()) {
      toast({
        title: "Usage limit exceeded",
        description: "Please upgrade your plan to continue using AI features.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get system prompt
      const systemPrompt = getDefaultPrompt(category);
      
      // Simulate AI response (replace with actual API call)
      const response = await simulateAIResponse(input, selectedModel);
      
      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: selectedModel.display_name,
        tokens: response.tokens,
        cost: response.cost,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Record generation
      await createGeneration.mutateAsync({
        project_id: projectId,
        model_id: selectedModel.id,
        prompt_id: systemPrompt?.id,
        input_text: input,
        output_text: response.content,
        input_tokens: Math.ceil(input.length / 4),
        output_tokens: response.tokens,
        total_cost: response.cost,
        success: true,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (input: string, model: AIModel) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate tokens and cost (simplified)
    const outputTokens = Math.ceil(input.length * 1.5);
    const inputTokens = Math.ceil(input.length / 4);
    const totalCost = (inputTokens * model.cost_per_input_token) + (outputTokens * model.cost_per_output_token);
    
    return {
      content: `This is a simulated response from ${model.display_name}. You asked: "${input}". This would be replaced with actual AI API integration.`,
      tokens: outputTokens,
      cost: totalCost,
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span>AI Assistant</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <Separator />
      
      <div className="p-4">
        <AIModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
      
      <Separator />
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with your AI assistant</p>
                {initialPrompt && (
                  <p className="text-sm mt-2">Try: "{initialPrompt}"</p>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {message.role === 'user' ? 'You' : message.model || 'Assistant'}
                    </span>
                    {message.role === 'assistant' && message.cost && (
                      <Badge variant="outline" className="text-xs">
                        ${message.cost.toFixed(6)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                    {message.tokens && (
                      <span className="ml-2">{message.tokens} tokens</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              disabled={isLoading || isOverLimit()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || isOverLimit()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Zap className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isOverLimit() && (
            <p className="text-sm text-destructive mt-2">
              Usage limit exceeded. Please upgrade your plan to continue.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAIChat;
