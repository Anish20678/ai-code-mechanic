
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Rocket, Settings } from 'lucide-react';
import BuildStatus from './BuildStatus';
import DeploymentManager from './DeploymentManager';
import EnvironmentVariables from './EnvironmentVariables';

interface DevOpsDashboardProps {
  projectId: string;
}

const DevOpsDashboard = ({ projectId }: DevOpsDashboardProps) => {
  const [activeTab, setActiveTab] = useState('build');

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">DevOps Dashboard</h1>
        <p className="text-gray-600">Manage builds, deployments, and environment configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="build" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Build & CI
          </TabsTrigger>
          <TabsTrigger value="deploy" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Deployment
          </TabsTrigger>
          <TabsTrigger value="env" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Environment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="mt-6">
          <div className="space-y-6">
            <BuildStatus
              projectId={projectId}
              onTriggerBuild={() => {
                // This will be handled by the BuildStatus component
              }}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Build Configuration</CardTitle>
                <CardDescription>
                  Configure how your project gets built
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Build Command</label>
                      <p className="text-sm text-gray-600">npm run build</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Node Version</label>
                      <p className="text-sm text-gray-600">18.x</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          <DeploymentManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="env" className="mt-6">
          <EnvironmentVariables projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevOpsDashboard;
