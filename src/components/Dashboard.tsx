
import { useState } from 'react';
import { Plus, Code, Play, LogOut, User, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectCard from './ProjectCard';
import CodeEditor from './CodeEditor';
import ErrorDisplay from './ErrorDisplay';
import CreateProjectDialog from './CreateProjectDialog';
import EnhancedChatInterface from './EnhancedChatInterface';
import EnhancedFileExplorer from './EnhancedFileExplorer';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useConversations } from '@/hooks/useConversations';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type CodeFile = Database['public']['Tables']['code_files']['Row'];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { projects, isLoading } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  const { conversations, createConversation } = useConversations(activeProject?.id);
  const { updateCodeFile } = useCodeFiles(activeProject?.id);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    setShowEditor(true);
    setSelectedFile(null);
    // Simulate error for demo
    if (project.status === 'error') {
      setCurrentError('TypeError: Cannot read property \'map\' of undefined at line 42 in components/TaskList.tsx');
    } else {
      setCurrentError(null);
    }
  };

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
    if (!activeProject) return;
    
    await createConversation.mutateAsync({
      project_id: activeProject.id,
      title: `Chat about ${activeProject.name}`,
    });
  };

  const handleTryFix = () => {
    console.log('Attempting to fix error with AI Agent...');
    setCurrentError(null);
  };

  const handleDeploy = () => {
    console.log('Deploying project...');
  };

  const handleRun = () => {
    console.log('Running project...');
  };

  const activeConversation = conversations?.[0];

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">AI Coding Agent</h1>
          </div>
          <div className="flex items-center space-x-3">
            <CreateProjectDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Project List */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projects</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isActive={activeProject?.id === project.id}
                    onClick={() => handleProjectSelect(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No projects yet</p>
                <CreateProjectDialog>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first project
                  </Button>
                </CreateProjectDialog>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {showEditor && activeProject ? (
            <>
              {/* Project Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{activeProject.name}</h3>
                    <p className="text-sm text-gray-500">{activeProject.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleRun}>
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </Button>
                    <Button onClick={handleDeploy} className="bg-gray-900 hover:bg-gray-800">
                      Deploy
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
              <div className="flex-1 flex">
                {/* File Explorer */}
                <div className="w-64 bg-white border-r border-gray-200">
                  <EnhancedFileExplorer
                    projectId={activeProject.id}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                  />
                </div>

                {/* Editor and Chat Tabs */}
                <div className="flex-1 flex flex-col">
                  <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                    <div className="bg-white border-b border-gray-200 px-4">
                      <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="editor" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Editor
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          AI Assistant
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
                    
                    <TabsContent value="chat" className="flex-1 m-0">
                      {activeConversation ? (
                        <EnhancedChatInterface 
                          conversationId={activeConversation.id}
                          projectId={activeProject.id}
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Start a conversation
                            </h3>
                            <p className="text-gray-500 mb-6">
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
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            // Welcome Screen
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Welcome to AI Coding Agent
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Select a project from the sidebar to start coding, or create a new project to begin.
                </p>
                <CreateProjectDialog>
                  <Button className="bg-gray-900 hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </CreateProjectDialog>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
