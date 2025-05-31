
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { useExecutionSessions } from '@/hooks/useExecutionSessions';
import { useExecutionLogs } from '@/hooks/useExecutionLogs';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ExecutionSession = Database['public']['Tables']['execution_sessions']['Row'];
type ExecutionLog = Database['public']['Tables']['execution_logs']['Row'];

interface ExecutionTrackerProps {
  projectId: string;
  activeSessionId?: string;
}

const ExecutionTracker = ({ projectId, activeSessionId }: ExecutionTrackerProps) => {
  const { sessions } = useExecutionSessions(projectId);
  const { logs } = useExecutionLogs(activeSessionId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const activeSession = sessions?.find(s => s.id === activeSessionId);

  return (
    <div className="space-y-4">
      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Execution Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      session.id === activeSessionId ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                      <span className="text-sm font-medium capitalize">
                        {session.execution_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session.completed_steps}/{session.total_steps}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No execution sessions yet
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Active Session Progress */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Execution</span>
              <Badge variant={activeSession.status === 'running' ? 'default' : 'secondary'}>
                {activeSession.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{activeSession.completed_steps}/{activeSession.total_steps}</span>
              </div>
              <Progress 
                value={(activeSession.completed_steps / activeSession.total_steps) * 100} 
                className="w-full"
              />
            </div>
            
            {activeSession.error_message && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {activeSession.error_message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Logs */}
      {activeSessionId && logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Execution Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded text-sm ${getLogLevelColor(log.log_level)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs uppercase">
                        {log.log_level}
                      </Badge>
                      <span className="text-xs opacity-70">
                        Step {log.step_number}
                      </span>
                    </div>
                    <p>{log.message}</p>
                    {log.details && Object.keys(log.details as any).length > 0 && (
                      <pre className="mt-1 text-xs opacity-70 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExecutionTracker;
