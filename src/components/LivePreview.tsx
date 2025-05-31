
import { useState, useEffect } from 'react';
import { Monitor, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeployment } from '@/hooks/useDeployment';
import { usePreviewSystem } from '@/hooks/usePreviewSystem';
import PreviewServer from './PreviewServer';

interface LivePreviewProps {
  projectId: string;
}

const LivePreview = ({ projectId }: LivePreviewProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { liveUrl, isDeploying } = useDeployment(projectId);
  const { isReady, previewUrl, status, error, refreshPreview } = usePreviewSystem(projectId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshPreview();
      
      // Also refresh iframe if it exists
      const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
      if (iframe && previewUrl) {
        iframe.src = previewUrl + (previewUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      }
    } catch (err) {
      console.error('Error refreshing preview:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleOpenInNewTab = () => {
    if (liveUrl) {
      // Open deployed version if available
      window.open(liveUrl, '_blank');
    } else if (previewUrl && !previewUrl.startsWith('data:')) {
      // Open preview URL if it's a real URL
      window.open(previewUrl, '_blank');
    } else {
      // Fallback to development server
      window.open('http://localhost:5173', '_blank');
    }
  };

  const getDisplayUrl = () => {
    if (liveUrl) return liveUrl;
    if (previewUrl && !previewUrl.startsWith('data:')) return previewUrl;
    return 'Internal Preview';
  };

  const getPreviewStatus = () => {
    if (isDeploying) return { text: 'Deploying...', variant: 'secondary', className: 'bg-blue-100 text-blue-700' };
    if (liveUrl) return { text: 'Live', variant: 'secondary', className: 'bg-green-100 text-green-700' };
    if (status === 'ready') return { text: 'Preview Ready', variant: 'secondary', className: 'bg-green-100 text-green-700' };
    if (status === 'building') return { text: 'Building...', variant: 'secondary', className: 'bg-yellow-100 text-yellow-700' };
    if (status === 'error') return { text: 'Error', variant: 'destructive', className: '' };
    return { text: 'Initializing...', variant: 'secondary', className: 'bg-gray-100 text-gray-700' };
  };

  const statusInfo = getPreviewStatus();

  if (error && !liveUrl && !previewUrl) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <PreviewServer projectId={projectId} />
        
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Preview Not Available
              </CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                To see a live preview, you need to:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
                <li>Create some code files in your project</li>
                <li>Build and deploy your project for full functionality</li>
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-gray-600" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Preview</span>
            <Badge variant={statusInfo.variant as any} className={statusInfo.className}>
              {statusInfo.text}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            disabled={!previewUrl && !liveUrl}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Tab
          </Button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${liveUrl ? 'bg-green-500' : isReady ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
          <span className="text-gray-600 font-mono truncate">{getDisplayUrl()}</span>
          {!liveUrl && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">DEV</span>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {liveUrl ? (
          // Show deployed version
          <iframe
            id="preview-frame"
            src={liveUrl}
            className="w-full h-full border-0"
            title="Live Preview - Deployed"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onError={() => console.error('Failed to load deployed preview')}
            onLoad={() => console.log('Deployed preview loaded successfully')}
          />
        ) : previewUrl ? (
          // Show development preview
          <iframe
            id="preview-frame"
            src={previewUrl}
            className="w-full h-full border-0"
            title="Live Preview - Development"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onError={() => console.error('Failed to load development preview')}
            onLoad={() => console.log('Development preview loaded successfully')}
          />
        ) : (
          // Loading state
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preparing Preview
              </h3>
              <p className="text-gray-500">
                {status === 'building' ? 'Building your application...' : 'Your preview will appear here once ready.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
