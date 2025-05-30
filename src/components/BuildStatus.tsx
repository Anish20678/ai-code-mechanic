
import { Clock, CheckCircle, XCircle, Loader2, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useBuildSystem } from '@/hooks/useBuildSystem';
import { formatDistanceToNow } from 'date-fns';

interface BuildStatusProps {
  projectId: string;
  onTriggerBuild: () => void;
}

const BuildStatus = ({ projectId, onTriggerBuild }: BuildStatusProps) => {
  const { buildJobs, latestBuild, isBuilding, isLoading } = useBuildSystem(projectId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'building':
      case 'queued':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'building':
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Build Status</CardTitle>
          <CardDescription>
            {latestBuild ? `Last build ${formatDistanceToNow(new Date(latestBuild.created_at), { addSuffix: true })}` : 'No builds yet'}
          </CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={onTriggerBuild}
          disabled={isBuilding}
          className="h-8"
        >
          {isBuilding ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4 mr-2" />
          )}
          {isBuilding ? 'Building...' : 'Build'}
        </Button>
      </CardHeader>
      <CardContent>
        {latestBuild ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(latestBuild.status)}
                <Badge className={getStatusColor(latestBuild.status)}>
                  {latestBuild.status}
                </Badge>
              </div>
              {latestBuild.duration && (
                <span className="text-xs text-gray-500">
                  {latestBuild.duration}s
                </span>
              )}
            </div>
            
            {isBuilding && (
              <Progress value={65} className="h-2" />
            )}

            {latestBuild.build_log && (
              <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-20 overflow-y-auto">
                {latestBuild.build_log.split('\n').slice(-3).join('\n')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click "Build" to start your first build</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildStatus;
