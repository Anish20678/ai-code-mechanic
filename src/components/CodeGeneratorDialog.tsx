
import { useState } from 'react';
import { Bot, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useCodeFiles } from '@/hooks/useCodeFiles';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface CodeGeneratorDialogProps {
  projectId: string;
  existingFiles?: CodeFile[];
  onFileCreated?: (file: CodeFile) => void;
}

const CodeGeneratorDialog = ({ projectId, existingFiles, onFileCreated }: CodeGeneratorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState('tsx');
  const [generatedCode, setGeneratedCode] = useState('');
  
  const { generateCode, isLoading } = useAIAssistant();
  const { createCodeFile } = useCodeFiles(projectId);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const result = await generateCode(prompt, projectId, fileType, existingFiles);
      setGeneratedCode(result.code);
      if (!filename && result.suggestedFilename) {
        setFilename(result.suggestedFilename);
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  };

  const handleSaveFile = async () => {
    if (!filename.trim() || !generatedCode.trim()) return;

    try {
      const newFile = await createCodeFile.mutateAsync({
        project_id: projectId,
        file_path: filename,
        content: generatedCode,
      });

      if (onFileCreated) {
        onFileCreated(newFile);
      }

      // Reset form
      setPrompt('');
      setFilename('');
      setGeneratedCode('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            AI Code Generator
          </DialogTitle>
          <DialogDescription>
            Describe what you want to create and let AI generate the code for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Code Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the component or function you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder="Component.tsx"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filetype">File Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tsx">React Component (.tsx)</SelectItem>
                  <SelectItem value="ts">TypeScript (.ts)</SelectItem>
                  <SelectItem value="css">Styles (.css)</SelectItem>
                  <SelectItem value="js">JavaScript (.js)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isLoading}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate Code
                </>
              )}
            </Button>
          </div>

          {generatedCode && (
            <div className="space-y-2">
              <Label>Generated Code</Label>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveFile}
                  disabled={!filename.trim() || createCodeFile.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createCodeFile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save File'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedCode('')}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeGeneratorDialog;
