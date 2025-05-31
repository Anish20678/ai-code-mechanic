
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Code, FileText, Database, Zap, Loader2 } from 'lucide-react';

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
          { id: '1', title: 'Analyzing request', status: 'running', icon: <Code className="h-4 w-4" />, description: 'Understanding your requirements' },
          { id: '2', title: 'Planning changes', status: 'pending', icon: <FileText className="h-4 w-4" />, description: 'Determining what files to modify' },
          { id: '3', title: 'Executing operations', status: 'pending', icon: <Zap className="h-4 w-4" />, description: 'Making code changes' },
          { id: '4', title: 'Validating changes', status: 'pending', icon: <CheckCircle className="h-4 w-4" />, description: 'Ensuring everything works' }
        );
      } else if (mode === 'analyze') {
        initialSteps.push(
          { id: '1', title: 'Scanning code', status: 'running', icon: <Code className="h-4 w-4" />, description: 'Reading your code files' },
          { id: '2', title: 'Analyzing patterns', status: 'pending', icon: <Database className="h-4 w-4" />, description: 'Identifying issues and opportunities' },
          { id: '3', title: 'Generating insights', status: 'pending', icon: <FileText className="h-4 w-4" />, description: 'Creating recommendations' }
        );
      } else {
        initialSteps.push(
          { id: '1', title: 'Processing request', status: 'running', icon: <Code className="h-4 w-4" />, description: 'Understanding your question' },
          { id: '2', title: 'Generating response', status: 'pending', icon: <FileText className="h-4 w-4" />, description: 'Formulating helpful advice' }
        );
      }
      
      setSteps(initialSteps);
      setCurrentStep(0);

      // Simulate step progression with more realistic timing
      const stepDuration = mode === 'execute' ? 2000 : 1500;
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
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [isExecuting, mode, onComplete]);

  if (!isExecuting || steps.length === 0) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isCompleted = steps.every(step => step.status === 'completed');

  return (
    <Card className="w-full mb-4 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <Zap className="h-4 w-4 text-orange-500" />
              {!isCompleted && (
                <Loader2 className="h-3 w-3 text-orange-400 absolute -top-1 -right-1 animate-spin" />
              )}
            </div>
            {mode === 'execute' ? 'Executing Changes' : mode === 'analyze' ? 'Analyzing Code' : 'Processing'}
          </CardTitle>
          <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
            {isCompleted ? 'Completed' : 'In Progress'}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 bg-orange-100" />
        <div className="text-xs text-gray-600">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 text-sm">
              <div className={`flex-shrink-0 transition-colors duration-300 ${
                step.status === 'completed' ? 'text-green-500' :
                step.status === 'running' ? 'text-orange-500' :
                step.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : step.status === 'running' ? (
                  <div className="relative">
                    {step.icon}
                    <div className="absolute inset-0 animate-pulse bg-orange-200 rounded-full opacity-30"></div>
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <span className={`font-medium transition-colors duration-300 ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'running' ? 'text-orange-700' :
                  step.status === 'error' ? 'text-red-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionStatusCard;
