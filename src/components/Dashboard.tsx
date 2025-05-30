
import { useState } from 'react';
import { Plus, Code, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectCard from './ProjectCard';
import CodeEditor from './CodeEditor';
import ErrorDisplay from './ErrorDisplay';

interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  status: 'active' | 'error' | 'deploying';
}

const Dashboard = () => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Mock projects data
  const projects: Project[] = [
    {
      id: '1',
      name: 'E-commerce Platform',
      description: 'React-based online store with payment integration',
      lastModified: '2 hours ago',
      status: 'active'
    },
    {
      id: '2',
      name: 'Task Management App',
      description: 'Collaborative project management tool',
      lastModified: '1 day ago',
      status: 'error'
    },
    {
      id: '3',
      name: 'Weather Dashboard',
      description: 'Real-time weather data visualization',
      lastModified: '3 days ago',
      status: 'deploying'
    }
  ];

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    setShowEditor(true);
    // Simulate error for demo
    if (project.status === 'error') {
      setCurrentError('TypeError: Cannot read property \'map\' of undefined at line 42 in components/TaskList.tsx');
    } else {
      setCurrentError(null);
    }
  };

  const handleCreateProject = () => {
    console.log('Creating new project...');
  };

  const handleTryFix = () => {
    console.log('Attempting to fix error with AI Agent...');
    setCurrentError(null);
  };

  const handleDeploy = () => {
    console.log('Deploying project...');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">AI Coding Agent</h1>
          </div>
          <Button onClick={handleCreateProject} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Project List */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projects</h2>
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
                    <Button variant="outline">
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

              {/* Code Editor */}
              <div className="flex-1">
                <CodeEditor />
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
                <Button onClick={handleCreateProject} className="bg-gray-900 hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
