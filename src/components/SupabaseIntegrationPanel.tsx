
import { useState } from 'react';
import { Database, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';
import { useProjects } from '@/hooks/useProjects';
import SupabaseDatabaseSchema from './SupabaseDatabaseSchema';
import SupabaseEdgeFunctions from './SupabaseEdgeFunctions';
import SupabaseAuthStatus from './SupabaseAuthStatus';
import SupabaseStorageOverview from './SupabaseStorageOverview';
import ProjectBackendConfig from './ProjectBackendConfig';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Project = DatabaseType['public']['Tables']['projects']['Row'];

interface SupabaseIntegrationPanelProps {
  projectId: string;
}

const SupabaseIntegrationPanel = ({ projectId }: SupabaseIntegrationPanelProps) => {
  const { status, isLoading, refresh } = useSupabaseStatus();
  const { projects } = useProjects();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const project = projects?.find(p => p.id === projectId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getConnectionStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    
    if (project?.uses_custom_backend) {
      return <Badge className="bg-purple-100 text-purple-700">Custom Backend</Badge>;
    }
    
    switch (status.connectionHealth) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700">Connected</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-700">Degraded</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  if (!project) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Project not found. Please make sure you have access to this project.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!status.isConnected && !isLoading && !project.uses_custom_backend) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Database className="h-6 w-6" />
              Connect to Supabase
            </CardTitle>
            <CardDescription>
              Connect your project to Supabase to unlock powerful backend capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Database className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <div className="font-medium">Database</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Database className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <div className="font-medium">Auth</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Database className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <div className="font-medium">Storage</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Database className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                <div className="font-medium">Functions</div>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Supabase Project
            </Button>
            <p className="text-xs text-gray-600">
              Click the Supabase button in the top navigation to connect your project
            </p>
          </CardContent>
        </Card>
        
        {/* Always show backend config option */}
        <ProjectBackendConfig project={project} />
      </div>
    );
  }

  const currentStatus = project.uses_custom_backend 
    ? { 
        ...status, 
        projectId: project.supabase_project_url ? 
          project.supabase_project_url.split('//')[1]?.split('.')[0] : 'custom',
        connectionHealth: project.backend_status === 'connected' ? 'healthy' as const : 'disconnected' as const
      }
    : status;

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Integration
              </CardTitle>
              <CardDescription>
                {project.uses_custom_backend 
                  ? `Custom Backend: ${project.supabase_project_url || 'Not configured'}`
                  : `Platform Backend: ${currentStatus.projectId}`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getConnectionStatusBadge()}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <div className="text-lg font-bold text-blue-900">{currentStatus.metrics.totalTables}</div>
              <div className="text-xs text-blue-700">Tables</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <div className="text-lg font-bold text-green-900">{currentStatus.metrics.totalFunctions}</div>
              <div className="text-xs text-green-700">Functions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <div className="text-lg font-bold text-purple-900">{currentStatus.metrics.activeConnections}</div>
              <div className="text-xs text-purple-700">Connections</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Database className="h-6 w-6 mx-auto text-orange-600 mb-2" />
              <div className="text-lg font-bold text-orange-900">{currentStatus.metrics.storageUsed}</div>
              <div className="text-xs text-orange-700">Storage</div>
            </div>
          </div>
          
          {currentStatus.lastChecked && (
            <p className="text-xs text-gray-600 mt-4">
              Last updated: {currentStatus.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Supabase Services Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ProjectBackendConfig project={project} />
        </TabsContent>

        <TabsContent value="database">
          <SupabaseDatabaseSchema />
        </TabsContent>

        <TabsContent value="auth">
          <SupabaseAuthStatus />
        </TabsContent>

        <TabsContent value="storage">
          <SupabaseStorageOverview />
        </TabsContent>

        <TabsContent value="functions">
          <SupabaseEdgeFunctions />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common Supabase management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              SQL Editor
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Auth Users
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Storage Browser
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Function Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseIntegrationPanel;
