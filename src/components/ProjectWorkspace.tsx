
import { useState } from 'react';
import { FileText, Bot, Rocket, Monitor, DatabaseIcon, FolderOpen, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SimplifiedAIAssistant from './SimplifiedAIAssistant';
import FileExplorer from './FileExplorer';
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
import { useNavigate } from 'react-router-dom';
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
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const navigate = useNavigate();

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

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  const activeConversation = conversations?.[0];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
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
          {/* Left Panel - AI Assistant with File Explorer Toggle */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <div className="h-full bg-white border-r border-gray-200 flex flex-col">
              {/* AI Assistant Panel Header */}
              <div className="border-b border-gray-200 p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleOpenSettings}>
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <Switch
                        checked={showFileExplorer}
                        onCheckedChange={setShowFileExplorer}
                        id="file-explorer-toggle"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {showFileExplorer ? (
                <FileExplorer
                  projectId={project.id}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                />
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {activeConversation ? (
                    <SimplifiedAIAssistant 
                      conversationId={activeConversation.id}
                      projectId={project.id}
                      onOpenSettings={handleOpenSettings}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                          Start with AI Assistant
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Get help with coding or execute commands directly.
                        </p>
                        <Button onClick={handleStartChat} className="bg-blue-600 hover:bg-blue-700">
                          <Bot className="h-4 w-4 mr-2" />
                          Start AI Assistant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Code Editor & Preview */}
          <ResizablePanel defaultSize={70} minSize={60}>
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
                        <p className="text-gray-500 mb-4">
                          Choose a file from the explorer or create a new one to start coding.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowFileExplorer(true)}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open File Explorer
                        </Button>
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
                            <SettingsIcon className="h-5 w-5" />
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
                                <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
