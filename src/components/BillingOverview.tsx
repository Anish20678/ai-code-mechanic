
import { AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserBilling } from '@/hooks/useUserBilling';
import { useAIGenerations } from '@/hooks/useAIGenerations';

const BillingOverview = () => {
  const { billing, isLoading: billingLoading, isNearLimit, isOverLimit, getUsagePercentage } = useUserBilling();
  const { getTotalCost, getTotalTokens, getUsageByModel } = useAIGenerations();

  if (billingLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const usageByModel = getUsageByModel();
  const totalCost = getTotalCost();
  const totalTokens = getTotalTokens();
  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Alert for usage limits */}
      {isOverLimit() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have exceeded your monthly usage limit. Please upgrade your plan to continue using AI features.
          </AlertDescription>
        </Alert>
      )}
      
      {isNearLimit() && !isOverLimit() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You are approaching your monthly usage limit. Consider upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${billing?.current_usage?.toFixed(4) || '0.0000'}
            </div>
            <div className="text-xs text-muted-foreground">
              of ${billing?.monthly_limit?.toFixed(2) || '0.00'} limit
            </div>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              tokens used this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <Badge variant={billing?.status === 'active' ? 'default' : 'secondary'}>
              {billing?.status || 'trial'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {billing?.plan_name || 'Free'}
            </div>
            <div className="text-xs text-muted-foreground">
              Current plan
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCost.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              total cost
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
          <CardDescription>
            Breakdown of your AI usage by different models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(usageByModel).map(([modelName, usage]) => (
              <div key={modelName} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{modelName}</span>
                  <Badge variant="outline">{usage.count} requests</Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">${usage.cost.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">
                    {usage.tokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(usageByModel).length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No usage data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingOverview;
