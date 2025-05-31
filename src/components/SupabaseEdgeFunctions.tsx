
import { useState, useEffect } from 'react';
import { Zap, Play, Settings, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EdgeFunction {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastInvoked: string;
  invocations: number;
  verifyJwt: boolean;
  description: string;
}

const SupabaseEdgeFunctions = () => {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading edge functions from config
    const loadEdgeFunctions = async () => {
      // Based on the supabase/config.toml file, we know these functions exist
      const knownFunctions: EdgeFunction[] = [
        {
          name: 'ai-coding-assistant',
          status: 'active',
          lastInvoked: '2 minutes ago',
          invocations: 145,
          verifyJwt: true,
          description: 'AI-powered coding assistance and suggestions',
        },
        {
          name: 'code-generator',
          status: 'active',
          lastInvoked: '5 minutes ago',
          invocations: 89,
          verifyJwt: true,
          description: 'Generate code based on user requirements',
        },
        {
          name: 'autonomous-agent',
          status: 'active',
          lastInvoked: '1 hour ago',
          invocations: 23,
          verifyJwt: true,
          description: 'Autonomous development and debugging agent',
        },
      ];

      setFunctions(knownFunctions);
      setIsLoading(false);
    };

    loadEdgeFunctions();
  }, []);

  const getStatusIcon = (status: EdgeFunction['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: EdgeFunction['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Edge Functions
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
          <Zap className="h-5 w-5" />
          Edge Functions
        </CardTitle>
        <CardDescription>
          Serverless functions running on the edge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Zap className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-900">{functions.length}</div>
            <div className="text-sm text-blue-700">Functions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {functions.filter(f => f.status === 'active').length}
            </div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Play className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {functions.reduce((sum, f) => sum + f.invocations, 0)}
            </div>
            <div className="text-sm text-purple-700">Total Invocations</div>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-3">
            {functions.map((func) => (
              <div key={func.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(func.status)}
                    <span className="font-medium">{func.name}</span>
                    {getStatusBadge(func.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Logs
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{func.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>Last invoked:</strong> {func.lastInvoked}
                  </div>
                  <div>
                    <strong>Invocations:</strong> {func.invocations}
                  </div>
                  <div>
                    <strong>JWT Auth:</strong> {func.verifyJwt ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Edge Functions are automatically deployed when you make changes to your code.
            Monitor their performance and logs in real-time.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SupabaseEdgeFunctions;
