
import { useState, useEffect } from 'react';
import { Monitor, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useBuildSystem } from '@/hooks/useBuildSystem';

interface PreviewServerProps {
  projectId: string;
}

const PreviewServer = ({ projectId }: PreviewServerProps) => {
  const [previewStatus, setPreviewStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { codeFiles } = useCodeFiles(projectId);
  const { latestBuild } = useBuildSystem(projectId);

  useEffect(() => {
    // Simulate preview server startup
    const startPreviewServer = async () => {
      try {
        setPreviewStatus('starting');
        
        // Simulate server startup time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate internal preview URL
        const internalPreviewUrl = `http://localhost:5173/preview/${projectId}`;
        setPreviewUrl(internalPreviewUrl);
        setPreviewStatus('ready');
        
        console.log('Preview server started for project:', projectId);
      } catch (error) {
        console.error('Failed to start preview server:', error);
        setPreviewStatus('error');
      }
    };

    if (codeFiles && codeFiles.length > 0) {
      startPreviewServer();
    }
  }, [projectId, codeFiles]);

  const getStatusIcon = () => {
    switch (previewStatus) {
      case 'starting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (previewStatus) {
      case 'starting':
        return 'Starting preview server...';
      case 'ready':
        return 'Preview server ready';
      case 'error':
        return 'Preview server error';
    }
  };

  const getStatusBadge = () => {
    switch (previewStatus) {
      case 'starting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Starting</Badge>;
      case 'ready':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Live</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Monitor className="h-4 w-4" />
          Preview Server
        </CardTitle>
        <CardDescription className="text-xs">
          Internal development server for real-time preview
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {getStatusBadge()}
        </div>
        
        {previewUrl && previewStatus === 'ready' && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
            {previewUrl}
          </div>
        )}

        {latestBuild && (
          <div className="mt-3 text-xs text-gray-500">
            Last build: {latestBuild.status === 'success' ? 'Successful' : 'Failed'} 
            {latestBuild.completed_at && ` at ${new Date(latestBuild.completed_at).toLocaleTimeString()}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviewServer;
