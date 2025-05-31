
import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: string | Error, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error('Error occurred:', {
      message: errorMessage,
      context,
      timestamp: new Date().toISOString()
    });

    toast({
      title: "Error",
      description: fullMessage,
      variant: "destructive",
    });
  }, [toast]);

  const handleAsyncOperation = useCallback(async (
    operation: () => Promise<void>,
    errorMessage: string,
    context?: string
  ) => {
    try {
      await operation();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context || errorMessage);
      throw error;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncOperation,
  };
};
