
import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemPrompts } from '@/hooks/useSystemPrompts';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type PromptCategory = Database['public']['Enums']['prompt_category'];
type SystemPrompt = Database['public']['Tables']['system_prompts']['Row'];

const SystemPromptsManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'coding' as PromptCategory,
    description: '',
  });

  const { prompts, isLoading, createPrompt, updatePrompt } = useSystemPrompts();
  const { toast } = useToast();

  const categories: PromptCategory[] = ['coding', 'debugging', 'review', 'documentation', 'testing'];

  const handleCreate = async () => {
    try {
      await createPrompt.mutateAsync(formData);
      setIsCreating(false);
      setFormData({ name: '', content: '', category: 'coding', description: '' });
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingPrompt) return;
    
    try {
      await updatePrompt.mutateAsync({
        id: editingPrompt.id,
        ...formData,
      });
      setEditingPrompt(null);
      setFormData({ name: '', content: '', category: 'coding', description: '' });
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const startEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      content: prompt.content,
      category: prompt.category,
      description: prompt.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setIsCreating(false);
    setFormData({ name: '', content: '', category: 'coding', description: '' });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading system prompts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingPrompt) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPrompt ? 'Edit System Prompt' : 'Create New System Prompt'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Advanced Code Review"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PromptCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the prompt's purpose"
              />
            </div>

            <div>
              <Label htmlFor="content">Prompt Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the system prompt content..."
                className="min-h-[200px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={editingPrompt ? handleUpdate : handleCreate}
                disabled={!formData.name || !formData.content}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingPrompt ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Create Button */}
      {!isCreating && !editingPrompt && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">System Prompts ({prompts?.length || 0})</h3>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>
      )}

      {/* Prompts List */}
      <div className="grid gap-4">
        {prompts?.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{prompt.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1)}
                    </Badge>
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {prompt.description && (
                <p className="text-gray-600 text-sm mb-3">{prompt.description}</p>
              )}
              <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                {prompt.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prompts?.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No system prompts configured yet.</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Prompt
          </Button>
        </div>
      )}
    </div>
  );
};

export default SystemPromptsManager;
