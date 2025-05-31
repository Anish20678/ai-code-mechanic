
import { useState, useEffect } from 'react';
import { Shield, Users, Key, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  authProviders: string[];
  securityLevel: 'high' | 'medium' | 'low';
}

const SupabaseAuthStatus = () => {
  const [authStats, setAuthStats] = useState<AuthStats>({
    totalUsers: 0,
    activeUsers: 0,
    authProviders: ['email'],
    securityLevel: 'medium',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadAuthStats = async () => {
      try {
        // In a real implementation, you would fetch these stats from Supabase
        // For demo purposes, we'll simulate the data
        setAuthStats({
          totalUsers: 1,
          activeUsers: user ? 1 : 0,
          authProviders: ['email'],
          securityLevel: 'high',
        });
      } catch (error) {
        console.error('Error loading auth stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthStats();
  }, [user]);

  const getSecurityBadge = (level: AuthStats['securityLevel']) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700">High Security</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium Security</Badge>;
      case 'low':
        return <Badge variant="destructive">Low Security</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          User authentication and security overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Security Level</span>
            {getSecurityBadge(authStats.securityLevel)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-900">{authStats.totalUsers}</div>
              <div className="text-sm text-blue-700">Total Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-900">{authStats.activeUsers}</div>
              <div className="text-sm text-green-700">Active Sessions</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Authentication Providers
            </h4>
            <div className="flex gap-2">
              {authStats.authProviders.map((provider) => (
                <Badge key={provider} variant="outline" className="capitalize">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current User</p>
                <p className="text-sm text-gray-600">
                  {user ? user.email : 'Not authenticated'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-3 w-3 mr-1" />
                Auth Settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseAuthStatus;
