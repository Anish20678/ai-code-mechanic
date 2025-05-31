import { useState } from 'react';
import { Plus, Code, LogOut, User, Trash2, Grid3X3, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectDeletion } from '@/hooks/useProjectDeletion';
import { useAutonomousAgent } from '@/hooks/useAutonomousAgent';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface GridDashboardProps {
  viewMode: 'grid' | 'list';
  onToggleView: () => void;
}

const GridDashboard = ({ viewMode, onToggleView }: GridDashboardProps) => {
  const { user, signOut } = useAuth();
  const { projects, isLoading, createProject } = useProjects();
  const { deleteProject } = useProjectDeletion();
  const { executeAutonomousTask, addTask } = useAutonomousAgent();

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject.mutateAsync(projectId);
  };

  const handleProjectOpen = (project: Project) => {
    window.location.href = `/projects/${project.id}`;
  };

  const handleIdeaSubmit = async (idea: string) => {
    try {
      const projectName = idea.split(' ').slice(0, 4).join(' ');
      const project = await createProject.mutateAsync({
        name: projectName,
        description: idea,
        status: 'active',
      });

      const task = addTask({
        type: 'setup_project',
        description: `Build a web application: ${idea}`,
      });

      await executeAutonomousTask(project.id, task);
    } catch (error) {
      console.error('Failed to create project from idea:', error);
      throw error;
    }
  };

  // Show hero section if no projects exist
  if (!isLoading && (!projects || projects.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">AI Coding Agent</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleView}
              className="hidden sm:flex"
            >
              {viewMode === 'grid' ? 
                <LayoutDashboard className="h-4 w-4" /> : 
                <Grid3X3 className="h-4 w-4" />
              }
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
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">
            {projects?.length === 1 ? '1 project' : `${projects?.length || 0} projects`}
          </p>
        </div>

        {isLoading ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <Link to={`/projects/${project.id}`}>
                  <ProjectCard
                    project={project}
                    onOpen={handleProjectOpen}
                  />
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={(e) => e.preventDefault()} // Prevent Link navigation
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
          <div className="text-center py-16">
            <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            <div className="space-y-3 max-w-sm mx-auto">
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
        )}
      </main>
    </div>
  );
};

export default GridDashboard;
