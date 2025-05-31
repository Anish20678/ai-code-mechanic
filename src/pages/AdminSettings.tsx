
import { useState } from 'react';
import { Settings, Bot, Database, Key, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemPromptsManager from '@/components/SystemPromptsManager';
import AIModelsManager from '@/components/AIModelsManager';
import ProviderConfigManager from '@/components/ProviderConfigManager';
import BillingOverview from '@/components/BillingOverview';

const AdminSettings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Settings className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            AI Platform Management
          </h2>
          <p className="text-gray-600">
            Configure AI models, system prompts, and platform settings for the superhuman developer experience.
          </p>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              System Prompts
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Prompts Management</CardTitle>
                <CardDescription>
                  Configure specialized prompts for different AI tasks and categories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemPromptsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Models Configuration</CardTitle>
                <CardDescription>
                  Manage available AI models and their pricing configurations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIModelsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Configuration</CardTitle>
                <CardDescription>
                  Configure API endpoints and settings for different AI providers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderConfigManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingOverview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminSettings;
