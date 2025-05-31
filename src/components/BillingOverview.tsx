
import { useState } from 'react';
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserBilling } from '@/hooks/useUserBilling';
import { useAIGenerations } from '@/hooks/useAIGenerations';

const BillingOverview = () => {
  const { billing, isLoading, isNearLimit, isOverLimit, getRemainingCredits, getUsagePercentage } = useUserBilling();
  const { generations, getUsageByModel, getTotalCost, getTotalTokens } = useAIGenerations();

  if (isLoading) {
    return <div className="text-center py-8">Loading billing information...</div>;
  }

  const usageByModel = getUsageByModel();
  const totalCost = getTotalCost();
  const totalTokens = getTotalTokens();
  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              of ${billing?.monthly_limit || 10} monthly limit
            </p>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              across {generations?.length || 0} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            {isOverLimit() ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getRemainingCredits().toFixed(4)}</div>
            <div className="flex items-center space-x-2 mt-1">
              {isOverLimit() && (
                <Badge variant="destructive">Over Limit</Badge>
              )}
              {isNearLimit() && !isOverLimit() && (
                <Badge variant="destructive">Near Limit</Badge>
              )}
              {!isNearLimit() && (
                <Badge variant="default">Healthy</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your billing plan and usage details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Plan</p>
              <p className="text-lg font-semibold capitalize">{billing?.plan_name || 'Free'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={billing?.status === 'active' ? 'default' : 'secondary'}>
                {billing?.status || 'Trial'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Billing Cycle</p>
              <p className="text-sm">
                {billing?.billing_cycle_start} to {billing?.billing_cycle_end}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Limit</p>
              <p className="text-sm">${billing?.monthly_limit || 10}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
          <CardDescription>
            Breakdown of your AI usage by model
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(usageByModel).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(usageByModel).map(([modelName, usage]) => (
                <div key={modelName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{modelName}</p>
                    <p className="text-sm text-gray-500">{usage.count} requests</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${usage.cost.toFixed(4)}</p>
                    <p className="text-sm text-gray-500">{usage.tokens.toLocaleString()} tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No usage data available yet.</p>
              <p className="text-sm text-gray-400 mt-1">Start using AI features to see usage breakdown.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Alerts */}
      {(isNearLimit() || isOverLimit()) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {isOverLimit() ? 'Usage Limit Exceeded' : 'Approaching Usage Limit'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              {isOverLimit() 
                ? 'You have exceeded your monthly usage limit. Consider upgrading your plan.'
                : 'You are approaching your monthly usage limit. Monitor your usage carefully.'
              }
            </p>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingOverview;
