
import { useState } from 'react';
import { Bot, Play, Square, CheckCircle, XCircle, Clock, FileText, Package, Search, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    analyzeProject,
    addTask, 
    clearTasks,
    removeTask
  } = useAutonomousAgent();

  const handleAddTask = () => {
    if (!taskDescription.trim()) return;
    
    const task = addTask({
      type: taskType,
      description: taskDescription
    });
    
    setTaskDescription('');
    executeAutonomousTask(projectId, task);
  };

  const handleAnalyzeProject = () => {
    analyzeProject(projectId);
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
          <h3 className="font-medium text-gray-900">Enhanced Autonomous AI Agent</h3>
          {isRunning && (
            <Badge variant="outline" className="ml-auto">
              <Bot className="h-3 w-3 mr-1 animate-pulse" />
              Working...
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyzeProject}
              disabled={isRunning}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze Project
            </Button>
            {tasks.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearTasks}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

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
                <SelectItem value="analyze_project">Analyze Project</SelectItem>
                <SelectItem value="refactor_code">Refactor Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Task Description</Label>
            <Textarea
              id="task-description"
              placeholder="Describe what you want the AI to build, analyze, or fix..."
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
          <h4 className="font-medium text-gray-900">Task History ({tasks.length})</h4>
        </div>

        <ScrollArea className="h-[calc(100%-2rem)]">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No tasks yet. Try analyzing your project or describe what you want to build!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Collapsible key={task.id}>
                  <Card className="border-l-4 border-l-gray-200">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <CardTitle className="text-sm font-medium">
                              {task.type.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                            <Eye className="h-3 w-3 text-gray-400" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(task.status)} className="text-xs">
                              {task.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTask(task.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="text-xs">
                          {task.description}
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 text-xs space-y-3">
                        {/* File Operations */}
                        {task.operations && (
                          <div className="space-y-2">
                            {task.operations.created.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <FileText className="h-3 w-3 text-green-600" />
                                  <span className="font-medium text-green-600">Created ({task.operations.created.length}):</span>
                                </div>
                                <div className="space-y-1 pl-4">
                                  {task.operations.created.map((file, index) => (
                                    <div key={index} className="text-gray-600 font-mono">{file}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {task.operations.modified.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <FileText className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium text-blue-600">Modified ({task.operations.modified.length}):</span>
                                </div>
                                <div className="space-y-1 pl-4">
                                  {task.operations.modified.map((file, index) => (
                                    <div key={index} className="text-gray-600 font-mono">{file}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {task.operations.deleted.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <FileText className="h-3 w-3 text-red-600" />
                                  <span className="font-medium text-red-600">Deleted ({task.operations.deleted.length}):</span>
                                </div>
                                <div className="space-y-1 pl-4">
                                  {task.operations.deleted.map((file, index) => (
                                    <div key={index} className="text-gray-600 font-mono">{file}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Analysis Results */}
                        {task.analysis && (
                          <div className="bg-blue-50 p-3 rounded text-xs">
                            <div className="font-medium text-blue-800 mb-2">AI Analysis:</div>
                            {task.analysis.projectInsights && (
                              <div className="mb-2">
                                <strong>Insights:</strong> {task.analysis.projectInsights}
                              </div>
                            )}
                            {task.analysis.integrationNotes && (
                              <div className="mb-2">
                                <strong>Integration:</strong> {task.analysis.integrationNotes}
                              </div>
                            )}
                            {task.analysis.recommendations && (
                              <div>
                                <strong>Recommendations:</strong> {task.analysis.recommendations}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Dependencies */}
                        {task.dependencies_added && task.dependencies_added.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Package className="h-3 w-3 text-purple-600" />
                              <span className="font-medium text-purple-600">Dependencies Added:</span>
                            </div>
                            <div className="space-y-1 pl-4">
                              {task.dependencies_added.map((dep, index) => (
                                <div key={index} className="text-gray-600 font-mono">{dep}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Errors */}
                        {task.errors && task.errors.length > 0 && (
                          <div className="text-red-600 bg-red-50 p-2 rounded text-xs">
                            <div className="font-medium mb-1">Errors:</div>
                            {task.errors.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                        
                        {/* Failure Result */}
                        {task.result && task.status === 'failed' && (
                          <div className="text-red-600 bg-red-50 p-2 rounded text-xs">
                            {task.result}
                          </div>
                        )}

                        {/* Timestamp */}
                        {task.timestamp && (
                          <div className="text-gray-400 text-xs">
                            {new Date(task.timestamp).toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AutonomousAgentPanel;
