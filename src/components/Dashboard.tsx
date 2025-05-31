
import { useState } from 'react';
import { Plus, Code, LogOut, User, Settings, Zap, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectCard from './ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';
import HeroSection from './HeroSection';
import ProjectWorkspace from './ProjectWorkspace';
import EnhancedAIChat from './EnhancedAIChat';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useAutonomousAgent } from '@/hooks/useAutonomousAgent';
import { useAIGenerations } from '@/hooks/useAIGenerations';
import { useUserBilling } from '@/hooks/useUserBilling';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { projects, isLoading, createProject } = useProjects();
  const { executeAutonomousTask, addTask } = useAutonomousAgent();
  const { getTotalCost, getTotalTokens } = useAIGenerations();
  const { billing } = useUserBilling();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
  };

  const handleBackToDashboard = () => {
    setActiveProject(null);
  };

  const handleIdeaSubmit = async (idea: string) => {
    try {
      // Create a new project based on the idea
      const projectName = idea.split(' ').slice(0, 4).join(' ');
      const project = await createProject.mutateAsync({
        name: projectName,
        description: idea,
        status: 'active',
      });

      // Add autonomous task to build the project
      const task = addTask({
        type: 'setup_project',
        description: `Build a web application: ${idea}`,
      });

      // Execute the task
      await executeAutonomousTask(project.id, task);

      // Switch to the project workspace
      setActiveProject(project);
    } catch (error) {
      console.error('Failed to create project from idea:', error);
      throw error;
    }
  };

  const navigateToAdmin = () => {
    window.location.href = '/admin';
  };

  if (activeProject) {
    return (
      <ProjectWorkspace 
        project={activeProject} 
        onBack={handleBackToDashboard}
      />
    );
  }

  // Show hero section if no projects exist
  if (!isLoading && (!projects || projects.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple header for hero section */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-gray-900" />
              <h1 className="text-2xl font-semibold text-gray-900">Superhuman AI Developer</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAIChat(!showAIChat)}
                className="bg-blue-50 hover:bg-blue-100"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={navigateToAdmin}>
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        <div className="flex">
          <div className="flex-1">
            <HeroSection onIdeaSubmit={handleIdeaSubmit} />
          </div>
          {showAIChat && (
            <div className="w-96 h-screen bg-white border-l border-gray-200 p-4 fixed right-0 top-0 z-20">
              <div className="h-full">
                <EnhancedAIChat 
                  category="coding"
                  initialPrompt="Help me build an amazing web application"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show project dashboard if projects exist
  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">Superhuman AI Developer</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAIChat(!showAIChat)}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
            <CreateProjectDialog />
            <Button 
              onClick={() => handleIdeaSubmit("Build a new web application")}
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New from Idea
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={navigateToAdmin}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Project List */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Projects</h2>
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
                    isActive={false}
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
          
          {/* AI Usage Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                AI Usage This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Cost:</span>
                <span className="font-mono">${getTotalCost().toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tokens Used:</span>
                <span className="font-mono">{getTotalTokens().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Limit:</span>
                <span className="font-mono">${billing?.monthly_limit || 10}</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Select a project to continue
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a project from the sidebar to start coding, or create a new one.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => handleIdeaSubmit("Build a new innovative web application")}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create from Idea
                </Button>
                <CreateProjectDialog>
                  <Button variant="outline" className="w-full">
                    Create Manually
                  </Button>
                </CreateProjectDialog>
              </div>
            </div>
          </div>
          
          {/* AI Chat Sidebar */}
          {showAIChat && (
            <div className="w-96 bg-white border-l border-gray-200 p-4">
              <EnhancedAIChat 
                category="coding"
                initialPrompt="Help me build an amazing web application"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
