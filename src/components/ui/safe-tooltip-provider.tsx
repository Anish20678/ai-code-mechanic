
import React, { useState, useEffect } from 'react';
import { TooltipProvider } from './tooltip';

interface SafeTooltipProviderProps {
  children: React.ReactNode;
}

const SafeTooltipProvider = ({ children }: SafeTooltipProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized before rendering TooltipProvider
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
};

export default SafeTooltipProvider;
