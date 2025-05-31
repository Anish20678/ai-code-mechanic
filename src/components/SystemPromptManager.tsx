
import { useState } from 'react';
import { Plus, Edit, Trash2, Power, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemPrompts } from '@/hooks/useSystemPrompts';

const SystemPromptManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    content: '',
    category: 'system' as any,
  });

  const { systemPrompts, isLoading, createPrompt, updatePrompt, deletePrompt, activatePrompt } = useSystemPrompts();

  const handleCreate = async () => {
    if (!newPrompt.name || !newPrompt.content) return;

    await createPrompt.mutateAsync({
      ...newPrompt,
      is_active: false,
      version: 1,
    });

    setNewPrompt({ name: '', description: '', content: '', category: 'system' });
    setShowCreateForm(false);
  };

  const handleUpdate = async (id: string, updates: any) => {
    await updatePrompt.mutateAsync({ id, updates });
    setEditingId(null);
  };

  const handleActivate = async (id: string, category: string) => {
    await activatePrompt.mutateAsync({ id, category });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'coding': return 'bg-orange-100 text-orange-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'debugging': return 'bg-purple-100 text-purple-800';
      case 'optimization': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'system': return 'System';
      case 'coding': return 'Coding';
      case 'analysis': return 'Analysis';
      case 'debugging': return 'Debugging';
      case 'optimization': return 'Optimization';
      default: return category;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading system prompts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Prompt Management</h2>
          <p className="text-gray-600">Manage AI assistant system prompts for different modes</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prompt
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New System Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                  placeholder="Enter prompt name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select
                  value={newPrompt.category}
                  onValueChange={(value: any) => setNewPrompt({ ...newPrompt, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="debugging">Debugging</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                placeholder="Enter system prompt content"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate}
                disabled={!newPrompt.name || !newPrompt.content || createPrompt.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts List */}
      <div className="grid gap-4">
        {systemPrompts?.map((prompt) => (
          <Card key={prompt.id} className={prompt.is_active ? 'ring-2 ring-green-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{prompt.name}</CardTitle>
                  <Badge className={getCategoryColor(prompt.category)}>
                    {getCategoryDisplayName(prompt.category)}
                  </Badge>
                  {prompt.is_active && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(prompt.id, prompt.category)}
                    disabled={prompt.is_active || activatePrompt.isPending}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(prompt.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePrompt.mutateAsync(prompt.id)}
                    disabled={deletePrompt.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {prompt.description && (
                <p className="text-gray-600">{prompt.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {editingId === prompt.id ? (
                <EditPromptForm
                  prompt={prompt}
                  onSave={(updates) => handleUpdate(prompt.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {prompt.content.length > 500 
                      ? `${prompt.content.substring(0, 500)}...` 
                      : prompt.content
                    }
                  </pre>
                  {prompt.content.length > 500 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setEditingId(prompt.id)}
                    >
                      View Full Content
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!systemPrompts || systemPrompts.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-500">No system prompts found. Create your first prompt to get started.</p>
        </div>
      )}
    </div>
  );
};

const EditPromptForm = ({ prompt, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    name: prompt.name,
    description: prompt.description || '',
    content: prompt.content,
    category: prompt.category,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="debugging">Debugging</SelectItem>
              <SelectItem value="optimization">Optimization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Content</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={12}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SystemPromptManager;
