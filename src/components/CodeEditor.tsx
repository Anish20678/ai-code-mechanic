
import { useState, useEffect, useRef } from 'react';
import { File, Save, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CodeFile = Database['public']['Tables']['code_files']['Row'];

interface CodeEditorProps {
  file: CodeFile;
  onContentChange: (content: string) => void;
}

const CodeEditor = ({ file, onContentChange }: CodeEditorProps) => {
  const [content, setContent] = useState(file.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setContent(file.content || '');
  }, [file.content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Debounce save
    const timeoutId = setTimeout(() => {
      onContentChange(newContent);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onContentChange(content);
      toast({
        title: "File saved",
        description: `${file.file_path} has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "File content copied successfully.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+S for save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '  '; // 2 spaces for indentation

      const newContent = content.substring(0, start) + spaces + content.substring(end);
      setContent(newContent);
      handleContentChange(newContent);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const getFileExtension = (filePath: string) => {
    return filePath.split('.').pop() || '';
  };

  const getLanguageFromExtension = (extension: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'jsx': 'React JSX',
      'ts': 'TypeScript',
      'tsx': 'React TSX',
      'css': 'CSS',
      'html': 'HTML',
      'json': 'JSON',
      'md': 'Markdown',
      'py': 'Python',
      'yml': 'YAML',
      'yaml': 'YAML',
    };
    return languageMap[extension] || 'Text';
  };

  const extension = getFileExtension(file.file_path);
  const language = getLanguageFromExtension(extension);

  const lineCount = content.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Editor Header */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{file.file_path}</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {language}
            </span>
            <span className="text-xs text-gray-500">
              {lineCount} lines
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Line Numbers and Code Content */}
      <div className="flex-1 flex bg-gray-50 overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-gray-100 border-r border-gray-200 px-3 py-4 text-xs text-gray-500 font-mono select-none min-w-[50px]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-relaxed text-right">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Editor */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 font-mono text-sm leading-relaxed text-gray-800 bg-white border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            placeholder="Start coding..."
            spellCheck={false}
            style={{
              lineHeight: '1.5',
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{extension.toUpperCase()}</span>
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Line {content.substring(0, textareaRef.current?.selectionStart || 0).split('\n').length}</span>
          <span>Characters: {content.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
