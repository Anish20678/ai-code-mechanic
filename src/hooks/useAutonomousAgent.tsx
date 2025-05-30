
import { useState } from 'react';
import { useCodeFiles } from './useCodeFiles';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AutonomousTask {
  id: string;
  type: 'create_component' | 'add_feature' | 'fix_bug' | 'optimize' | 'setup_project' | 'analyze_project' | 'refactor_code';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  operations?: {
    created: string[];
    modified: string[];
    deleted: string[];
  };
  analysis?: {
    projectInsights?: string;
    integrationNotes?: string;
    recommendations?: string;
  };
  dependencies_added?: string[];
  errors?: string[];
  timestamp?: string;
}

export const useAutonomousAgent = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<AutonomousTask | null>(null);
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const { toast } = useToast();

  const executeAutonomousTask = async (projectId: string, task: AutonomousTask, operation?: string) => {
    setIsRunning(true);
    setCurrentTask(task);
    
    try {
      // Update task status
      const updatedTask = { 
        ...task, 
        status: 'in_progress' as const,
        timestamp: new Date().toISOString()
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

      // Call the enhanced autonomous agent edge function
      const { data, error } = await supabase.functions.invoke('autonomous-agent', {
        body: {
          projectId,
          task: task.description,
          taskType: task.type,
          operation: operation || 'general'
        }
      });

      if (error) throw error;

      // Update task with enhanced results
      const completedTask = {
        ...task,
        status: 'completed' as const,
        result: data.result,
        operations: data.operations || { created: [], modified: [], deleted: [] },
        analysis: data.analysis || {},
        dependencies_added: data.dependencies || [],
        errors: data.errors || [],
        timestamp: new Date().toISOString()
      };

      setTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));
      setCurrentTask(null);

      // Enhanced toast notification
      const operationSummary = [];
      if (data.operations?.created?.length > 0) {
        operationSummary.push(`${data.operations.created.length} files created`);
      }
      if (data.operations?.modified?.length > 0) {
        operationSummary.push(`${data.operations.modified.length} files modified`);
      }
      if (data.operations?.deleted?.length > 0) {
        operationSummary.push(`${data.operations.deleted.length} files deleted`);
      }

      toast({
        title: "Task Completed Successfully",
        description: `${task.description}${operationSummary.length > 0 ? ` - ${operationSummary.join(', ')}` : ''}`,
      });

      return data;
    } catch (error: any) {
      const failedTask = { 
        ...task, 
        status: 'failed' as const, 
        result: error.message,
        timestamp: new Date().toISOString()
      };
      setTasks(prev => prev.map(t => t.id === task.id ? failedTask : t));
      setCurrentTask(null);

      toast({
        title: "Task Failed",
        description: error.message || "Failed to complete autonomous task",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const analyzeProject = async (projectId: string) => {
    const analysisTask: AutonomousTask = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'analyze_project',
      description: 'Analyze project structure and provide insights',
      status: 'pending'
    };

    setTasks(prev => [...prev, analysisTask]);
    return executeAutonomousTask(projectId, analysisTask, 'analyze');
  };

  const addTask = (task: Omit<AutonomousTask, 'id' | 'status'>) => {
    const newTask: AutonomousTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const clearTasks = () => {
    setTasks([]);
    setCurrentTask(null);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const getTaskHistory = () => {
    return tasks.sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  };

  return {
    isRunning,
    currentTask,
    tasks: getTaskHistory(),
    executeAutonomousTask,
    analyzeProject,
    addTask,
    clearTasks,
    removeTask
  };
};
