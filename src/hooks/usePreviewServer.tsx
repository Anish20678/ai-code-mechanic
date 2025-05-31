
import { useState, useEffect } from 'react';
import { useCodeFiles } from './useCodeFiles';
import { useBuildSystem } from './useBuildSystem';
import { useToast } from '@/components/ui/use-toast';

interface PreviewServerState {
  status: 'starting' | 'ready' | 'error' | 'building';
  url: string | null;
  port: number | null;
  error: string | null;
  buildRequired: boolean;
}

export const usePreviewServer = (projectId: string) => {
  const [state, setState] = useState<PreviewServerState>({
    status: 'starting',
    url: null,
    port: null,
    error: null,
    buildRequired: false,
  });

  const { codeFiles } = useCodeFiles(projectId);
  const { latestBuild, triggerBuild, isBuilding } = useBuildSystem(projectId);
  const { toast } = useToast();

  useEffect(() => {
    const initializePreviewServer = async () => {
      try {
        setState(prev => ({ ...prev, status: 'starting', error: null }));

        // Check if we have code files
        if (!codeFiles || codeFiles.length === 0) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'No code files found. Create some files to start the preview server.',
          }));
          return;
        }

        // Check if we need a build
        if (!latestBuild || latestBuild.status !== 'success') {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'No successful build found. Please build the project first.',
            buildRequired: true,
          }));
          return;
        }

        // If currently building, show building status
        if (isBuilding) {
          setState(prev => ({ ...prev, status: 'building' }));
          return;
        }

        // Simulate starting preview server
        await new Promise(resolve => setTimeout(resolve, 1500));

        const port = 5173; // Standard Vite dev server port
        const previewUrl = `http://localhost:${port}`;

        setState({
          status: 'ready',
          url: previewUrl,
          port,
          error: null,
          buildRequired: false,
        });

        console.log('Preview server ready:', { projectId, url: previewUrl, port });
      } catch (error) {
        console.error('Preview server initialization failed:', error);
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Failed to start preview server',
          buildRequired: false,
        }));
      }
    };

    initializePreviewServer();
  }, [projectId, codeFiles, latestBuild, isBuilding]);

  const restart = async () => {
    setState(prev => ({ ...prev, status: 'starting' }));
    // Trigger a rebuild if needed
    if (!latestBuild || latestBuild.status !== 'success') {
      await triggerBuild.mutateAsync({
        project_id: projectId,
        build_command: 'npm run build',
        status: 'queued',
      });
    }
  };

  const handleBuildAndStart = async () => {
    try {
      setState(prev => ({ ...prev, status: 'building' }));
      await triggerBuild.mutateAsync({
        project_id: projectId,
        build_command: 'npm run build',
        status: 'queued',
      });
      toast({
        title: "Build started",
        description: "Building project and starting preview server...",
      });
    } catch (error) {
      toast({
        title: "Build failed",
        description: "Failed to start build process",
        variant: "destructive",
      });
    }
  };

  return {
    ...state,
    restart,
    handleBuildAndStart,
  };
};
