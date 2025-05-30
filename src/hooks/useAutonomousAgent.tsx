
import { useState } from 'react';
import { useAIAssistant } from './useAIAssistant';
import { useCodeFiles } from './useCodeFiles';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AutonomousTask {
  id: string;
  type: 'create_component' | 'add_feature' | 'fix_bug' | 'optimize' | 'setup_project';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  files_created?: string[];
  dependencies_added?: string[];
}

export const useAutonomousAgent = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<AutonomousTask | null>(null);
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const { generateCode } = useAIAssistant();
  const { toast } = useToast();

  const executeAutonomousTask = async (projectId: string, task: AutonomousTask) => {
    setIsRunning(true);
    setCurrentTask(task);
    
    try {
      // Update task status
      const updatedTask = { ...task, status: 'in_progress' as const };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

      // Call the autonomous agent edge function
      const { data, error } = await supabase.functions.invoke('autonomous-agent', {
        body: {
          projectId,
          task: task.description,
          taskType: task.type
        }
      });

      if (error) throw error;

      // Update task with results
      const completedTask = {
        ...task,
        status: 'completed' as const,
        result: data.result,
        files_created: data.filesCreated || [],
        dependencies_added: data.dependenciesAdded || []
      };

      setTasks(prev => prev.map(t => t.id === task.id ? completedTask : t));
      setCurrentTask(null);

      toast({
        title: "Task Completed",
        description: `Successfully completed: ${task.description}`,
      });

      return data;
    } catch (error: any) {
      const failedTask = { ...task, status: 'failed' as const, result: error.message };
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

  return {
    isRunning,
    currentTask,
    tasks,
    executeAutonomousTask,
    addTask,
    clearTasks
  };
};
