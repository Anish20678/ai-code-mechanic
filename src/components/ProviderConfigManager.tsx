
import { useState } from 'react';
import { Settings, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAIProviderConfigs } from '@/hooks/useAIProviderConfigs';
import { useAIModels } from '@/hooks/useAIModels';
import AIModelSelector from '@/components/AIModelSelector';
import type { Database } from '@/integrations/supabase/types';

type AIProviderConfig = Database['public']['Tables']['ai_provider_configs']['Row'];
type AIModel = Database['public']['Tables']['ai_models']['Row'];

const ProviderConfigManager = () => {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configData, setConfigData] = useState<Partial<AIProviderConfig>>({});

  const { configs, isLoading, updateConfig } = useAIProviderConfigs();
  const { models } = useAIModels();

  const handleToggleApiKey = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const startEdit = (config: AIProviderConfig) => {
    setEditingConfig(config.id);
    setConfigData(config);
  };

  const handleSave = async () => {
    if (!editingConfig || !configData.id) return;
    
    try {
      await updateConfig.mutateAsync({
        id: configData.id,
        api_endpoint: configData.api_endpoint,
        is_enabled: configData.is_enabled,
        rate_limit_requests: configData.rate_limit_requests,
        rate_limit_window_minutes: configData.rate_limit_window_minutes,
        default_model_id: configData.default_model_id,
      });
      setEditingConfig(null);
      setConfigData({});
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const cancelEdit = () => {
    setEditingConfig(null);
    setConfigData({});
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'google':
        return 'Google';
      case 'deepseek':
        return 'DeepSeek';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const getDefaultModelForProvider = (provider: string): AIModel | null => {
    return models?.find(model => model.provider === provider) || null;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading provider configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Provider Configurations ({configs?.length || 0})</h3>
      </div>

      <div className="grid gap-6">
        {configs?.map((config) => {
          const isEditing = editingConfig === config.id;
          const currentData = isEditing ? configData : config;
          const defaultModel = getDefaultModelForProvider(config.provider);

          return (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {getProviderDisplayName(config.provider)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
                        {config.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(config)}
                      >
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`api-endpoint-${config.id}`}>API Endpoint</Label>
                  <Input
                    id={`api-endpoint-${config.id}`}
                    value={currentData.api_endpoint || ''}
                    onChange={(e) => setConfigData({ ...configData, api_endpoint: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://api.provider.com/v1"
                  />
                </div>

                <div>
                  <Label htmlFor={`default-model-${config.id}`}>Default Model</Label>
                  {isEditing ? (
                    <AIModelSelector
                      selectedModel={models?.find(m => m.id === currentData.default_model_id) || null}
                      onModelChange={(model) => setConfigData({ ...configData, default_model_id: model.id })}
                      provider={config.provider}
                    />
                  ) : (
                    <Input
                      value={defaultModel?.display_name || 'No default model set'}
                      disabled
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`rate-limit-${config.id}`}>Rate Limit (requests)</Label>
                    <Input
                      id={`rate-limit-${config.id}`}
                      type="number"
                      value={currentData.rate_limit_requests || 0}
                      onChange={(e) => setConfigData({ ...configData, rate_limit_requests: Number(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`window-${config.id}`}>Window (minutes)</Label>
                    <Input
                      id={`window-${config.id}`}
                      type="number"
                      value={currentData.rate_limit_window_minutes || 0}
                      onChange={(e) => setConfigData({ ...configData, rate_limit_window_minutes: Number(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`enabled-${config.id}`}
                    checked={currentData.is_enabled || false}
                    onCheckedChange={(checked) => setConfigData({ ...configData, is_enabled: checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor={`enabled-${config.id}`}>Enable Provider</Label>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> API keys should be configured in your environment variables or secrets management system for security.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {configs?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No provider configurations found.</p>
          <p className="text-sm text-gray-400">Provider configurations are automatically created when you add AI models.</p>
        </div>
      )}
    </div>
  );
};

export default ProviderConfigManager;
