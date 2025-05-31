
import { useState, useEffect } from 'react';
import { Monitor, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeployment } from '@/hooks/useDeployment';
import { useBuildSystem } from '@/hooks/useBuildSystem';

interface LivePreviewProps {
  projectId: string;
}

const LivePreview = ({ projectId }: LivePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { liveUrl, isDeploying } = useDeployment(projectId);
  const { buildJobs } = useBuildSystem(projectId);

  const latestBuild = buildJobs?.[0];
  const hasSuccessfulBuild = latestBuild?.status === 'success';

  useEffect(() => {
    if (liveUrl) {
      setPreviewUrl(liveUrl);
      setError(null);
    } else if (hasSuccessfulBuild && latestBuild?.artifact_url) {
      // Generate a preview URL based on the artifact
      const previewBaseUrl = `https://preview-${projectId.slice(0, 8)}.lovable.app`;
      setPreviewUrl(previewBaseUrl);
      setError(null);
    } else {
      // For development, show local preview if no deployment exists
      const devPreviewUrl = `http://localhost:5173`;
      setPreviewUrl(devPreviewUrl);
      setError(null);
    }
  }, [liveUrl, hasSuccessfulBuild, latestBuild, projectId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh iframe content
      const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
      if (iframe && previewUrl) {
        iframe.src = previewUrl + '?t=' + Date.now();
      }
    } catch (err) {
      console.error('Error refreshing preview:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              No Preview Available
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              To see a live preview, you need to either:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
              <li>Build and deploy your project</li>
              <li>Have a successful build artifact</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Monitor className="h-4 w-4 mr-2" />
                Preview Unavailable
              </Button>
            </div>
          </CardContent>
        </Card>
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
            {isDeploying && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Deploying...
              </Badge>
            )}
            {hasSuccessfulBuild && !isDeploying && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Ready
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !previewUrl}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            disabled={!previewUrl}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Tab
          </Button>
        </div>
      </div>

      {/* URL Bar */}
      {previewUrl && (
        <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 font-mono truncate">{previewUrl}</span>
          </div>
        </div>
      )}

      {/* Preview Frame */}
      <div className="flex-1 relative overflow-hidden">
        {previewUrl ? (
          <iframe
            id="preview-frame"
            src={previewUrl}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onError={() => setError('Failed to load preview')}
            onLoad={() => {
              console.log('Preview loaded successfully');
              setError(null);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preparing Preview
              </h3>
              <p className="text-gray-500">
                Your preview will appear here once ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
