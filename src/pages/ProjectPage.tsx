
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import ProjectWorkspace from '@/components/ProjectWorkspace';
import { Loader2 } from 'lucide-react';

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();

  const project = projects?.find(p => p.id === projectId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!projectsLoading && projects && !project) {
      // Project not found or user doesn't have access
      navigate('/');
    }
  }, [project, projects, projectsLoading, navigate]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!project) {
    return null; // Will redirect via useEffect
  }

  return (
    <ProjectWorkspace 
      project={project} 
      onBack={handleBackToDashboard}
    />
  );
};

export default ProjectPage;
