
import { useState, useEffect } from 'react';
import { Monitor, RefreshCw, ExternalLink, AlertTriangle, Play, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePreviewSystem } from '@/hooks/usePreviewSystem';
import { useBuildSystem } from '@/hooks/useBuildSystem';

interface EnhancedLivePreviewProps {
  projectId: string;
}

const EnhancedLivePreview = ({ projectId }: EnhancedLivePreviewProps) => {
  const { isReady, previewUrl, status, error, refreshPreview } = usePreviewSystem(projectId);
  const { triggerBuild } = useBuildSystem(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshPreview();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBuildAndPreview = async () => {
    try {
      await triggerBuild.mutateAsync({
        project_id: projectId,
        build_command: 'npm run build',
        status: 'queued',
      });
    } catch (error) {
      console.error('Failed to trigger build:', error);
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const PreviewFrame = () => {
    if (status === 'error') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={handleBuildAndPreview}>
              <Play className="h-4 w-4 mr-2" />
              Build & Preview
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'building') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Building Project</h3>
            <p className="text-gray-500">Please wait while we prepare your preview...</p>
          </div>
        </div>
      );
    }

    if (!isReady || !previewUrl) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center p-6">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing Preview</h3>
            <p className="text-gray-500">Setting up live preview environment...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 relative">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0 rounded-lg bg-white"
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <span className="font-medium">Live Preview</span>
              {previewUrl && (
                <span className="text-sm text-gray-500 font-mono">{previewUrl}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={openInNewTab} disabled={!previewUrl}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Tab
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <PreviewFrame />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Live Preview
          </h3>
          <p className="text-sm text-gray-500">
            {isReady ? 'Real-time preview of your application' : 'Preview will appear here after build'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || !isReady}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={openInNewTab} disabled={!previewUrl}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen} disabled={!isReady}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <PreviewFrame />
    </div>
  );
};

export default EnhancedLivePreview;
