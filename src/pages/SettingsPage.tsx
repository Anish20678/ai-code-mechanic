
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SystemPromptManager from '@/components/SystemPromptManager';

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Manage your AI assistant settings and system prompts</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-6">
        <SystemPromptManager />
      </div>
    </div>
  );
};

export default SettingsPage;
