
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUnifiedAIAssistant } from '@/hooks/useUnifiedAIAssistant';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AIFileExecutionTestProps {
  conversationId: string;
  projectId: string;
}

const AIFileExecutionTest = ({ conversationId, projectId }: AIFileExecutionTestProps) => {
  const { sendUnifiedMessage, isLoading } = useUnifiedAIAssistant();
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runFileExecutionTest = async () => {
    try {
      setTestStatus('running');
      setTestResult(null);
      
      const testMessage = "Create a simple test component called HelloWorld that displays 'Hello from AI File Executor!' in a div with blue text color.";
      const projectFiles = [{ project_id: projectId }];
      
      console.log('Starting AI file execution test...');
      const response = await sendUnifiedMessage(testMessage, conversationId, projectFiles, false);
      
      setTestResult(response);
      setTestStatus('success');
      
      toast({
        title: "Test Successful",
        description: "AI file execution is working correctly!",
      });
    } catch (error: any) {
      console.error('File execution test failed:', error);
      setTestResult(error.message || 'Unknown error occurred');
      setTestStatus('error');
      
      toast({
        title: "Test Failed",
        description: `File execution test failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI File Execution Test
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          Test the AI file executor to ensure it can create and modify files correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runFileExecutionTest} 
          disabled={isLoading || testStatus === 'running'}
          className="w-full"
        >
          {testStatus === 'running' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Test...
            </>
          ) : (
            'Run File Execution Test'
          )}
        </Button>

        {testResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Test Result:</h4>
            <div className={`text-sm ${testStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {testResult}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>What this test does:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Sends a request to create a simple React component</li>
            <li>Tests the AI file executor edge function</li>
            <li>Verifies that files can be created in the database</li>
            <li>Confirms the execution tracking system works</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFileExecutionTest;
