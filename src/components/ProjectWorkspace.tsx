import { useState } from 'react';
import { FileText, Bot, Rocket, Settings, Monitor, Play, ArrowLeft, Database as DatabaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import UnifiedAIAssistant from './UnifiedAIAssistant';
import EnhancedFileExplorer from './EnhancedFileExplorer';
import BuildStatus from './BuildStatus';
import DeploymentManager from './DeploymentManager';
import EnvironmentVariables from './EnvironmentVariables';
import CodeEditor from './CodeEditor';
import ErrorDisplay from './ErrorDisplay';
import LivePreview from './LivePreview';
import SupabaseIntegrationPanel from './SupabaseIntegrationPanel';
import { useConversations } from '@/hooks/useConversations';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useBuildSystem } from '@/hooks/useBuildSystem';
import { useProjectIntegrations } from '@/hooks/useProjectIntegrations';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

const ProjectWorkspace = ({ project, onBack }: ProjectWorkspaceProps) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);

  const { conversations, createConversation } = useConversations(project.id);
  const { updateCodeFile } = useCodeFiles(project.id);
  const { triggerBuild } = useBuildSystem(project.id);
  const { integrations } = useProjectIntegrations(project.id);

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
  };

  const handleFileContentChange = (content: string) => {
    if (selectedFile) {
      updateCodeFile.mutate({
        id: selectedFile.id,
        content,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleStartChat = async () => {
    await createConversation.mutateAsync({
      project_id: project.id,
      title: `AI Assistant for ${project.name}`,
    });
  };

  const handleTriggerBuild = async () => {
    await triggerBuild.mutateAsync({
      project_id: project.id,
      build_command: 'npm run build',
      status: 'queued',
    });
  };

  const handleTryFix = () => {
    console.log('Attempting to fix error with AI Assistant...');
    setCurrentError(null);
  };

  const handleRun = () => {
    console.log('Running project...');
  };

  const activeConversation = conversations?.[0];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleRun}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button onClick={handleTriggerBuild} className="bg-gray-900 hover:bg-gray-800">
              <Rocket className="h-4 w-4 mr-2" />
              Build & Deploy
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {currentError && (
        <ErrorDisplay 
          error={currentError} 
          onTryFix={handleTryFix} 
        />
      )}

      {/* Main Workspace with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - AI Assistant & Tools */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full bg-white border-r border-gray-200 flex flex-col">
              <Tabs defaultValue="assistant" className="flex-1 flex flex-col h-full">
                <div className="border-b border-gray-200 px-4 py-2 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assistant" className="flex items-center gap-1">
                      <Bot className="h-4 w-4" />
                      <span className="hidden sm:inline">AI Assistant</span>
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Files</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="assistant" className="flex-1 m-0 overflow-hidden">
                  {activeConversation ? (
                    <UnifiedAIAssistant 
                      conversationId={activeConversation.id}
                      projectId={project.id}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                          Start with AI Assistant
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Get help with coding or execute commands directly.
                        </p>
                        <Button onClick={handleStartChat} className="bg-gray-900 hover:bg-gray-800">
                          <Bot className="h-4 w-4 mr-2" />
                          Start AI Assistant
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
                  <EnhancedFileExplorer
                    projectId={project.id}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Code Editor & Preview */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="h-full flex flex-col">
              <Tabs defaultValue="editor" className="flex-1 flex flex-col h-full">
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
                  <TabsList className="grid w-fit grid-cols-4">
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Code Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Live Preview
                    </TabsTrigger>
                    <TabsTrigger value="deploy" className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Deploy
                    </TabsTrigger>
                    <TabsTrigger value="supabase" className="flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4" />
                      Supabase
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
                  {selectedFile ? (
                    <CodeEditor 
                      file={selectedFile}
                      onContentChange={handleFileContentChange}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Select a file to edit
                        </h3>
                        <p className="text-gray-500">
                          Choose a file from the explorer or create a new one to start coding.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                  <LivePreview projectId={project.id} />
                </TabsContent>

                <TabsContent value="deploy" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <BuildStatus 
                          projectId={project.id}
                          onTriggerBuild={handleTriggerBuild}
                        />
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Monitor className="h-5 w-5" />
                              Live Preview
                            </CardTitle>
                            <CardDescription>
                              Preview your deployed application
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                              <p className="text-gray-500">Preview will appear here after deployment</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <DeploymentManager projectId={project.id} />
                      <EnvironmentVariables projectId={project.id} />
                      
                      {/* Project Integrations Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Project Integrations
                          </CardTitle>
                          <CardDescription>
                            Configure external services and APIs for this project
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {integrations && integrations.length > 0 ? (
                              <div className="space-y-3">
                                {integrations.map((integration) => (
                                  <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium capitalize">{integration.integration_type}</p>
                                      <p className="text-sm text-gray-500">
                                        {integration.is_active ? 'Active' : 'Inactive'}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className={`h-2 w-2 rounded-full ${integration.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>No integrations configured yet</p>
                                <p className="text-sm">Add external services to enhance your project</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="supabase" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <SupabaseIntegrationPanel projectId={project.id} />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
