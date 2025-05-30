
import { useState } from 'react';
import { Globe, ExternalLink, Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeployment } from '@/hooks/useDeployment';
import { useEnvironments } from '@/hooks/useEnvironments';
import { formatDistanceToNow } from 'date-fns';

interface DeploymentManagerProps {
  projectId: string;
}

const DeploymentManager = ({ projectId }: DeploymentManagerProps) => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');
  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  const { deployments, latestDeployment, isDeploying, liveUrl, deploy } = useDeployment(projectId);
  const { environments, createEnvironment } = useEnvironments(projectId);

  const handleDeploy = async () => {
    await deploy.mutateAsync({
      project_id: projectId,
      environment: selectedEnvironment,
      build_command: 'npm run build',
      status: 'queued',
    });
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvName.trim()) return;
    
    await createEnvironment.mutateAsync({
      project_id: projectId,
      name: newEnvName,
      variables: {},
    });
    
    setNewEnvName('');
    setIsCreateEnvOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'deploying':
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Deployment Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Deploy Project
          </CardTitle>
          <CardDescription>
            Deploy your project to different environments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="environment">Environment</Label>
              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  {environments?.map((env) => (
                    <SelectItem key={env.id} value={env.name}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateEnvOpen} onOpenChange={setIsCreateEnvOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Environment</DialogTitle>
                  <DialogDescription>
                    Add a new deployment environment for your project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="envName">Environment Name</Label>
                    <Input
                      id="envName"
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value)}
                      placeholder="e.g., staging, testing"
                    />
                  </div>
                  <Button onClick={handleCreateEnvironment} className="w-full">
                    Create Environment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button 
            onClick={handleDeploy} 
            disabled={isDeploying}
            className="w-full"
          >
            {isDeploying ? 'Deploying...' : `Deploy to ${selectedEnvironment}`}
          </Button>

          {liveUrl && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Live at:</span>
              <a 
                href={liveUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {liveUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>
            Recent deployments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deployments && deployments.length > 0 ? (
            <div className="space-y-3">
              {deployments.slice(0, 5).map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(deployment.status)}>
                      {deployment.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{deployment.environment}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(deployment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {deployment.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {deployment.duration && (
                      <span className="text-xs text-gray-500">
                        {deployment.duration}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No deployments yet. Deploy your project to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentManager;
