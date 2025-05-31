
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorInfo {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  details?: string;
}

interface ErrorContextType {
  errors: ErrorInfo[];
  addError: (message: string, details?: string, type?: 'error' | 'warning' | 'info') => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider = ({ children }: ErrorProviderProps) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const { toast } = useToast();

  const addError = (message: string, details?: string, type: 'error' | 'warning' | 'info' = 'error') => {
    const newError: ErrorInfo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date(),
      details,
    };

    setErrors(prev => [...prev, newError]);

    // Show toast notification
    toast({
      title: type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });

    // Auto-remove after 5 seconds for non-error types
    if (type !== 'error') {
      setTimeout(() => {
        removeError(newError.id);
      }, 5000);
    }
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};
