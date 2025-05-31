
import { useState } from 'react';
import { Key, Edit, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIProviderConfigs } from '@/hooks/useAIProviderConfigs';
import type { Database } from '@/integrations/supabase/types';

type AIProviderConfig = Database['public']['Tables']['ai_provider_configs']['Row'];

const ProviderConfigManager = () => {
  const [editingConfig, setEditingConfig] = useState<AIProviderConfig | null>(null);
  const [formData, setFormData] = useState({
    api_endpoint: '',
    is_enabled: true,
    rate_limit_requests: 100,
    rate_limit_window_minutes: 60,
  });

  const { configs, isLoading, updateConfig } = useAIProviderConfigs();

  const handleUpdate = async () => {
    if (!editingConfig) return;
    
    try {
      await updateConfig.mutateAsync({
        id: editingConfig.id,
        ...formData,
      });
      setEditingConfig(null);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const startEdit = (config: AIProviderConfig) => {
    setEditingConfig(config);
    setFormData({
      api_endpoint: config.api_endpoint,
      is_enabled: config.is_enabled,
      rate_limit_requests: config.rate_limit_requests,
      rate_limit_window_minutes: config.rate_limit_window_minutes,
    });
  };

  const cancelEdit = () => {
    setEditingConfig(null);
  };

  const getProviderStatus = (provider: string) => {
    // This would check if API keys are configured
    // For now, we'll simulate this
    const hasApiKey = ['openai', 'anthropic', 'google'].includes(provider);
    return hasApiKey;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading provider configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Provider configurations require API keys to be set in the project secrets. 
          Make sure to configure the necessary API keys for each provider.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {configs?.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)}
                    <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
                      {config.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant={getProviderStatus(config.provider) ? 'default' : 'destructive'}>
                      {getProviderStatus(config.provider) ? 'API Key Set' : 'No API Key'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Configure settings for {config.provider} API integration
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(config)}
                  disabled={editingConfig?.id === config.id}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingConfig?.id === config.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api_endpoint">API Endpoint</Label>
                    <Input
                      id="api_endpoint"
                      value={formData.api_endpoint}
                      onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rate_limit_requests">Rate Limit (requests)</Label>
                      <Input
                        id="rate_limit_requests"
                        type="number"
                        value={formData.rate_limit_requests}
                        onChange={(e) => setFormData({ ...formData, rate_limit_requests: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate_limit_window">Time Window (minutes)</Label>
                      <Input
                        id="rate_limit_window"
                        type="number"
                        value={formData.rate_limit_window_minutes}
                        onChange={(e) => setFormData({ ...formData, rate_limit_window_minutes: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_enabled"
                      checked={formData.is_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                    />
                    <Label htmlFor="is_enabled">Enable Provider</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">API Endpoint</p>
                    <p className="font-mono">{config.api_endpoint}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rate Limit</p>
                    <p>{config.rate_limit_requests} requests / {config.rate_limit_window_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={config.is_enabled ? 'text-green-600' : 'text-gray-500'}>
                      {config.is_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Key Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Configure API keys for each provider to enable AI functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">OpenAI API Key</p>
                  <p className="text-sm text-gray-600">Required for GPT models</p>
                </div>
                <Badge variant={getProviderStatus('openai') ? 'default' : 'destructive'}>
                  {getProviderStatus('openai') ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Anthropic API Key</p>
                  <p className="text-sm text-gray-600">Required for Claude models</p>
                </div>
                <Badge variant={getProviderStatus('anthropic') ? 'default' : 'destructive'}>
                  {getProviderStatus('anthropic') ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Google API Key</p>
                  <p className="text-sm text-gray-600">Required for Gemini models</p>
                </div>
                <Badge variant={getProviderStatus('google') ? 'default' : 'destructive'}>
                  {getProviderStatus('google') ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderConfigManager;
