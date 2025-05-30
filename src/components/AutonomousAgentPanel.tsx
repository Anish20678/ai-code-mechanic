
import { useState } from 'react';
import { Bot, Play, Square, CheckCircle, XCircle, Clock, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutonomousAgent, type AutonomousTask } from '@/hooks/useAutonomousAgent';

interface AutonomousAgentPanelProps {
  projectId: string;
}

const AutonomousAgentPanel = ({ projectId }: AutonomousAgentPanelProps) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<AutonomousTask['type']>('create_component');
  
  const { 
    isRunning, 
    currentTask, 
    tasks, 
    executeAutonomousTask, 
    addTask, 
    clearTasks 
  } = useAutonomousAgent();

  const handleAddTask = () => {
    if (!taskDescription.trim()) return;
    
    const task = addTask({
      type: taskType,
      description: taskDescription
    });
    
    setTaskDescription('');
    
    // Auto-execute the task
    executeAutonomousTask(projectId, task);
  };

  const getStatusIcon = (status: AutonomousTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <Bot className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: AutonomousTask['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Autonomous AI Agent</h3>
          {isRunning && (
            <Badge variant="outline" className="ml-auto">
              <Bot className="h-3 w-3 mr-1 animate-pulse" />
              Working...
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="task-type">Task Type</Label>
            <Select value={taskType} onValueChange={(value: AutonomousTask['type']) => setTaskType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create_component">Create Component</SelectItem>
                <SelectItem value="add_feature">Add Feature</SelectItem>
                <SelectItem value="fix_bug">Fix Bug</SelectItem>
                <SelectItem value="optimize">Optimize Code</SelectItem>
                <SelectItem value="setup_project">Setup Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Task Description</Label>
            <Textarea
              id="task-description"
              placeholder="Describe what you want the AI to build or fix..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleAddTask}
            disabled={!taskDescription.trim() || isRunning}
            className="w-full bg-gray-900 hover:bg-gray-800"
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Agent Working...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Task
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Task History</h4>
          {tasks.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearTasks}>
              Clear All
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-2rem)]">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No tasks yet. Describe what you want to build!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <CardTitle className="text-sm font-medium">
                          {task.type.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                      </div>
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {task.description}
                    </CardDescription>
                  </CardHeader>
                  
                  {(task.files_created?.length || task.dependencies_added?.length || task.result) && (
                    <CardContent className="pt-0 text-xs">
                      {task.files_created && task.files_created.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <FileText className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">Files Created:</span>
                          </div>
                          <div className="space-y-1">
                            {task.files_created.map((file, index) => (
                              <div key={index} className="pl-4 text-gray-600">{file}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {task.dependencies_added && task.dependencies_added.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span className="font-medium text-blue-600">Dependencies Added:</span>
                          </div>
                          <div className="space-y-1">
                            {task.dependencies_added.map((dep, index) => (
                              <div key={index} className="pl-4 text-gray-600">{dep}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {task.result && task.status === 'failed' && (
                        <div className="text-red-600 bg-red-50 p-2 rounded text-xs">
                          {task.result}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AutonomousAgentPanel;
