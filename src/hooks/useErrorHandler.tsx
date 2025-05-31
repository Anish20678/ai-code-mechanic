
import { useCallback } from 'react';
import { useError } from '@/contexts/ErrorContext';

export const useErrorHandler = () => {
  const { addError } = useError();

  const handleError = useCallback((error: Error | string, context?: string) => {
    const message = typeof error === 'string' ? error : error.message;
    const details = context ? `Context: ${context}` : undefined;
    
    console.error('Error handled:', { message, context, error });
    addError(message, details);
  }, [addError]);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage?: string,
    context?: string
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const message = errorMessage || (error instanceof Error ? error.message : 'An unexpected error occurred');
      handleError(message, context);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncOperation,
  };
};
