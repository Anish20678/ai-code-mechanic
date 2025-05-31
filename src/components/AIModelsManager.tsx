
import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAIModels } from '@/hooks/useAIModels';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];
type AIProvider = Database['public']['Enums']['ai_provider'];

const AIModelsManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    model_name: '',
    display_name: '',
    provider: 'openai' as AIProvider,
    description: '',
    cost_per_input_token: 0,
    cost_per_output_token: 0,
    max_tokens: 4000,
    supports_vision: false,
    supports_streaming: true,
  });

  const { models, isLoading, createModel, updateModel } = useAIModels();
  const { toast } = useToast();

  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'deepseek'];

  const handleCreate = async () => {
    try {
      await createModel.mutateAsync(formData);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingModel) return;
    
    try {
      await updateModel.mutateAsync({
        id: editingModel.id,
        ...formData,
      });
      setEditingModel(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const startEdit = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      model_name: model.model_name,
      display_name: model.display_name,
      provider: model.provider,
      description: model.description || '',
      cost_per_input_token: Number(model.cost_per_input_token),
      cost_per_output_token: Number(model.cost_per_output_token),
      max_tokens: model.max_tokens,
      supports_vision: model.supports_vision,
      supports_streaming: model.supports_streaming,
    });
  };

  const resetForm = () => {
    setFormData({
      model_name: '',
      display_name: '',
      provider: 'openai',
      description: '',
      cost_per_input_token: 0,
      cost_per_output_token: 0,
      max_tokens: 4000,
      supports_vision: false,
      supports_streaming: true,
    });
  };

  const cancelEdit = () => {
    setEditingModel(null);
    setIsCreating(false);
    resetForm();
  };

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
      case 'deepseek':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading AI models...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingModel) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingModel ? 'Edit AI Model' : 'Add New AI Model'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model_name">Model Name</Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="e.g., gpt-4o-mini"
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., GPT-4o Mini"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value: AIProvider) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Model description and capabilities"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="input_cost">Cost per Input Token</Label>
                <Input
                  id="input_cost"
                  type="number"
                  step="0.000001"
                  value={formData.cost_per_input_token}
                  onChange={(e) => setFormData({ ...formData, cost_per_input_token: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="output_cost">Cost per Output Token</Label>
                <Input
                  id="output_cost"
                  type="number"
                  step="0.000001"
                  value={formData.cost_per_output_token}
                  onChange={(e) => setFormData({ ...formData, cost_per_output_token: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports_vision"
                  checked={formData.supports_vision}
                  onCheckedChange={(checked) => setFormData({ ...formData, supports_vision: checked })}
                />
                <Label htmlFor="supports_vision">Supports Vision</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports_streaming"
                  checked={formData.supports_streaming}
                  onCheckedChange={(checked) => setFormData({ ...formData, supports_streaming: checked })}
                />
                <Label htmlFor="supports_streaming">Supports Streaming</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={editingModel ? handleUpdate : handleCreate}
                disabled={!formData.model_name || !formData.display_name}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingModel ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Create Button */}
      {!isCreating && !editingModel && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">AI Models ({models?.length || 0})</h3>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      )}

      {/* Models List */}
      <div className="grid gap-4">
        {models?.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {getProviderIcon(model.provider)}
                    {model.display_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={getProviderColor(model.provider)}>
                      {model.provider}
                    </Badge>
                    <Badge variant={model.is_active ? 'default' : 'secondary'}>
                      {model.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {model.supports_vision && (
                      <Badge variant="outline">Vision</Badge>
                    )}
                    {model.supports_streaming && (
                      <Badge variant="outline">Streaming</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(model)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {model.description && (
                <p className="text-gray-600 text-sm mb-3">{model.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Model:</span> {model.model_name}
                </div>
                <div>
                  <span className="font-medium">Max Tokens:</span> {model.max_tokens.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Input Cost:</span> ${model.cost_per_input_token} per token
                </div>
                <div>
                  <span className="font-medium">Output Cost:</span> ${model.cost_per_output_token} per token
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {models?.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No AI models configured yet.</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Model
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIModelsManager;
