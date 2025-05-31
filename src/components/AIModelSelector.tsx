
import { useState } from 'react';
import { Check, ChevronsUpDown, Zap, Eye, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAIModels } from '@/hooks/useAIModels';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];

interface AIModelSelectorProps {
  selectedModel: AIModel | null;
  onModelChange: (model: AIModel) => void;
  provider?: string;
}

const AIModelSelector = ({ selectedModel, onModelChange, provider }: AIModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { models, isLoading } = useAIModels();

  const filteredModels = provider 
    ? models?.filter(model => model.provider === provider) || []
    : models || [];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'anthropic':
        return <Zap className="h-4 w-4" />;
      case 'google':
        return <Eye className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'anthropic':
        return 'bg-orange-100 text-orange-800';
      case 'google':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="h-10 bg-gray-100 rounded animate-pulse" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedModel ? (
            <div className="flex items-center space-x-2">
              {getProviderIcon(selectedModel.provider)}
              <span>{selectedModel.display_name}</span>
              <Badge variant="secondary" className={getProviderColor(selectedModel.provider)}>
                {selectedModel.provider}
              </Badge>
            </div>
          ) : (
            "Select AI model..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              {filteredModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.display_name}
                  onSelect={() => {
                    onModelChange(model);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModel?.id === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {getProviderIcon(model.provider)}
                    <div className="flex flex-col">
                      <span className="font-medium">{model.display_name}</span>
                      <span className="text-sm text-gray-500">{model.description}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {model.supports_vision && (
                        <Badge variant="outline" className="text-xs">Vision</Badge>
                      )}
                      {model.supports_streaming && (
                        <Badge variant="outline" className="text-xs">Stream</Badge>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AIModelSelector;
