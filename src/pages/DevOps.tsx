
import { useParams } from 'react-router-dom';
import DevOpsDashboard from '@/components/DevOpsDashboard';

const DevOps = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Project ID is required</p>
      </div>
    );
  }

  return <DevOpsDashboard projectId={projectId} />;
};

export default DevOps;
