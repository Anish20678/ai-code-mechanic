
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUnifiedAIAssistant } from '@/hooks/useUnifiedAIAssistant';
import { useToast } from '@/components/ui/use-toast';

interface AITestButtonProps {
  conversationId: string;
  projectId: string;
}

const AITestButton = ({ conversationId, projectId }: AITestButtonProps) => {
  const { sendUnifiedMessage, isLoading } = useUnifiedAIAssistant();
  const { toast } = useToast();

  const handleTestExecution = async () => {
    try {
      const testMessage = "Create a simple Hello World component called TestComponent";
      const projectFiles = [{ project_id: projectId }];
      
      await sendUnifiedMessage(testMessage, conversationId, projectFiles, false);
      
      toast({
        title: "Test Executed",
        description: "AI file execution test completed successfully!",
      });
    } catch (error) {
      console.error('Test execution failed:', error);
      toast({
        title: "Test Failed",
        description: `Test execution failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleTestExecution} 
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700"
    >
      {isLoading ? "Testing..." : "Test AI File Execution"}
    </Button>
  );
};

export default AITestButton;
