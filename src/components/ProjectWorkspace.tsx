
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import EnhancedFileExplorer from '@/components/EnhancedFileExplorer';
import CodeEditor from '@/components/CodeEditor';
import EnhancedLivePreview from '@/components/EnhancedLivePreview';
import UnifiedAIAssistant from '@/components/UnifiedAIAssistant';
import ExecutionTracker from '@/components/ExecutionTracker';
import AIFileExecutionTest from '@/components/AIFileExecutionTest';
import { useProjects } from '@/hooks/useProjects';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useConversations } from '@/hooks/useConversations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectWorkspaceProps {
  project?: Project;
  onBack?: () => void;
}

const ProjectWorkspace = ({ project: propProject, onBack }: ProjectWorkspaceProps = {}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');

  const { projects, isLoading: projectsLoading } = useProjects();
  const { codeFiles, isLoading: filesLoading, updateCodeFile } = useCodeFiles(projectId);
  const { conversations, createConversation } = useConversations(projectId);

  const currentProject = propProject || projects?.find(p => p.id === projectId);

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    } else if (projectId && !filesLoading) {
      // Create a new conversation if none exists
      createConversation.mutate({
        project_id: projectId,
        title: 'Main Conversation'
      }, {
        onSuccess: (newConversation) => {
          setCurrentConversationId(newConversation.id);
        }
      });
    }
  }, [conversations, projectId, filesLoading, createConversation]);

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
  };

  const handleContentChange = (content: string) => {
    if (selectedFile) {
      updateCodeFile.mutate({
        id: selectedFile.id,
        content
      });
    }
  };

  if (projectsLoading || filesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>The requested project could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">{currentProject.name}</h1>
        {currentProject.description && (
          <p className="text-gray-600 mt-1">{currentProject.description}</p>
        )}
      </div>

      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r">
              <EnhancedFileExplorer
                projectId={projectId!}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel - Code Editor and Preview */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full">
                  {selectedFile ? (
                    <CodeEditor
                      file={selectedFile}
                      onContentChange={handleContentChange}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Select a file to start editing
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full border-t">
                  <EnhancedLivePreview projectId={projectId!} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - AI Assistant and Tools */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full border-l">
              <Tabs defaultValue="assistant" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                  <TabsTrigger value="test">Test</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assistant" className="flex-1 overflow-hidden">
                  {currentConversationId && (
                    <UnifiedAIAssistant
                      conversationId={currentConversationId}
                      projectId={projectId!}
                    />
                  )}
                </TabsContent>

                <TabsContent value="execution" className="flex-1 overflow-hidden">
                  {currentConversationId && (
                    <ExecutionTracker
                      projectId={projectId!}
                      activeSessionId={currentConversationId}
                    />
                  )}
                </TabsContent>

                <TabsContent value="test" className="flex-1 overflow-auto p-4">
                  {currentConversationId && projectId && (
                    <AIFileExecutionTest
                      conversationId={currentConversationId}
                      projectId={projectId}
                    />
                  )}
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
