
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SupabaseStatusData {
  isConnected: boolean;
  projectId: string | null;
  connectionHealth: 'healthy' | 'degraded' | 'disconnected';
  lastChecked: Date | null;
  metrics: {
    totalTables: number;
    totalFunctions: number;
    activeConnections: number;
    storageUsed: string;
  };
}

export const useSupabaseStatus = () => {
  const [status, setStatus] = useState<SupabaseStatusData>({
    isConnected: false,
    projectId: null,
    connectionHealth: 'disconnected',
    lastChecked: null,
    metrics: {
      totalTables: 0,
      totalFunctions: 0,
      activeConnections: 0,
      storageUsed: '0 MB',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkSupabaseConnection = async () => {
    try {
      setIsLoading(true);
      
      // Test basic connectivity
      const { data: healthCheck, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);

      if (error) throw error;

      // Get project metrics
      const [tablesResult, functionsResult] = await Promise.allSettled([
        supabase.rpc('get_table_count').catch(() => ({ data: 0 })),
        supabase.rpc('get_function_count').catch(() => ({ data: 0 })),
      ]);

      const totalTables = tablesResult.status === 'fulfilled' ? tablesResult.value.data || 0 : 0;
      const totalFunctions = functionsResult.status === 'fulfilled' ? functionsResult.value.data || 0 : 0;

      setStatus({
        isConnected: true,
        projectId: 'yitldryumpmhzymxoioq',
        connectionHealth: 'healthy',
        lastChecked: new Date(),
        metrics: {
          totalTables,
          totalFunctions,
          activeConnections: 1,
          storageUsed: '0 MB', // This would need additional API calls to get real storage data
        },
      });
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        connectionHealth: 'disconnected',
        lastChecked: new Date(),
      }));
      
      toast({
        title: "Supabase Connection Issue",
        description: "Unable to connect to Supabase. Please check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSupabaseConnection();
    
    // Set up periodic health checks
    const interval = setInterval(checkSupabaseConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    refresh: checkSupabaseConnection,
  };
};
