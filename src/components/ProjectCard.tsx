
import { Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
}

const ProjectCard = ({ project, isActive, onClick }: ProjectCardProps) => {
  const getStatusIcon = () => {
    switch (project.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'deploying':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'archived':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (project.status) {
      case 'active':
        return 'Active';
      case 'error':
        return 'Error';
      case 'deploying':
        return 'Deploying';
      case 'archived':
        return 'Archived';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'deploying':
        return 'text-blue-600';
      case 'archived':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border group",
        isActive 
          ? "border-gray-900 shadow-sm bg-gray-50" 
          : "border-gray-200 hover:border-gray-300"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2 text-lg group-hover:text-gray-700 transition-colors">
            {project.name}
          </h4>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {getStatusIcon()}
            <span className={cn("text-xs font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </div>
          
          {project.deployment_url && (
            <div className="text-xs text-green-600 font-medium">
              Deployed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
