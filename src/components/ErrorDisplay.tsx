
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string;
  onTryFix: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay = ({ error, onTryFix, onDismiss }: ErrorDisplayProps) => {
  return (
    <Card className="mx-6 my-4 border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 mb-1">
              Deployment Error
            </h4>
            <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded border">
              {error}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              onClick={onTryFix}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try to Fix
            </Button>
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
