
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Database, FileText, Zap } from 'lucide-react';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import { useBuildSystem } from '@/hooks/useBuildSystem';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { useProjectIntegrations } from '@/hooks/useProjectIntegrations';

interface ProjectHealthDashboardProps {
  projectId: string;
}

const ProjectHealthDashboard = ({ projectId }: ProjectHealthDashboardProps) => {
  const { codeFiles } = useCodeFiles(projectId);
  const { latestBuild } = useBuildSystem(projectId);
  const { analyses } = useCodeAnalysis(projectId);
  const { integrations } = useProjectIntegrations(projectId);

  // Calculate health metrics
  const totalFiles = codeFiles?.length || 0;
  const hasSuccessfulBuild = latestBuild?.status === 'success';
  const criticalIssues = analyses?.filter(a => a.severity === 'high').length || 0;
  const warningIssues = analyses?.filter(a => a.severity === 'medium').length || 0;
  const activeIntegrations = integrations?.filter(i => i.is_active).length || 0;

  // Calculate overall health score
  const healthScore = Math.min(100, Math.max(0, 
    (hasSuccessfulBuild ? 40 : 0) +
    (totalFiles > 0 ? 20 : 0) +
    (criticalIssues === 0 ? 20 : Math.max(0, 20 - criticalIssues * 5)) +
    (activeIntegrations > 0 ? 20 : 0)
  ));

  const getHealthStatus = () => {
    if (healthScore >= 80) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (healthScore >= 60) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (healthScore >= 40) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Needs Attention', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const health = getHealthStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Overall Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{healthScore}%</span>
              <Badge variant="secondary" className={`${health.bgColor} ${health.color}`}>
                {health.status}
              </Badge>
            </div>
            <Progress value={healthScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Build Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Build Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {hasSuccessfulBuild ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Success</span>
              </>
            ) : latestBuild?.status === 'failed' ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Failed</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">Pending</span>
              </>
            )}
          </div>
          {latestBuild?.completed_at && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(latestBuild.completed_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Code Quality */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Code Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Files</span>
              <span className="font-medium">{totalFiles}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">Critical</span>
              <span className="font-medium">{criticalIssues}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600">Warnings</span>
              <span className="font-medium">{warningIssues}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{activeIntegrations}</span>
            <span className="text-sm text-gray-600">active</span>
          </div>
          {integrations && integrations.length > 0 && (
            <div className="mt-2 space-y-1">
              {integrations.slice(0, 3).map((integration) => (
                <div key={integration.id} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{integration.integration_type}</span>
                  <div className={`h-2 w-2 rounded-full ${integration.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectHealthDashboard;
