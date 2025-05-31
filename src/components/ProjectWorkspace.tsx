
import { useState } from 'react';
import { FileText, MessageSquare, Bot, Rocket, Settings, Monitor, Play, ArrowLeft, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedChatInterface from './EnhancedChatInterface';
import EnhancedFileExplorer from './EnhancedFileExplorer';
import EnhancedAIChat from './EnhancedAIChat';
import AutonomousAgentPanel from './AutonomousAgentPanel';
import BuildStatus from './BuildStatus';
import DeploymentManager from './DeploymentManager';
import EnvironmentVariables from './EnvironmentVariables';
import CodeEditor from './CodeEditor';
import ErrorDisplay from './ErrorDisplay';
import { useConversations } from '@/hooks/useConversations';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useBuildSystem } from '@/hooks/useBuildSystem';
import { useAIGenerations } from '@/hooks/useAIGenerations';
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
  const { getTotalCost, getTotalTokens } = useAIGenerations(project.id);

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
      title: `Chat about ${project.name}`,
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
    console.log('Attempting to fix error with AI Agent...');
    setCurrentError(null);
  };

  const handleRun = () => {
    console.log('Running project...');
  };

  const activeConversation = conversations?.[0];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
            {/* AI Usage Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>${getTotalCost().toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>{getTotalTokens().toLocaleString()}</span>
              </div>
            </div>
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

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Assistant & Tools */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 px-4 py-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="agent" className="flex items-center gap-1">
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">Agent</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chat" className="flex-1 m-0">
              {activeConversation ? (
                <EnhancedChatInterface 
                  conversationId={activeConversation.id}
                  projectId={project.id}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Chat with your AI assistant about this project.
                    </p>
                    <Button onClick={handleStartChat} className="bg-gray-900 hover:bg-gray-800">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="flex-1 m-0 p-4">
              <div className="h-full">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Enhanced AI Assistant</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Multi-model AI with specialized prompts for coding tasks.
                  </p>
                </div>
                <div className="h-[calc(100%-80px)]">
                  <EnhancedAIChat 
                    projectId={project.id}
                    category="coding"
                    initialPrompt="Help me improve this project"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="flex-1 m-0">
              <AutonomousAgentPanel projectId={project.id} />
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0">
              <EnhancedFileExplorer
                projectId={project.id}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor & Preview */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <TabsList className="grid w-fit grid-cols-3">
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
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 m-0">
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
            
            <TabsContent value="preview" className="flex-1 m-0">
              <div className="flex-1 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Live Preview
                  </h3>
                  <p className="text-gray-500">
                    Your app preview will appear here once built.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deploy" className="flex-1 m-0 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
