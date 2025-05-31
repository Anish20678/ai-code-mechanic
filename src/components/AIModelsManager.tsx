
import { useState } from 'react';
import { Plus, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAIModels } from '@/hooks/useAIModels';
import type { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];
type Provider = Database['public']['Enums']['ai_provider'];

const AIModelsManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    model_name: '',
    provider: 'openai' as Provider,
    cost_per_input_token: 0,
    cost_per_output_token: 0,
    max_tokens: 4000,
    supports_vision: false,
    supports_streaming: true,
    is_active: true,
    description: '',
  });

  const { models, isLoading, createModel, updateModel } = useAIModels();

  const providers: Provider[] = ['openai', 'anthropic', 'google'];

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
      display_name: model.display_name,
      model_name: model.model_name,
      provider: model.provider,
      cost_per_input_token: Number(model.cost_per_input_token),
      cost_per_output_token: Number(model.cost_per_output_token),
      max_tokens: model.max_tokens,
      supports_vision: model.supports_vision,
      supports_streaming: model.supports_streaming,
      is_active: model.is_active,
      description: model.description || '',
    });
  };

  const resetForm = () => {
    setFormData({
      display_name: '',
      model_name: '',
      provider: 'openai',
      cost_per_input_token: 0,
      cost_per_output_token: 0,
      max_tokens: 4000,
      supports_vision: false,
      supports_streaming: true,
      is_active: true,
      description: '',
    });
  };

  const cancelEdit = () => {
    setEditingModel(null);
    setIsCreating(false);
    resetForm();
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
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., GPT-4o Mini"
                />
              </div>
              <div>
                <Label htmlFor="model_name">Model Name</Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="e.g., gpt-4o-mini"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value: Provider) => setFormData({ ...formData, provider: value })}
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
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="input_cost">Cost per Input Token</Label>
                <Input
                  id="input_cost"
                  type="number"
                  step="0.000001"
                  value={formData.cost_per_input_token}
                  onChange={(e) => setFormData({ ...formData, cost_per_input_token: parseFloat(e.target.value) })}
                  placeholder="0.000001"
                />
              </div>
              <div>
                <Label htmlFor="output_cost">Cost per Output Token</Label>
                <Input
                  id="output_cost"
                  type="number"
                  step="0.000001"
                  value={formData.cost_per_output_token}
                  onChange={(e) => setFormData({ ...formData, cost_per_output_token: parseFloat(e.target.value) })}
                  placeholder="0.000001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the model"
              />
            </div>

            <div className="flex gap-6">
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={editingModel ? handleUpdate : handleCreate}
                disabled={!formData.display_name || !formData.model_name}
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
                  <CardTitle className="text-base">{model.display_name}</CardTitle>
                  <p className="text-sm text-gray-600">{model.model_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
                    </Badge>
                    <Badge variant={model.is_active ? 'default' : 'secondary'}>
                      {model.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {model.supports_vision && (
                      <Badge variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Vision
                      </Badge>
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Input Cost</p>
                  <p className="font-mono">${Number(model.cost_per_input_token).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Output Cost</p>
                  <p className="font-mono">${Number(model.cost_per_output_token).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Max Tokens</p>
                  <p className="font-mono">{model.max_tokens.toLocaleString()}</p>
                </div>
              </div>
              {model.description && (
                <p className="text-gray-600 text-sm mt-2">{model.description}</p>
              )}
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
