
import { useState } from 'react';
import { Plus, Code, LogOut, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProjectCard from './ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';
import HeroSection from './HeroSection';
import ProjectWorkspace from './ProjectWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectDeletion } from '@/hooks/useProjectDeletion';
import { useAutonomousAgent } from '@/hooks/useAutonomousAgent';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { projects, isLoading, createProject } = useProjects();
  const { deleteProject } = useProjectDeletion();
  const { executeAutonomousTask, addTask } = useAutonomousAgent();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
  };

  const handleBackToDashboard = () => {
    setActiveProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject.mutateAsync(projectId);
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
          <div className="flex items-center justify-end">
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
            </DropdownMenu>
          </div>
        </header>
        
        <HeroSection onIdeaSubmit={handleIdeaSubmit} />
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
            <h1 className="text-2xl font-semibold text-gray-900">AI Coding Agent</h1>
          </div>
          <div className="flex items-center space-x-3">
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
                  <div key={project.id} className="relative group">
                    <ProjectCard
                      project={project}
                      isActive={false}
                      onClick={() => handleProjectSelect(project)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action will move the project to trash and it can be restored later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
        <main className="flex-1 flex items-center justify-center">
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
