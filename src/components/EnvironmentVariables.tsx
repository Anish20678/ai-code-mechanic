
import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useToast } from '@/components/ui/use-toast';

interface EnvironmentVariablesProps {
  projectId: string;
}

interface EnvVar {
  key: string;
  value: string;
  isSecret: boolean;
}

const EnvironmentVariables = ({ projectId }: EnvironmentVariablesProps) => {
  const [selectedEnv, setSelectedEnv] = useState<string>('production');
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const { environments, updateEnvironment } = useEnvironments(projectId);

  const addVariable = () => {
    setEnvVars([...envVars, { key: '', value: '', isSecret: false }]);
  };

  const removeVariable = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: keyof EnvVar, value: string | boolean) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const toggleSecretVisibility = (index: number) => {
    setShowSecrets({
      ...showSecrets,
      [index]: !showSecrets[index]
    });
  };

  const saveVariables = async () => {
    const environment = environments?.find(env => env.name === selectedEnv);
    if (!environment) return;

    const variables = envVars.reduce((acc, envVar) => {
      if (envVar.key) {
        acc[envVar.key] = envVar.value;
      }
      return acc;
    }, {} as Record<string, string>);

    await updateEnvironment.mutateAsync({
      id: environment.id,
      variables,
    });

    toast({
      title: "Variables saved",
      description: "Environment variables have been updated successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Manage environment variables for different deployment environments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="env-select">Environment</Label>
            <Select value={selectedEnv} onValueChange={setSelectedEnv}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                {environments?.map((env) => (
                  <SelectItem key={env.id} value={env.name}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addVariable} variant="outline" className="mt-6">
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>

        <div className="space-y-3">
          {envVars.map((envVar, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1">
                <Input
                  placeholder="Variable name"
                  value={envVar.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                />
              </div>
              <div className="flex-1 relative">
                <Input
                  type={envVar.isSecret && !showSecrets[index] ? 'password' : 'text'}
                  placeholder="Variable value"
                  value={envVar.value}
                  onChange={(e) => updateVariable(index, 'value', e.target.value)}
                />
                {envVar.isSecret && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    onClick={() => toggleSecretVisibility(index)}
                  >
                    {showSecrets[index] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <Select
                value={envVar.isSecret ? 'secret' : 'public'}
                onValueChange={(value) => updateVariable(index, 'isSecret', value === 'secret')}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeVariable(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {envVars.length > 0 && (
          <Button onClick={saveVariables} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Variables
          </Button>
        )}

        {envVars.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No environment variables configured.</p>
            <p className="text-sm">Click "Add Variable" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentVariables;
