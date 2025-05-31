
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Code, FileText, Lightbulb, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface SmartMessageBubbleProps {
  message: Message;
  mode: 'chat' | 'execute';
}

const SmartMessageBubble = ({ message, mode }: SmartMessageBubbleProps) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isUser = message.role === 'user';
  const content = message.content.replace(/^\[(CHAT|EXECUTE|ANALYSIS) MODE\]\s*/, '');
  
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatContent = (text: string) => {
    // Split content by code blocks
    const parts = text.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0] || 'text';
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg my-3 relative group">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                {language}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white h-6 px-2"
                onClick={() => copyToClipboard(code)}
              >
                {copiedText === code ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="text-sm font-mono overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      // Regular text with enhanced formatting
      return (
        <div key={index} className="prose prose-sm max-w-none">
          {part.split('\n').map((line, lineIndex) => {
            // Detect lists
            if (line.match(/^\d+\.\s/)) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 my-1">
                  <Badge variant="outline" className="text-xs mt-0.5 px-1.5 py-0.5">
                    {line.match(/^(\d+)\./)?.[1]}
                  </Badge>
                  <span>{line.replace(/^\d+\.\s/, '')}</span>
                </div>
              );
            }
            
            // Detect bullet points
            if (line.match(/^[-*]\s/)) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 my-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span>{line.replace(/^[-*]\s/, '')}</span>
                </div>
              );
            }
            
            // Regular line
            return line ? <p key={lineIndex} className="my-1">{line}</p> : <br key={lineIndex} />;
          })}
        </div>
      );
    });
  };

  const getMessageMetadata = () => {
    const metadata = message.metadata as any;
    if (!metadata) return null;

    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        {metadata.mode && (
          <Badge variant="outline" className="text-xs">
            {metadata.mode}
          </Badge>
        )}
        {metadata.tokens_used && (
          <span>{metadata.tokens_used} tokens</span>
        )}
        {metadata.model && (
          <span>{metadata.model}</span>
        )}
      </div>
    );
  };

  const shouldTruncate = content.length > 500;
  const displayContent = shouldTruncate && !isExpanded 
    ? content.substring(0, 500) + '...' 
    : content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-gray-900' : mode === 'execute' ? 'bg-orange-500' : 'bg-blue-500'
        }`}>
          {isUser ? (
            <div className="w-4 h-4 bg-white rounded-full" />
          ) : mode === 'execute' ? (
            <Zap className="h-4 w-4 text-white" />
          ) : (
            <Lightbulb className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <Card className={`${
          isUser ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="text-sm leading-relaxed">
              {isUser ? (
                <div className="whitespace-pre-wrap">{displayContent}</div>
              ) : (
                formatContent(displayContent)
              )}
            </div>

            {/* Expand/Collapse for long messages */}
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 h-6 px-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}

            {/* Message metadata */}
            {getMessageMetadata()}

            {/* Timestamp */}
            <div className="flex items-center justify-between mt-3">
              <p className={`text-xs ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </p>
              
              {!isUser && !content.includes('```') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(content)}
                  className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedText === content ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartMessageBubble;
