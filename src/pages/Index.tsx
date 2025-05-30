
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';
import Auth from '@/components/Auth';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

export default Index;
