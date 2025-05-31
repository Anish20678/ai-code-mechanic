
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Code, FileText, Database, Zap } from 'lucide-react';

interface ExecutionStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  description?: string;
  icon?: React.ReactNode;
}

interface ExecutionStatusCardProps {
  sessionId?: string;
  isExecuting: boolean;
  mode: 'chat' | 'execute' | 'analyze';
  onComplete?: () => void;
}

const ExecutionStatusCard = ({ sessionId, isExecuting, mode, onComplete }: ExecutionStatusCardProps) => {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isExecuting) {
      // Initialize steps based on mode
      const initialSteps: ExecutionStep[] = [];
      
      if (mode === 'execute') {
        initialSteps.push(
          { id: '1', title: 'Analyzing request', status: 'running', icon: <Code className="h-4 w-4" /> },
          { id: '2', title: 'Planning changes', status: 'pending', icon: <FileText className="h-4 w-4" /> },
          { id: '3', title: 'Executing operations', status: 'pending', icon: <Zap className="h-4 w-4" /> },
          { id: '4', title: 'Validating changes', status: 'pending', icon: <CheckCircle className="h-4 w-4" /> }
        );
      } else if (mode === 'analyze') {
        initialSteps.push(
          { id: '1', title: 'Scanning code', status: 'running', icon: <Code className="h-4 w-4" /> },
          { id: '2', title: 'Analyzing patterns', status: 'pending', icon: <Database className="h-4 w-4" /> },
          { id: '3', title: 'Generating insights', status: 'pending', icon: <FileText className="h-4 w-4" /> }
        );
      } else {
        initialSteps.push(
          { id: '1', title: 'Processing request', status: 'running', icon: <Code className="h-4 w-4" /> },
          { id: '2', title: 'Generating response', status: 'pending', icon: <FileText className="h-4 w-4" /> }
        );
      }
      
      setSteps(initialSteps);
      setCurrentStep(0);

      // Simulate step progression
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = prev + 1;
          if (nextStep < initialSteps.length) {
            setSteps(currentSteps => 
              currentSteps.map((step, index) => ({
                ...step,
                status: index < nextStep ? 'completed' : index === nextStep ? 'running' : 'pending'
              }))
            );
            return nextStep;
          } else {
            setSteps(currentSteps => 
              currentSteps.map(step => ({ ...step, status: 'completed' }))
            );
            clearInterval(interval);
            setTimeout(() => {
              onComplete?.();
            }, 1000);
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isExecuting, mode, onComplete]);

  if (!isExecuting || steps.length === 0) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isCompleted = steps.every(step => step.status === 'completed');

  return (
    <Card className="w-full mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            {mode === 'execute' ? 'Executing Changes' : mode === 'analyze' ? 'Analyzing Code' : 'Processing'}
          </CardTitle>
          <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
            {isCompleted ? 'Completed' : 'In Progress'}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 text-sm">
              <div className={`flex-shrink-0 ${
                step.status === 'completed' ? 'text-green-500' :
                step.status === 'running' ? 'text-orange-500' :
                step.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : step.status === 'running' ? (
                  <Clock className="h-4 w-4 animate-pulse" />
                ) : (
                  step.icon || <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span className={`${
                step.status === 'completed' ? 'text-green-700' :
                step.status === 'running' ? 'text-orange-700' :
                step.status === 'error' ? 'text-red-700' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionStatusCard;
