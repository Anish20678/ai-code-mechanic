
import { useState, useEffect } from 'react';
import { useCodeFiles } from './useCodeFiles';
import { useBuildSystem } from './useBuildSystem';

interface PreviewSystemState {
  isReady: boolean;
  previewUrl: string | null;
  status: 'initializing' | 'building' | 'ready' | 'error';
  error: string | null;
}

export const usePreviewSystem = (projectId: string) => {
  const [state, setState] = useState<PreviewSystemState>({
    isReady: false,
    previewUrl: null,
    status: 'initializing',
    error: null,
  });

  const { codeFiles } = useCodeFiles(projectId);
  const { latestBuild, isBuilding } = useBuildSystem(projectId);

  useEffect(() => {
    const initializePreview = async () => {
      try {
        setState(prev => ({ ...prev, status: 'initializing', error: null }));

        // Check if we have code files
        if (!codeFiles || codeFiles.length === 0) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'No code files found. Create some files to see a preview.',
          }));
          return;
        }

        // If building, wait for it to complete
        if (isBuilding) {
          setState(prev => ({ ...prev, status: 'building' }));
          return;
        }

        // Generate preview based on available code
        const previewUrl = generatePreviewUrl(projectId, codeFiles);
        
        setState({
          isReady: true,
          previewUrl,
          status: 'ready',
          error: null,
        });

        console.log('Preview system initialized:', { projectId, previewUrl });
      } catch (error) {
        console.error('Preview system initialization failed:', error);
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Failed to initialize preview system',
        }));
      }
    };

    initializePreview();
  }, [projectId, codeFiles, isBuilding, latestBuild]);

  const refreshPreview = () => {
    setState(prev => ({ ...prev, status: 'initializing' }));
    // Trigger re-initialization
    setTimeout(() => {
      const previewUrl = generatePreviewUrl(projectId, codeFiles || []);
      setState(prev => ({
        ...prev,
        previewUrl: previewUrl + '?t=' + Date.now(),
        status: 'ready',
      }));
    }, 500);
  };

  return {
    ...state,
    refreshPreview,
  };
};

function generatePreviewUrl(projectId: string, codeFiles: any[]): string {
  // For development, create a virtual preview URL that represents the current state
  const hasReactFiles = codeFiles.some(file => 
    file.file_path.endsWith('.tsx') || file.file_path.endsWith('.jsx')
  );
  
  if (hasReactFiles) {
    // Generate a preview URL that represents the current project state
    return `data:text/html;charset=utf-8,${encodeURIComponent(generatePreviewHTML(projectId, codeFiles))}`;
  }
  
  // Fallback to development server
  return 'http://localhost:5173';
}

function generatePreviewHTML(projectId: string, codeFiles: any[]): string {
  const mainComponent = codeFiles.find(file => 
    file.file_path.includes('App.tsx') || file.file_path.includes('Index.tsx')
  );

  const hasComponents = codeFiles.filter(file => 
    file.file_path.endsWith('.tsx') || file.file_path.endsWith('.jsx')
  ).length;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview - ${projectId}</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
          .preview-container { max-width: 800px; margin: 0 auto; }
          .file-info { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
          .component-preview { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="preview-container">
            <div class="file-info">
                <h2 style="margin: 0 0 12px 0; color: #1f2937;">Project Preview</h2>
                <p style="margin: 0; color: #6b7280;">
                    Found ${hasComponents} React component(s) in your project.
                    ${mainComponent ? `Main component: ${mainComponent.file_path}` : 'No main component detected.'}
                </p>
            </div>
            
            <div class="component-preview">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 24px;">⚛️</span>
                    </div>
                    <h3 style="margin: 0 0 8px 0; color: #1f2937;">Live Preview</h3>
                    <p style="margin: 0; color: #6b7280;">
                        Your React application is being processed for preview.
                        Build and deploy to see the full application.
                    </p>
                    
                    <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                        <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                            💡 Tip: Use the "Build & Deploy" button to create a fully functional preview of your application.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}
