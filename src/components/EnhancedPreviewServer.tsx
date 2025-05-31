
import { useState } from 'react';
import { Monitor, AlertTriangle, CheckCircle, Clock, Play, RotateCcw, ExternalLink, Hammer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePreviewServer } from '@/hooks/usePreviewServer';
import { useBuildSystem } from '@/hooks/useBuildSystem';

interface EnhancedPreviewServerProps {
  projectId: string;
}

const EnhancedPreviewServer = ({ projectId }: EnhancedPreviewServerProps) => {
  const { status, url, port, error, buildRequired, restart, handleBuildAndStart } = usePreviewServer(projectId);
  const { latestBuild } = useBuildSystem(projectId);
  const [isRestarting, setIsRestarting] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'starting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'building':
        return <Hammer className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'starting':
        return 'Starting preview server...';
      case 'building':
        return 'Building project...';
      case 'ready':
        return `Preview server running on port ${port}`;
      case 'error':
        return 'Preview server error';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'starting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Starting</Badge>;
      case 'building':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Building</Badge>;
      case 'ready':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Live</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    await restart();
    setTimeout(() => setIsRestarting(false), 2000);
  };

  const openPreview = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              Development Preview Server
            </CardTitle>
            <CardDescription className="text-xs">
              Live preview of your application with hot reload
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          <div className="flex items-center gap-2">
            {status === 'ready' && url && (
              <Button variant="outline" size="sm" onClick={openPreview}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            )}
            {(status === 'ready' || status === 'error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                disabled={isRestarting}
              >
                <RotateCcw className={`h-3 w-3 mr-1 ${isRestarting ? 'animate-spin' : ''}`} />
                Restart
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant={buildRequired ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
              {buildRequired && (
                <div className="mt-2">
                  <Button size="sm" onClick={handleBuildAndStart}>
                    <Play className="h-3 w-3 mr-1" />
                    Build & Start Server
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {url && status === 'ready' && (
          <div className="p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all border">
            <div className="flex items-center justify-between">
              <span>{url}</span>
              <Button variant="ghost" size="sm" onClick={openPreview}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {latestBuild && (
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="flex items-center justify-between">
              <span>
                Last build: {latestBuild.status === 'success' ? 'Successful' : 'Failed'}
                {latestBuild.completed_at && ` at ${new Date(latestBuild.completed_at).toLocaleTimeString()}`}
              </span>
              {latestBuild.duration && (
                <span className="text-gray-400">
                  {latestBuild.duration}s
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPreviewServer;
