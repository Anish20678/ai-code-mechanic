
import { useState } from 'react';
import { Database, Settings, Check, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useProjectBackendHealth } from '@/hooks/useProjectBackendHealth';
import { useBackendMigrations } from '@/hooks/useBackendMigrations';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Project = DatabaseType['public']['Tables']['projects']['Row'];

interface ProjectBackendConfigProps {
  project: Project;
}

const ProjectBackendConfig = ({ project }: ProjectBackendConfigProps) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [customBackendUrl, setCustomBackendUrl] = useState(project.supabase_project_url || '');
  const [customAnonKey, setCustomAnonKey] = useState(project.supabase_anon_key || '');
  const [useCustomBackend, setUseCustomBackend] = useState(project.uses_custom_backend || false);
  
  const { toast } = useToast();
  const { updateProject } = useProjects();
  const { backendHealth, recordHealthCheck } = useProjectBackendHealth(project.id);
  const { migrations, createMigration } = useBackendMigrations(project.id);

  const handleTestConnection = async () => {
    if (!customBackendUrl || !customAnonKey) {
      toast({
        title: "Missing configuration",
        description: "Please provide both Supabase URL and Anon Key",
        variant: "destructive",
      });
      return;
    }

    setIsConfiguring(true);
    const startTime = Date.now();

    try {
      // Test the connection by making a simple request
      const testUrl = `${customBackendUrl}/rest/v1/`;
      const response = await fetch(testUrl, {
        headers: {
          'apikey': customAnonKey,
          'Authorization': `Bearer ${customAnonKey}`,
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      await recordHealthCheck.mutateAsync({
        connection_status: isHealthy ? 'healthy' : 'degraded',
        response_time_ms: responseTime,
        error_message: isHealthy ? null : `HTTP ${response.status}: ${response.statusText}`,
        metrics: {
          test_type: 'connection_test',
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: isHealthy ? "Connection successful" : "Connection issues detected",
        description: isHealthy 
          ? `Connected successfully in ${responseTime}ms` 
          : `Failed to connect: ${response.status} ${response.statusText}`,
        variant: isHealthy ? "default" : "destructive",
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await recordHealthCheck.mutateAsync({
        connection_status: 'disconnected',
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          test_type: 'connection_test',
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsConfiguring(true);

    try {
      await updateProject.mutateAsync({
        id: project.id,
        supabase_project_url: useCustomBackend ? customBackendUrl : null,
        supabase_anon_key: useCustomBackend ? customAnonKey : null,
        uses_custom_backend: useCustomBackend,
        backend_status: useCustomBackend ? 'connected' : 'not_configured',
        last_backend_check: new Date().toISOString(),
      });

      if (useCustomBackend && project.uses_custom_backend !== useCustomBackend) {
        // Create migration record when switching to custom backend
        await createMigration.mutateAsync({
          migration_type: 'platform_to_custom',
          source_backend: { type: 'platform' },
          target_backend: { 
            type: 'custom', 
            url: customBackendUrl, 
            configured_at: new Date().toISOString() 
          },
          status: 'completed',
          progress_percentage: 100,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }

      toast({
        title: "Configuration saved",
        description: useCustomBackend 
          ? "Custom Supabase backend has been configured" 
          : "Switched back to platform backend",
      });
    } catch (error) {
      toast({
        title: "Error saving configuration",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const getStatusBadge = () => {
    if (!project.uses_custom_backend) {
      return <Badge className="bg-blue-100 text-blue-700">Platform Backend</Badge>;
    }

    if (!backendHealth) {
      return <Badge variant="secondary">Not Tested</Badge>;
    }

    switch (backendHealth.connection_status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-700">Degraded</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backend Configuration
              </CardTitle>
              <CardDescription>
                Configure a custom Supabase backend for this project
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-custom-backend"
              checked={useCustomBackend}
              onCheckedChange={setUseCustomBackend}
            />
            <Label htmlFor="use-custom-backend">Use custom Supabase backend</Label>
          </div>

          {useCustomBackend && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="backend-url">Supabase Project URL</Label>
                <Input
                  id="backend-url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={customBackendUrl}
                  onChange={(e) => setCustomBackendUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="anon-key">Anon Key</Label>
                <Input
                  id="anon-key"
                  type="password"
                  placeholder="your-anon-key"
                  value={customAnonKey}
                  onChange={(e) => setCustomAnonKey(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isConfiguring || !customBackendUrl || !customAnonKey}
                >
                  {isConfiguring ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {project.uses_custom_backend 
                ? 'This project uses a custom Supabase backend'
                : 'This project uses the platform Supabase backend'
              }
            </div>
            <Button
              onClick={handleSaveConfiguration}
              disabled={isConfiguring}
            >
              {isConfiguring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backend Health Status */}
      {project.uses_custom_backend && backendHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Backend Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-900">
                  {backendHealth.connection_status}
                </div>
                <div className="text-xs text-blue-700">Status</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-900">
                  {backendHealth.response_time_ms || 0}ms
                </div>
                <div className="text-xs text-green-700">Response Time</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-900">
                  {new Date(backendHealth.last_check).toLocaleDateString()}
                </div>
                <div className="text-xs text-purple-700">Last Check</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-900">
                  {backendHealth.error_message ? 'Error' : 'OK'}
                </div>
                <div className="text-xs text-orange-700">Health</div>
              </div>
            </div>
            
            {backendHealth.error_message && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {backendHealth.error_message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration History */}
      {migrations && migrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration History</CardTitle>
            <CardDescription>
              Track backend configuration changes and migrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {migrations.map((migration) => (
                <div key={migration.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">
                      {migration.migration_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(migration.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={migration.status === 'completed' ? 'default' : 
                               migration.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {migration.status}
                    </Badge>
                    {migration.progress_percentage && (
                      <span className="text-sm text-gray-500">
                        {migration.progress_percentage}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectBackendConfig;
